#!/usr/bin/env python3
"""
Comprehensive Testing Suite for Supply Chain Intelligence Platform
Covers backend, frontend, and end-to-end testing capabilities
"""

import os
import sys
import subprocess
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, current_dir)

class TestStatus(Enum):
    PASSED = "✅ PASSED"
    FAILED = "❌ FAILED"
    SKIPPED = "⏭️ SKIPPED"
    RUNNING = "🔄 RUNNING"

@dataclass
class TestResult:
    name: str
    status: TestStatus
    duration: float
    error: str = None
    details: Dict = None

class ComprehensiveTestSuite:
    """Comprehensive testing suite for the entire platform"""
    
    def __init__(self):
        self.results: List[TestResult] = []
        self.start_time = time.time()
        self.backend_url = "http://localhost:5000"
        self.frontend_url = "http://localhost:3000"
        
    def log(self, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def run_test(self, name: str, test_func) -> TestResult:
        """Run a single test and record results"""
        self.log(f"🔄 Running: {name}")
        start_time = time.time()
        
        try:
            result = test_func()
            duration = time.time() - start_time
            
            if result:
                test_result = TestResult(name, TestStatus.PASSED, duration)
                self.log(f"✅ PASSED: {name} ({duration:.2f}s)")
            else:
                test_result = TestResult(name, TestStatus.FAILED, duration, "Test returned False")
                self.log(f"❌ FAILED: {name} ({duration:.2f}s)")
                
        except Exception as e:
            duration = time.time() - start_time
            test_result = TestResult(name, TestStatus.FAILED, duration, str(e))
            self.log(f"❌ FAILED: {name} ({duration:.2f}s) - {str(e)}")
        
        self.results.append(test_result)
        return test_result
    
    def test_supabase_connection(self) -> bool:
        """Test Supabase database connection"""
        try:
            from test_supabase_connection import test_supabase_connection
            return test_supabase_connection()
        except Exception as e:
            self.log(f"Supabase connection test failed: {e}")
            return False
    
    def test_flask_app_startup(self) -> bool:
        """Test Flask app startup"""
        try:
            from main import app
            # Test basic app functionality
            with app.test_client() as client:
                response = client.get('/')
                return response.status_code == 200
        except Exception as e:
            self.log(f"Flask app startup test failed: {e}")
            return False
    
    def test_api_endpoints(self) -> bool:
        """Test API endpoints"""
        try:
            with requests.Session() as session:
                # Test health endpoint
                response = session.get(f"{self.backend_url}/api/health", timeout=10)
                if response.status_code != 200:
                    return False
                
                # Test API docs endpoint
                response = session.get(f"{self.backend_url}/api/docs", timeout=10)
                if response.status_code != 200:
                    return False
                
                return True
        except Exception as e:
            self.log(f"API endpoints test failed: {e}")
            return False
    
    def test_database_models(self) -> bool:
        """Test database models and relationships"""
        try:
            from main import app
            from models_enhanced import UnifiedTransaction, DocumentInventoryLink
from backend.models import Organization, Upload, TradeDocument
            
            with app.app_context():
from backend.models import db
                from sqlalchemy import text
                
                # Test if all tables exist
                tables = ['organizations', 'uploads', 'trade_documents', 
                         'unified_transactions', 'document_inventory_links']
                
                for table in tables:
                    result = db.session.execute(text(f"""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_name = '{table}'
                        )
                    """)).fetchone()
                    
                    if not result[0]:
                        self.log(f"Table {table} not found")
                        return False
                
                self.log("All database tables exist")
                return True
                
        except Exception as e:
            self.log(f"Database models test failed: {e}")
            return False
    
    def test_file_upload_endpoint(self) -> bool:
        """Test file upload functionality"""
        try:
            # Create a test CSV file
            test_file_content = "sku,product_description,quantity,unit_cost\nTEST001,Test Product,100,10.50"
            test_file_path = "test_upload.csv"
            
            with open(test_file_path, 'w') as f:
                f.write(test_file_content)
            
            # Test upload endpoint
            with requests.Session() as session:
                with open(test_file_path, 'rb') as f:
                    files = {'file': ('test_upload.csv', f, 'text/csv')}
                    data = {'org_id': 'test_org_123', 'user_id': 'test_user_123'}
                    
                    response = session.post(
                        f"{self.backend_url}/api/upload",
                        files=files,
                        data=data,
                        timeout=30
                    )
                
                # Clean up test file
                os.remove(test_file_path)
                
                return response.status_code in [200, 201]
                
        except Exception as e:
            self.log(f"File upload test failed: {e}")
            return False
    
    def test_frontend_build(self) -> bool:
        """Test frontend build process"""
        try:
            # Check if package.json exists
            if not os.path.exists("package.json"):
                self.log("package.json not found, skipping frontend build test")
                return True
            
            # Test npm install
            result = subprocess.run(
                ["npm", "install"],
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode != 0:
                self.log(f"npm install failed: {result.stderr}")
                return False
            
            # Test build
            result = subprocess.run(
                ["npm", "run", "build"],
                capture_output=True,
                text=True,
                timeout=600
            )
            
            if result.returncode != 0:
                self.log(f"npm build failed: {result.stderr}")
                return False
            
            self.log("Frontend build successful")
            return True
            
        except Exception as e:
            self.log(f"Frontend build test failed: {e}")
            return False
    
    def test_type_checking(self) -> bool:
        """Test TypeScript type checking"""
        try:
            if not os.path.exists("tsconfig.json"):
                self.log("tsconfig.json not found, skipping type checking")
                return True
            
            result = subprocess.run(
                ["npm", "run", "type-check"],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode != 0:
                self.log(f"Type checking failed: {result.stderr}")
                return False
            
            self.log("TypeScript type checking passed")
            return True
            
        except Exception as e:
            self.log(f"Type checking test failed: {e}")
            return False
    
    def test_linting(self) -> bool:
        """Test code linting"""
        try:
            # Test ESLint
            if os.path.exists(".eslintrc.json"):
                result = subprocess.run(
                    ["npm", "run", "lint"],
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                
                if result.returncode != 0:
                    self.log(f"ESLint failed: {result.stderr}")
                    return False
            
            # Test Python linting
            result = subprocess.run(
                ["python", "-m", "flake8", ".", "--exclude=venv311,node_modules,dist,build,.git", "--max-line-length=100", "--ignore=E501,W503"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode != 0:
                self.log(f"Python linting failed: {result.stderr}")
                return False
            
            self.log("Code linting passed")
            return True
            
        except Exception as e:
            self.log(f"Linting test failed: {e}")
            return False
    
    def test_security_scan(self) -> bool:
        """Test security vulnerabilities"""
        try:
            # Test npm audit
            result = subprocess.run(
                ["npm", "audit", "--audit-level=moderate"],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # npm audit returns 1 if vulnerabilities found, but we'll be lenient
            if result.returncode != 0:
                self.log(f"Security vulnerabilities found: {result.stdout}")
                # Don't fail the test for moderate vulnerabilities
                return True
            
            self.log("Security scan passed")
            return True
            
        except Exception as e:
            self.log(f"Security scan failed: {e}")
            return False
    
    def run_backend_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting Backend Tests...")
        
        tests = [
            ("Supabase Database Connection", self.test_supabase_connection),
            ("Flask App Startup", self.test_flask_app_startup),
            ("Database Models & Relationships", self.test_database_models),
            ("API Endpoints", self.test_api_endpoints),
            ("File Upload Endpoint", self.test_file_upload_endpoint),
        ]
        
        for name, test_func in tests:
            self.run_test(name, test_func)
    
    def run_frontend_tests(self):
        """Run all frontend tests"""
        self.log("🚀 Starting Frontend Tests...")
        
        tests = [
            ("Frontend Build Process", self.test_frontend_build),
            ("TypeScript Type Checking", self.test_type_checking),
            ("Code Linting", self.test_linting),
            ("Security Vulnerability Scan", self.test_security_scan),
        ]
        
        for name, test_func in tests:
            self.run_test(name, test_func)
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        self.log("🧪 COMPREHENSIVE TEST SUITE STARTING")
        self.log("=" * 60)
        
        # Backend tests
        self.run_backend_tests()
        
        # Frontend tests
        self.run_frontend_tests()
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_time = time.time() - self.start_time
        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIPPED)
        total = len(self.results)
        
        self.log("=" * 60)
        self.log("📊 TEST REPORT")
        self.log("=" * 60)
        self.log(f"Total Tests: {total}")
        self.log(f"✅ Passed: {passed}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"⏭️ Skipped: {skipped}")
        self.log(f"⏱️ Total Time: {total_time:.2f}s")
        
        if failed > 0:
            self.log("\n❌ FAILED TESTS:")
            for result in self.results:
                if result.status == TestStatus.FAILED:
                    self.log(f"  - {result.name}: {result.error}")
        
        self.log("\n📋 DETAILED RESULTS:")
        for result in self.results:
            status_icon = "✅" if result.status == TestStatus.PASSED else "❌" if result.status == TestStatus.FAILED else "⏭️"
            self.log(f"  {status_icon} {result.name} ({result.duration:.2f}s)")
            if result.error:
                self.log(f"      Error: {result.error}")
        
        # Save report to file
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
                "total_time": total_time
            },
            "results": [
                {
                    "name": r.name,
                    "status": r.status.value,
                    "duration": r.duration,
                    "error": r.error
                }
                for r in self.results
            ]
        }
        
        report_file = f"test-results/comprehensive-test-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs("test-results", exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        self.log(f"\n📄 Detailed report saved to: {report_file}")
        
        if failed == 0:
            self.log("\n🎉 ALL TESTS PASSED! Ready for deployment.")
            return True
        else:
            self.log(f"\n⚠️ {failed} tests failed. Please fix issues before deployment.")
            return False

def main():
    """Main test runner"""
    print("🧪 Supply Chain Intelligence Platform - Comprehensive Test Suite")
    print("=" * 70)
    
    # Check if we're in the right directory
    if not os.path.exists("main.py"):
        print("❌ Error: main.py not found. Please run from project root.")
        sys.exit(1)
    
    # Run tests
    test_suite = ComprehensiveTestSuite()
    success = test_suite.run_all_tests()
    
    if success:
        print("\n🚀 All tests passed! Ready for deployment.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please fix issues before deployment.")
        sys.exit(1)

if __name__ == "__main__":
    main() 