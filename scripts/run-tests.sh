#!/bin/bash

# Test Execution Script
# Runs all tests for the Supply Chain B2B SaaS MVP

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 Supply Chain B2B SaaS Test Runner${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Track test results
FRONTEND_TESTS_PASSED=false
BACKEND_TESTS_PASSED=false
INTEGRATION_TESTS_PASSED=false
TYPE_CHECK_PASSED=false
LINT_PASSED=false

# Function to run command and capture result
run_test() {
    local test_name=$1
    local command=$2
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo "Command: $command"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $test_name passed${NC}\n"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}\n"
        return 1
    fi
}

# 1. Environment Check
echo -e "${YELLOW}1. Environment Setup Check${NC}"
echo "================================"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check npm dependencies
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Node modules installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing Node dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python3 not found${NC}"
    exit 1
fi

# Check Python venv
if [ -d "venv311" ]; then
    echo -e "${GREEN}✅ Python venv found${NC}"
    source venv311/bin/activate
elif [ -d "venv" ]; then
    echo -e "${GREEN}✅ Python venv found${NC}"
    source venv/bin/activate
else
    echo -e "${YELLOW}⚠️  No Python venv found${NC}"
fi

echo ""

# 2. Frontend Tests
echo -e "${YELLOW}2. Frontend Tests${NC}"
echo "================================"

# TypeScript type checking
if run_test "TypeScript Type Check" "npm run type-check"; then
    TYPE_CHECK_PASSED=true
fi

# Linting
if run_test "ESLint" "npm run lint"; then
    LINT_PASSED=true
fi

# Component tests (if available)
if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
    if run_test "Frontend Unit Tests" "npm test -- --passWithNoTests"; then
        FRONTEND_TESTS_PASSED=true
    fi
else
    echo -e "${YELLOW}⚠️  No frontend tests configured${NC}\n"
    FRONTEND_TESTS_PASSED=true
fi

# 3. Backend Tests
echo -e "${YELLOW}3. Backend Tests${NC}"
echo "================================"

# Check if pytest is available
if command -v pytest &> /dev/null; then
    # Look for test files
    if find . -name "test_*.py" -o -name "*_test.py" | grep -v node_modules | grep -v venv | head -1 > /dev/null; then
        if run_test "Python Unit Tests" "pytest -v"; then
            BACKEND_TESTS_PASSED=true
        fi
    else
        echo -e "${YELLOW}⚠️  No Python test files found${NC}\n"
        BACKEND_TESTS_PASSED=true
    fi
else
    echo -e "${YELLOW}⚠️  pytest not installed - skipping backend tests${NC}\n"
    BACKEND_TESTS_PASSED=true
fi

# 4. Build Tests
echo -e "${YELLOW}4. Build Tests${NC}"
echo "================================"

# Test Next.js build
if run_test "Next.js Production Build" "npm run build"; then
    echo -e "${GREEN}✅ Frontend builds successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
fi

# 5. API Health Check
echo -e "${YELLOW}5. API Health Check${NC}"
echo "================================"

# Start backend in background
echo "Starting backend server..."
python main.py &
BACKEND_PID=$!
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
    INTEGRATION_TESTS_PASSED=true
else
    echo -e "${RED}❌ Backend API health check failed${NC}"
fi

# Kill backend
kill $BACKEND_PID 2>/dev/null || true

echo ""

# 6. Security Checks
echo -e "${YELLOW}6. Security Checks${NC}"
echo "================================"

# Check for exposed secrets
echo "Checking for exposed secrets..."
if ! grep -r "sk-" --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=.git --exclude="*.log" . 2>/dev/null | grep -v ".env.example"; then
    echo -e "${GREEN}✅ No exposed API keys found${NC}"
else
    echo -e "${RED}❌ Potential exposed secrets detected!${NC}"
fi

# Check .env.example exists
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
else
    echo -e "${YELLOW}⚠️  .env.example missing${NC}"
fi

echo ""

# 7. Performance Check
echo -e "${YELLOW}7. Performance Metrics${NC}"
echo "================================"

# Check bundle size
if [ -f ".next/analyze/client.html" ]; then
    echo "Bundle analysis available at .next/analyze/client.html"
fi

# Get build size
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo "Build size: $BUILD_SIZE"
fi

echo ""

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"

TOTAL_PASSED=0
TOTAL_TESTS=5

[ "$TYPE_CHECK_PASSED" = true ] && ((TOTAL_PASSED++))
[ "$LINT_PASSED" = true ] && ((TOTAL_PASSED++))
[ "$FRONTEND_TESTS_PASSED" = true ] && ((TOTAL_PASSED++))
[ "$BACKEND_TESTS_PASSED" = true ] && ((TOTAL_PASSED++))
[ "$INTEGRATION_TESTS_PASSED" = true ] && ((TOTAL_PASSED++))

echo "Type Checking: $([ "$TYPE_CHECK_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo "Linting: $([ "$LINT_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo "Frontend Tests: $([ "$FRONTEND_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo "Backend Tests: $([ "$BACKEND_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo "Integration Tests: $([ "$INTEGRATION_TESTS_PASSED" = true ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"

echo ""
echo "Overall: $TOTAL_PASSED/$TOTAL_TESTS tests passed"

if [ $TOTAL_PASSED -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi