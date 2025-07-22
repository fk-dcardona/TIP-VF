#!/usr/bin/env python3
"""
Simple script to test Railway endpoints without Flask dependencies
"""
import requests
import json

BASE_URL = "https://tip-vf-production.up.railway.app"

def test_endpoint(endpoint, description):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\nTesting: {description}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("✅ SUCCESS")
                print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Non-dict response'}")
            except:
                print("✅ SUCCESS (non-JSON response)")
                print(f"Response preview: {response.text[:100]}...")
        else:
            print("❌ FAILED")
            print(f"Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

def main():
    print("🔍 Testing Railway Deployment Endpoints")
    print("=" * 50)
    
    # Test basic health
    test_endpoint("/api/health", "Health Check")
    test_endpoint("/", "Root Endpoint")
    test_endpoint("/api/docs", "API Documentation")
    
    # Test analytics endpoints
    test_endpoint("/api/analytics/triangle/test_org", "Triangle Analytics")
    test_endpoint("/api/analytics/cross-reference/test_org", "Cross-Reference Analytics")
    test_endpoint("/api/analytics/supplier-performance/test_org", "Supplier Performance")
    test_endpoint("/api/analytics/market-intelligence/test_org", "Market Intelligence")
    test_endpoint("/api/analytics/health", "Analytics Health Check")

if __name__ == "__main__":
    main()