#!/bin/bash
# =============================================================================
# Deployment Script with Automatic Rollback on Failure
# =============================================================================
# Wraps the deployment script with automatic failure detection and rollback.
# Monitors health checks and error rates, triggering rollback if thresholds
# are exceeded.
# Requirements: 12.3
# =============================================================================

set -e

# Configuration
DEPLOY_SCRIPT="scripts/deploy.sh"
VERIFY_SCRIPT="scripts/verify-deployment.sh"
ROLLBACK_SCRIPT="scripts/rollback.sh"
MONITORING_DURATION="${MONITORING_DURATION:-600}"  # 10 minutes
ERROR_THRESHOLD="${ERROR_THRESHOLD:-0.10}"  # 10% error rate threshold
HEALTH_CHECK_FAILURES_THRESHOLD=3  # Number of consecutive health check failures before rollback

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment state
DEPLOYMENT_STARTED=false
DEPLOYMENT_COMPLETED=false
ROLLBACK_TRIGGERED=false

echo "=== Deployment with Automatic Rollback ==="
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
    if [ $exit_code -ne 0 ] && [ "$ROLLBACK_TRIGGERED" = false ]; then
        log_error "Deployment failed with exit code: $exit_code"
        
        if [ "$DEPLOYMENT_STARTED" = true ] && [ "$DEPLOYMENT_COMPLETED" = false ]; then
            log_error "Deployment was interrupted"
            trigger_rollback "Deployment script failed"
        fi
    fi
}

trap cleanup_on_error EXIT

# Trigger automatic rollback
trigger_rollback() {
    local reason=$1
    
    if [ "$ROLLBACK_TRIGGERED" = true ]; then
        log_warn "Rollback already triggered, skipping duplicate"
        return
    fi
    
    ROLLBACK_TRIGGERED=true
    
    log_error "=== TRIGGERING AUTOMATIC ROLLBACK ==="
    log_error "Reason: ${reason}"
    echo ""
    
    # Check if rollback script exists
    if [ ! -f "${ROLLBACK_SCRIPT}" ]; then
        log_error "Rollback script not found: ${ROLLBACK_SCRIPT}"
        log_error "Manual rollback required"
        exit 1
    fi
    
    # Execute rollback with auto-confirmation
    log_info "Executing automatic rollback..."
    export ROLLBACK_CONFIRM="yes"
    
    if bash "${ROLLBACK_SCRIPT}"; then
        log_info "Automatic rollback completed successfully"
        exit 1  # Exit with error to indicate deployment failed
    else
        log_error "Automatic rollback failed"
        log_error "CRITICAL: Manual intervention required immediately"
        exit 2
    fi
}

# Check if a URL is accessible
check_url() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-5}
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        return 1
    fi
}

