#!/bin/bash

echo "🚀 Deploying Supply Chain Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd src

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Frontend deployed successfully!"
echo "🔧 Don't forget to set environment variables in Vercel dashboard:"
echo "   NEXT_PUBLIC_API_URL=https://tip-vf-production.up.railway.app/api"
echo ""
echo "🎉 Your full application is now live!"
echo "   Backend: https://tip-vf-production.up.railway.app"
echo "   Frontend: [Check Vercel dashboard for URL]" 