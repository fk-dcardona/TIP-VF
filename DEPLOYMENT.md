# Supply Chain B2B SaaS - Deployment Guide

## Quick Start

### Vercel Deployment (Recommended for Frontend)
```bash
# Use the deployment helper script
./scripts/deploy-vercel.sh

# Or deploy manually
vercel --prod
```

### Full Stack Deployment
Backend is already deployed on Railway. For frontend:
```bash
./deploy.sh
```

## Deployment Options

### 1. Docker Deployment (Recommended)

Docker provides the most consistent deployment experience.

```bash
# Using docker-compose
docker-compose up --build

# Or manually:
docker build -f Dockerfile.frontend -t supply-chain-frontend .
docker build -f Dockerfile.backend -t supply-chain-backend .
docker run -p 3000:3000 supply-chain-frontend
docker run -p 5000:5000 supply-chain-backend
```

### 2. Railway Deployment

Railway offers simple full-stack deployment with automatic builds.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway up
```

### 3. Vercel Deployment (Frontend) - RECOMMENDED

Best for Next.js applications. The project is fully configured for Vercel deployment.

#### Prerequisites
- Backend already deployed to Railway at: `https://tip-vf-production.up.railway.app`
- Clerk account with authentication configured
- Vercel account

#### Deployment Steps

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Option 1: Use deployment helper script
./scripts/deploy-vercel.sh

# Option 2: Deploy manually
vercel --prod
```

#### Required Environment Variables in Vercel Dashboard

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# API Configuration (Required)
NEXT_PUBLIC_API_URL=https://tip-vf-production.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

#### Features Configured
- ✅ Security headers (CSP, XSS protection, etc.)
- ✅ API proxy/rewrites to Railway backend
- ✅ PWA support with manifest.json
- ✅ Optimized build configuration
- ✅ Edge runtime support
- ✅ Automatic HTTPS/SSL

#### Post-Deployment Steps
1. Update Railway backend CORS to include Vercel domain
2. Test authentication flow with Clerk
3. Verify API connectivity
4. Check performance in Vercel Analytics

### 4. Render Deployment

Create two services on Render:

**Web Service (Backend)**:
- Environment: Python 3
- Build Command: `pip install -r requirements.txt`
- Start Command: `python main.py`

**Static Site (Frontend)**:
- Environment: Node
- Build Command: `npm install && npm run build`
- Publish Directory: `.next`

### 5. AWS Deployment

**Option A: Elastic Beanstalk**
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init -p python-3.9 supply-chain-backend
eb create supply-chain-env
eb deploy
```

**Option B: ECS with Fargate**
- Use the provided Dockerfiles
- Push to ECR
- Create ECS task definitions
- Deploy with Fargate

## Environment Variables

### Development (.env.local)

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Optional Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### Production (Vercel Dashboard)

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key

# Backend API (Railway)
NEXT_PUBLIC_API_URL=https://tip-vf-production.up.railway.app/api
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional Services
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Twilio (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

## Production Checklist

- [ ] Set all environment variables
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipeline
- [ ] Test all API endpoints
- [ ] Verify file upload functionality
- [ ] Check authentication flow

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)
- Verify Python version: `python --version` (should be 3.8+)

### Runtime Errors
- Check environment variables are set correctly
- Verify backend is running on port 5000
- Check CORS configuration
- Review logs: `docker logs <container-id>`

### Database Issues
- Ensure Supabase credentials are correct
- Check network connectivity
- Verify Row Level Security policies

## Support

For deployment issues:
1. Check the logs
2. Verify environment variables
3. Ensure all services are running
4. Test API endpoints individually