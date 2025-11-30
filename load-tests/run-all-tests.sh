#!/bin/bash

# Run All Load Tests Script
# Executes all K6 load tests in sequence with proper setup and teardown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create results directory
mkdir -p results

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}UP Schedule Generator - Load Test Suite${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if K6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: K6 is not installed${NC}"
    echo "Please install K6:"
    echo "  macOS: brew install k6"
    echo "  Linux: See https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if services are running
echo -e "${YELLOW}Checking if services are running...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}Error: Backend service is not running${NC}"
    echo "Please start services with: docker compose up -d"
    exit 1
fi

if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}Error: Frontend service is not running${NC}"
    echo "Please start services with: docker compose up -d"
    exit 1
fi

echo -e "${GREEN}✓ Services are running${NC}"
echo ""

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}Running ${test_name}...${NC}"
    echo "Test file: ${test_file}"
    echo "Started at: $(date)"
    echo ""
    
    if k6 run "${test_file}"; then
        echo -e "${GREEN}✓ ${test_name} completed successfully${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ ${test_name} failed${NC}"
        echo ""
        return 1
    fi
}

# Track test results
PASSED=0
FAILED=0

# Run tests
echo -e "${GREEN}Starting test suite...${NC}"
echo ""

# 1. Baseline Test
if run_test "Baseline Test" "baseline.js"; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Wait between tests
sleep 10

# 2. Status Check Test
if run_test "Status Check Test" "status-check.js"; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Wait between tests
sleep 10

# 3. Upload Test (longer, more intensive)
echo -e "${YELLOW}Note: Upload test will take approximately 20 minutes${NC}"
if run_test "Upload Test" "upload.js"; then
    ((PASSED++))
else
    ((FAILED++))
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Suite Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Tests passed: ${PASSED}"
echo "Tests failed: ${FAILED}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Results are available in the results/ directory"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Please review the results in the results/ directory"
    exit 1
fi
