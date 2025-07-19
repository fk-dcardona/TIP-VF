# GitHub Actions Workflows

This directory contains automated workflows for deploying the Supply Chain B2B SaaS platform.

## Workflows

### 1. Deploy to Production (`deploy-production.yml`)
- **Trigger**: Push to `main` or `master` branch, or manual dispatch
- **Actions**:
  - Type checking and linting (non-blocking)
  - Build the Next.js application
  - Deploy to Vercel production environment
  - Post-deployment health check
- **Required Secrets**:
  - `VERCEL_TOKEN`: Your Vercel authentication token
  - `VERCEL_ORG_ID`: Your Vercel organization ID
  - `VERCEL_PROJECT_ID`: Your Vercel project ID

### 2. Deploy Preview (`deploy-preview.yml`)
- **Trigger**: Pull requests (opened, synchronized, reopened)
- **Actions**:
  - Type checking and linting (non-blocking)
  - Build the Next.js application
  - Deploy preview to Vercel
  - Comment on PR with preview URL
- **Required Secrets**: Same as production workflow

## Setup Instructions

1. **Get Vercel Token**:
   - Go to https://vercel.com/account/tokens
   - Create a new token with full access
   - Copy the token value

2. **Get Organization and Project IDs**:
   ```bash
   # Install Vercel CLI locally
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # List projects to get IDs
   vercel project ls
   ```
   
   The output will show:
   - Organization ID (starts with `team_`)
   - Project ID (starts with `prj_`)

3. **Add Secrets to GitHub**:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VERCEL_TOKEN`: Your token from step 1
     - `VERCEL_ORG_ID`: Your organization ID from step 2
     - `VERCEL_PROJECT_ID`: Your project ID from step 2

## Features

- **Automatic Deployments**: Push to main branch triggers production deployment
- **Preview Deployments**: Every PR gets its own preview environment
- **Health Checks**: Automated post-deployment verification
- **Type Safety**: Type checking runs before deployment
- **Code Quality**: Linting ensures code standards
- **Fast Builds**: Uses npm caching for faster CI/CD

## Monitoring

After deployment, check:
- Production: https://finkargo.ai
- API Health: https://finkargo.ai/api/health
- Vercel Dashboard: https://vercel.com/dashboard

## Troubleshooting

If deployments fail:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly set
3. Ensure the Vercel project is properly configured
4. Check that environment variables are set in Vercel dashboard