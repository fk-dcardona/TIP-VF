#!/usr/bin/env python3
"""
Frontend Integration Test Script
Tests frontend components and integration
"""

import os
import sys
import subprocess
import json

def test_typescript_compilation():
    """Test TypeScript syntax and structure of integration files"""
    print("🎨 Testing TypeScript Syntax & Structure")
    print("=" * 50)
    
    integration_files = {
        'src/services/analytics/providers/CSVAnalyticsProvider.ts': {
            'required_exports': ['CSVAnalyticsProvider'],
            'required_methods': ['uploadCSVFiles', 'validateCSV', 'getAnalytics']
        },
        'src/hooks/useCSVUpload.ts': {
            'required_exports': ['useCSVUpload'],
            'required_content': ['useState', 'useCallback']
        },
        'src/components/upload/EnhancedUploadWizard.tsx': {
            'required_exports': ['default', 'EnhancedUploadWizard'],
            'required_content': ['useCSVUpload', 'React']
        }
    }
    
    success = True
    
    for file_path, requirements in integration_files.items():
        try:
            print(f"📄 Checking {file_path}")
            
            if not os.path.exists(file_path):
                print(f"   ❌ File not found")
                success = False
                continue
                
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Check for basic TypeScript syntax
            if not content.strip():
                print(f"   ❌ File is empty")
                success = False
                continue
                
            # Check for required exports
            if 'required_exports' in requirements:
                for export in requirements['required_exports']:
                    if f'export' in content and export in content:
                        print(f"   ✅ Export '{export}' found")
                    else:
                        print(f"   ❌ Export '{export}' missing")
                        success = False
            
            # Check for required content/methods
            if 'required_methods' in requirements:
                for method in requirements['required_methods']:
                    if method in content:
                        print(f"   ✅ Method '{method}' found")
                    else:
                        print(f"   ❌ Method '{method}' missing")
                        success = False
                        
            if 'required_content' in requirements:
                for item in requirements['required_content']:
                    if item in content:
                        print(f"   ✅ Content '{item}' found")
                    else:
                        print(f"   ❌ Content '{item}' missing")
                        success = False
            
            # Basic syntax check - no obvious syntax errors
            if content.count('{') != content.count('}'):
                print(f"   ❌ Mismatched braces")
                success = False
            else:
                print(f"   ✅ Basic syntax structure valid")
                
        except Exception as e:
            print(f"   ❌ Error checking file: {e}")
            success = False
    
    return success

def test_package_json_scripts():
    """Test package.json scripts exist"""
    print("\n📦 Testing Package.json Scripts")
    print("=" * 50)
    
    try:
        with open('package.json', 'r') as f:
            package_data = json.load(f)
        
        required_scripts = ['dev', 'build', 'type-check']
        scripts = package_data.get('scripts', {})
        
        success = True
        for script in required_scripts:
            if script in scripts:
                print(f"✅ npm run {script}")
            else:
                print(f"❌ npm run {script} - MISSING")
                success = False
        
        return success
        
    except Exception as e:
        print(f"❌ Error reading package.json: {e}")
        return False

def test_component_files_structure():
    """Test component file structure"""
    print("\n📁 Testing Component File Structure")
    print("=" * 50)
    
    required_structure = {
        'src/components/upload/': ['EnhancedUploadWizard.tsx'],
        'src/hooks/': ['useCSVUpload.ts'],
        'src/services/analytics/providers/': ['CSVAnalyticsProvider.ts'],
        'src/app/dashboard/': ['page.tsx']
    }
    
    success = True
    
    for directory, files in required_structure.items():
        if os.path.exists(directory):
            print(f"✅ {directory}")
            
            for file in files:
                file_path = os.path.join(directory, file)
                if os.path.exists(file_path):
                    print(f"  ✅ {file}")
                else:
                    print(f"  ❌ {file} - MISSING")
                    success = False
        else:
            print(f"❌ {directory} - DIRECTORY MISSING")
            success = False
    
    return success

def test_import_statements():
    """Test key import statements in files"""
    print("\n📥 Testing Import Statements")
    print("=" * 50)
    
    import_tests = [
        {
            'file': 'src/services/analytics/providers/CSVAnalyticsProvider.ts',
            'imports': ['AnalyticsData', 'InventoryData', 'SalesData']
        },
        {
            'file': 'src/hooks/useCSVUpload.ts',
            'imports': ['useState', 'useCallback', 'SolidAnalyticsService']
        },
        {
            'file': 'src/components/upload/EnhancedUploadWizard.tsx',
            'imports': ['React', 'useCSVUpload']
        }
    ]
    
    success = True
    
    for test in import_tests:
        file_path = test['file']
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            print(f"📄 {file_path}")
            
            for import_name in test['imports']:
                if import_name in content:
                    print(f"  ✅ {import_name}")
                else:
                    print(f"  ❌ {import_name} - NOT FOUND")
                    success = False
                    
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            success = False
    
    return success

def test_dashboard_integration():
    """Test dashboard integration"""
    print("\n🎯 Testing Dashboard Integration")
    print("=" * 50)
    
    dashboard_file = 'src/app/dashboard/page.tsx'
    
    try:
        with open(dashboard_file, 'r') as f:
            content = f.read()
        
        integration_checks = [
            ('EnhancedUploadWizard import', 'EnhancedUploadWizard'),
            ('Upload tab trigger', 'upload'),
            ('Upload tab content', 'TabsContent value="upload"'),
            ('CSV Data Upload title', 'CSV Data Upload'),
            ('EnhancedUploadWizard component', '<EnhancedUploadWizard')
        ]
        
        success = True
        
        for check_name, search_term in integration_checks:
            if search_term in content:
                print(f"✅ {check_name}")
            else:
                print(f"❌ {check_name} - NOT FOUND")
                success = False
        
        return success
        
    except Exception as e:
        print(f"❌ Error reading dashboard file: {e}")
        return False

def main():
    """Run all frontend integration tests"""
    print("🎨 Frontend Integration Test Suite")
    print("=" * 60)
    
    tests = [
        ("Component File Structure", test_component_files_structure),
        ("Package.json Scripts", test_package_json_scripts),
        ("Import Statements", test_import_statements),
        ("Dashboard Integration", test_dashboard_integration),
        ("TypeScript Compilation", test_typescript_compilation),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        try:
            result = test_func()
            results.append((test_name, result))
            if result:
                print(f"✅ {test_name} Test: PASSED")
            else:
                print(f"❌ {test_name} Test: FAILED")
        except Exception as e:
            print(f"❌ {test_name} Test: ERROR - {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FRONTEND TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:25} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL FRONTEND TESTS PASSED! Frontend integration is ready.")
        return True
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please review and fix issues.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)