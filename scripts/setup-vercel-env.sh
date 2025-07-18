#!/bin/bash
# Setup Vercel Environment Variables

echo "🔐 Setting up Vercel Environment Variables"
echo "========================================"
echo ""
echo "This script will help you add the required environment variables to your Vercel project."
echo ""
echo "You'll need:"
echo "1. Your Clerk Publishable Key (starts with pk_)"
echo "2. Your Clerk Secret Key (starts with sk_)"
echo "3. The Railway backend URL (https://tip-vf-production.up.railway.app/api)"
echo ""
echo "To add these variables, run the following commands:"
echo ""
echo "# Required - Clerk Authentication"
echo "vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "vercel env add CLERK_SECRET_KEY"
echo ""
echo "# Required - API Configuration"
echo "vercel env add NEXT_PUBLIC_API_URL"
echo "# Use: https://tip-vf-production.up.railway.app/api"
echo ""
echo "vercel env add NEXT_PUBLIC_APP_URL"
echo "# Use your Vercel domain (e.g., https://supply-chain-b2b.vercel.app)"
echo ""
echo "# Optional - Supabase (if using)"
echo "# vercel env add NEXT_PUBLIC_SUPABASE_URL"
echo "# vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "# vercel env add SUPABASE_SERVICE_KEY"
echo ""
echo "After adding all variables, redeploy with:"
echo "vercel --prod"
echo ""
echo "Or visit: https://vercel.com/daniel-cardonas-projects-6f697727/supply-chain-b2b/settings/environment-variables"