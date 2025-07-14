# Supply Chain B2B SaaS - Deployment Guide

## Quick Start

Run the deployment script:
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

### 3. Vercel Deployment (Frontend)

Best for Next.js applications with serverless functions.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Set these environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `NEXT_PUBLIC_API_URL` (your backend URL)

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

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Backend API (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Twilio (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
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