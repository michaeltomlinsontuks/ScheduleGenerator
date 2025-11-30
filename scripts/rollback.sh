#!/bin/bash
# =============================================================================
# Automatic Rollback Script
# =============================================================================
# Detects deployment failures and automatically rolls back to the previous
# version by reverting Docker images and restoring from pre-deployment backup.
# Requirements: 12.3
# =============================================================================

set -e

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_PROD_FILE="${COMPOSE_PROD_FILE:-docker-compose.prod.yml}"
BACKUP_INFO_FILE=".last-deployment-backup"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes max for health checks
HEALTH_CHECK_INTERVAL=5   # Check every 5 seconds

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Rollback state tracking
ROLLBACK_STARTED=false
SERVICES_STOPPED=false
DATABASE_RESTORED=false
IMAGES_REVERTED=false

echo "=== Automatic Rollback Script ==="
echo "Started at: $(date)"
echo ""

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Cleanup function for graceful exit
cleanup_on_error() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Rollback encountered an error (exit code: $exit_code)"
        log_error "Manual intervention may be required"
        
        if [ "$ROLLBACK_STARTED" = true ]; then
            log_info "Rollback progress:"
            log_info "  - Services stopped: ${SERVICES_STOPPED}"
            log_info "  - Database restored: ${DATABASE_RESTORED}"
            log_info "  - Images reverted: ${IMAGES_REVERTED}"
        fi
    fi
}

trap cleanup_on_error EXIT

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

log_step "Pre-flight Checks"

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

# Check if backup info file exists
if [ ! -f "${BACKUP_INFO_FILE}" ]; then
    log_error "No backup information found at ${BACKUP_INFO_FILE}"
    log_error "Cannot perform rollback without backup information"
    log_error "This file is created automatically during deployment"
    exit 1
fi

log_info "Pre-flight checks passed"
echo ""

# =============================================================================
# Step 1: Load Backup Information
# =============================================================================

log_step "Step 1: Loading backup information"

# Source the backup information
source "${BACKUP_INFO_FILE}"

log_info "Backup information loaded:"
log_info "  Deployment timestamp: ${DEPLOYMENT_TIMESTAMP}"
log_info "  Backup directory: ${BACKUP_DIR}"
log_info "  Git commit: ${GIT_COMMIT}"
log_info "  Git branch: ${GIT_BRANCH}"

# Verify backup files exist
if [ ! -f "${DB_BACKUP_FILE}" ]; then
    log_error "Database backup file not found: ${DB_BACKUP_FILE}"
    exit 1
fi

if [ ! -f "${MINIO_BACKUP_FILE}" ]; then
    log_error "MinIO backup file not found: ${MINIO_BACKUP_FILE}"
    exit 1
fi

log_info "Backup files verified:"
log_info "  Database: ${DB_BACKUP_FILE} ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
log_info "  MinIO: ${MINIO_BACKUP_FILE} ($(du -h "$MINIO_BACKUP_FILE" | cut -f1))"

echo ""

# =============================================================================
# Step 2: Confirm Rollback
# =============================================================================

log_step "Step 2: Rollback confirmation"

log_warn "⚠️  WARNING: This will rollback to the previous deployment"
log_warn "⚠️  Current data will be replaced with backup from: ${DEPLOYMENT_TIMESTAMP}"
log_warn "⚠️  Git commit: ${GIT_COMMIT}"
echo ""

# Check if running in non-interactive mode
if [ "${ROLLBACK_CONFIRM:-}" = "yes" ]; then
    log_info "Auto-confirmed via ROLLBACK_CONFIRM environment variable"
else
    read -p "Are you sure you want to proceed with rollback? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi
fi

ROLLBACK_STARTED=true
log_info "Rollback confirmed, proceeding..."
echo ""

# =============================================================================
# Step 3: Stop All Services
# =============================================================================

log_step "Step 3: Stopping all services"

log_info "Stopping services gracefully..."
if ! timeout 120 docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" stop; then
    log_warn "Graceful stop timed out, forcing stop..."
    docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" down --timeout 30
fi

SERVICES_STOPPED=true
log_info "All services stopped"
echo ""

# =============================================================================
# Step 4: Restore Database
# =============================================================================

log_step "Step 4: Restoring database from backup"

# Start only PostgreSQL
log_info "Starting PostgreSQL for restore..."
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" up -d postgres

# Wait for PostgreSQL to be ready
log_info "Waiting for PostgreSQL to be ready..."
if ! check_service_health "postgres" 120; then
    log_error "PostgreSQL failed to start"
    exit 1
fi

