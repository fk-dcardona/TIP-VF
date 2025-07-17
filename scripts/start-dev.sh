#!/bin/bash

# Development startup script for Supply Chain Intelligence Platform
# This script ensures both frontend and backend run with consistent configuration

set -e

echo "🚀 Starting Supply Chain Intelligence Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Check environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found, creating from example..."
        if [ -f "env.example" ]; then
            cp env.example .env.local
            print_success "Created .env.local from example"
        else
            print_error "env.example not found"
            exit 1
        fi
    fi
    
    # Check if NEXT_PUBLIC_API_URL is set
    if ! grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        print_warning "NEXT_PUBLIC_API_URL not found in .env.local"
        echo "NEXT_PUBLIC_API_URL=http://localhost:5000" >> .env.local
        print_success "Added NEXT_PUBLIC_API_URL to .env.local"
    fi
    
    print_success "Environment configuration check passed"
}

# Kill existing processes
kill_existing_processes() {
    print_status "Stopping existing processes..."
    
    # Kill Next.js processes
    pkill -f "next dev" || true
    pkill -f "next-server" || true
    
    # Kill Python backend processes
    pkill -f "python.*app.py" || true
    pkill -f "flask" || true
    
    sleep 2
    print_success "Existing processes stopped"
}

# Start backend server
start_backend() {
    print_status "Starting backend server..."
    
    # Check if virtual environment exists
    if [ ! -d "venv311" ]; then
        print_warning "Virtual environment not found, creating..."
        python3 -m venv venv311
    fi
    
    # Activate virtual environment
    source venv311/bin/activate
    
    # Install Python dependencies if needed
    if [ ! -f "venv311/lib/python*/site-packages/flask" ]; then
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt || pip install flask flask-cors
    fi
    
    # Start backend in background
    python app.py &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 3
    
    # Check if backend is running
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        print_success "Backend server started on http://localhost:5000"
    else
        print_warning "Backend health check failed, but continuing..."
    fi
}

# Start frontend server
start_frontend() {
    print_status "Starting frontend server..."
    
    # Install Node.js dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
    fi
    
    # Start frontend in background
    PORT=3001 npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    sleep 5
    
    # Check if frontend is running
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        print_success "Frontend server started on http://localhost:3001"
    else
        print_warning "Frontend health check failed, but continuing..."
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "Supply Chain Intelligence Platform"
    echo "Development Startup Script"
    echo "=========================================="
    
    check_dependencies
    check_environment
    kill_existing_processes
    start_backend
    start_frontend
    
    echo ""
    echo "=========================================="
    print_success "Platform started successfully!"
    echo ""
    echo "Frontend: http://localhost:3001"
    echo "Backend:  http://localhost:5000"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo "=========================================="
    
    # Wait for user to stop
    wait
}

# Cleanup function
cleanup() {
    print_status "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    print_success "Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run main function
main 