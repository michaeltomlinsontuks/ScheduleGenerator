#!/bin/bash
# =============================================================================
# Smoke Test Script
# =============================================================================
# Quick smoke tests for critical functionality after deployment.
# This is a faster alternative to full verification for quick checks.
# Requirements: 12.4
# =============================================================================

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== Smoke Test Suite ==="
echo "Backend: ${BACKEND_URL}"
echo "Frontend: ${FRONTEND_URL}"
echo ""

PASSED=0
FAILED=0

# Helper function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing ${test_name}... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Backend health
run_test "Backend health" \
    "curl -sf --max-time 5 ${BACKEND_URL}/health"

# Test 2: Database health
run_test "Database health" \
    "curl -sf --max-time 5 ${BACKEND_URL}/health/db"

# Test 3: Frontend accessibility
run_test "Frontend accessibility" \
    "curl -sf --max-time 5 ${FRONTEND_URL}"

# Test 4: Metrics endpoint
run_test "Metrics endpoint" \
    "curl -sf --max-time 5 ${BACKEND_URL}/metrics | grep -q '# HELP'"

# Test 5: Job queue metrics
run_test "Job queue metrics" \
    "curl -sf --max-time 5 ${BACKEND_URL}/api/jobs/metrics | jq -e '.waiting != null'"

# Test 6: CORS configuration
run_test "CORS configuration" \
    "curl -sf -X OPTIONS --max-time 5 ${BACKEND_URL}/api/upload"

echo ""
echo "=== Results ==="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed${NC}"
    exit 0
else
    echo -e "${RED}✗ Some smoke tests failed${NC}"
    exit 1
fi