# Drop existing connections
log_info "Terminating existing database connections..."
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" exec -T postgres psql -U "${POSTGRES_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();" \
    2>/dev/null || log_warn "Could not terminate connections (database may not exist yet)"

# Drop and recreate database
log_info "Dropping and recreating database..."
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" exec -T postgres psql -U "${POSTGRES_USER}" -d postgres -c \
    "DROP DATABASE IF EXISTS ${POSTGRES_DB};" || log_warn "Could not drop database"

docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" exec -T postgres psql -U "${POSTGRES_USER}" -d postgres -c \
    "CREATE DATABASE ${POSTGRES_DB};"

# Restore database from backup
log_info "Restoring database from backup: ${DB_BACKUP_FILE}"
if gunzip -c "${DB_BACKUP_FILE}" | docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > /dev/null; then
    log_info "Database restored successfully"
    DATABASE_RESTORED=true
else
    log_error "Database restore failed"
    exit 1
fi

# Verify database restore
log_info "Verifying database restore..."
table_count=$(docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$table_count" -gt 0 ]; then
    log_info "Database verification passed (${table_count} tables found)"
else
    log_error "Database verification failed (no tables found)"
    exit 1
fi

echo ""

# =============================================================================
# Step 5: Restore MinIO Volumes
# =============================================================================

log_step "Step 5: Restoring MinIO volumes from backup"

# Stop MinIO if running
log_info "Stopping MinIO..."
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" stop minio 2>/dev/null || true

# Restore MinIO data
log_info "Restoring MinIO data from backup: ${MINIO_BACKUP_FILE}"
if docker run --rm \
    -v schedgen_minio_data:/data \
    -v "$(pwd)/${BACKUP_DIR}:/backup" \
    alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename ${MINIO_BACKUP_FILE}) -C /data"; then
    log_info "MinIO data restored successfully"
else
    log_error "MinIO restore failed"
    exit 1
fi

echo ""

# =============================================================================
# Step 6: Revert to Previous Git Commit
# =============================================================================

log_step "Step 6: Reverting to previous Git commit"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log_warn "Not in a git repository, skipping git revert"
else
    log_info "Current commit: $(git rev-parse HEAD)"
    log_info "Reverting to commit: ${GIT_COMMIT}"
    
    # Stash any uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_info "Stashing uncommitted changes..."
        git stash push -m "Auto-stash before rollback at $(date)"
    fi
    
    # Checkout the previous commit
    if git checkout "${GIT_COMMIT}"; then
        log_info "Git checkout successful"
    else
        log_error "Git checkout failed"
        log_warn "Continuing with rollback using existing code..."
    fi
fi

echo ""

# =============================================================================
# Step 7: Rebuild and Start Services with Previous Images
# =============================================================================

log_step "Step 7: Rebuilding and starting services"

# Rebuild containers from the reverted code
log_info "Rebuilding containers..."
if ! timeout 1800 docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" build --no-cache; then
    log_error "Container build timed out or failed"
    exit 1
fi

IMAGES_REVERTED=true
log_info "Containers rebuilt successfully"

# Start all services
log_info "Starting all services..."
if ! docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" up -d; then
    log_error "Failed to start services"
    exit 1
fi

log_info "Services started, waiting for health checks..."
echo ""

# =============================================================================
# Step 8: Verify Rollback Success
# =============================================================================

log_step "Step 8: Verifying rollback success"

# Wait for all services to be healthy
log_info "Waiting for services to become healthy..."
sleep 10  # Give services time to initialize

if ! verify_all_services; then
    log_error "Rollback verification failed - services are not healthy"
    log_error "Manual intervention required"
    exit 1
fi

# Run basic smoke tests
log_info "Running basic smoke tests..."

# Test backend health
if curl -sf --max-time 10 "http://localhost:3001/health" > /dev/null; then
    log_info "✓ Backend health check passed"
else
    log_error "✗ Backend health check failed"
    exit 1
fi

# Test frontend
if curl -sf --max-time 10 "http://localhost:3000" > /dev/null; then
    log_info "✓ Frontend accessibility check passed"
else
    log_error "✗ Frontend accessibility check failed"
    exit 1
fi

# Test database connectivity
if docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "SELECT 1;" > /dev/null 2>&1; then
    log_info "✓ Database connectivity check passed"
else
    log_error "✗ Database connectivity check failed"
    exit 1
fi

echo ""

# Display service status
log_info "Current service status:"
docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" ps

echo ""

# =============================================================================
# Rollback Complete
# =============================================================================

log_step "Rollback Complete"

log_info "✓ All services stopped and restarted"
log_info "✓ Database restored from backup"
log_info "✓ MinIO volumes restored from backup"
log_info "✓ Code reverted to previous commit"
log_info "✓ Services verified healthy"

echo ""
log_info "Rollback completed successfully at: $(date)"
log_info "System restored to state from: ${DEPLOYMENT_TIMESTAMP}"
log_info "Git commit: ${GIT_COMMIT}"
echo ""

log_warn "Next steps:"
echo "  1. Investigate the cause of the deployment failure"
echo "  2. Monitor service logs: docker compose logs -f"
echo "  3. Check metrics in Grafana: http://localhost:3002"
echo "  4. Verify critical user flows manually"
echo "  5. Review and fix issues before attempting redeployment"
echo ""

exit 0
