#!/bin/bash
# 🚨 EMERGENCY ROLLBACK SCRIPT
# Use only in case of critical production issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 EMERGENCY ROLLBACK INITIATED 🚨${NC}"
echo "This will rollback to the last stable deployment"
echo "================================"

# Confirmation
echo -e "${YELLOW}⚠️  This action will:${NC}"
echo "1. Revert to previous Vercel deployment"
echo "2. Restore package.json to pre-upgrade state"
echo "3. Alert the team"
echo ""
read -p "Are you SURE you want to rollback? (type 'ROLLBACK' to confirm): " CONFIRM

if [ "$CONFIRM" != "ROLLBACK" ]; then
    echo "Rollback cancelled."
    exit 1
fi

echo -e "\n${YELLOW}Starting rollback...${NC}"

# Step 1: Vercel instant rollback
echo "1. Rolling back Vercel deployment..."
if command -v vercel &> /dev/null; then
    # Get previous deployment
    PREV_DEPLOYMENT=$(vercel list --prod | grep "Ready" | head -2 | tail -1 | awk '{print $1}')
    echo "   Previous deployment: $PREV_DEPLOYMENT"
    
    # Promote previous deployment
    vercel promote $PREV_DEPLOYMENT --yes
    echo -e "   ${GREEN}✓ Vercel rollback complete${NC}"
else
    echo -e "   ${RED}Vercel CLI not found. Use dashboard for manual rollback.${NC}"
fi

# Step 2: Git rollback
echo "2. Rolling back Git repository..."
if [ -f "package.json.emergency" ]; then
    cp package.json.emergency package.json
    cp package-lock.json.emergency package-lock.json
    
    git add package.json package-lock.json
    git commit -m "EMERGENCY ROLLBACK: Restore stable dependencies"
    git push origin main --force-with-lease
    
    echo -e "   ${GREEN}✓ Git rollback complete${NC}"
else
    echo -e "   ${YELLOW}No emergency backup found. Manual intervention required.${NC}"
fi

# Step 3: Alert team
echo "3. Alerting team..."
ALERT_MESSAGE="🚨 EMERGENCY ROLLBACK EXECUTED

Time: $(date)
Reason: Production issues detected
Action: Rolled back to previous stable deployment

Please investigate:
1. Check error logs
2. Review deployment metrics
3. Plan fix for next deployment"

# Send alerts (configure your notification method)
# Example: Slack webhook
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$ALERT_MESSAGE\"}" \
        "$SLACK_WEBHOOK"
fi

# Log the rollback
echo "$ALERT_MESSAGE" >> deployment-rollback.log

echo -e "\n${GREEN}✅ ROLLBACK COMPLETE${NC}"
echo "================================"
echo "Actions taken:"
echo "- Vercel deployment rolled back"
echo "- Dependencies restored to stable state"
echo "- Team alerted"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Monitor production health"
echo "2. Investigate root cause"
echo "3. Fix issues before next deployment"
echo "4. Update rollback procedures if needed"