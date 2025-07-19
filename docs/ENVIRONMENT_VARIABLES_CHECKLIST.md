# Environment Variables Checklist

This document lists all required environment variables for the Supply Chain B2B SaaS platform.

## Frontend Environment Variables (Vercel)

### Required Variables
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL
  - Development: `http://localhost:5000/api`
  - Production: `https://tip-vf-production.up.railway.app/api`
  
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication public key
  - Format: `pk_test_...` (development) or `pk_live_...` (production)
  
- [ ] `CLERK_SECRET_KEY` - Clerk authentication secret key
  - Format: `sk_test_...` (development) or `sk_live_...` (production)

### Optional Variables
- [ ] `NEXT_PUBLIC_APP_URL` - Frontend application URL
  - Production: `https://finkargo.ai`
  
- [ ] `NEXT_PUBLIC_ENVIRONMENT` - Current environment
  - Values: `development`, `staging`, `production`

## Backend Environment Variables (Railway)

### Required Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Development: Can use SQLite: `sqlite:///instance/app.db`
  
- [ ] `AGENT_ASTRA_API_KEY` - Agent Astra API key for document intelligence
  - Current: `aa_UFMDHMpOdW0bSy8SuGF0NpOu6I8iy4gu0G049xcIhFk`

### Optional AI Variables
- [ ] `OPENAI_API_KEY` - OpenAI API key (if using OpenAI features)
  - Format: `sk-...`
  
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key (if using Claude features)
  - Format: `sk-ant-...`

### Flask Configuration
- [ ] `FLASK_ENV` - Flask environment
  - Values: `development`, `production`
  
- [ ] `DEBUG` - Debug mode
  - Values: `true` (development), `false` (production)
  
- [ ] `LOG_LEVEL` - Logging level
  - Values: `DEBUG`, `INFO`, `WARNING`, `ERROR`

## GitHub Actions Secrets

### Required for Deployment
- [ ] `VERCEL_TOKEN` - Vercel authentication token
  - Get from: https://vercel.com/account/tokens
  
- [ ] `VERCEL_ORG_ID` - Vercel organization ID
  - Get from: `vercel project ls`
  
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID
  - Get from: `vercel project ls`

## Verification Steps

### 1. Verify Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Ensure all frontend variables are set for Production environment

### 2. Verify Railway Environment Variables
1. Go to https://railway.app/dashboard
2. Select your project
3. Navigate to Variables tab
4. Ensure all backend variables are set

### 3. Test Environment Variables
```bash
# Test frontend variables locally
npm run dev
# Check console for any missing variable warnings

# Test backend variables locally
python main.py
# Check logs for any configuration errors

# Test production endpoints
curl https://finkargo.ai/api/health
curl https://tip-vf-production.up.railway.app/api/health
```

## Common Issues

### API Calls Failing
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Ensure no trailing slash in the URL
- Check CORS configuration in backend

### Authentication Errors
- Verify Clerk keys match the environment (test vs live)
- Ensure both public and secret keys are set
- Check Clerk dashboard for correct domain configuration

### Database Connection Errors
- Verify `DATABASE_URL` format is correct
- Check database server is accessible
- Ensure SSL mode is configured if required

## Security Notes

- Never commit `.env` files to version control
- Use different API keys for development and production
- Rotate secrets regularly
- Use GitHub Secrets for CI/CD variables
- Enable audit logging for production environments