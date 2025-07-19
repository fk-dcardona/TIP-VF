#!/usr/bin/env python3
"""
Simple AI Functionality Test
Tests basic AI functionality by uploading data first
"""

import requests
import json
import time

def test_upload_and_insights():
    """Test upload followed by insights generation"""
    base_url = "http://localhost:5000"
    
    print("🔄 Testing CSV upload and insights generation...")
    
    # Test 1: Upload CSV data
    try:
        with open('test_sample_data.csv', 'rb') as f:
            files = {'file': ('test_data.csv', f, 'text/csv')}
            data = {
                'user_id': 'test_user_123',
                'data_type': 'inventory'
            }
            
            response = requests.post(f"{base_url}/api/upload", files=files, data=data)
            
            if response.status_code == 200:
                upload_result = response.json()
                print(f"✅ CSV Upload successful: {upload_result.get('message', 'No message')}")
                
                # Wait a bit for processing
                time.sleep(2)
                
                # Test 2: Get user insights
                insights_response = requests.get(f"{base_url}/api/insights/test_user_123")
                
                if insights_response.status_code == 200:
                    insights_data = insights_response.json()
                    print(f"✅ Insights generated successfully")
                    print(f"   - Health Score: {insights_data.get('insights', {}).get('summary', {}).get('overall_health_score', 'N/A')}")
                    
                    # Test 3: Get role-specific insights
                    for role in ['general_manager', 'sales', 'finance']:
                        role_response = requests.get(f"{base_url}/api/insights/test_user_123/role/{role}")
                        if role_response.status_code == 200:
                            print(f"✅ {role.title()} insights available")
                        else:
                            print(f"❌ {role.title()} insights failed: {role_response.status_code}")
                    
                    return True
                else:
                    print(f"❌ Insights failed: {insights_response.status_code} - {insights_response.text}")
                    return False
            else:
                print(f"❌ Upload failed: {response.status_code} - {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_document_analytics():
    """Test document analytics without upload (using existing data)"""
    base_url = "http://localhost:5000"
    
    print("\n🔄 Testing document analytics...")
    
    # Test analytics endpoint
    response = requests.get(f"{base_url}/api/documents/analytics/test_org_123")
    
    if response.status_code == 200:
        print("✅ Document analytics endpoint accessible")
        return True
    elif response.status_code == 404:
        print("ℹ️  No documents found (expected for new org)")
        return True
    else:
        print(f"❌ Document analytics failed: {response.status_code}")
        return False

def test_health_endpoints():
    """Test basic health endpoints"""
    base_url = "http://localhost:5000"
    
    print("\n🔄 Testing health endpoints...")
    
    endpoints = ["/api/health", "/api/ready", "/api/live"]
    all_good = True
    
    for endpoint in endpoints:
        response = requests.get(f"{base_url}{endpoint}")
        if response.status_code == 200:
            print(f"✅ {endpoint} - OK")
        else:
            print(f"❌ {endpoint} - FAILED ({response.status_code})")
            all_good = False
    
    return all_good

def main():
    """Main test runner"""
    print("🤖 Starting Simple AI Functionality Tests")
    print("=" * 50)
    
    # Test health first
    health_ok = test_health_endpoints()
    
    # Test data upload and insights
    upload_ok = test_upload_and_insights()
    
    # Test document analytics
    analytics_ok = test_document_analytics()
    
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Health Endpoints: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Data Upload & Insights: {'✅ PASS' if upload_ok else '❌ FAIL'}")
    print(f"Document Analytics: {'✅ PASS' if analytics_ok else '❌ FAIL'}")
    
    if all([health_ok, upload_ok, analytics_ok]):
        print("\n🎉 All core AI functionality tests passed!")
        return True
    else:
        print("\n💥 Some tests failed. The AI system may need attention.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)