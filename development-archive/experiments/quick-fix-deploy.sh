#!/bin/bash

# Quick Fix Deployment Script for Vercel
# Fixes the 500 error by deploying with proper environment configuration

echo "🚀 Quick Fix Deployment for Supply Chain B2B SaaS"
echo "=================================================="

# Build the project to check for errors
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors first."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎯 The application should now be accessible without 500 errors"
    echo "🔗 URL: https://supply-chain-b2b-2dlfezm37-daniel-cardonas-projects-6f697727.vercel.app"
    echo ""
    echo "📋 What was fixed:"
    echo "  ✅ Middleware now handles missing Clerk credentials gracefully"
    echo "  ✅ Layout fallback for demo mode without authentication"
    echo "  ✅ Production environment configuration added"
    echo "  ✅ Error boundary improvements"
    echo ""
    echo "🧪 You can now test with your colleagues!"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi