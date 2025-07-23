#!/usr/bin/env python3
"""
Dashboard Performance Diagnostic Script
Identifies common causes of unresponsive dashboard pages
"""

import os
import sys
import requests
import time
import json
import subprocess
from pathlib import Path

class DashboardDiagnostic:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.issues_found = []
        self.recommendations = []
        
    def check_console_errors(self):
        """Check for console errors by examining build output"""
        print("🔍 Checking for Build/Console Errors")
        print("=" * 50)
        
        # Check if there are any build errors
        try:
            # Look for .next build logs
            next_dir = ".next"
            if os.path.exists(next_dir):
                print("✅ .next directory exists")
                
                # Check for build-manifest errors
                build_manifest = os.path.join(next_dir, "build-manifest.json")
                if os.path.exists(build_manifest):
                    print("✅ Build manifest exists")
                else:
                    print("⚠️  Build manifest missing - may indicate build issues")
                    self.issues_found.append("Missing build manifest")
            
            # Check for TypeScript compilation errors
            result = subprocess.run(
                ["npm", "run", "type-check"], 
                capture_output=True, 
                text=True, 
                timeout=30
            )
            
            if result.returncode == 0:
                print("✅ TypeScript compilation successful")
            else:
                print("❌ TypeScript compilation errors found")
                print(f"   Errors: {result.stderr}")
                self.issues_found.append("TypeScript compilation errors")
                self.recommendations.append("Fix TypeScript errors with: npm run type-check")
                
        except subprocess.TimeoutExpired:
            print("⏱️  TypeScript check timed out")
            self.issues_found.append("TypeScript check timeout")
        except Exception as e:
            print(f"❌ Error checking build status: {e}")
    
    def check_memory_intensive_components(self):
        """Check for components that might cause memory issues"""
        print("\n🧠 Checking for Memory-Intensive Components")
        print("=" * 50)
        
        # List of files that might cause performance issues
        performance_files = [
            'src/app/dashboard/page.tsx',
            'src/components/upload/EnhancedUploadWizard.tsx',
            'src/hooks/useCSVUpload.ts',
            'src/services/analytics/providers/CSVAnalyticsProvider.ts'
        ]
        
        for file_path in performance_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    # Check for potential performance issues
                    lines = len(content.split('\n'))
                    size_kb = len(content) / 1024
                    
                    print(f"📄 {file_path}")
                    print(f"   Size: {size_kb:.1f}KB, Lines: {lines}")
                    
                    # Check for performance anti-patterns
                    issues = []
                    
                    if 'useEffect' in content and 'useState' in content:
                        # Count useEffect hooks
                        effect_count = content.count('useEffect')
                        if effect_count > 5:
                            issues.append(f"Many useEffect hooks ({effect_count})")
                    
                    if 'fetch' in content or 'axios' in content:
                        # Check for API calls in render
                        if 'map(' in content and ('fetch' in content or 'axios' in content):
                            issues.append("Potential API calls in render loops")
                    
                    if size_kb > 50:
                        issues.append(f"Large file size ({size_kb:.1f}KB)")
                    
                    if issues:
                        print(f"   ⚠️  Issues: {', '.join(issues)}")
                        self.issues_found.extend(issues)
                    else:
                        print("   ✅ No obvious performance issues")
                        
                except Exception as e:
                    print(f"   ❌ Error reading file: {e}")
    
    def check_infinite_loops(self):
        """Check for potential infinite loops in hooks"""
        print("\n🔄 Checking for Infinite Loop Patterns")
        print("=" * 50)
        
        hook_files = [
            'src/hooks/useCSVUpload.ts',
            'src/hooks/useAPIFetch.ts',
            'src/hooks/useSolidAnalytics.ts'
        ]
        
        for file_path in hook_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    print(f"🪝 {file_path}")
                    
                    # Check for common infinite loop patterns
                    warnings = []
                    
                    # Pattern 1: useEffect without dependency array
                    if 'useEffect(' in content:
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if 'useEffect(' in line and i < len(lines) - 1:
                                # Look for missing dependency array
                                next_few_lines = '\n'.join(lines[i:i+5])
                                if '], [' not in next_few_lines and '});' in next_few_lines:
                                    warnings.append(f"Line {i+1}: useEffect may be missing dependencies")
                    
                    # Pattern 2: State updates in useEffect without proper dependencies
                    if 'setState(' in content or 'set' in content:
                        if 'useEffect' in content:
                            warnings.append("State updates in useEffect - check dependencies")
                    
                    # Pattern 3: API calls without proper cleanup
                    if 'fetch(' in content or 'axios' in content:
                        if 'AbortController' not in content and 'cleanup' not in content:
                            warnings.append("API calls without cleanup - may cause memory leaks")
                    
                    if warnings:
                        print(f"   ⚠️  Potential issues: {warnings}")
                        self.issues_found.extend(warnings)
                    else:
                        print("   ✅ No obvious loop issues")
                        
                except Exception as e:
                    print(f"   ❌ Error reading file: {e}")
    
    def check_network_requests(self):
        """Check for excessive or problematic network requests"""
        print("\n🌐 Checking Network Request Patterns")
        print("=" * 50)
        
        try:
            # Test the dashboard page for response time
            start_time = time.time()
            response = requests.get(f"{self.base_url}/dashboard", timeout=10)
            response_time = time.time() - start_time
            
            print(f"📊 Dashboard response time: {response_time:.2f}s")
            
            if response_time > 5:
                print("   ❌ Slow response time (>5s)")
                self.issues_found.append("Slow dashboard response")
                self.recommendations.append("Optimize API calls or add loading states")
            elif response_time > 2:
                print("   ⚠️  Moderate response time (>2s)")
                self.issues_found.append("Moderate dashboard response time")
            else:
                print("   ✅ Good response time")
            
            # Check for API endpoints being called
            content = response.text
            
            # Look for fetch calls in the page source
            if 'fetch(' in content:
                print("   🔍 Fetch calls detected in page")
            
            # Check for loading states
            if 'loading' in content.lower() or 'spinner' in content.lower():
                print("   ✅ Loading states implemented")
            else:
                print("   ⚠️  No loading states detected")
                self.recommendations.append("Add loading states for better UX")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Network request failed: {e}")
            self.issues_found.append("Dashboard not accessible")
    
    def check_large_data_sets(self):
        """Check for large datasets that might cause performance issues"""
        print("\n📊 Checking for Large Dataset Issues")
        print("=" * 50)
        
        # Check provider files for large data handling
        provider_files = [
            'src/services/analytics/providers/CSVAnalyticsProvider.ts',
            'src/services/analytics/providers/RealDataAnalyticsProvider.ts',
            'src/services/analytics/SolidAnalyticsService.ts'
        ]
        
        for file_path in provider_files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                    
                    print(f"📈 {file_path}")
                    
                    # Check for pagination or data limiting
                    data_handling = []
                    
                    if 'slice(' in content or 'limit' in content:
                        data_handling.append("Data limiting implemented")
                    else:
                        data_handling.append("⚠️  No data limiting found")
                        self.recommendations.append("Implement data pagination/limiting")
                    
                    if 'cache' in content.lower():
                        data_handling.append("Caching implemented")
                    else:
                        data_handling.append("⚠️  No caching found")
                        self.recommendations.append("Implement data caching")
                    
                    if 'useMemo' in content or 'useCallback' in content:
                        data_handling.append("React optimization hooks used")
                    else:
                        data_handling.append("⚠️  No React optimization hooks")
                        self.recommendations.append("Add useMemo/useCallback for performance")
                    
                    for item in data_handling:
                        if '⚠️' in item:
                            print(f"   {item}")
                            self.issues_found.append(item.replace('⚠️  ', ''))
                        else:
                            print(f"   ✅ {item}")
                            
                except Exception as e:
                    print(f"   ❌ Error reading file: {e}")
    
    def check_browser_console_simulation(self):
        """Simulate browser console check"""
        print("\n🖥️  Browser Console Simulation")
        print("=" * 50)
        
        print("💡 To check browser console errors manually:")
        print("1. Open http://localhost:3001/dashboard in your browser")
        print("2. Press F12 to open Developer Tools")
        print("3. Go to Console tab")
        print("4. Look for red error messages")
        print("5. Common errors to look for:")
        print("   - Memory leaks")
        print("   - Infinite loops")
        print("   - Failed network requests")
        print("   - React warnings")
        print("   - JavaScript errors")
        
        # Check server logs for errors
        try:
            # This would normally check server logs, but we'll simulate
            print("\n📋 Common console errors that cause unresponsive pages:")
            common_errors = [
                "Cannot read property 'map' of undefined",
                "Maximum update depth exceeded",
                "Memory leak detected",
                "Failed to fetch",
                "CORS error",
                "ChunkLoadError"
            ]
            
            for error in common_errors:
                print(f"   - {error}")
                
        except Exception as e:
            print(f"❌ Error checking logs: {e}")
    
    def generate_quick_fixes(self):
        """Generate quick fixes for common issues"""
        print("\n🔧 Quick Fix Recommendations")
        print("=" * 50)
        
        # Priority fixes for unresponsive pages
        priority_fixes = [
            {
                "issue": "React infinite re-renders",
                "fix": "Add proper dependency arrays to useEffect hooks",
                "code": "useEffect(() => { /* code */ }, [dependency1, dependency2])"
            },
            {
                "issue": "Memory leaks from API calls",
                "fix": "Add cleanup functions to useEffect",
                "code": "useEffect(() => { const controller = new AbortController(); return () => controller.abort(); }, [])"
            },
            {
                "issue": "Large dataset rendering",
                "fix": "Implement virtual scrolling or pagination",
                "code": "const visibleData = data.slice(0, 100)"
            },
            {
                "issue": "Missing loading states",
                "fix": "Add loading indicators",
                "code": "{loading ? <Spinner /> : <DataComponent />}"
            }
        ]
        
        print("🎯 Priority fixes to try first:")
        for i, fix in enumerate(priority_fixes, 1):
            print(f"\n{i}. {fix['issue']}")
            print(f"   Solution: {fix['fix']}")
            print(f"   Example: {fix['code']}")
    
    def create_performance_fix_script(self):
        """Create a script to apply common performance fixes"""
        print("\n📝 Creating Performance Fix Script")
        print("=" * 50)
        
        fix_script = """#!/bin/bash
# Dashboard Performance Fix Script

echo "🔧 Applying common performance fixes..."

# 1. Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next
npm run build

# 2. Restart development server
echo "Restarting development server..."
pkill -f "next dev" || true
sleep 2
npm run dev &

# 3. Check for memory usage
echo "Monitoring memory usage..."
ps aux | grep node

echo "✅ Performance fixes applied!"
echo "💡 If still unresponsive, check browser console for specific errors"
"""
        
        with open('fix_dashboard_performance.sh', 'w') as f:
            f.write(fix_script)
        
        os.chmod('fix_dashboard_performance.sh', 0o755)
        print("✅ Created fix_dashboard_performance.sh")
        print("   Run with: ./fix_dashboard_performance.sh")
    
    def run_comprehensive_diagnostic(self):
        """Run all diagnostic checks"""
        print("🔍 Dashboard Performance Diagnostic")
        print("=" * 70)
        print("🎯 Diagnosing unresponsive dashboard issue...")
        print()
        
        # Run all checks
        self.check_console_errors()
        self.check_memory_intensive_components()
        self.check_infinite_loops()
        self.check_network_requests()
        self.check_large_data_sets()
        self.check_browser_console_simulation()
        
        # Generate fixes
        self.generate_quick_fixes()
        self.create_performance_fix_script()
        
        # Summary report
        self.generate_diagnostic_report()
    
    def generate_diagnostic_report(self):
        """Generate final diagnostic report"""
        print("\n" + "=" * 70)
        print("📊 DIAGNOSTIC REPORT")
        print("=" * 70)
        
        print(f"🔍 Issues Found: {len(self.issues_found)}")
        for i, issue in enumerate(self.issues_found, 1):
            print(f"   {i}. {issue}")
        
        print(f"\n💡 Recommendations: {len(self.recommendations)}")
        for i, rec in enumerate(self.recommendations, 1):
            print(f"   {i}. {rec}")
        
        if len(self.issues_found) == 0:
            print("\n✅ No obvious issues found!")
            print("💡 Try these general solutions:")
            print("   1. Clear browser cache and hard refresh (Ctrl+Shift+R)")
            print("   2. Check browser console for JavaScript errors")
            print("   3. Restart the development server")
            print("   4. Try incognito/private browsing mode")
        elif len(self.issues_found) <= 3:
            print("\n⚠️  Minor issues found - likely fixable")
            print("🚀 Dashboard should work after applying fixes")
        else:
            print("\n❌ Multiple issues found")
            print("🔧 Recommend systematic fixing approach")
        
        print(f"\n🌐 Dashboard URL: {self.base_url}/dashboard")
        print("🛠️  Next steps: Apply fixes and test again")

def main():
    """Main diagnostic function"""
    diagnostic = DashboardDiagnostic()
    diagnostic.run_comprehensive_diagnostic()
    return len(diagnostic.issues_found) <= 3

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)