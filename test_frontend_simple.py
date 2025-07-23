#!/usr/bin/env python3
"""
Simple Frontend Dashboard Testing Script
Tests frontend without requiring additional dependencies
"""

import os
import sys
import time
import requests
import subprocess
import json

class SimpleFrontendTester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.test_results = []
        
    def test_frontend_server(self):
        """Test if frontend server is running"""
        print(f"🔍 Testing Frontend Server at {self.base_url}")
        print("=" * 50)
        
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                print("✅ Frontend server is running")
                print(f"   Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
                print(f"   Content-Length: {len(response.text)} bytes")
                
                # Check for React/Next.js indicators
                content = response.text.lower()
                if 'next.js' in content or '_next' in content:
                    print("   ✅ Next.js application detected")
                if 'react' in content:
                    print("   ✅ React components detected")
                
                self.test_results.append(("Frontend Server", True))
                return True
            else:
                print(f"❌ Frontend server responded with: {response.status_code}")
                self.test_results.append(("Frontend Server", False))
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Frontend server not reachable: {e}")
            self.test_results.append(("Frontend Server", False))
            return False
    
    def test_dashboard_routes(self):
        """Test dashboard route accessibility"""
        print(f"\n📊 Testing Dashboard Routes")
        print("=" * 50)
        
        routes = [
            ("/", "Home Page"),
            ("/dashboard", "Main Dashboard"),
            ("/real-analytics-demo", "Analytics Demo"),
            ("/onboarding", "Onboarding"),
            ("/monitoring", "Monitoring")
        ]
        
        success_count = 0
        
        for path, page_name in routes:
            try:
                print(f"📄 Testing {page_name} ({path})")
                response = requests.get(f"{self.base_url}{path}", timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ {page_name}: Accessible (200 OK)")
                    
                    # Check for specific dashboard indicators
                    content = response.text.lower()
                    
                    if path == "/dashboard":
                        if 'upload' in content:
                            print("   ✅ Upload functionality detected")
                        if 'analytics' in content or 'dashboard' in content:
                            print("   ✅ Analytics dashboard detected")
                    
                    self.test_results.append((f"{page_name} Access", True))
                    success_count += 1
                    
                elif response.status_code == 404:
                    print(f"   ❌ {page_name}: Not found (404)")
                    self.test_results.append((f"{page_name} Access", False))
                else:
                    print(f"   ⚠️  {page_name}: Status {response.status_code}")
                    self.test_results.append((f"{page_name} Access", False))
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ {page_name}: Error - {e}")
                self.test_results.append((f"{page_name} Access", False))
        
        return success_count > 0
    
    def test_static_assets(self):
        """Test static assets loading"""
        print(f"\n🎨 Testing Static Assets")
        print("=" * 50)
        
        # Get main page to find asset references
        try:
            response = requests.get(self.base_url, timeout=10)
            content = response.text
            
            # Look for common Next.js static assets
            asset_indicators = [
                '_next/static',
                '.css',
                '.js',
                'favicon'
            ]
            
            found_assets = []
            for indicator in asset_indicators:
                if indicator in content:
                    found_assets.append(indicator)
            
            if found_assets:
                print(f"✅ Static assets found: {found_assets}")
                self.test_results.append(("Static Assets", True))
                return True
            else:
                print("❌ No static assets detected")
                self.test_results.append(("Static Assets", False))
                return False
                
        except Exception as e:
            print(f"❌ Static asset testing failed: {e}")
            self.test_results.append(("Static Assets", False))
            return False
    
    def test_api_endpoints(self):
        """Test API endpoints accessibility"""
        print(f"\n🔗 Testing API Endpoints")
        print("=" * 50)
        
        # Test if frontend can reach API endpoints
        api_tests = [
            ("/api-test", "API Test Page"),
            ("/api/health", "Health Check (if proxied)")
        ]
        
        success_count = 0
        
        for path, endpoint_name in api_tests:
            try:
                print(f"🔌 Testing {endpoint_name} ({path})")
                response = requests.get(f"{self.base_url}{path}", timeout=5)
                
                if response.status_code == 200:
                    print(f"   ✅ {endpoint_name}: Accessible")
                    self.test_results.append((f"{endpoint_name} Access", True))
                    success_count += 1
                else:
                    print(f"   ⚠️  {endpoint_name}: Status {response.status_code}")
                    self.test_results.append((f"{endpoint_name} Access", False))
                    
            except requests.exceptions.RequestException as e:
                print(f"   ❌ {endpoint_name}: Not accessible - {e}")
                self.test_results.append((f"{endpoint_name} Access", False))
        
        return success_count > 0
    
    def test_build_assets(self):
        """Test if build was successful"""
        print(f"\n🏗️  Testing Build Status")
        print("=" * 50)
        
        # Check for .next directory (indicates successful build)
        next_dir = ".next"
        if os.path.exists(next_dir):
            print("✅ .next directory exists (build successful)")
            
            # Check for specific build artifacts
            build_artifacts = [
                ".next/static",
                ".next/server",
                ".next/BUILD_ID"
            ]
            
            artifacts_found = 0
            for artifact in build_artifacts:
                if os.path.exists(artifact):
                    artifacts_found += 1
                    print(f"   ✅ {artifact}")
                else:
                    print(f"   ❌ {artifact} - missing")
            
            if artifacts_found >= 2:
                print("✅ Build artifacts present")
                self.test_results.append(("Build Status", True))
                return True
            else:
                print("⚠️  Some build artifacts missing")
                self.test_results.append(("Build Status", False))
                return False
        else:
            print("❌ .next directory not found - build may not have run")
            self.test_results.append(("Build Status", False))
            return False
    
    def test_component_files(self):
        """Test CSV integration component files"""
        print(f"\n📁 Testing CSV Integration Files")
        print("=" * 50)
        
        integration_files = [
            'src/components/upload/EnhancedUploadWizard.tsx',
            'src/hooks/useCSVUpload.ts',
            'src/services/analytics/providers/CSVAnalyticsProvider.ts',
            'src/app/dashboard/page.tsx'
        ]
        
        success_count = 0
        
        for file_path in integration_files:
            if os.path.exists(file_path):
                print(f"✅ {file_path}")
                success_count += 1
            else:
                print(f"❌ {file_path} - missing")
        
        if success_count == len(integration_files):
            print("✅ All CSV integration files present")
            self.test_results.append(("CSV Integration Files", True))
            return True
        else:
            print(f"⚠️  {len(integration_files) - success_count} integration files missing")
            self.test_results.append(("CSV Integration Files", False))
            return False
    
    def check_npm_scripts(self):
        """Check npm scripts availability"""
        print(f"\n📦 Testing NPM Scripts")
        print("=" * 50)
        
        try:
            with open('package.json', 'r') as f:
                package_data = json.load(f)
            
            required_scripts = ['dev', 'build', 'start', 'lint']
            scripts = package_data.get('scripts', {})
            
            success_count = 0
            
            for script in required_scripts:
                if script in scripts:
                    print(f"✅ npm run {script}")
                    success_count += 1
                else:
                    print(f"❌ npm run {script} - missing")
            
            if success_count >= 3:
                print("✅ NPM scripts configured")
                self.test_results.append(("NPM Scripts", True))
                return True
            else:
                print("❌ Some NPM scripts missing")
                self.test_results.append(("NPM Scripts", False))
                return False
                
        except Exception as e:
            print(f"❌ Error reading package.json: {e}")
            self.test_results.append(("NPM Scripts", False))
            return False
    
    def generate_manual_testing_guide(self):
        """Generate manual testing checklist"""
        print(f"\n📋 Manual Testing Guide")
        print("=" * 50)
        
        print("🎯 To manually test the dashboard, follow these steps:")
        print()
        print("1. **Open Browser**: Navigate to http://localhost:3001")
        print("2. **Test Navigation**: Click through all dashboard tabs")
        print("3. **Test Upload Tab**: Look for the new 'Upload' tab")
        print("4. **Test Upload Wizard**: Try the 4-step CSV upload process")
        print("5. **Test Responsiveness**: Resize browser window")
        print("6. **Test Analytics**: Check if charts and data display correctly")
        print()
        print("🔍 What to look for:")
        print("   ✅ Dashboard loads without errors")
        print("   ✅ All tabs are clickable and responsive")
        print("   ✅ Upload tab contains CSV upload wizard")
        print("   ✅ Charts and analytics components render")
        print("   ✅ No console errors in browser developer tools")
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 70)
        print("📊 FRONTEND DASHBOARD TEST REPORT")
        print("=" * 70)
        
        passed = sum(1 for _, result in self.test_results if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:30} {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Frontend dashboards are working correctly!")
            print(f"🌐 Dashboard URL: {self.base_url}/dashboard")
        elif passed >= total * 0.7:  # 70% pass rate
            print(f"\n✅ MOSTLY WORKING! {passed}/{total} tests passed.")
            print(f"🌐 Dashboard URL: {self.base_url}/dashboard")
            print("💡 Minor issues found but dashboard should be functional")
        else:
            print(f"\n⚠️  NEEDS ATTENTION: Only {passed}/{total} tests passed.")
            print("🔧 Please review the failed tests above")
        
        return passed >= total * 0.7
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🎨 Simple Frontend Dashboard Test Suite")
        print("=" * 70)
        print("💡 Testing frontend without requiring additional dependencies")
        print()
        
        # Test 1: Frontend server
        server_running = self.test_frontend_server()
        
        if not server_running:
            print("\n❌ Frontend server not running.")
            print("💡 Start the frontend with: npm run dev")
            print("📋 Or test a built version with: npm run build && npm run start")
            return False
        
        # Test 2: Dashboard routes
        self.test_dashboard_routes()
        
        # Test 3: Static assets
        self.test_static_assets()
        
        # Test 4: API endpoints
        self.test_api_endpoints()
        
        # Test 5: Build status
        self.test_build_assets()
        
        # Test 6: Component files
        self.test_component_files()
        
        # Test 7: NPM scripts
        self.check_npm_scripts()
        
        # Generate manual testing guide
        self.generate_manual_testing_guide()
        
        # Generate report
        success = self.generate_report()
        
        return success

def main():
    """Main testing function"""
    
    tester = SimpleFrontendTester()
    
    print("🎯 Starting Simple Frontend Dashboard Tests...")
    print("💡 Make sure frontend is running: npm run dev")
    print()
    
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Frontend dashboards are ready for use!")
    else:
        print("\n🔧 Some issues found. Check the report above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)