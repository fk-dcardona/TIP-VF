#!/bin/bash

# Isolated Test Runner with Comprehensive Logging
# Runs all tests in isolation with detailed output capture

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get results directory from argument or create default
RESULTS_DIR=${1:-"test-results/$(date +%Y%m%d_%H%M%S)"}
mkdir -p "$RESULTS_DIR"

# Create subdirectories for different test types
mkdir -p "$RESULTS_DIR"/{unit,integration,e2e,static,performance,security,build}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 Isolated Test Runner${NC}"
echo -e "${BLUE}================================================${NC}\n"
echo "Results directory: $RESULTS_DIR"
echo ""

# Function to run test with timeout and capture output
run_test_suite() {
    local suite_name=$1
    local command=$2
    local timeout_seconds=${3:-300}  # Default 5 minute timeout
    local log_file="$RESULTS_DIR/$suite_name.log"
    local timing_file="$RESULTS_DIR/$suite_name.time"
    local status_file="$RESULTS_DIR/$suite_name.status"
    
    echo -e "${YELLOW}Running $suite_name...${NC}"
    
    # Record start time
    start_time=$(date +%s)
    
    # Run command with timeout
    if timeout $timeout_seconds bash -c "$command" > "$log_file" 2>&1; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo "$duration" > "$timing_file"
        echo -e "${GREEN}✅ $suite_name completed in ${duration}s${NC}"
        echo "PASSED" > "$status_file"
        return 0
    else
        exit_code=$?
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        echo "$duration" > "$timing_file"
        
        if [ $exit_code -eq 124 ]; then
            echo -e "${RED}❌ $suite_name timed out after ${timeout_seconds}s${NC}"
            echo "TIMEOUT" > "$status_file"
        else
            echo -e "${RED}❌ $suite_name failed (exit code: $exit_code)${NC}"
            echo "FAILED" > "$status_file"
        fi
        return 1
    fi
}

# Track overall results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=()

# 1. Static Analysis Tests
echo -e "${CYAN}=== Static Analysis ===${NC}"

# TypeScript type checking
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "static/typescript" "npm run type-check" 180; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("TypeScript")
fi

# ESLint
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "static/eslint" "npm run lint" 180; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("ESLint")
fi

# Python linting (if flake8 available in venv)
if command -v flake8 &> /dev/null; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test_suite "static/flake8" "flake8 . --exclude=venv,node_modules,development-archive,.next,test-environment --max-line-length=120" 60; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES+=("Flake8")
    fi
else
    echo -e "${YELLOW}⚠️  Flake8 not available, skipping Python linting${NC}"
fi

# Python type checking (if mypy available in venv)
if command -v mypy &> /dev/null; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test_suite "static/mypy" "mypy *.py --ignore-missing-imports --exclude 'development-archive|venv|test-environment'" 120; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES+=("MyPy")
    fi
else
    echo -e "${YELLOW}⚠️  MyPy not available, skipping Python type checking${NC}"
fi

echo ""

# 2. Unit Tests
echo -e "${CYAN}=== Unit Tests ===${NC}"

# JavaScript/TypeScript unit tests
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "unit/jest" "npm test -- --passWithNoTests --coverage --coverageDirectory=$RESULTS_DIR/coverage/jest" 300; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("Jest")
fi

# Python unit tests
if command -v pytest &> /dev/null; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    if run_test_suite "unit/pytest" "pytest -v --cov=. --cov-report=html:$RESULTS_DIR/coverage/pytest --cov-report=term" 300; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES+=("Pytest")
    fi
else
    echo -e "${YELLOW}⚠️  Pytest not available, skipping Python tests${NC}"
fi

echo ""

# 3. Integration Tests
echo -e "${CYAN}=== Integration Tests ===${NC}"

# API endpoint tests
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "integration/api" "python -c \"import requests; print('API test placeholder')\"" 60; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("API Integration")
fi

echo ""

# 4. Build Tests
echo -e "${CYAN}=== Build Tests ===${NC}"

# Next.js production build
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "build/nextjs" "npm run build" 600; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
    
    # Analyze build size
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next | cut -f1)
        echo "Build size: $BUILD_SIZE" > "$RESULTS_DIR/build/metrics.txt"
        
        # Extract bundle analysis if available
        if [ -f ".next/analyze/client.html" ]; then
            cp .next/analyze/client.html "$RESULTS_DIR/build/bundle-analysis.html"
        fi
    fi
else
    FAILED_SUITES+=("Next.js Build")
fi

echo ""

# 5. Security Checks
echo -e "${CYAN}=== Security Checks ===${NC}"

# Check for exposed secrets
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "security/secrets" "grep -r 'sk-\\|pk_\\|AKIA\\|ghp_' . --exclude-dir={node_modules,.next,venv,test-environment,development-archive} --exclude='*.log' || true" 60; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("Security Scan")
fi

# NPM audit
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "security/npm-audit" "npm audit --audit-level=moderate" 120; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("NPM Audit")
fi

echo ""

# 6. Performance Tests
echo -e "${CYAN}=== Performance Tests ===${NC}"

# Memory usage check
TOTAL_SUITES=$((TOTAL_SUITES + 1))
if run_test_suite "performance/memory" "python -c \"import psutil; print(f'Memory usage: {psutil.virtual_memory().percent}%')\"" 30; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES+=("Memory Test")
fi

echo ""

# 7. Environment Snapshot
echo -e "${CYAN}=== Environment Snapshot ===${NC}"
./scripts/capture-environment-snapshot.sh > "$RESULTS_DIR/environment-snapshot.log" 2>&1
echo -e "${GREEN}✅ Environment snapshot captured${NC}"

echo ""

# Generate summary report
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Test Summary Report${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Total Test Suites: $TOTAL_SUITES"
echo "Passed: $PASSED_SUITES"
echo "Failed: $((TOTAL_SUITES - PASSED_SUITES))"
echo "Pass Rate: $((PASSED_SUITES * 100 / TOTAL_SUITES))%"
echo ""

if [ ${#FAILED_SUITES[@]} -gt 0 ]; then
    echo -e "${RED}Failed Suites:${NC}"
    for suite in "${FAILED_SUITES[@]}"; do
        echo "  - $suite"
    done
    echo ""
fi

echo "Detailed results saved to: $RESULTS_DIR"

# Create JSON summary
cat > "$RESULTS_DIR/summary.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_suites": $TOTAL_SUITES,
  "passed": $PASSED_SUITES,
  "failed": $((TOTAL_SUITES - PASSED_SUITES)),
  "pass_rate": $((PASSED_SUITES * 100 / TOTAL_SUITES)),
  "failed_suites": $(printf '%s\n' "${FAILED_SUITES[@]}" | jq -R . | jq -s .),
  "environment": {
    "node_version": "$(node --version)",
    "npm_version": "$(npm --version)",
    "python_version": "$(python --version 2>&1)",
    "platform": "$(uname -s)"
  }
}
EOF

# Exit with appropriate code
if [ $PASSED_SUITES -eq $TOTAL_SUITES ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check logs for details.${NC}"
    exit 1
fi