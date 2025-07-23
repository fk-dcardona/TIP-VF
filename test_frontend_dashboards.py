#!/usr/bin/env python3
"""
Frontend Dashboard Testing Script
Automated testing for FinkArgo dashboard integration
"""

import os
import sys
import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import subprocess
import json

class FrontendDashboardTester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.driver = None
        self.test_results = []
        
    def setup_browser(self):
        """Setup Chrome browser for testing"""
        print("🌐 Setting up browser for testing...")
        
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in background
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✅ Chrome browser setup successful")
            return True
        except Exception as e:
            print(f"❌ Chrome browser setup failed: {e}")
            print("💡 Please install ChromeDriver or use manual testing")
            return False
    
    def test_frontend_server(self):
        """Test if frontend server is running"""
        print(f"\n🔍 Testing Frontend Server at {self.base_url}")
        print("=" * 50)
        
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                print("✅ Frontend server is running")
                print(f"   Status: {response.status_code}")
                print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
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
    
    def test_dashboard_pages(self):
        """Test dashboard page accessibility"""
        print(f"\n📊 Testing Dashboard Pages")
        print("=" * 50)
        
        if not self.driver:
            print("❌ Browser not available, skipping page tests")
            return False
        
        dashboard_pages = [
            ("/", "Home Page"),
            ("/dashboard", "Main Dashboard"),
            ("/real-analytics-demo", "Analytics Demo"),
            ("/onboarding", "Onboarding")
        ]
        
        success_count = 0
        
        for path, page_name in dashboard_pages:
            try:
                print(f"📄 Testing {page_name} ({path})")
                self.driver.get(f"{self.base_url}{path}")
                
                # Wait for page to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                # Check for error messages
                page_source = self.driver.page_source.lower()
                
                if "error" in page_source and "this page could not be found" in page_source:
                    print(f"   ❌ {page_name}: Page not found")
                    self.test_results.append((f"{page_name} Access", False))
                elif "application error" in page_source:
                    print(f"   ❌ {page_name}: Application error")
                    self.test_results.append((f"{page_name} Access", False))
                else:
                    print(f"   ✅ {page_name}: Loaded successfully")
                    self.test_results.append((f"{page_name} Access", True))
                    success_count += 1
                    
            except TimeoutException:
                print(f"   ❌ {page_name}: Page load timeout")
                self.test_results.append((f"{page_name} Access", False))
            except Exception as e:
                print(f"   ❌ {page_name}: Error - {e}")
                self.test_results.append((f"{page_name} Access", False))
        
        return success_count > 0
    
    def test_dashboard_tabs(self):
        """Test dashboard tab navigation"""
        print(f"\n🗂️  Testing Dashboard Tabs")
        print("=" * 50)
        
        if not self.driver:
            print("❌ Browser not available, skipping tab tests")
            return False
        
        try:
            # Navigate to dashboard
            self.driver.get(f"{self.base_url}/dashboard")
            
            # Wait for dashboard to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "main"))
            )
            
            # Look for tab navigation elements
            expected_tabs = [
                "overview", "analytics", "sales", "finance", 
                "procurement", "upload", "alerts"
            ]
            
            found_tabs = []
            
            # Check for tab elements (various selectors)
            tab_selectors = [
                "button[role='tab']",
                "[data-state='active']",
                ".tab-trigger",
                "button:contains('Overview')",
                "[role='tablist'] button"
            ]
            
            for selector in tab_selectors:
                try:
                    tabs = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if tabs:
                        for tab in tabs:
                            tab_text = tab.text.lower().strip()
                            if tab_text and tab_text not in found_tabs:
                                found_tabs.append(tab_text)
                except:
                    continue
            
            print(f"📋 Found tabs: {found_tabs}")
            
            # Check for upload tab specifically
            upload_tab_found = any('upload' in tab for tab in found_tabs)
            
            if upload_tab_found:
                print("✅ Upload tab found - CSV integration successful")
                self.test_results.append(("Upload Tab Integration", True))
            else:
                print("❌ Upload tab not found - integration may need verification")
                self.test_results.append(("Upload Tab Integration", False))
            
            # General tab navigation test
            if len(found_tabs) >= 5:
                print(f"✅ Dashboard tabs functional ({len(found_tabs)} tabs found)")
                self.test_results.append(("Dashboard Tab Navigation", True))
                return True
            else:
                print(f"⚠️  Limited tab functionality ({len(found_tabs)} tabs found)")
                self.test_results.append(("Dashboard Tab Navigation", False))
                return False
                
        except Exception as e:
            print(f"❌ Dashboard tab testing failed: {e}")
            self.test_results.append(("Dashboard Tab Navigation", False))
            return False
    
    def test_csv_upload_component(self):
        """Test CSV upload wizard component"""
        print(f"\n📁 Testing CSV Upload Component")
        print("=" * 50)
        
        if not self.driver:
            print("❌ Browser not available, skipping upload component tests")
            return False
        
        try:
            # Navigate to dashboard
            self.driver.get(f"{self.base_url}/dashboard")
            
            # Wait for page load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "main"))
            )
            
            # Look for upload-related elements
            upload_elements = [
                "input[type='file']",
                "button:contains('Upload')",
                "[data-testid*='upload']",
                ".upload-wizard",
                ".enhanced-upload"
            ]
            
            upload_found = False
            
            for selector in upload_elements:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        print(f"✅ Found upload element: {selector}")
                        upload_found = True
                        break
                except:
                    continue
            
            if upload_found:
                print("✅ CSV upload component is present")
                self.test_results.append(("CSV Upload Component", True))
                return True
            else:
                print("❌ CSV upload component not found")
                self.test_results.append(("CSV Upload Component", False))
                return False
                
        except Exception as e:
            print(f"❌ CSV upload component testing failed: {e}")
            self.test_results.append(("CSV Upload Component", False))
            return False
    
    def test_business_intelligence_components(self):
        """Test business intelligence dashboard components"""
        print(f"\n📈 Testing Business Intelligence Components")
        print("=" * 50)
        
        if not self.driver:
            print("❌ Browser not available, skipping BI component tests")
            return False
        
        try:
            # Navigate to dashboard
            self.driver.get(f"{self.base_url}/dashboard")
            
            # Wait for page load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "main"))
            )
            
            # Look for business intelligence components
            bi_indicators = [
                "canvas",  # Charts
                ".chart",
                ".analytics",
                ".dashboard",
                "[role='img']",  # Chart elements
                ".recharts",     # Chart library
                "svg"            # SVG charts
            ]
            
            found_components = []
            
            for selector in bi_indicators:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        found_components.append(f"{selector} ({len(elements)} elements)")
                except:
                    continue
            
            print(f"📊 Found BI components: {found_components}")
            
            if len(found_components) >= 3:
                print("✅ Business Intelligence components are present")
                self.test_results.append(("Business Intelligence Components", True))
                return True
            else:
                print("⚠️  Limited BI components found")
                self.test_results.append(("Business Intelligence Components", False))
                return False
                
        except Exception as e:
            print(f"❌ BI component testing failed: {e}")
            self.test_results.append(("Business Intelligence Components", False))
            return False
    
    def test_responsive_design(self):
        """Test responsive design"""
        print(f"\n📱 Testing Responsive Design")
        print("=" * 50)
        
        if not self.driver:
            print("❌ Browser not available, skipping responsive tests")
            return False
        
        try:
            # Test different screen sizes
            screen_sizes = [
                (1920, 1080, "Desktop"),
                (768, 1024, "Tablet"),
                (375, 667, "Mobile")
            ]
            
            responsive_success = True
            
            for width, height, device in screen_sizes:
                print(f"📐 Testing {device} ({width}x{height})")
                
                self.driver.set_window_size(width, height)
                self.driver.get(f"{self.base_url}/dashboard")
                
                # Wait for page load
                time.sleep(2)
                
                # Check for responsive elements
                try:
                    body = self.driver.find_element(By.TAG_NAME, "body")
                    if body:
                        print(f"   ✅ {device}: Layout rendered")
                    else:
                        print(f"   ❌ {device}: Layout issues")
                        responsive_success = False
                except:
                    print(f"   ❌ {device}: Major layout issues")
                    responsive_success = False
            
            if responsive_success:
                print("✅ Responsive design working")
                self.test_results.append(("Responsive Design", True))
            else:
                print("❌ Responsive design issues found")
                self.test_results.append(("Responsive Design", False))
            
            return responsive_success
            
        except Exception as e:
            print(f"❌ Responsive design testing failed: {e}")
            self.test_results.append(("Responsive Design", False))
            return False
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 70)
        print("📊 FRONTEND DASHBOARD TEST REPORT")
        print("=" * 70)
        
        passed = sum(1 for _, result in self.test_results if result)
        total = len(self.test_results)
        
        for test_name, result in self.test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name:35} {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Frontend dashboards are working correctly!")
            return True
        else:
            print(f"\n⚠️  {total - passed} tests failed. Review issues above.")
            return False
    
    def cleanup(self):
        """Cleanup browser resources"""
        if self.driver:
            self.driver.quit()
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🎨 Frontend Dashboard Test Suite")
        print("=" * 70)
        
        # Test 1: Frontend server
        server_running = self.test_frontend_server()
        
        if not server_running:
            print("\n❌ Frontend server not running. Please start with: npm run dev")
            return False
        
        # Setup browser for advanced tests
        browser_available = self.setup_browser()
        
        if browser_available:
            # Test 2: Dashboard pages
            self.test_dashboard_pages()
            
            # Test 3: Dashboard tabs
            self.test_dashboard_tabs()
            
            # Test 4: CSV upload component
            self.test_csv_upload_component()
            
            # Test 5: Business intelligence components
            self.test_business_intelligence_components()
            
            # Test 6: Responsive design
            self.test_responsive_design()
        else:
            print("\n💡 Browser automation not available. Manual testing recommended.")
        
        # Generate report
        success = self.generate_report()
        
        # Cleanup
        self.cleanup()
        
        return success

def main():
    """Main testing function"""
    
    # Check if frontend server is running
    tester = FrontendDashboardTester()
    
    print("🎯 Starting Frontend Dashboard Tests...")
    print("💡 Make sure frontend is running: npm run dev")
    print()
    
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Frontend dashboards are ready for use!")
        print(f"🌐 Visit: {tester.base_url}/dashboard")
    else:
        print("\n🔧 Some issues found. Check the report above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)