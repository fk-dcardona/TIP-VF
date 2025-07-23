#!/usr/bin/env python3
"""
Test dashboard responsiveness after performance fixes
"""

import requests
import time
import json

def test_dashboard_responsiveness():
    """Test if dashboard is responsive"""
    base_url = "http://localhost:3000"
    
    print("🎯 Testing Dashboard Responsiveness")
    print("=" * 50)
    
    # Test 1: Homepage loads quickly
    print("\n📄 Testing Homepage...")
    try:
        start = time.time()
        response = requests.get(base_url, timeout=5)
        load_time = time.time() - start
        
        if response.status_code == 200:
            print(f"✅ Homepage loaded in {load_time:.2f}s")
            if load_time > 3:
                print("   ⚠️  Slow load time")
        else:
            print(f"❌ Homepage returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Homepage error: {e}")
    
    # Test 2: Dashboard page loads
    print("\n📊 Testing Dashboard Page...")
    try:
        start = time.time()
        response = requests.get(f"{base_url}/dashboard", timeout=10)
        load_time = time.time() - start
        
        if response.status_code == 200:
            print(f"✅ Dashboard loaded in {load_time:.2f}s")
            
            # Check for React/Next.js indicators
            content = response.text
            
            if "_next" in content:
                print("   ✅ Next.js framework detected")
            
            if "dashboard" in content.lower():
                print("   ✅ Dashboard content present")
                
            if "upload" in content.lower():
                print("   ✅ Upload functionality detected")
                
            # Check page size
            size_kb = len(content) / 1024
            print(f"   📏 Page size: {size_kb:.1f}KB")
            
            if size_kb > 500:
                print("   ⚠️  Large page size might affect performance")
                
        else:
            print(f"❌ Dashboard returned status {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("❌ Dashboard request timed out - page might be unresponsive")
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
    
    # Test 3: Static assets load
    print("\n🎨 Testing Static Assets...")
    try:
        # Try to get a Next.js static asset
        response = requests.get(f"{base_url}/_next/static/chunks/webpack.js", timeout=5)
        if response.status_code == 200:
            print("✅ Static assets loading correctly")
        else:
            print("⚠️  Static assets might not be optimized")
    except:
        print("⚠️  Could not verify static assets")
    
    # Test 4: API endpoints
    print("\n🔌 Testing API Endpoints...")
    api_endpoints = [
        "/api/health",
        "/api-test"
    ]
    
    for endpoint in api_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {endpoint} - Accessible")
            else:
                print(f"⚠️  {endpoint} - Status {response.status_code}")
        except:
            print(f"❌ {endpoint} - Not accessible")
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 RESPONSIVENESS SUMMARY")
    print("=" * 50)
    
    print("\n🎯 Dashboard Status:")
    print("   If you see ✅ marks above, the dashboard is responding")
    print("   If you see ❌ marks, there might still be issues")
    
    print("\n💡 Manual Testing Required:")
    print("1. Open http://localhost:3000/dashboard in your browser")
    print("2. Check if the page loads without hanging")
    print("3. Click through the tabs (Overview, Upload, Analytics, etc.)")
    print("4. Open browser console (F12) and check for errors")
    print("5. Look for:")
    print("   - 'Maximum update depth exceeded' errors")
    print("   - Memory leak warnings")
    print("   - Failed network requests")
    
    print("\n🚀 If Still Unresponsive:")
    print("1. Clear browser cache (Ctrl+Shift+R)")
    print("2. Try incognito/private browsing mode")
    print("3. Check browser console for specific errors")
    print("4. Run: npm run build && npm run start (production mode)")

def check_browser_console_tips():
    """Provide browser console debugging tips"""
    print("\n🖥️  Browser Console Debugging Guide")
    print("=" * 50)
    
    print("\n1. Open Chrome DevTools (F12)")
    print("2. Go to Console tab")
    print("3. Look for these specific errors:")
    print()
    print("❌ If you see: 'Maximum update depth exceeded'")
    print("   → There's an infinite re-render loop")
    print("   → Check useEffect dependencies")
    print()
    print("❌ If you see: 'Cannot read property of undefined'")
    print("   → Data is not loading properly")
    print("   → Add null checks and loading states")
    print()
    print("❌ If you see: 'Network request failed'")
    print("   → API calls are failing")
    print("   → Check CORS and backend connectivity")
    print()
    print("❌ If you see: 'Out of memory'")
    print("   → Memory leak in components")
    print("   → Check for missing cleanup functions")

if __name__ == "__main__":
    test_dashboard_responsiveness()
    check_browser_console_tips()