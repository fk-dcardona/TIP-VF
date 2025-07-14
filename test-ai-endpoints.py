#!/usr/bin/env python3
"""
AI Endpoints Test Script
Tests actual AI functionality against running backend services
"""

import asyncio
import aiohttp
import json
import os
import sys
import time
from typing import Dict, Any, List
import tempfile
import requests

class AIEndpointTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test_result(self, test_name: str, success: bool, details: str = "", error: str = ""):
        """Log test result for reporting"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": time.time()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
    
    async def test_health_endpoints(self):
        """Test basic health endpoints"""
        endpoints = [
            ("/api/health", "Basic health check"),
            ("/api/ready", "Readiness check"),
            ("/api/live", "Liveness check")
        ]
        
        for endpoint, description in endpoints:
            try:
                async with self.session.get(f"{self.base_url}{endpoint}") as response:
                    if response.status == 200:
                        data = await response.json()
                        self.log_test_result(
                            f"Health Check - {description}",
                            True,
                            f"Status: {data.get('status', 'unknown')}"
                        )
                    else:
                        self.log_test_result(
                            f"Health Check - {description}",
                            False,
                            error=f"HTTP {response.status}"
                        )
            except Exception as e:
                self.log_test_result(
                    f"Health Check - {description}",
                    False,
                    error=str(e)
                )
    
    async def test_document_upload(self):
        """Test document upload functionality"""
        # Create a test document
        test_content = """
        INVOICE
        Invoice Number: INV-TEST-001
        Date: 2024-01-15
        
        To: Test Customer
        123 Business St
        
        From: Test Supplier
        456 Vendor Ave
        
        Items:
        - Product A: $100.00
        - Product B: $200.00
        
        Total: $300.00
        """
        
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(test_content)
                temp_file_path = f.name
            
            # Upload using requests for file upload
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_invoice.txt', f, 'text/plain')}
                data = {
                    'org_id': 'test_org_123',
                    'document_type': 'auto'
                }
                
                response = requests.post(
                    f"{self.base_url}/api/documents/upload",
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.log_test_result(
                        "Document Upload",
                        True,
                        f"Document ID: {result.get('document_id', 'unknown')}"
                    )
                    return result.get('document_id')
                else:
                    self.log_test_result(
                        "Document Upload",
                        False,
                        error=f"HTTP {response.status_code}: {response.text}"
                    )
                    return None
            
        except Exception as e:
            self.log_test_result(
                "Document Upload",
                False,
                error=str(e)
            )
            return None
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file_path)
            except:
                pass
    
    async def test_document_analytics(self):
        """Test document analytics endpoint"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/documents/analytics/test_org_123"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify expected analytics structure
                    required_fields = ['overall_score', 'dimensions']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        dimensions = data.get('dimensions', {})
                        expected_dimensions = ['compliance', 'visibility', 'efficiency', 'accuracy']
                        missing_dimensions = [dim for dim in expected_dimensions if dim not in dimensions]
                        
                        if not missing_dimensions:
                            self.log_test_result(
                                "Document Analytics",
                                True,
                                f"Overall Score: {data['overall_score']}"
                            )
                        else:
                            self.log_test_result(
                                "Document Analytics",
                                False,
                                error=f"Missing dimensions: {missing_dimensions}"
                            )
                    else:
                        self.log_test_result(
                            "Document Analytics",
                            False,
                            error=f"Missing fields: {missing_fields}"
                        )
                else:
                    self.log_test_result(
                        "Document Analytics",
                        False,
                        error=f"HTTP {response.status}"
                    )
        except Exception as e:
            self.log_test_result(
                "Document Analytics",
                False,
                error=str(e)
            )
    
    async def test_insights_generation(self):
        """Test AI insights generation"""
        user_ids = ["test_user_123"]
        roles = ["executive", "sales", "procurement", "finance", "logistics"]
        
        for user_id in user_ids:
            # Test general insights
            try:
                async with self.session.get(
                    f"{self.base_url}/api/insights/{user_id}"
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        insights_count = len(data.get('insights', []))
                        self.log_test_result(
                            f"General Insights - {user_id}",
                            True,
                            f"Generated {insights_count} insights"
                        )
                    else:
                        self.log_test_result(
                            f"General Insights - {user_id}",
                            False,
                            error=f"HTTP {response.status}"
                        )
            except Exception as e:
                self.log_test_result(
                    f"General Insights - {user_id}",
                    False,
                    error=str(e)
                )
            
            # Test role-specific insights
            for role in roles:
                try:
                    async with self.session.get(
                        f"{self.base_url}/api/insights/{user_id}/role/{role}"
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            insights_count = len(data.get('insights', []))
                            self.log_test_result(
                                f"Role Insights - {role}",
                                True,
                                f"Generated {insights_count} {role} insights"
                            )
                        else:
                            self.log_test_result(
                                f"Role Insights - {role}",
                                False,
                                error=f"HTTP {response.status}"
                            )
                except Exception as e:
                    self.log_test_result(
                        f"Role Insights - {role}",
                        False,
                        error=str(e)
                    )
    
    async def test_agent_astra_integration(self):
        """Test Agent Astra API integration"""
        # This tests if the Agent Astra API key and connection work
        test_document_data = {
            "text": "INVOICE\nInvoice Number: TEST-001\nAmount: $500.00\nVendor: Test Corp",
            "document_type": "invoice"
        }
        
        try:
            async with self.session.post(
                f"{self.base_url}/api/documents/test-astra",
                json=test_document_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test_result(
                        "Agent Astra Integration",
                        True,
                        f"Response: {data.get('status', 'unknown')}"
                    )
                elif response.status == 404:
                    self.log_test_result(
                        "Agent Astra Integration",
                        False,
                        error="Test endpoint not implemented (this is expected)"
                    )
                else:
                    self.log_test_result(
                        "Agent Astra Integration",
                        False,
                        error=f"HTTP {response.status}"
                    )
        except Exception as e:
            self.log_test_result(
                "Agent Astra Integration",
                False,
                error=str(e)
            )
    
    async def test_search_functionality(self):
        """Test AI-powered search"""
        search_queries = [
            {"org_id": "test_org_123", "document_type": "invoice"},
            {"org_id": "test_org_123", "document_number": "urgent"},
            {"org_id": "test_org_123", "min_confidence": 0.8},
            {"org_id": "test_org_123", "page": 1, "per_page": 5}
        ]
        
        for i, search_data in enumerate(search_queries):
            try:
                async with self.session.post(
                    f"{self.base_url}/api/documents/search",
                    json=search_data
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        results_count = len(data.get('documents', []))
                        self.log_test_result(
                            f"Search - Query {i+1}",
                            True,
                            f"Found {results_count} documents"
                        )
                    else:
                        self.log_test_result(
                            f"Search - Query {i+1}",
                            False,
                            error=f"HTTP {response.status}"
                        )
            except Exception as e:
                self.log_test_result(
                    f"Search - Query {i+1}",
                    False,
                    error=str(e)
                )
    
    async def test_timeline_tracking(self):
        """Test document timeline tracking"""
        try:
            async with self.session.get(
                f"{self.base_url}/api/documents/timeline/test_org_123"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    timeline_events = len(data.get('timeline', []))
                    self.log_test_result(
                        "Timeline Tracking",
                        True,
                        f"Found {timeline_events} timeline events"
                    )
                else:
                    self.log_test_result(
                        "Timeline Tracking",
                        False,
                        error=f"HTTP {response.status}"
                    )
        except Exception as e:
            self.log_test_result(
                "Timeline Tracking",
                False,
                error=str(e)
            )
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "="*60)
        print("AI AGENTS FUNCTIONALITY TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test_name']}: {result['error']}")
        
        print("\nDETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"  {status} {result['test_name']}")
            if result['details']:
                print(f"      {result['details']}")
        
        return passed_tests, failed_tests
    
    async def run_all_tests(self):
        """Run all AI functionality tests"""
        print("🤖 Starting AI Agents Functionality Tests")
        print(f"Testing against: {self.base_url}")
        print("-" * 60)
        
        # Test basic connectivity first
        await self.test_health_endpoints()
        
        # Test core AI functionality
        document_id = await self.test_document_upload()
        await self.test_document_analytics()
        await self.test_insights_generation()
        await self.test_agent_astra_integration()
        await self.test_search_functionality()
        await self.test_timeline_tracking()
        
        # Print summary
        passed, failed = self.print_summary()
        
        return failed == 0  # Return True if all tests passed

def check_backend_running(base_url: str) -> bool:
    """Check if backend is running"""
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        return response.status_code == 200
    except:
        return False

async def main():
    """Main test runner"""
    base_url = os.getenv('API_BASE_URL', 'http://localhost:5000')
    
    print("🔍 Checking if backend is running...")
    if not check_backend_running(base_url):
        print(f"❌ Backend not running at {base_url}")
        print("Please start the backend with: python main.py")
        sys.exit(1)
    
    print(f"✅ Backend is running at {base_url}")
    
    async with AIEndpointTester(base_url) as tester:
        success = await tester.run_all_tests()
        
        if success:
            print("\n🎉 All AI functionality tests passed!")
            sys.exit(0)
        else:
            print("\n💥 Some tests failed. Check the details above.")
            sys.exit(1)

if __name__ == "__main__":
    # Install required packages if not available
    try:
        import aiohttp
        import requests
    except ImportError:
        print("Installing required packages...")
        os.system("pip install aiohttp requests")
        import aiohttp
        import requests
    
    asyncio.run(main())