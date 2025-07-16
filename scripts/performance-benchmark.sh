#!/bin/bash
# Performance Benchmarking Script for Supply Chain Intelligence Platform

set -e

echo "🚀 Starting Performance Benchmarking Suite"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:5000}"
RESULTS_DIR="performance-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="${RESULTS_DIR}/benchmark_${TIMESTAMP}.json"

# Create results directory
mkdir -p $RESULTS_DIR

# Initialize results JSON
echo "{" > $RESULTS_FILE
echo '  "timestamp": "'$TIMESTAMP'",' >> $RESULTS_FILE
echo '  "results": {' >> $RESULTS_FILE

# Function to check if URL is accessible
check_url() {
    local url=$1
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        return 0
    else
        return 1
    fi
}

# Function to measure page load time
measure_page_load() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    # Measure time to first byte and total time
    result=$(curl -s -o /dev/null -w '{"ttfb": %{time_starttransfer}, "total": %{time_total}, "size": %{size_download}}' "$url")
    
    ttfb=$(echo $result | jq -r '.ttfb')
    total=$(echo $result | jq -r '.total')
    size=$(echo $result | jq -r '.size')
    
    # Convert to milliseconds
    ttfb_ms=$(echo "$ttfb * 1000" | bc | cut -d. -f1)
    total_ms=$(echo "$total * 1000" | bc | cut -d. -f1)
    size_kb=$(echo "scale=2; $size / 1024" | bc)
    
    # Determine status
    if [ $total_ms -lt 1000 ]; then
        echo -e "${GREEN}✓ Fast${NC} (${total_ms}ms)"
        status="fast"
    elif [ $total_ms -lt 3000 ]; then
        echo -e "${YELLOW}⚡ Acceptable${NC} (${total_ms}ms)"
        status="acceptable"
    else
        echo -e "${RED}✗ Slow${NC} (${total_ms}ms)"
        status="slow"
    fi
    
    # Add to results
    echo "    \"$name\": {" >> $RESULTS_FILE
    echo "      \"url\": \"$url\"," >> $RESULTS_FILE
    echo "      \"ttfb_ms\": $ttfb_ms," >> $RESULTS_FILE
    echo "      \"total_ms\": $total_ms," >> $RESULTS_FILE
    echo "      \"size_kb\": $size_kb," >> $RESULTS_FILE
    echo "      \"status\": \"$status\"" >> $RESULTS_FILE
    echo "    }," >> $RESULTS_FILE
}

# Function to measure API response time
measure_api_endpoint() {
    local endpoint=$1
    local name=$2
    
    echo -n "Testing API: $name... "
    
    # Make 5 requests and calculate average
    total_time=0
    for i in {1..5}; do
        time=$(curl -s -o /dev/null -w '%{time_total}' "${API_URL}${endpoint}")
        total_time=$(echo "$total_time + $time" | bc)
    done
    
    avg_time=$(echo "scale=3; $total_time / 5" | bc)
    avg_ms=$(echo "$avg_time * 1000" | bc | cut -d. -f1)
    
    # Determine status
    if [ $avg_ms -lt 100 ]; then
        echo -e "${GREEN}✓ Fast${NC} (${avg_ms}ms avg)"
        status="fast"
    elif [ $avg_ms -lt 500 ]; then
        echo -e "${YELLOW}⚡ Acceptable${NC} (${avg_ms}ms avg)"
        status="acceptable"
    else
        echo -e "${RED}✗ Slow${NC} (${avg_ms}ms avg)"
        status="slow"
    fi
    
    # Add to results
    echo "    \"api_$name\": {" >> $RESULTS_FILE
    echo "      \"endpoint\": \"$endpoint\"," >> $RESULTS_FILE
    echo "      \"avg_ms\": $avg_ms," >> $RESULTS_FILE
    echo "      \"status\": \"$status\"" >> $RESULTS_FILE
    echo "    }," >> $RESULTS_FILE
}

