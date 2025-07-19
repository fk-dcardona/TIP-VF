#!/bin/bash

# Supply Chain B2B SaaS - Server Startup Script
# This script starts both the Next.js frontend and Python backend servers

echo "🚀 Starting Supply Chain B2B SaaS Servers..."

# Kill any existing processes on ports 3000 and 5000
echo "Clearing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null

# Start Frontend (Next.js) in background
echo "Starting Next.js frontend on port 3000..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait a moment for frontend to start
sleep 3

# Start Backend (Python Flask) with venv
echo "Starting Python backend on port 5000..."
source venv311/bin/activate
python main.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo ""
echo "✅ Servers are starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 API Docs: http://localhost:5000/api/docs"
echo ""
echo "To stop servers, press Ctrl+C or run: kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "🧪 Testing the Organization Flow:"
echo "1. Open http://localhost:3000"
echo "2. Click 'Get Started' to sign up"
echo "3. Create an organization on the onboarding page"
echo "4. Access the dashboard with organization context"
echo ""

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID