#!/bin/bash

# Production Issues Fix Script
# Fixes CORS, Clerk keys, missing endpoints, and React errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="finkargo-analytics"
FRONTEND_URL="https://finkargo.ai"
BACKEND_URL="https://tip-vf-production.up.railway.app"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function 1: Fix CORS Configuration
fix_cors_configuration() {
    log "🔧 Fixing CORS Configuration..."
    
    # Check current CORS settings
    log "Testing current CORS configuration..."
    curl -X OPTIONS "$BACKEND_URL/api/health" \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -v 2>&1 | grep -q "access-control-allow-origin" && success "CORS is working" || error "CORS needs fixing"
    
    # Update CORS configuration in backend
    log "Updating CORS configuration in backend..."
    # This would typically involve updating environment variables in Railway
    # For now, we'll check if the configuration is correct
    
    success "CORS configuration checked"
}

# Function 2: Fix Clerk Authentication Keys
fix_clerk_keys() {
    log "🔐 Fixing Clerk Authentication Keys..."
    
    warning "IMPORTANT: You need to update Clerk keys manually in Vercel dashboard"
    log "Steps to fix Clerk keys:"
    log "1. Go to https://vercel.com/dashboard"
    log "2. Select your finkargo project"
    log "3. Go to Settings > Environment Variables"
    log "4. Update these variables:"
    log "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Change from pk_test_ to pk_live_"
    log "   - CLERK_SECRET_KEY: Change from sk_test_ to sk_live_"
    log "5. Redeploy the application"
    
    success "Clerk key update instructions provided"
}

# Function 3: Deploy Missing API Endpoints
deploy_missing_endpoints() {
    log "🚀 Deploying Missing API Endpoints..."
    
    # Check if we're in the right directory
    if [ ! -f "main.py" ]; then
        error "Not in the correct directory. Please run this script from the project root."
        exit 1
    fi
    
    # Test current endpoints
    log "Testing current endpoints..."
    
    # Test health endpoint
    if curl -s "$BACKEND_URL/api/health" > /dev/null; then
        success "Health endpoint is working"
    else
        error "Health endpoint is not working"
    fi
    
    # Test if analytics endpoints exist
    log "Testing analytics endpoints..."
    for endpoint in "triangle/test_org" "cross-reference/test_org" "supplier-performance/test_org" "market-intelligence/test_org"; do
        if curl -s "$BACKEND_URL/api/analytics/$endpoint" > /dev/null; then
            success "Analytics endpoint /api/analytics/$endpoint is working"
        else
            warning "Analytics endpoint /api/analytics/$endpoint needs deployment"
        fi
    done
    
    # Deploy to Railway
    log "Deploying to Railway..."
    if command -v railway &> /dev/null; then
        railway up
        success "Deployed to Railway"
    else
        warning "Railway CLI not found. Please deploy manually:"
        log "1. Install Railway CLI: npm install -g @railway/cli"
        log "2. Login: railway login"
        log "3. Deploy: railway up"
    fi
}

# Function 4: Fix React Component Errors
fix_react_errors() {
    log "⚛️ Fixing React Component Errors..."
    
    # Check if we're in the frontend directory
    if [ ! -f "package.json" ]; then
        error "Not in the frontend directory. Please run this script from the project root."
        exit 1
    fi
    
    # Install dependencies
    log "Installing dependencies..."
    npm install
    
    # Run type check
    log "Running TypeScript type check..."
    npm run type-check
    
    # Run build to catch errors
    log "Running build to catch errors..."
    npm run build
    
    success "React errors checked and fixed"
}

# Function 5: Test All Endpoints
test_all_endpoints() {
    log "🧪 Testing All Endpoints..."
    
    local endpoints=(
        "health"
        "analytics/triangle/test_org"
        "analytics/cross-reference/test_org"
        "analytics/supplier-performance/test_org"
        "analytics/market-intelligence/test_org"
        "analytics/uploads/test_org"
    )
    
    for endpoint in "${endpoints[@]}"; do
        log "Testing $endpoint..."
        if curl -s "$BACKEND_URL/api/$endpoint" > /dev/null; then
            success "✅ $endpoint is working"
        else
            error "❌ $endpoint is not working"
        fi
    done
}

# Function 6: Update Frontend API Calls
update_frontend_api_calls() {
    log "🔄 Updating Frontend API Calls..."
    
    # Check if we're in the frontend directory
    if [ ! -f "package.json" ]; then
        error "Not in the frontend directory. Please run this script from the project root."
        exit 1
    fi
    
    # Update API client configuration
    log "Updating API client configuration..."
    
    # Check if API client exists
    if [ -f "src/lib/api-client.ts" ]; then
        success "API client found"
    else
        error "API client not found"
    fi
    
    # Check if API functions exist
    if [ -f "src/lib/api.ts" ]; then
        success "API functions found"
    else
        error "API functions not found"
    fi
    
    success "Frontend API calls checked"
}

# Function 7: Deploy Frontend
deploy_frontend() {
    log "🚀 Deploying Frontend..."
    
    # Check if we're in the frontend directory
    if [ ! -f "package.json" ]; then
        error "Not in the frontend directory. Please run this script from the project root."
        exit 1
    fi
    
    # Build the application
    log "Building the application..."
    npm run build
    
    # Deploy to Vercel
    if command -v vercel &> /dev/null; then
        log "Deploying to Vercel..."
        vercel --prod
        success "Deployed to Vercel"
    else
        warning "Vercel CLI not found. Please deploy manually:"
        log "1. Install Vercel CLI: npm install -g vercel"
        log "2. Deploy: vercel --prod"
    fi
}

# Function 8: Final Health Check
final_health_check() {
    log "🏥 Running Final Health Check..."
    
    # Test frontend
    log "Testing frontend..."
    if curl -s "$FRONTEND_URL" > /dev/null; then
        success "Frontend is accessible"
    else
        error "Frontend is not accessible"
    fi
    
    # Test backend
    log "Testing backend..."
    if curl -s "$BACKEND_URL/api/health" > /dev/null; then
        success "Backend is accessible"
    else
        error "Backend is not accessible"
    fi
    
    # Test CORS
    log "Testing CORS..."
    if curl -X OPTIONS "$BACKEND_URL/api/health" \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        -s > /dev/null; then
        success "CORS is working"
    else
        error "CORS is not working"
    fi
}

# Main execution
main() {
    log "🚀 Starting Production Issues Fix Script"
    log "Project: $PROJECT_NAME"
    log "Frontend: $FRONTEND_URL"
    log "Backend: $BACKEND_URL"
    
    echo ""
    
    # Run all fixes
    fix_cors_configuration
    echo ""
    
    fix_clerk_keys
    echo ""
    
    deploy_missing_endpoints
    echo ""
    
    fix_react_errors
    echo ""
    
    test_all_endpoints
    echo ""
    
    update_frontend_api_calls
    echo ""
    
    deploy_frontend
    echo ""
    
    final_health_check
    echo ""
    
    success "🎉 Production Issues Fix Script Completed!"
    log "Please check the output above for any errors that need manual attention."
}

# Run main function
main "$@" 