# Function to check bundle size
check_bundle_size() {
    echo -e "\n📦 Checking Bundle Size..."
    echo "========================"
    
    if [ -d ".next" ]; then
        # Get total size of .next directory
        total_size=$(du -sh .next | cut -f1)
        echo "Total .next build size: $total_size"
        
        # Get size of static files
        if [ -d ".next/static" ]; then
            static_size=$(du -sh .next/static | cut -f1)
            echo "Static files size: $static_size"
        fi
        
        # Check main bundle
        main_js=$(find .next/static/chunks -name "main-*.js" 2>/dev/null | head -1)
        if [ -n "$main_js" ]; then
            main_size=$(ls -lh "$main_js" | awk '{print $5}')
            echo "Main bundle size: $main_size"
        fi
        
        # Add to results
        echo "    \"bundle\": {" >> $RESULTS_FILE
        echo "      \"total_size\": \"$total_size\"," >> $RESULTS_FILE
        echo "      \"static_size\": \"${static_size:-N/A}\"," >> $RESULTS_FILE
        echo "      \"main_bundle\": \"${main_size:-N/A}\"" >> $RESULTS_FILE
        echo "    }," >> $RESULTS_FILE
    else
        echo "No .next directory found. Run 'npm run build' first."
    fi
}

# Function to run Lighthouse CI
run_lighthouse() {
    echo -e "\n🔦 Running Lighthouse Performance Audit..."
    echo "========================================"
    
    if command -v lighthouse &> /dev/null; then
        lighthouse "$FRONTEND_URL" \
            --output=json \
            --output-path="${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json" \
            --only-categories=performance \
            --chrome-flags="--headless" \
            --quiet
        
        # Extract key metrics
        perf_score=$(jq '.categories.performance.score' "${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json")
        fcp=$(jq '.audits."first-contentful-paint".numericValue' "${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json")
        lcp=$(jq '.audits."largest-contentful-paint".numericValue' "${RESULTS_DIR}/lighthouse_${TIMESTAMP}.json")
        
        echo "Performance Score: $(echo "$perf_score * 100" | bc | cut -d. -f1)/100"
        echo "First Contentful Paint: ${fcp}ms"
        echo "Largest Contentful Paint: ${lcp}ms"
        
        # Add to results
        echo "    \"lighthouse\": {" >> $RESULTS_FILE
        echo "      \"performance_score\": $perf_score," >> $RESULTS_FILE
        echo "      \"fcp_ms\": $fcp," >> $RESULTS_FILE
        echo "      \"lcp_ms\": $lcp" >> $RESULTS_FILE
        echo "    }" >> $RESULTS_FILE
    else
        echo "Lighthouse not installed. Install with: npm install -g lighthouse"
        echo "    \"lighthouse\": \"not_available\"" >> $RESULTS_FILE
    fi
}

# Main execution
echo "🌐 Frontend Performance Tests"
echo "============================"

# Check if frontend is running
if check_url "$FRONTEND_URL"; then
    measure_page_load "$FRONTEND_URL" "homepage"
    measure_page_load "$FRONTEND_URL/dashboard" "dashboard"
    measure_page_load "$FRONTEND_URL/sign-in" "signin"
else
    echo -e "${RED}Frontend not accessible at $FRONTEND_URL${NC}"
fi

echo -e "\n🔌 API Performance Tests"
echo "======================="

# Check if API is running
if check_url "$API_URL/api/health"; then
    measure_api_endpoint "/api/health" "health"
    measure_api_endpoint "/api/analytics/sales" "sales_analytics"
    measure_api_endpoint "/api/analytics/financial" "financial_analytics"
    measure_api_endpoint "/api/analytics/procurement" "procurement_analytics"
else
    echo -e "${RED}API not accessible at $API_URL${NC}"
fi

# Bundle size check
check_bundle_size

# Lighthouse (optional)
if [ "$RUN_LIGHTHOUSE" = "true" ]; then
    run_lighthouse
fi

# Close JSON
echo "  }" >> $RESULTS_FILE
echo "}" >> $RESULTS_FILE

# Summary
echo -e "\n📊 Performance Summary"
echo "===================="
echo "Results saved to: $RESULTS_FILE"

# Display key metrics
if [ -f "$RESULTS_FILE" ]; then
    echo -e "\nKey Metrics:"
    
    # Calculate averages
    page_loads=$(jq -r '.results | to_entries[] | select(.key | startswith("homepage") or startswith("dashboard")) | "\(.key): \(.value.total_ms)ms"' "$RESULTS_FILE" 2>/dev/null)
    if [ -n "$page_loads" ]; then
        echo -e "\nPage Load Times:"
        echo "$page_loads"
    fi
    
    api_times=$(jq -r '.results | to_entries[] | select(.key | startswith("api_")) | "\(.key): \(.value.avg_ms)ms"' "$RESULTS_FILE" 2>/dev/null)
    if [ -n "$api_times" ]; then
        echo -e "\nAPI Response Times:"
        echo "$api_times"
    fi
fi

echo -e "\n✅ Performance benchmarking complete!"