# Monitor health checks for failures
monitor_health_checks() {
    local backend_url="${BACKEND_URL:-http://localhost:3001}"
    local frontend_url="${FRONTEND_URL:-http://localhost:3000}"
    local check_interval=10
    local consecutive_failures=0
    local total_checks=0
    local failed_checks=0
    
    log_info "Monitoring health checks for ${MONITORING_DURATION}s..."
    log_info "Error threshold: $(echo "scale=2; $ERROR_THRESHOLD * 100" | bc)%"
    log_info "Consecutive failure threshold: ${HEALTH_CHECK_FAILURES_THRESHOLD}"
    echo ""
    
    local start_time=$(date +%s)
    local end_time=$((start_time + MONITORING_DURATION))
    
    while [ $(date +%s) -lt $end_time ]; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        local remaining=$((end_time - current_time))
        
        # Check backend health
        if check_url "${backend_url}/health" 200 5; then
            consecutive_failures=0
            total_checks=$((total_checks + 1))
        else
            consecutive_failures=$((consecutive_failures + 1))
            total_checks=$((total_checks + 1))
            failed_checks=$((failed_checks + 1))
            
            log_warn "Health check failed (consecutive: ${consecutive_failures})"
            
            # Check if consecutive failures exceed threshold
            if [ $consecutive_failures -ge $HEALTH_CHECK_FAILURES_THRESHOLD ]; then
                log_error "Consecutive health check failures (${consecutive_failures}) exceeded threshold (${HEALTH_CHECK_FAILURES_THRESHOLD})"
                trigger_rollback "Consecutive health check failures"
                return 1
            fi
        fi
        
        # Calculate error rate
        if [ $total_checks -gt 0 ]; then
            local error_rate=$(echo "scale=4; $failed_checks / $total_checks" | bc)
            local error_pct=$(echo "scale=2; $error_rate * 100" | bc)
        else
            local error_rate=0
            local error_pct=0
        fi
        
        # Display progress
        echo -ne "\r  Progress: ${elapsed}s / ${MONITORING_DURATION}s | Checks: ${total_checks} | Failures: ${failed_checks} (${error_pct}%) | Consecutive: ${consecutive_failures} | Remaining: ${remaining}s   "
        
        # Check if error rate exceeds threshold (after minimum checks)
        if [ $total_checks -ge 10 ]; then
            local threshold_exceeded=$(echo "$error_rate > $ERROR_THRESHOLD" | bc)
            if [ "$threshold_exceeded" -eq 1 ]; then
                echo ""
                log_error "Error rate (${error_pct}%) exceeded threshold ($(echo "scale=2; $ERROR_THRESHOLD * 100" | bc)%)"
                trigger_rollback "High error rate"
                return 1
            fi
        fi
        
        sleep $check_interval
    done
    
    echo ""
    
    # Final report
    if [ $total_checks -gt 0 ]; then
        local final_error_rate=$(echo "scale=4; $failed_checks / $total_checks" | bc)
        local final_error_pct=$(echo "scale=2; $final_error_rate * 100" | bc)
        
        log_info "Monitoring complete:"
        log_info "  Total checks: ${total_checks}"
        log_info "  Failed checks: ${failed_checks}"
        log_info "  Error rate: ${final_error_pct}%"
        
        local threshold_exceeded=$(echo "$final_error_rate > $ERROR_THRESHOLD" | bc)
        if [ "$threshold_exceeded" -eq 1 ]; then
            log_error "Final error rate exceeds threshold"
            trigger_rollback "High error rate after monitoring"
            return 1
        else
            log_info "✓ Error rate within acceptable limits"
        fi
    fi
    
    return 0
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

log_step "Pre-flight Checks"

# Check if deployment script exists
if [ ! -f "${DEPLOY_SCRIPT}" ]; then
    log_error "Deployment script not found: ${DEPLOY_SCRIPT}"
    exit 1
fi

# Check if rollback script exists
if [ ! -f "${ROLLBACK_SCRIPT}" ]; then
    log_error "Rollback script not found: ${ROLLBACK_SCRIPT}"
    exit 1
fi

# Check if bc is available (for calculations)
if ! command -v bc &> /dev/null; then
    log_error "bc is not installed. Please install bc for calculations."
    exit 1
fi

log_info "Pre-flight checks passed"
echo ""

# =============================================================================
# Step 1: Execute Deployment
# =============================================================================

log_step "Step 1: Executing deployment"

DEPLOYMENT_STARTED=true

# Execute deployment script
log_info "Running deployment script: ${DEPLOY_SCRIPT}"
echo ""

if bash "${DEPLOY_SCRIPT}"; then
    log_info "Deployment script completed successfully"
    DEPLOYMENT_COMPLETED=true
else
    log_error "Deployment script failed"
    trigger_rollback "Deployment script execution failed"
    exit 1
fi

echo ""

# =============================================================================
# Step 2: Initial Health Check Verification
# =============================================================================

log_step "Step 2: Initial health check verification"

log_info "Waiting 30 seconds for services to stabilize..."
sleep 30

# Quick health check
log_info "Performing initial health checks..."

if ! check_url "http://localhost:3001/health" 200 10; then
    log_error "Backend health check failed immediately after deployment"
    trigger_rollback "Backend not healthy after deployment"
    exit 1
fi

if ! check_url "http://localhost:3000" 200 10; then
    log_error "Frontend not accessible immediately after deployment"
    trigger_rollback "Frontend not accessible after deployment"
    exit 1
fi

log_info "✓ Initial health checks passed"
echo ""

# =============================================================================
# Step 3: Run Deployment Verification
# =============================================================================

log_step "Step 3: Running deployment verification"

if [ -f "${VERIFY_SCRIPT}" ]; then
    log_info "Running verification script: ${VERIFY_SCRIPT}"
    
    # Run verification with shorter monitoring duration (we'll do extended monitoring separately)
    export MONITORING_DURATION=60  # 1 minute quick check
    
    if bash "${VERIFY_SCRIPT}"; then
        log_info "✓ Deployment verification passed"
    else
        log_error "Deployment verification failed"
        trigger_rollback "Deployment verification failed"
        exit 1
    fi
else
    log_warn "Verification script not found, skipping: ${VERIFY_SCRIPT}"
fi

echo ""

# =============================================================================
# Step 4: Extended Monitoring with Automatic Rollback
# =============================================================================

log_step "Step 4: Extended monitoring with automatic rollback detection"

log_info "Monitoring deployment for ${MONITORING_DURATION}s..."
log_info "Automatic rollback will trigger if:"
echo "  - Error rate exceeds $(echo "scale=2; $ERROR_THRESHOLD * 100" | bc)%"
echo "  - ${HEALTH_CHECK_FAILURES_THRESHOLD} consecutive health check failures occur"
echo ""

if ! monitor_health_checks; then
    # Rollback already triggered by monitor_health_checks
    exit 1
fi

log_info "✓ Extended monitoring completed successfully"
echo ""

# =============================================================================
# Deployment Successful
# =============================================================================

log_step "Deployment Successful"

log_info "✓ Deployment completed without errors"
log_info "✓ Health checks passed"
log_info "✓ Verification successful"
log_info "✓ Extended monitoring passed"

echo ""
log_info "Deployment completed successfully at: $(date)"
echo ""

log_info "Recommended next steps:"
echo "  1. Monitor Grafana dashboards: http://localhost:3002"
echo "  2. Check Prometheus metrics: http://localhost:9090"
echo "  3. Review application logs: docker compose logs -f"
echo "  4. Test critical user flows manually"
echo "  5. Monitor for 24 hours before considering deployment stable"
echo ""

log_info "If issues arise, you can manually trigger rollback with:"
echo "  bash ${ROLLBACK_SCRIPT}"
echo ""

exit 0
