#!/bin/bash
# Vercel Deployment Script for Supply Chain B2B SaaS

set -e

echo "🚀 Supply Chain B2B SaaS - Vercel Deployment Script"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

# Build the project first to catch errors early
echo -e "${YELLOW}📦 Building project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

# Environment variables reminder
echo -e "${YELLOW}📋 Required Environment Variables:${NC}"
echo "   - NEXT_PUBLIC_API_URL (Backend API URL)"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "   - CLERK_SECRET_KEY"
echo "   - NEXT_PUBLIC_APP_URL (Production URL)"
echo ""
echo -e "${YELLOW}⚠️  Make sure these are configured in Vercel Dashboard!${NC}"
echo ""

# Deployment options
echo "Select deployment type:"
echo "1) Preview deployment (staging)"
echo "2) Production deployment"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔄 Deploying to preview...${NC}"
        vercel
        ;;
    2)
        echo -e "${YELLOW}🚀 Deploying to production...${NC}"
        vercel --prod
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Post-deployment reminders
echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo -e "${YELLOW}📝 Post-deployment checklist:${NC}"
echo "   1. Verify environment variables in Vercel dashboard"
echo "   2. Update CORS settings in Railway backend to include Vercel URL"
echo "   3. Test authentication flow"
echo "   4. Check API connectivity"
echo "   5. Monitor performance in Vercel Analytics"
echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}"