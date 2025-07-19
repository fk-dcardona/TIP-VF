#!/bin/bash

# Supply Chain B2B SaaS - Deployment Script
# This script provides multiple deployment options

echo "Supply Chain B2B SaaS - Deployment Script"
echo "========================================"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy with Docker
deploy_docker() {
    echo "Deploying with Docker..."
    
    if ! command_exists docker; then
        echo "Error: Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Build and run with docker-compose
    docker-compose up --build -d
    
    echo "✅ Docker deployment complete!"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5000"
}

# Function to deploy to Railway
deploy_railway() {
    echo "Deploying to Railway..."
    
    if ! command_exists railway; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    railway login
    
    # Deploy the project
    railway up
    
    echo "✅ Railway deployment complete!"
}

# Function to deploy to Vercel (Frontend only)
deploy_vercel() {
    echo "Deploying frontend to Vercel..."
    
    if ! command_exists vercel; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    vercel --prod
    
    echo "✅ Vercel deployment complete!"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "Deploying to Heroku..."
    
    if ! command_exists heroku; then
        echo "Error: Heroku CLI is not installed. Please install it first."
        echo "Visit: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Create Heroku app if not exists
    heroku create supply-chain-b2b-saas || true
    
    # Add Python buildpack for backend
    heroku buildpacks:add heroku/python
    
    # Deploy
    git push heroku main
    
    echo "✅ Heroku deployment complete!"
}

# Function for local development
start_local() {
    echo "Starting local development servers..."
    
    # Check if npm dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "Installing npm dependencies..."
        npm install
    fi
    
    # Start backend in background
    echo "Starting Python backend..."
    python main.py &
    BACKEND_PID=$!
    
    # Start frontend
    echo "Starting Next.js frontend..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo "✅ Local development servers started!"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5000"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    
    # Wait for interrupt
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# Main menu
echo "Select deployment option:"
echo "1) Docker (Recommended for production)"
echo "2) Railway (Full-stack cloud deployment)"
echo "3) Vercel (Frontend only)"
echo "4) Heroku (Full-stack deployment)"
echo "5) Local Development"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_docker
        ;;
    2)
        deploy_railway
        ;;
    3)
        deploy_vercel
        ;;
    4)
        deploy_heroku
        ;;
    5)
        start_local
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac