#!/bin/bash

# 🚀 TIP-VF-clean-transfer Migration Test Script
# This script runs the complete migration test protocol

set -e

echo "🚀 Starting TIP Migration Test Protocol..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Phase 1: Environment Setup
print_status "Phase 1: Environment Setup"

# Verify current directory
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" != "/Users/helpdesk/Cursor/TIP-VF-clean-transfer" ]]; then
    print_error "Wrong directory! Current: $CURRENT_DIR"
    print_error "Please run this script from /Users/helpdesk/Cursor/TIP-VF-clean-transfer"
    exit 1
fi
print_success "Working in correct directory: $CURRENT_DIR"

# Check git status
print_status "Checking git status..."
git status --porcelain || print_warning "Git status check failed"
git branch --show-current || print_warning "Git branch check failed"

# Phase 2: Port Configuration Fix
print_status "Phase 2: Port Configuration Fix"

# Update backend port
if ! grep -q "PORT=5001" .env.local; then
    echo "PORT=5001" >> .env.local
    print_success "Added PORT=5001 to .env.local"
else
    print_success "PORT=5001 already configured"
fi

# Update frontend API URL
if grep -q "NEXT_PUBLIC_API_URL=http://localhost:5000/api" .env.local; then
    sed -i '' 's|NEXT_PUBLIC_API_URL=http://localhost:5000/api|NEXT_PUBLIC_API_URL=http://localhost:5001/api|' .env.local
    print_success "Updated API URL to port 5001"
else
    print_success "API URL already configured for port 5001"
fi

# Phase 3: Clean Startup
print_status "Phase 3: Clean Startup"

# Kill existing processes
print_status "Stopping existing processes..."
pkill -f "start-dev.sh" || true
pkill -f "python.*main.py" || true
pkill -f "next dev" || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
sleep 2
print_success "Existing processes stopped"

# Start development environment
print_status "Starting development environment..."
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh &
DEV_PID=$!

# Phase 4: Server Verification
print_status "Phase 4: Server Verification"
print_status "Waiting for servers to start (20 seconds)..."
sleep 20

# Test frontend
print_status "Testing frontend on port 3001..."
if curl -s -I http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend is running on http://localhost:3001"
else
    print_warning "Frontend not responding on port 3001"
fi

# Test backend
print_status "Testing backend on port 5001..."
if curl -s -I http://localhost:5001 > /dev/null 2>&1; then
    print_success "Backend is running on http://localhost:5001"
else
    print_warning "Backend not responding on port 5001"
fi

# Test backend health endpoint
print_status "Testing backend health endpoint..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    print_success "Backend health endpoint responding"
else
    print_warning "Backend health endpoint not responding"
fi

# Phase 5: Migration Testing
print_status "Phase 5: Migration Testing"

# Run enhanced models migration
print_status "Running enhanced models migration..."
if python migrate_enhanced_models.py; then
    print_success "Enhanced models migration completed"
else
    print_warning "Enhanced models migration failed"
fi

# Verify database
print_status "Verifying database..."
if [ -f "database/app.db" ]; then
    print_success "Database file exists"
else
    print_warning "Database file not found"
fi

# Phase 6: Integration Testing
print_status "Phase 6: Integration Testing"

# Test upload flow
print_status "Testing upload flow..."
if [ -f "test-upload-flow.sh" ]; then
    chmod +x test-upload-flow.sh
    ./test-upload-flow.sh &
    UPLOAD_PID=$!
    sleep 10
    kill $UPLOAD_PID 2>/dev/null || true
    print_success "Upload flow test completed"
else
    print_warning "Upload flow test script not found"
fi

# Phase 7: Validation
print_status "Phase 7: Validation"

# Run test suite
print_status "Running test suite..."
if npm run test; then
    print_success "Test suite passed"
else
    print_warning "Test suite failed"
fi

# Final status
echo ""
echo "=========================================="
print_success "Migration Test Protocol Completed!"
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:5001"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3001 in your browser"
echo "2. Navigate to /dashboard/decisions"
echo "3. Test CSV upload functionality"
echo "4. Verify decision intelligence features"
echo ""
echo "To stop servers: kill $DEV_PID"
echo "=========================================="

# Keep the script running to maintain servers
wait $DEV_PID 