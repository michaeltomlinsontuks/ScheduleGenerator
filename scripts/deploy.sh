#!/bin/bash
# =============================================================================
# Deployment Script with Zero-Downtime Rolling Updates
# =============================================================================
# Pulls latest code, rebuilds containers, runs migrations, and performs
# rolling updates with health check verification between each service update.
#
# Usage:
#   ./deploy.sh                    # Standard deployment
#   ./deploy.sh --with-rollback    # Deploy with automatic rollback on failure
#
# Requirements: 12.2
# =============================================================================

set -e

# Parse command line arguments
WITH_ROLLBACK=false
for arg in "$@"; do
    case $arg in
        --with-rollback)
            WITH_ROLLBACK=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --with-rollback    Automatically rollback on deployment failure"
            echo "  --help             Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  GIT_BRANCH         Git branch to deploy (default: main)"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
GIT_BRANCH="${GIT_BRANCH:-main}"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes max for health checks
HEALTH_CHECK_INTERVAL=5   # Check every 5 seconds
SERVICE_UPDATE_TIMEOUT=600  # 10 minutes max per service update

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Zero-Downtime Deployment Script ==="
echo "Branch: ${GIT_BRANCH}"
if [ "$WITH_ROLLBACK" = true ]; then
    echo -e "${YELLOW}Rollback Protection: ENABLED${NC}"
    echo "Deployment will automatically rollback on failure"
fi
echo "Started at: $(date)"
echo ""

# =============================================================================
# Helper Functions
# =============================================================================

# Print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Rollback on failure (if enabled)
rollback_on_failure() {
    local exit_code=$?
    
    if [ $exit_code -ne 0 ] && [ "$WITH_ROLLBACK" = true ]; then
        echo ""
        log_error "Deployment failed with exit code: ${exit_code}"
        log_warn "Automatic rollback is enabled, initiating rollback..."
        echo ""
        
        # Check if rollback script exists
        if [ -f "scripts/rollback.sh" ]; then
            log_info "Executing rollback script..."
            bash scripts/rollback.sh || {
                log_error "Rollback script failed!"
                log_error "Manual intervention required"
                exit 1
            }
            log_info "Rollback completed successfully"
            exit 1
        else
            log_error "Rollback script not found at scripts/rollback.sh"
            log_error "Manual rollback required"
            log_error "Backup location: ${BACKUP_DIR}"
            exit 1
        fi
    fi
}

# Set trap for automatic rollback on failure
if [ "$WITH_ROLLBACK" = true ]; then
    trap rollback_on_failure EXIT
fi

