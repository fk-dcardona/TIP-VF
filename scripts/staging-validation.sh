#!/bin/bash
# 📋 Staging Environment Validation
# Comprehensive checks before production deployment

set -e

# Configuration
STAGING_URL="https://preview.finkargo.ai"
PRODUCTION_URL="https://finkargo.ai"
MIN_PASS_RATE=95

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Staging Validation Suite${NC}"
echo "================================"
echo "Staging URL: $STAGING_URL"
echo "Minimum Pass Rate: ${MIN_PASS_RATE}%"
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0

# Test function
run_test() {
    local test_name=$1
    local test_command=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $test_name... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# 1. Health Checks
echo -e "\n${YELLOW}1. Health Checks${NC}"
echo "----------------"
run_test "Basic health" "curl -f -s $STAGING_URL/api/health"
run_test "Detailed health" "curl -f -s $STAGING_URL/api/health/detailed"
run_test "Database connectivity" "curl -f -s $STAGING_URL/api/health/db"

# 2. Authentication Tests
echo -e "\n${YELLOW}2. Authentication${NC}"
echo "-----------------"
run_test "Sign-in page loads" "curl -f -s $STAGING_URL/sign-in | grep -q 'Sign in'"
run_test "Clerk JS loads" "curl -f -s $STAGING_URL | grep -q 'clerk.browser.js'"
run_test "Auth endpoints" "curl -f -s -I $STAGING_URL/api/auth/me | grep -q '401\|200'"

# 3. Critical Routes
echo -e "\n${YELLOW}3. Critical Routes${NC}"
echo "------------------"
ROUTES=(
    "/"
    "/dashboard"
    "/dashboard/sales"
    "/dashboard/finance"
    "/dashboard/procurement"
    "/api-test"
)

for route in "${ROUTES[@]}"; do
    run_test "Route $route" "curl -f -s -o /dev/null -w '%{http_code}' $STAGING_URL$route | grep -q '200\|307'"
done

# 4. Component Rendering
echo -e "\n${YELLOW}4. Component Tests${NC}"
echo "------------------"
run_test "Customer Segmentation loads" "curl -f -s $STAGING_URL/dashboard/sales | grep -q 'Customer.*Segmentation\|Loading'"
run_test "Financial Analytics loads" "curl -f -s $STAGING_URL/dashboard/finance | grep -q 'Financial\|Cash\|Loading'"
run_test "Supply Chain loads" "curl -f -s $STAGING_URL/dashboard/procurement | grep -q 'Supply.*Chain\|Procurement\|Loading'"

# 5. Performance Checks
echo -e "\n${YELLOW}5. Performance${NC}"
echo "---------------"
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' $STAGING_URL)
if (( $(echo "$RESPONSE_TIME < 3" | bc -l) )); then
    echo -e "Page load time: ${GREEN}${RESPONSE_TIME}s ✓${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "Page load time: ${RED}${RESPONSE_TIME}s ✗${NC} (threshold: 3s)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 6. Bundle Size Check
echo -e "\n${YELLOW}6. Bundle Size${NC}"
echo "---------------"
# Check if build info endpoint exists
if curl -f -s $STAGING_URL/api/build-info > /dev/null 2>&1; then
    BUNDLE_SIZE=$(curl -s $STAGING_URL/api/build-info | grep -o '"bundleSize":[0-9.]*' | cut -d: -f2)
    if (( $(echo "$BUNDLE_SIZE < 87.8" | bc -l) )); then
        echo -e "Bundle size: ${GREEN}${BUNDLE_SIZE}KB ✓${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "Bundle size: ${RED}${BUNDLE_SIZE}KB ✗${NC} (threshold: 87.8KB)"
    fi
else
    echo -e "Bundle size: ${YELLOW}Unable to verify${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 7. Error Rate Check
echo -e "\n${YELLOW}7. Error Rate${NC}"
echo "--------------"
ERROR_COUNT=0
for i in {1..10}; do
    if ! curl -f -s $STAGING_URL/api/health > /dev/null 2>&1; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    sleep 0.5
done

ERROR_RATE=$((ERROR_COUNT * 10))
if [ $ERROR_RATE -lt 5 ]; then
    echo -e "Error rate: ${GREEN}${ERROR_RATE}% ✓${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "Error rate: ${RED}${ERROR_RATE}% ✗${NC} (threshold: 5%)"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Calculate results
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "\n================================"
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo "================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo -e "Pass Rate: ${PASS_RATE}%"

if [ $PASS_RATE -ge $MIN_PASS_RATE ]; then
    echo -e "\n${GREEN}✅ STAGING VALIDATION PASSED${NC}"
    echo "Safe to proceed with production deployment"
    exit 0
else
    echo -e "\n${RED}❌ STAGING VALIDATION FAILED${NC}"
    echo "DO NOT proceed with production deployment"
    echo "Fix issues and re-run validation"
    exit 1
fi