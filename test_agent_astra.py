#!/usr/bin/env python3
"""
Test Agent Astra integration for document processing
"""
import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_agent_astra():
    """Test Agent Astra API connection and functionality"""
    api_key = os.getenv('AGENT_ASTRA_API_KEY')
    
    if not api_key:
        print("❌ AGENT_ASTRA_API_KEY not found in environment")
        return False
    
    print(f"✅ Agent Astra API key found: {api_key[:8]}...")
    
    # Test API endpoint (check Agent Astra documentation for correct endpoint)
    test_url = "https://api.agentuniverse.ai/v1/test"  # Replace with actual endpoint
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Simple test request
        response = requests.get(test_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Agent Astra API connection successful")
            return True
        else:
            print(f"⚠️ Agent Astra API returned status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Agent Astra API connection failed: {e}")
        return False

def test_local_backend():
    """Test local backend health"""
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            print("✅ Local backend is running")
            return True
        else:
            print(f"⚠️ Local backend returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("❌ Local backend is not running")
        return False

def test_production_backend():
    """Test production backend health"""
    try:
        response = requests.get('https://tip-vf-production.up.railway.app/api/health', timeout=10)
        if response.status_code == 200:
            print("✅ Production backend is healthy")
            return True
        else:
            print(f"⚠️ Production backend returned status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Production backend connection failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Agent Astra Integration\n")
    
    # Test environment
    print("📋 Environment Variables:")
    print(f"   - DATABASE_URL: {'✅' if os.getenv('DATABASE_URL') else '❌'}")
    print(f"   - AGENT_ASTRA_API_KEY: {'✅' if os.getenv('AGENT_ASTRA_API_KEY') else '❌'}")
    print(f"   - SECRET_KEY: {'✅' if os.getenv('SECRET_KEY') else '❌'}")
    print()
    
    # Test backends
    print("🌐 Backend Health Checks:")
    local_ok = test_local_backend()
    prod_ok = test_production_backend()
    print()
    
    # Test Agent Astra
    print("🤖 Agent Astra Integration:")
    astra_ok = test_agent_astra()
    print()
    
    # Summary
    print("📊 Test Summary:")
    print(f"   - Local Backend: {'✅' if local_ok else '❌'}")
    print(f"   - Production Backend: {'✅' if prod_ok else '❌'}")
    print(f"   - Agent Astra API: {'✅' if astra_ok else '❌'}")
    
    if prod_ok and astra_ok:
        print("\n🎉 System ready for beta testing!")
        sys.exit(0)
    else:
        print("\n⚠️ Some components need attention before beta testing")
        sys.exit(1)