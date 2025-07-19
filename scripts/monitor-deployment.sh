#!/bin/bash
# 🚨 Real-time Deployment Monitoring Script
# Monitors critical metrics during deployment

set -e

# Configuration
PRODUCTION_URL="https://finkargo.ai"
ALERT_THRESHOLD_ERROR_RATE=0.01  # 1%
ALERT_THRESHOLD_RESPONSE_TIME=2000  # 2 seconds
ALERT_THRESHOLD_AUTH_FAILURES=10  # per minute
DURATION=${1:-300}  # Default 5 minutes

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚨 Deployment Monitoring Active"
echo "Duration: ${DURATION} seconds"
echo "URL: ${PRODUCTION_URL}"
echo "================================"

# Initialize counters
ERRORS=0
TOTAL_REQUESTS=0
AUTH_FAILURES=0
START_TIME=$(date +%s)

# Monitoring loop
while [ $(($(date +%s) - START_TIME)) -lt $DURATION ]; do
    echo -ne "\r⏱️  Monitoring: $(($(date +%s) - START_TIME))s / ${DURATION}s"
    
    # Health check
    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" ${PRODUCTION_URL}/api/health || echo "FAILED")
    
    if [[ "$HEALTH_RESPONSE" == "FAILED" ]]; then
        ERRORS=$((ERRORS + 1))
        echo -e "\n${RED}❌ Health check failed!${NC}"
    else
        HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -2 | head -1)
        RESPONSE_TIME=$(echo "$HEALTH_RESPONSE" | tail -1)
        
        # Check response time
        if (( $(echo "$RESPONSE_TIME > 2" | bc -l) )); then
            echo -e "\n${YELLOW}⚠️  Slow response: ${RESPONSE_TIME}s${NC}"
        fi
        
        # Check HTTP status
        if [ "$HTTP_CODE" != "200" ]; then
            ERRORS=$((ERRORS + 1))
            echo -e "\n${RED}❌ HTTP Error: ${HTTP_CODE}${NC}"
        fi
    fi
    
    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
    
    # Calculate error rate
    ERROR_RATE=$(echo "scale=4; $ERRORS / $TOTAL_REQUESTS" | bc)
    
    # Check thresholds
    if (( $(echo "$ERROR_RATE > $ALERT_THRESHOLD_ERROR_RATE" | bc -l) )); then
        echo -e "\n${RED}🚨 CRITICAL: Error rate ${ERROR_RATE} exceeds threshold!${NC}"
        echo "Recommendation: ROLLBACK IMMEDIATELY"
        
        # Trigger rollback prompt
        read -p "Execute automatic rollback? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./scripts/emergency-rollback.sh
            exit 1
        fi
    fi
    
    sleep 5
done

echo -e "\n\n✅ Monitoring Complete"
echo "================================"
echo "Total Requests: $TOTAL_REQUESTS"
echo "Errors: $ERRORS"
echo "Error Rate: ${ERROR_RATE}"
echo "================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment appears stable!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some errors detected. Review logs.${NC}"
    exit 1
fi