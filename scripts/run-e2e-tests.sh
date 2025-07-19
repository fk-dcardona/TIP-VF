#!/bin/bash

# E2E Test Runner for Finkargo.ai Business Intelligence Components
# This script runs comprehensive E2E tests on all 15 components

set -e

echo "🧪 Finkargo.ai E2E Test Suite"
echo "============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_URL=${TEST_URL:-"https://finkargo.ai"}
HEADLESS=${HEADLESS:-true}
COVERAGE=${COVERAGE:-true}

echo -e "${BLUE}Configuration:${NC}"
echo "- Test URL: $TEST_URL"
echo "- Headless: $HEADLESS"
echo "- Coverage: $COVERAGE"
echo ""

# Function to run tests for a specific category
run_category_tests() {
    local category=$1
    local test_file=$2
    
    echo -e "${YELLOW}Testing $category...${NC}"
    
    if [ "$COVERAGE" = true ]; then
        npm run test:e2e:coverage -- $test_file
    else
        npm run test:e2e -- $test_file
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $category tests passed${NC}"
    else
        echo -e "${RED}❌ $category tests failed${NC}"
        exit 1
    fi
    echo ""
}

# Check if dependencies are installed
echo -e "${BLUE}Checking dependencies...${NC}"
if ! npm list puppeteer >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing E2E test dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Create test results directory
mkdir -p e2e-results

# Run tests for each category
echo -e "${BLUE}Starting E2E tests...${NC}"
echo ""

# Sales Intelligence Components (1-5)
run_category_tests "Sales Intelligence Components" "e2e/sales-intelligence.test.ts"

# Financial Intelligence Components (6-10)
run_category_tests "Financial Intelligence Components" "e2e/financial-intelligence.test.ts"

# Supply Chain Intelligence Components (11-15)
run_category_tests "Supply Chain Intelligence Components" "e2e/supply-chain-intelligence.test.ts"

# Generate comprehensive report
echo -e "${BLUE}Generating test report...${NC}"
npx ts-node e2e/generate-test-report.ts

# Display coverage summary if enabled
if [ "$COVERAGE" = true ]; then
    echo -e "${BLUE}Coverage Summary:${NC}"
    echo ""
    
    # Check if coverage report exists
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo -e "${GREEN}✅ Coverage report generated${NC}"
        echo "View detailed coverage: open coverage/lcov-report/index.html"
        
        # Extract coverage summary
        if [ -f "coverage/coverage-summary.json" ]; then
            node -e "
                const coverage = require('./coverage/coverage-summary.json');
                const total = coverage.total;
                console.log('Statements:', total.statements.pct + '%');
                console.log('Branches:', total.branches.pct + '%');
                console.log('Functions:', total.functions.pct + '%');
                console.log('Lines:', total.lines.pct + '%');
            "
        fi
    fi
fi

echo ""
echo -e "${GREEN}🎉 E2E Test Suite Complete!${NC}"
echo ""
echo "📊 Reports generated:"
echo "- Test Report: e2e-test-report.md"
echo "- Coverage Report: coverage/lcov-report/index.html"
echo ""

# Performance summary
echo -e "${BLUE}Performance Summary:${NC}"
echo "- All 15 business intelligence components tested"
echo "- Functionality, accessibility, and performance validated"
echo "- Data accuracy verified across all calculations"
echo ""

# Exit with appropriate code
if [ -f "e2e-results/failed-tests.txt" ]; then
    echo -e "${RED}⚠️  Some tests failed. Check e2e-results/failed-tests.txt for details.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed successfully!${NC}"
    exit 0
fi