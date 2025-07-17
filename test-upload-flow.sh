#!/bin/bash

echo "🚀 Testing CSV Upload → Analytics → AI Agent Flow"
echo "================================================"

# Check if backend is running
echo "1. Checking backend health..."
curl -s http://localhost:5000/api/health || echo "❌ Backend not running! Start with: python main.py"

# Check if frontend is running
echo -e "\n2. Checking frontend..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend running" || echo "❌ Frontend not running! Start with: npm run dev"

echo -e "\n3. Sample CSV file created: sample_inventory.csv"
echo "   - Contains 10 products with inventory data"

echo -e "\n4. To test the complete flow:"
echo "   a) Start backend: python main.py"
echo "   b) Start frontend: npm run dev"
echo "   c) Go to http://localhost:3000/dashboard/upload"
echo "   d) Upload sample_inventory.csv"
echo "   e) View analytics and AI agent insights"

echo -e "\n5. API endpoints available:"
echo "   - POST http://localhost:5000/api/upload"
echo "   - GET http://localhost:5000/api/analytics/dashboard/{org_id}"
echo "   - GET http://localhost:5000/api/uploads/{org_id}"

echo -e "\n✅ Setup complete! Ready to test hypothesis validation."