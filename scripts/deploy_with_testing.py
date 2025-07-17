#!/usr/bin/env python3
"""
Deployment Script with Comprehensive Testing Protocol
Follows the project's established testing and deployment procedures
"""

import os
import sys
import subprocess
import time
import json
from datetime import datetime
from typing import Dict, List, Tuple

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, current_dir)

class DeploymentManager:
    """Manages the deployment process with comprehensive testing"""
    
    def __init__(self):
        self.deployment_start = time.time()
        self.results = []
        self.environment = os.getenv('DEPLOYMENT_ENV', 'production')
        
    def log(self, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def run_command(self, command: str, description: str, timeout: int = 300) -> bool:
        """Run a command and log results"""
        self.log(f"🔄 {description}")
        self.log(f"   Command: {command}")
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            if result.returncode == 0:
                self.log(f"✅ {description} - SUCCESS")
                if result.stdout.strip():
                    self.log(f"   Output: {result.stdout.strip()}")
                return True
            else:
                self.log(f"❌ {description} - FAILED")
                self.log(f"   Error: {result.stderr.strip()}")
                return False
                
        except subprocess.TimeoutExpired:
            self.log(f"❌ {description} - TIMEOUT")
            return False
        except Exception as e:
            self.log(f"❌ {description} - ERROR: {str(e)}")
            return False
    
    def run_comprehensive_tests(self) -> bool:
        """Run comprehensive test suite"""
        self.log("🧪 Running Comprehensive Test Suite...")
        
        # Run the comprehensive test suite
        result = subprocess.run(
            [sys.executable, "scripts/comprehensive_test_suite.py"],
            capture_output=True,
            text=True,
            timeout=600
        )
        
        if result.returncode == 0:
            self.log("✅ Comprehensive Test Suite - PASSED")
            return True
        else:
            self.log("❌ Comprehensive Test Suite - FAILED")
            self.log(f"   Error: {result.stderr}")
            return False
    
    def check_git_status(self) -> bool:
        """Check git status and ensure clean working directory"""
        self.log("🔍 Checking Git Status...")
        
        # Check if there are uncommitted changes
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True
        )
        
        if result.stdout.strip():
            self.log("⚠️ Uncommitted changes detected:")
            self.log(result.stdout)
            return False
        else:
            self.log("✅ Working directory is clean")
            return True
    
    def run_security_checks(self) -> bool:
        """Run security checks"""
        self.log("🔒 Running Security Checks...")
        
        checks = [
            ("npm audit --audit-level=moderate", "NPM Security Audit"),
            ("python -m bandit -r . -f json -o security-report.json", "Python Security Scan"),
        ]
        
        all_passed = True
        for command, description in checks:
            if not self.run_command(command, description, timeout=120):
                all_passed = False
        
        return all_passed
    
    def run_performance_checks(self) -> bool:
        """Run performance checks"""
        self.log("⚡ Running Performance Checks...")
        
        checks = [
            ("npm run build", "Frontend Build Performance"),
            ("python -c 'from main import app; print(\"Backend startup time check\")'", "Backend Startup Check"),
        ]
        
        all_passed = True
        for command, description in checks:
            if not self.run_command(command, description, timeout=300):
                all_passed = False
        
        return all_passed
    
    def deploy_to_vercel(self) -> bool:
        """Deploy frontend to Vercel"""
        self.log("🚀 Deploying to Vercel...")
        
        # Check if Vercel CLI is installed
        if not self.run_command("vercel --version", "Check Vercel CLI", timeout=30):
            self.log("❌ Vercel CLI not found. Please install it first.")
            return False
        
        # Deploy to Vercel
        return self.run_command("vercel --prod", "Deploy to Vercel Production", timeout=600)
    
    def deploy_to_railway(self) -> bool:
        """Deploy backend to Railway"""
        self.log("🚀 Deploying to Railway...")
        
        # Check if Railway CLI is installed
        if not self.run_command("railway --version", "Check Railway CLI", timeout=30):
            self.log("❌ Railway CLI not found. Please install it first.")
            return False
        
        # Deploy to Railway
        return self.run_command("railway up", "Deploy to Railway", timeout=600)
    
    def update_environment_variables(self) -> bool:
        """Update environment variables in deployment platforms"""
        self.log("🔧 Updating Environment Variables...")
        
        # This would typically involve updating Vercel and Railway environment variables
        # For now, we'll just log the process
        self.log("✅ Environment variables should be updated manually in:")
        self.log("   - Vercel Dashboard: https://vercel.com/dashboard")
        self.log("   - Railway Dashboard: https://railway.app/dashboard")
        
        return True
    
    def run_post_deployment_tests(self) -> bool:
        """Run post-deployment tests"""
        self.log("🧪 Running Post-Deployment Tests...")
        
        # Wait for deployment to be ready
        self.log("⏳ Waiting for deployment to be ready...")
        time.sleep(30)
        
        # Test production endpoints
        production_urls = [
            "https://finkargo.ai/api/health",
            "https://finkargo.ai/api/docs",
        ]
        
        import requests
        for url in production_urls:
            try:
                response = requests.get(url, timeout=30)
                if response.status_code == 200:
                    self.log(f"✅ {url} - SUCCESS")
                else:
                    self.log(f"❌ {url} - Status: {response.status_code}")
                    return False
            except Exception as e:
                self.log(f"❌ {url} - ERROR: {str(e)}")
                return False
        
        return True
    
    def generate_deployment_report(self):
        """Generate deployment report"""
        total_time = time.time() - self.deployment_start
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "environment": self.environment,
            "total_time": total_time,
            "results": self.results
        }
        
        report_file = f"deployment-reports/deployment-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs("deployment-reports", exist_ok=True)
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.log(f"📄 Deployment report saved to: {report_file}")
    
    def deploy(self) -> bool:
        """Main deployment process"""
        self.log("🚀 STARTING DEPLOYMENT PROCESS")
        self.log("=" * 60)
        
        # Phase 1: Pre-deployment checks
        self.log("📋 Phase 1: Pre-deployment Checks")
        if not self.check_git_status():
            self.log("❌ Git status check failed. Please commit all changes.")
            return False
        
        # Phase 2: Comprehensive testing
        self.log("📋 Phase 2: Comprehensive Testing")
        if not self.run_comprehensive_tests():
            self.log("❌ Comprehensive tests failed. Please fix issues before deployment.")
            return False
        
        # Phase 3: Security checks
        self.log("📋 Phase 3: Security Checks")
        if not self.run_security_checks():
            self.log("⚠️ Security checks failed. Review and continue if acceptable.")
        
        # Phase 4: Performance checks
        self.log("📋 Phase 4: Performance Checks")
        if not self.run_performance_checks():
            self.log("❌ Performance checks failed.")
            return False
        
        # Phase 5: Deployment
        self.log("📋 Phase 5: Deployment")
        
        # Deploy frontend
        if not self.deploy_to_vercel():
            self.log("❌ Vercel deployment failed.")
            return False
        
        # Deploy backend
        if not self.deploy_to_railway():
            self.log("❌ Railway deployment failed.")
            return False
        
        # Phase 6: Post-deployment
        self.log("📋 Phase 6: Post-deployment")
        
        # Update environment variables
        self.update_environment_variables()
        
        # Run post-deployment tests
        if not self.run_post_deployment_tests():
            self.log("❌ Post-deployment tests failed.")
            return False
        
        # Generate report
        self.generate_deployment_report()
        
        self.log("=" * 60)
        self.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!")
        self.log("=" * 60)
        
        return True

def main():
    """Main deployment runner"""
    print("🚀 Supply Chain Intelligence Platform - Deployment with Testing")
    print("=" * 70)
    
    # Check if we're in the right directory
    if not os.path.exists("main.py"):
        print("❌ Error: main.py not found. Please run from project root.")
        sys.exit(1)
    
    # Check if comprehensive test suite exists
    if not os.path.exists("scripts/comprehensive_test_suite.py"):
        print("❌ Error: comprehensive_test_suite.py not found.")
        sys.exit(1)
    
    # Run deployment
    deployment_manager = DeploymentManager()
    success = deployment_manager.deploy()
    
    if success:
        print("\n🎉 Deployment completed successfully!")
        print("   Your application is now live!")
        sys.exit(0)
    else:
        print("\n❌ Deployment failed. Please check the logs and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main() 