# Check if a service is healthy
check_service_health() {
    local service=$1
    local timeout=$2
    local elapsed=0
    
    log_info "Checking health of service: ${service}"
    
    while [ $elapsed -lt $timeout ]; do
        # Get container health status
        local health_status=$(docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" ps --format json "${service}" 2>/dev/null | jq -r '.[0].Health // "none"')
        
        if [ "$health_status" = "healthy" ]; then
            log_info "Service ${service} is healthy"
            return 0
        elif [ "$health_status" = "none" ]; then
            # Service doesn't have health check, check if it's running
            local state=$(docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" ps --format json "${service}" 2>/dev/null | jq -r '.[0].State // "none"')
            if [ "$state" = "running" ]; then
                log_info "Service ${service} is running (no health check defined)"
                return 0
            fi
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done
    
    echo ""
    log_error "Service ${service} failed health check after ${timeout}s"
    return 1
}

# Update a single service with timeout protection
update_service() {
    local service=$1
    local start_time=$(date +%s)
    
    log_info "Updating service: ${service}"
    
    # Start the service update with timeout
    timeout ${SERVICE_UPDATE_TIMEOUT} docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" up -d --no-deps "${service}" || {
        log_error "Service ${service} update timed out after ${SERVICE_UPDATE_TIMEOUT}s"
        return 1
    }
    
    # Wait for service to be healthy
    if ! check_service_health "${service}" ${HEALTH_CHECK_TIMEOUT}; then
        log_error "Service ${service} failed to become healthy"
        return 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_info "Service ${service} updated successfully in ${duration}s"
    
    return 0
}

# Verify all critical services are healthy
verify_all_services() {
    local services=("postgres" "redis" "backend" "frontend" "pdf-worker")
    
    log_info "Verifying all critical services..."
    
    for service in "${services[@]}"; do
        if ! check_service_health "${service}" 60; then
            log_error "Service ${service} is not healthy"
            return 1
        fi
    done
    
    log_info "All critical services are healthy"
    return 0
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

echo "=== Pre-flight Checks ==="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log_error "Not in a git repository"
    exit 1
fi

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if jq is available (needed for JSON parsing)
if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install jq for JSON parsing."
    exit 1
fi

# Check if backup script exists
if [ ! -f "scripts/backup-all.sh" ]; then
    log_error "Backup script not found at scripts/backup-all.sh"
    exit 1
fi

log_info "Pre-flight checks passed"
echo ""

# =============================================================================
# Step 0: Pre-Deployment Backup
# =============================================================================

echo "=== Step 0: Pre-deployment backup ==="
log_info "Creating backup before deployment (Requirement 12.5)"

# Set backup directory with deployment timestamp
DEPLOYMENT_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
export BACKUP_DIR="./backups/pre-deployment-${DEPLOYMENT_TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"

log_info "Backup directory: ${BACKUP_DIR}"

# Run backup script
if ! bash scripts/backup-all.sh; then
    log_error "Pre-deployment backup failed"
    log_error "Aborting deployment to prevent data loss"
    exit 1
fi

# Verify backup files exist and are valid
DB_BACKUP_PATTERN="${BACKUP_DIR}/db_*.sql.gz"
MINIO_BACKUP_PATTERN="${BACKUP_DIR}/minio_*.tar.gz"

DB_BACKUP_FILE=$(ls ${DB_BACKUP_PATTERN} 2>/dev/null | head -n 1)
MINIO_BACKUP_FILE=$(ls ${MINIO_BACKUP_PATTERN} 2>/dev/null | head -n 1)

if [ -z "$DB_BACKUP_FILE" ]; then
    log_error "Database backup file not found"
    exit 1
fi

if [ -z "$MINIO_BACKUP_FILE" ]; then
    log_error "MinIO backup file not found"
    exit 1
fi

# Verify backup integrity
log_info "Verifying backup integrity..."

# Check database backup size (should be at least 1KB)
DB_BACKUP_SIZE=$(stat -f%z "$DB_BACKUP_FILE" 2>/dev/null || stat -c%s "$DB_BACKUP_FILE" 2>/dev/null)
if [ "$DB_BACKUP_SIZE" -lt 1024 ]; then
    log_error "Database backup file too small: ${DB_BACKUP_SIZE} bytes"
    exit 1
fi

# Verify gzip integrity
if ! gzip -t "$DB_BACKUP_FILE" 2>/dev/null; then
    log_error "Database backup file corrupted"
    exit 1
fi

# Check MinIO backup size (should be at least 512 bytes)
MINIO_BACKUP_SIZE=$(stat -f%z "$MINIO_BACKUP_FILE" 2>/dev/null || stat -c%s "$MINIO_BACKUP_FILE" 2>/dev/null)
if [ "$MINIO_BACKUP_SIZE" -lt 512 ]; then
    log_error "MinIO backup file too small: ${MINIO_BACKUP_SIZE} bytes"
    exit 1
fi

# Verify tar.gz integrity
if ! gzip -t "$MINIO_BACKUP_FILE" 2>/dev/null; then
    log_error "MinIO backup file corrupted"
    exit 1
fi

log_info "Backup integrity verified successfully"
log_info "Database backup: ${DB_BACKUP_FILE} ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
log_info "MinIO backup: ${MINIO_BACKUP_FILE} ($(du -h "$MINIO_BACKUP_FILE" | cut -f1))"

# Store backup location for potential rollback
BACKUP_LOCATION_FILE=".last-deployment-backup"
cat > "${BACKUP_LOCATION_FILE}" <<EOF
# Last deployment backup information
# Created: $(date)
DEPLOYMENT_TIMESTAMP=${DEPLOYMENT_TIMESTAMP}
BACKUP_DIR=${BACKUP_DIR}
DB_BACKUP_FILE=${DB_BACKUP_FILE}
MINIO_BACKUP_FILE=${MINIO_BACKUP_FILE}
GIT_COMMIT=$(git rev-parse HEAD)
GIT_BRANCH=${GIT_BRANCH}
EOF

log_info "Backup location stored in ${BACKUP_LOCATION_FILE}"
log_info "Pre-deployment backup completed successfully"
echo ""

# =============================================================================
# Step 1: Pull Latest Code
# =============================================================================

echo "=== Step 1: Pulling latest code ==="
git fetch origin
git checkout "${GIT_BRANCH}"
git pull origin "${GIT_BRANCH}"
log_info "Code updated successfully"
echo ""

# =============================================================================
# Step 2: Build Containers
# =============================================================================

echo "=== Step 2: Building containers ==="
if ! timeout 1800 docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" build --no-cache; then
    log_error "Container build timed out or failed"
    exit 1
fi
log_info "Containers built successfully"
echo ""

# =============================================================================
# Step 3: Run Database Migrations
# =============================================================================

echo "=== Step 3: Running database migrations ==="

# Ensure database is running
log_info "Ensuring PostgreSQL is running..."
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" up -d postgres

# Wait for database to be healthy
if ! check_service_health "postgres" ${HEALTH_CHECK_TIMEOUT}; then
    log_error "PostgreSQL failed to start"
    exit 1
fi

# Run migrations with timeout
log_info "Running database migrations..."
if ! timeout 300 docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" run --rm backend npm run migration:run; then
    log_error "Database migrations timed out or failed"
    exit 1
fi
log_info "Migrations completed successfully"
echo ""

# =============================================================================
# Step 4: Rolling Update - Infrastructure Services
# =============================================================================

echo "=== Step 4: Rolling update - Infrastructure services ==="

# Update Redis (cache and queue)
if ! update_service "redis"; then
    log_error "Failed to update Redis"
    exit 1
fi

# Update MinIO (object storage)
if ! update_service "minio"; then
    log_error "Failed to update MinIO"
    exit 1
fi

log_info "Infrastructure services updated successfully"
echo ""

# =============================================================================
# Step 5: Rolling Update - Application Services
# =============================================================================

echo "=== Step 5: Rolling update - Application services ==="

# Update PDF Workers first (processing layer)
log_info "Updating PDF Worker instances..."
if ! update_service "pdf-worker"; then
    log_error "Failed to update PDF Worker"
    exit 1
fi

# Small delay to ensure workers are fully ready
sleep 5

# Update Backend (API layer)
log_info "Updating Backend instances..."
if ! update_service "backend"; then
    log_error "Failed to update Backend"
    exit 1
fi

# Small delay to ensure backend is fully ready
sleep 5

# Update Frontend (presentation layer)
log_info "Updating Frontend instances..."
if ! update_service "frontend"; then
    log_error "Failed to update Frontend"
    exit 1
fi

log_info "Application services updated successfully"
echo ""

# =============================================================================
# Step 6: Rolling Update - Monitoring Services
# =============================================================================

echo "=== Step 6: Rolling update - Monitoring services ==="

# Update Prometheus
if ! update_service "prometheus"; then
    log_warn "Failed to update Prometheus (non-critical)"
fi

# Update Grafana
if ! update_service "grafana"; then
    log_warn "Failed to update Grafana (non-critical)"
fi

log_info "Monitoring services updated"
echo ""

# =============================================================================
# Step 7: Post-Deployment Verification
# =============================================================================

echo "=== Step 7: Post-deployment verification ==="

# Verify all critical services are healthy
if ! verify_all_services; then
    log_error "Post-deployment verification failed"
    log_error "Some services are not healthy. Please check logs."
    exit 1
fi

# Display service status
log_info "Current service status:"
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" ps

echo ""

# Run comprehensive deployment verification
log_info "Running comprehensive deployment verification..."
if [ -f "scripts/verify-deployment.sh" ]; then
    if bash scripts/verify-deployment.sh; then
        log_info "Deployment verification passed"
    else
        log_error "Deployment verification failed"
        log_error "Please check the verification output above for details"
        exit 1
    fi
else
    log_warn "Verification script not found, skipping comprehensive verification"
fi

echo ""

# =============================================================================
# Step 8: Cleanup
# =============================================================================

echo "=== Step 8: Cleaning up old images ==="
docker image prune -f
log_info "Old images cleaned up"
echo ""

# =============================================================================
# Deployment Complete
# =============================================================================

echo "=== Deployment Complete ==="
log_info "All services updated successfully with zero downtime"
log_info "Finished at: $(date)"
echo ""
log_info "Pre-deployment backup location: ${BACKUP_DIR}"
log_info "Backup details stored in: ${BACKUP_LOCATION_FILE}"
echo ""
log_info "Next steps:"
echo "  1. Monitor service logs: docker compose -f ${COMPOSE_FILE} -f ${COMPOSE_PROD_FILE} logs -f"
echo "  2. Check metrics: Visit Grafana dashboard"
echo "  3. Verify functionality: Test critical user flows"
echo ""
log_warn "If rollback is needed, backup is available at: ${BACKUP_DIR}"

exit 0
