#!/bin/bash
# =============================================================================
# Deployment Verification Script
# =============================================================================
# Verifies deployment success by checking health, running smoke tests,
# and monitoring error rates for 10 minutes.
# Requirements: 12.4
# =============================================================================

set -e

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_PROD_FILE="${COMPOSE_PROD_FILE:-docker-compose.prod.yml}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
MONITORING_DURATION="${MONITORING_DURATION:-600}"  # 10 minutes
ERROR_THRESHOLD="${ERROR_THRESHOLD:-0.05}"  # 5% error rate threshold

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters for monitoring
TOTAL_REQUESTS=0
FAILED_REQUESTS=0

echo "=== Deployment Verification Script ==="
echo "Started at: $(date)"
echo "Backend URL: ${BACKEND_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Monitoring duration: ${MONITORING_DURATION}s"
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

# Check if a URL returns valid JSON
check_json_response() {
    local url=$1
    local timeout=${2:-5}
    
    local response=$(curl -s --max-time "$timeout" "$url" 2>/dev/null)
    
    if echo "$response" | jq empty 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# =============================================================================
# Step 1: Verify All Services Are Running
# =============================================================================

log_step "Step 1: Verifying all services are running"

services=("postgres" "redis" "minio" "backend" "frontend" "pdf-worker")
all_running=true

for service in "${services[@]}"; do
    state=$(docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" ps --format json "${service}" 2>/dev/null | jq -r '.[0].State // "none"')
    
    if [ "$state" = "running" ]; then
        log_info "✓ ${service} is running"
    else
        log_error "✗ ${service} is not running (state: ${state})"
        all_running=false
    fi
done

if [ "$all_running" = false ]; then
    log_error "Not all services are running"
    exit 1
fi

echo ""

# =============================================================================
# Step 2: Verify Health Checks
# =============================================================================

log_step "Step 2: Verifying health checks"

# Backend health check
log_info "Checking backend health..."
if check_url "${BACKEND_URL}/health" 200 10; then
    log_info "✓ Backend health check passed"
    
    # Check if response is valid JSON
    if check_json_response "${BACKEND_URL}/health" 10; then
        log_info "✓ Backend health response is valid JSON"
    else
        log_warn "⚠ Backend health response is not valid JSON"
    fi
else
    log_error "✗ Backend health check failed"
    exit 1
fi

# Database health check
log_info "Checking database health..."
if check_url "${BACKEND_URL}/health/db" 200 10; then
    log_info "✓ Database health check passed"
else
    log_error "✗ Database health check failed"
    exit 1
fi

# Frontend accessibility
log_info "Checking frontend accessibility..."
if check_url "${FRONTEND_URL}" 200 10; then
    log_info "✓ Frontend is accessible"
else
    log_error "✗ Frontend is not accessible"
    exit 1
fi

echo ""

# =============================================================================
# Step 3: Run Smoke Tests
# =============================================================================

log_step "Step 3: Running smoke tests"

# Test 1: API root endpoint
log_info "Test 1: API root endpoint"
if check_url "${BACKEND_URL}/api" 200 5; then
    log_info "✓ API root endpoint accessible"
else
    log_warn "⚠ API root endpoint not accessible (non-critical)"
fi

# Test 2: Metrics endpoint
log_info "Test 2: Metrics endpoint"
if check_url "${BACKEND_URL}/metrics" 200 5; then
    log_info "✓ Metrics endpoint accessible"
    
    # Verify Prometheus format
    metrics_response=$(curl -s --max-time 5 "${BACKEND_URL}/metrics" 2>/dev/null)
    if echo "$metrics_response" | grep -q "# HELP"; then
        log_info "✓ Metrics in Prometheus format"
    else
        log_warn "⚠ Metrics may not be in Prometheus format"
    fi
else
    log_warn "⚠ Metrics endpoint not accessible (non-critical)"
fi

# Test 3: Job queue metrics
log_info "Test 3: Job queue metrics"
if check_url "${BACKEND_URL}/api/jobs/metrics" 200 5; then
    log_info "✓ Job queue metrics accessible"
    
    if check_json_response "${BACKEND_URL}/api/jobs/metrics" 5; then
        log_info "✓ Job queue metrics response is valid JSON"
        
        # Parse and display metrics
        metrics=$(curl -s --max-time 5 "${BACKEND_URL}/api/jobs/metrics" 2>/dev/null)
        waiting=$(echo "$metrics" | jq -r '.waiting // 0')
        active=$(echo "$metrics" | jq -r '.active // 0')
        completed=$(echo "$metrics" | jq -r '.completed // 0')
        failed=$(echo "$metrics" | jq -r '.failed // 0')
        
        log_info "  Queue status: waiting=$waiting, active=$active, completed=$completed, failed=$failed"
    fi
else
    log_warn "⚠ Job queue metrics not accessible (non-critical)"
fi

# Test 4: Upload endpoint (OPTIONS for CORS)
log_info "Test 4: Upload endpoint CORS"
upload_options=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS --max-time 5 "${BACKEND_URL}/api/upload" 2>/dev/null || echo "000")
if [ "$upload_options" = "200" ] || [ "$upload_options" = "204" ]; then
    log_info "✓ Upload endpoint CORS configured"
else
    log_warn "⚠ Upload endpoint CORS may not be configured properly"
fi

echo ""

# =============================================================================
# Step 4: Verify Monitoring Stack
# =============================================================================

log_step "Step 4: Verifying monitoring stack"

# Check Prometheus
log_info "Checking Prometheus..."
if check_url "http://localhost:9090/-/healthy" 200 5; then
    log_info "✓ Prometheus is healthy"
    
    # Check if backend is being scraped
    targets=$(curl -s --max-time 5 "http://localhost:9090/api/v1/targets" 2>/dev/null)
    if echo "$targets" | jq -e '.data.activeTargets[] | select(.labels.job=="backend")' > /dev/null 2>&1; then
        log_info "✓ Prometheus is scraping backend metrics"
    else
        log_warn "⚠ Prometheus may not be scraping backend metrics"
    fi
else
    log_warn "⚠ Prometheus is not accessible (non-critical)"
fi

# Check Grafana
log_info "Checking Grafana..."
if check_url "http://localhost:3002/api/health" 200 5; then
    log_info "✓ Grafana is healthy"
else
    log_warn "⚠ Grafana is not accessible (non-critical)"
fi

echo ""

# =============================================================================
# Step 5: Monitor Error Rates
# =============================================================================

log_step "Step 5: Monitoring error rates for ${MONITORING_DURATION}s"

log_info "Monitoring endpoints every 10 seconds..."
log_info "Press Ctrl+C to skip monitoring (not recommended)"

start_time=$(date +%s)
end_time=$((start_time + MONITORING_DURATION))
check_interval=10

while [ $(date +%s) -lt $end_time ]; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    remaining=$((end_time - current_time))
    
    # Health check
    if check_url "${BACKEND_URL}/health" 200 5; then
        TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    else
        TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
        FAILED_REQUESTS=$((FAILED_REQUESTS + 1))
        log_warn "Health check failed at ${elapsed}s"
    fi
    
    # Calculate current error rate
    if [ $TOTAL_REQUESTS -gt 0 ]; then
        error_rate=$(echo "scale=4; $FAILED_REQUESTS / $TOTAL_REQUESTS" | bc)
        error_pct=$(echo "scale=2; $error_rate * 100" | bc)
    else
        error_rate=0
        error_pct=0
    fi
    
    # Display progress
    echo -ne "\r  Progress: ${elapsed}s / ${MONITORING_DURATION}s | Requests: ${TOTAL_REQUESTS} | Errors: ${FAILED_REQUESTS} (${error_pct}%) | Remaining: ${remaining}s   "
    
    # Check if error rate exceeds threshold
    if [ $TOTAL_REQUESTS -ge 10 ]; then
        threshold_exceeded=$(echo "$error_rate > $ERROR_THRESHOLD" | bc)
        if [ "$threshold_exceeded" -eq 1 ]; then
            echo ""
            log_error "Error rate (${error_pct}%) exceeds threshold ($(echo "scale=2; $ERROR_THRESHOLD * 100" | bc)%)"
            log_error "Deployment verification failed"
            exit 1
        fi
    fi
    
    sleep $check_interval
done

echo ""

# Final error rate calculation
if [ $TOTAL_REQUESTS -gt 0 ]; then
    final_error_rate=$(echo "scale=4; $FAILED_REQUESTS / $TOTAL_REQUESTS" | bc)
    final_error_pct=$(echo "scale=2; $final_error_rate * 100" | bc)
    
    log_info "Monitoring complete:"
    log_info "  Total requests: ${TOTAL_REQUESTS}"
    log_info "  Failed requests: ${FAILED_REQUESTS}"
    log_info "  Error rate: ${final_error_pct}%"
    
    threshold_exceeded=$(echo "$final_error_rate > $ERROR_THRESHOLD" | bc)
    if [ "$threshold_exceeded" -eq 1 ]; then
        log_error "✗ Error rate exceeds threshold"
        exit 1
    else
        log_info "✓ Error rate within acceptable limits"
    fi
else
    log_warn "No requests were made during monitoring"
fi

echo ""

# =============================================================================
# Step 6: Verify Container Resource Usage
# =============================================================================

log_step "Step 6: Checking container resource usage"

log_info "Current resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "backend|frontend|pdf-worker|postgres|redis" || true

echo ""

# =============================================================================
# Step 7: Check for Recent Errors in Logs
# =============================================================================

log_step "Step 7: Checking for recent errors in logs"

log_info "Checking backend logs for errors..."
error_count=$(docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" logs --tail=100 backend 2>/dev/null | grep -i "error" | wc -l || echo "0")

if [ "$error_count" -gt 0 ]; then
    log_warn "Found ${error_count} error messages in recent backend logs"
    log_info "Recent errors:"
    docker compose -f "${COMPOSE_FILE}" -f "${COMPOSE_PROD_FILE}" logs --tail=100 backend 2>/dev/null | grep -i "error" | tail -5 || true
else
    log_info "✓ No errors found in recent backend logs"
fi

echo ""

# =============================================================================
# Verification Complete
# =============================================================================

log_step "Deployment Verification Complete"

log_info "✓ All services are running"
log_info "✓ Health checks passed"
log_info "✓ Smoke tests completed"
log_info "✓ Error rate within acceptable limits"

echo ""
log_info "Deployment verification successful!"
log_info "Finished at: $(date)"
echo ""

log_info "Recommended next steps:"
echo "  1. Monitor Grafana dashboards: http://localhost:3002"
echo "  2. Check Prometheus metrics: http://localhost:9090"
echo "  3. Review application logs: docker compose logs -f backend frontend pdf-worker"
echo "  4. Test critical user flows manually"
echo ""

exit 0
