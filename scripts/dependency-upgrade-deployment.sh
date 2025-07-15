#!/bin/bash
# Zero-Downtime Dependency Upgrade Deployment Strategy
# For resolving Next.js 14.0.0 -> 14.2.25 upgrade

set -e

echo "🚀 Zero-Downtime Dependency Upgrade Deployment"
echo "============================================"

# Configuration
BRANCH_NAME="fix/nextjs-clerk-dependency-upgrade"
ROLLBACK_FILES=("package.json.backup" "package-lock.json.backup")
PRODUCTION_URL="https://finkargo.ai"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Pre-deployment checks
echo -e "${YELLOW}Phase 1: Pre-deployment Verification${NC}"
echo "1. Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]; then
    echo -e "${RED}Error: Not on correct branch. Expected: $BRANCH_NAME, Got: $CURRENT_BRANCH${NC}"
    exit 1
fi

echo "2. Verifying backup files exist..."
for file in "${ROLLBACK_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Backup file $file not found${NC}"
        exit 1
    fi
done

echo "3. Running local tests..."
npm run type-check || { echo -e "${RED}Type check failed${NC}"; exit 1; }
npm run lint || { echo -e "${RED}Lint check failed${NC}"; exit 1; }

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

# Deployment steps
echo -e "\n${YELLOW}Phase 2: Deployment Steps${NC}"
echo "1. Commit changes locally"
git add package.json package-lock.json tsconfig.json
git commit -m "fix: upgrade Next.js to 14.2.25 to resolve Clerk peer dependency conflict

- Upgraded Next.js from 14.0.0 to 14.2.25
- Upgraded eslint-config-next to match
- Excluded e2e directory from TypeScript build
- Removes need for --legacy-peer-deps flag
- Maintains full compatibility with @clerk/nextjs 6.24.0"

echo "2. Push to feature branch"
git push origin "$BRANCH_NAME"

echo -e "\n${YELLOW}Phase 3: Production Deployment${NC}"
echo "GitHub Actions will automatically:"
echo "1. Run CI/CD pipeline on push"
echo "2. Build and test the application"
echo "3. Deploy to Vercel preview environment"
echo "4. After manual verification, merge to main"
echo "5. Auto-deploy to production"

echo -e "\n${YELLOW}Phase 4: Monitoring${NC}"
echo "Monitor the following endpoints:"
echo "- Health: $PRODUCTION_URL/api/health"
echo "- App: $PRODUCTION_URL"

# Rollback procedure
cat > rollback-instructions.md << 'EOF'
# Rollback Procedure

If issues occur after deployment:

## Immediate Rollback (within 5 minutes)
```bash
# Restore from backup
cp package.json.backup package.json
cp package-lock.json.backup package-lock.json

# Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps

# Commit and push
git add package.json package-lock.json
git commit -m "revert: rollback to Next.js 14.0.0"
git push origin main
```

## Vercel Rollback
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find last working deployment
4. Click "..." menu → "Promote to Production"

## Railway Backend (if affected)
1. Go to Railway Dashboard
2. Navigate to Deployments
3. Rollback to previous deployment
EOF

echo -e "\n${GREEN}✓ Deployment script ready${NC}"
echo "Rollback instructions saved to: rollback-instructions.md"
echo ""
echo "Next steps:"
echo "1. Review the changes in GitHub"
echo "2. Create Pull Request from $BRANCH_NAME to main"
echo "3. Wait for CI/CD checks to pass"
echo "4. Test in preview environment"
echo "5. Merge to main for auto-deployment"