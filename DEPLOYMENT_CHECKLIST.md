# Production Deployment Checklist

Complete deployment checklist for the Supply Chain B2B SaaS platform (finkargo.ai).

## Pre-Deployment Checks

### Code Quality
- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] ESLint warnings addressed (`npm run lint`)
- [ ] Tests passing (`npm run test`)
- [ ] Build successful locally (`npm run build`)
- [ ] No console errors in development mode
- [ ] Pull latest changes: `git pull origin main`

### Environment Configuration
- [ ] All environment variables set (see ENVIRONMENT_VARIABLES_CHECKLIST.md)
- [ ] API URLs configured correctly for production
- [ ] Authentication keys updated for production (Clerk live keys)
- [ ] Database connection string verified
- [ ] Third-party API keys configured (Agent Astra, etc.)

### Security Review
- [ ] No hardcoded secrets in code
- [ ] API endpoints secured with authentication
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] XSS protection headers configured

## Manual Deployment Process

### Option 1: Using Deployment Script (Local Only)
```bash
# Run from local machine, NOT in Vercel build environment
./scripts/deploy-vercel.sh
# Select option 2 for production deployment
```

### Option 2: Direct Vercel CLI
```bash
vercel --prod
```

### Option 3: Automatic Deployment (Recommended)
```bash
# Push to main branch
git add .
git commit -m "Deploy to production"
git push origin main
# GitHub Actions will automatically deploy
```

## Automatic Deployment Setup

### 1. Get Vercel Credentials
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Get your org and project IDs
vercel project ls
```

### 2. Add GitHub Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions
Add these secrets:
- `VERCEL_TOKEN`: Get from https://vercel.com/account/tokens
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 3. Verify GitHub Actions
- Workflow files ready at `.github/workflows/`
  - `deploy-production.yml` - Production deployments
  - `deploy-preview.yml` - PR preview deployments

## Backend Deployment (Railway)

```bash
# Deploy backend
railway up

# Verify deployment
railway logs
railway domain
```

## Post-Deployment Verification

### Health Checks
```bash
# Frontend health
curl https://finkargo.ai

# API health
curl https://finkargo.ai/api/health
curl https://finkargo.ai/api/health/detailed

# Direct backend health
curl https://tip-vf-production.up.railway.app/api/health
```

### Functional Testing
- [ ] Homepage loads correctly
- [ ] Authentication flow works (sign up/sign in)
- [ ] Dashboard accessible after login
- [ ] All 15 business intelligence components load
- [ ] API calls successful from frontend
- [ ] File upload functionality works
- [ ] Data visualizations render correctly

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] No memory leaks in long sessions
- [ ] Mobile performance acceptable

## Environment Variables

### Frontend (Vercel Dashboard)
- `NEXT_PUBLIC_API_URL`: https://tip-vf-production.up.railway.app/api
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: pk_live_...
- `CLERK_SECRET_KEY`: sk_live_...

### Backend (Railway)
- `DATABASE_URL`: postgresql://...
- `AGENT_ASTRA_API_KEY`: aa_UFMDHMpOdW0bSy8SuGF0NpOu6I8iy4gu0G049xcIhFk
- `FLASK_ENV`: production

## Rollback Process

### Quick Rollback - Frontend
1. Go to Vercel dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Find the previous working deployment
5. Click "..." menu → "Promote to Production"

### Quick Rollback - Backend
```bash
# Railway rollback
railway rollback
```

### Emergency Procedures
1. **Frontend Issues**:
   - Revert deployment in Vercel dashboard
   - Clear CDN cache if needed
   - Update DNS if domain issues

2. **Backend Issues**:
   - Rollback Railway deployment
   - Restore database from backup if needed
   - Switch to maintenance mode

## Quick Status Check

```bash
# Check current git status
git status

# Verify remote URL
git remote -v

# Check current branch
git branch --show-current

# See latest commits
git log --oneline -5

# Check deployment status
curl -I https://finkargo.ai
```

## Known Issues

- ESLint warnings about React Hook dependencies (non-critical)
- Next.js 14.0.0 deprecation warning from Clerk (non-critical)
- SSL certificate pending (24-48 hours for provisioning)

## Support

- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard
- GitHub Actions: Check `.github/workflows/` for CI/CD status

---

**Last Updated**: July 15, 2025
**Platform Status**: LIVE at https://finkargo.ai