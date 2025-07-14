#!/bin/bash
# Add essential environment variables to Vercel

echo "🔐 Adding Environment Variables to Vercel"
echo "========================================"

# Required environment variables with default values
echo "Adding NEXT_PUBLIC_API_URL..."
echo "https://tip-vf-production.up.railway.app/api" | vercel env add NEXT_PUBLIC_API_URL production

echo "Adding Clerk URLs..."
echo "/sign-in" | vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
echo "/sign-up" | vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
echo "/dashboard" | vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production
echo "/dashboard" | vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL production

echo ""
echo "✅ Basic environment variables added!"
echo ""
echo "⚠️  You still need to add your Clerk keys manually:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project: supply-chain-b2b"
echo "3. Go to Settings → Environment Variables"
echo "4. Add these manually:"
echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (your pk_... key)"
echo "   - CLERK_SECRET_KEY (your sk_... key)"
echo ""
echo "Or run these commands with your actual keys:"
echo "vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "vercel env add CLERK_SECRET_KEY"