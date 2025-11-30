#!/bin/bash

# Validate Load Test Files
# Checks that all test files exist and are properly structured

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Validating Load Test Suite${NC}"
echo "Location: $SCRIPT_DIR"
echo ""

ERRORS=0

# Check if test files exist
echo "Checking test files..."

TEST_FILES=(
    "baseline.js"
    "upload.js"
    "status-check.js"
    "stress.js"
    "spike.js"
    "soak.js"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file exists"
    else
        echo -e "  ${RED}✗${NC} $file missing"
        ((ERRORS++))
    fi
done

echo ""

# Check if documentation exists
echo "Checking documentation..."

DOC_FILES=(
    "README.md"
    "QUICK_START.md"
    "INSTALLATION.md"
    "package.json"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file exists"
    else
        echo -e "  ${RED}✗${NC} $file missing"
        ((ERRORS++))
    fi
done

echo ""

# Check if results directory exists
echo "Checking directories..."

if [ -d "$SCRIPT_DIR/results" ]; then
    echo -e "  ${GREEN}✓${NC} results/ directory exists"
else
    echo -e "  ${YELLOW}⚠${NC} results/ directory missing (will be created on first run)"
fi

echo ""

# Check if source PDF files exist
echo "Checking test fixtures..."

FIXTURE_FILES=(
    "$SCRIPT_DIR/../SourceFiles/UP_TST_PDF.pdf"
    "$SCRIPT_DIR/../SourceFiles/UP_EXAM_SS.pdf"
    "$SCRIPT_DIR/../SourceFiles/UP_MOD_XLS.pdf"
)

for file in "${FIXTURE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $(basename $file) exists"
    else
        echo -e "  ${RED}✗${NC} $(basename $file) missing"
        ((ERRORS++))
    fi
done

echo ""

# Check test file structure
echo "Validating test file structure..."

for file in "${TEST_FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        # Check for required imports
        if grep -q "import http from 'k6/http'" "$SCRIPT_DIR/$file"; then
            echo -e "  ${GREEN}✓${NC} $file has http import"
        else
            echo -e "  ${RED}✗${NC} $file missing http import"
            ((ERRORS++))
        fi
        
        # Check for options export
        if grep -q "export const options" "$SCRIPT_DIR/$file"; then
            echo -e "  ${GREEN}✓${NC} $file has options export"
        else
            echo -e "  ${RED}✗${NC} $file missing options export"
            ((ERRORS++))
        fi
        
        # Check for default function
        if grep -q "export default function" "$SCRIPT_DIR/$file"; then
            echo -e "  ${GREEN}✓${NC} $file has default function"
        else
            echo -e "  ${RED}✗${NC} $file missing default function"
            ((ERRORS++))
        fi
    fi
done

echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All validation checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Install K6 (see INSTALLATION.md)"
    echo "  2. Start services: docker compose up -d"
    echo "  3. Run tests: k6 run baseline.js"
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors above before running tests."
    exit 1
fi
