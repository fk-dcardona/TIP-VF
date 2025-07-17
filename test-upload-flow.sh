#!/bin/bash

# Test script for end-to-end upload flow
# This tests: CSV Upload → Analytics Engine → AI Agent → Frontend Display

echo "🚀 Testing Finkargo End-to-End Upload Flow"
echo "=========================================="

# Configuration
API_URL="${API_URL:-http://localhost:5000/api}"
ORG_ID="org_test_123"
USER_ID="user_test_123"

# Create a sample CSV file
echo "📝 Creating sample inventory CSV file..."
cat > sample_inventory.csv << EOF
Product ID,Product Name,Current Stock,Sales Velocity,Unit Cost,Selling Price,Lead Time Days,Supplier
PROD001,Widget A,100,5.2,10.50,25.99,7,Acme Corp
PROD002,Widget B,45,8.7,15.00,35.50,10,Global Parts Ltd
PROD003,Widget C,12,3.1,22.00,49.99,14,Quality Supplies Inc
PROD004,Gadget X,200,12.5,5.00,12.99,5,Acme Corp
PROD005,Gadget Y,8,15.3,8.50,19.99,7,Global Parts Ltd
PROD006,Component Z,350,25.0,2.50,5.99,3,Quick Supply Co
PROD007,Tool Alpha,25,2.1,45.00,99.99,21,Premium Tools Ltd
PROD008,Tool Beta,0,4.5,35.00,79.99,14,Quality Supplies Inc
PROD009,Material M,500,50.0,1.00,2.50,2,Bulk Materials Inc
PROD010,Material N,5,18.5,3.00,7.99,5,Quick Supply Co
EOF

echo "✅ Sample CSV created with 10 products"
echo ""

# Test 1: Upload the CSV file
echo "🔄 Test 1: Uploading CSV file..."
echo "Endpoint: POST $API_URL/upload"
echo ""

RESPONSE=$(curl -s -X POST \
  -F "file=@sample_inventory.csv" \
  -F "org_id=$ORG_ID" \
  -F "user_id=$USER_ID" \
  "$API_URL/upload")

# Check if upload was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Upload successful!"
    
    # Extract upload ID
    UPLOAD_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "📋 Upload ID: $UPLOAD_ID"
    
    # Check for analytics
    if echo "$RESPONSE" | grep -q '"analytics":{'; then
        echo "✅ Analytics processing completed"
        
        # Extract some analytics info
        TOTAL_ALERTS=$(echo "$RESPONSE" | grep -o '"total_alerts":[0-9]*' | cut -d':' -f2)
        CRITICAL_ITEMS=$(echo "$RESPONSE" | grep -o '"critical_items":[0-9]*' | cut -d':' -f2)
        
        echo "📊 Analytics Results:"
        echo "   - Total Alerts: ${TOTAL_ALERTS:-0}"
        echo "   - Critical Items: ${CRITICAL_ITEMS:-0}"
    else
        echo "❌ Analytics processing not found in response"
    fi
    
    # Check for AI agent results
    if echo "$RESPONSE" | grep -q '"agent_result":{'; then
        echo "✅ AI Agent analysis completed"
        
        AGENT_CONFIDENCE=$(echo "$RESPONSE" | grep -o '"agent_confidence":[0-9.]*' | cut -d':' -f2)
        echo "🤖 AI Agent Results:"
        echo "   - Confidence: ${AGENT_CONFIDENCE:-0}%"
    else
        echo "❌ AI Agent results not found in response"
    fi
    
    echo ""
    echo "📄 Full Response Summary:"
    echo "$RESPONSE" | python -m json.tool 2>/dev/null | head -50 || echo "$RESPONSE" | head -200
    
else
    echo "❌ Upload failed!"
    echo "Response: $RESPONSE"
fi

echo ""
echo "=========================================="

# Test 2: Check if we can retrieve the upload
if [ ! -z "$UPLOAD_ID" ]; then
    echo ""
    echo "🔄 Test 2: Retrieving upload details..."
    echo "Endpoint: GET $API_URL/upload/$UPLOAD_ID"
    
    DETAILS=$(curl -s -X GET \
      -H "X-Organization-ID: $ORG_ID" \
      "$API_URL/upload/$UPLOAD_ID")
    
    if echo "$DETAILS" | grep -q '"upload":{'; then
        echo "✅ Upload details retrieved successfully"
    else
        echo "❌ Failed to retrieve upload details"
        echo "Response: $DETAILS"
    fi
fi

echo ""
echo "=========================================="
echo "🎯 Test Summary:"
echo ""
echo "The end-to-end flow should:"
echo "1. ✅ Accept CSV file upload"
echo "2. ✅ Process with Supply Chain Analytics Engine"
echo "3. ✅ Trigger AI Agent for insights"
echo "4. ✅ Return combined results to frontend"
echo "5. ✅ Display in AnalyticsDisplay component"
echo ""
echo "🚀 Ready to deploy if all tests pass!"
echo ""

# Cleanup
rm -f sample_inventory.csv

echo "🧹 Cleanup complete"