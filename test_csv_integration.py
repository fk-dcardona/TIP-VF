#!/usr/bin/env python3
"""
CSV Integration Test Script
Tests the CSV analytics integration between analytics dashboard and FinkArgo
"""

import os
import sys
import tempfile
import json
from io import StringIO
import pandas as pd

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def test_csv_processing():
    """Test CSV processing functionality"""
    print("🧪 Testing CSV Processing Functionality")
    print("=" * 50)
    
    # Test 1: Import CSV processing functions
    try:
        from backend.routes.upload_routes import detect_csv_type, validate_csv_data
        print("✅ Successfully imported CSV processing functions")
    except Exception as e:
        print(f"❌ Failed to import CSV functions: {e}")
        return False
    
    # Test 2: Create sample inventory data
    print("\n📦 Testing Inventory CSV Processing...")
    inventory_data = {
        'k_sc_codigo_articulo': ['PROD001', 'PROD002', 'PROD003'],
        'sc_detalle_articulo': ['Product 1', 'Product 2', 'Product 3'],
        'sc_detalle_grupo': ['Electronics', 'Hardware', 'Software'],
        'n_saldo_actual': [100, 50, 200],
        'n_costo_promedio': [25.50, 89.99, 15.00]
    }
    
    inventory_df = pd.DataFrame(inventory_data)
    
    # Test CSV type detection
    csv_type = detect_csv_type(inventory_df)
    print(f"✅ Detected CSV type: {csv_type}")
    assert csv_type == 'inventory', f"Expected 'inventory', got '{csv_type}'"
    
    # Test validation
    validation = validate_csv_data(inventory_df, csv_type)
    print(f"✅ Validation result: {validation}")
    assert validation['is_valid'], f"Validation failed: {validation['errors']}"
    
    # Test 3: Create sample sales data
    print("\n💰 Testing Sales CSV Processing...")
    sales_data = {
        'k_sc_codigo_articulo': ['PROD001', 'PROD002', 'PROD001'],
        'sc_detalle_articulo': ['Product 1', 'Product 2', 'Product 1'],
        'd_fecha_documento': ['1/15/2024', '1/16/2024', '1/17/2024'],
        'n_cantidad': [5, 3, 2],
        'n_valor': [127.50, 269.97, 51.00]
    }
    
    sales_df = pd.DataFrame(sales_data)
    
    # Test CSV type detection
    csv_type = detect_csv_type(sales_df)
    print(f"✅ Detected CSV type: {csv_type}")
    assert csv_type == 'sales', f"Expected 'sales', got '{csv_type}'"
    
    # Test validation
    validation = validate_csv_data(sales_df, csv_type)
    print(f"✅ Validation result: {validation}")
    assert validation['is_valid'], f"Validation failed: {validation['errors']}"
    
    return True

def test_analytics_engine():
    """Test the Supply Chain Analytics Engine"""
    print("\n🔧 Testing Supply Chain Analytics Engine")
    print("=" * 50)
    
    try:
        from supply_chain_engine import SupplyChainAnalyticsEngine
        print("✅ Successfully imported SupplyChainAnalyticsEngine")
        
        engine = SupplyChainAnalyticsEngine()
        print("✅ Successfully created analytics engine instance")
        
        # Test with sample data in the format expected by analytics engine
        sample_data = pd.DataFrame({
            'product_id': ['PROD001', 'PROD002'],
            'product_name': ['Product 1', 'Product 2'],
            'current_stock': [100, 50],
            'cost_per_unit': [25.50, 89.99],
            'selling_price': [30.00, 100.00],
            'sales_quantity': [5, 3],
            'sales_period': [30, 30],  # 30 days
            'category': ['Electronics', 'Hardware']
        })
        
        result = engine.process_inventory_sales_csv(sample_data)
        print("✅ Successfully processed sample data")
        print(f"📊 Analytics result keys: {list(result.keys())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Analytics engine test failed: {e}")
        return False

def test_frontend_provider():
    """Test the CSV Analytics Provider"""
    print("\n🎨 Testing Frontend CSV Analytics Provider")
    print("=" * 50)
    
    try:
        # Since this is TypeScript, we'll just check the file exists
        provider_path = os.path.join(current_dir, 'src/services/analytics/providers/CSVAnalyticsProvider.ts')
        
        if os.path.exists(provider_path):
            print("✅ CSVAnalyticsProvider.ts file exists")
            
            # Read and check basic structure
            with open(provider_path, 'r') as f:
                content = f.read()
                
            if 'class CSVAnalyticsProvider' in content:
                print("✅ CSVAnalyticsProvider class found")
            else:
                print("❌ CSVAnalyticsProvider class not found")
                return False
                
            if 'uploadCSVFiles' in content:
                print("✅ uploadCSVFiles method found")
            else:
                print("❌ uploadCSVFiles method not found")
                return False
                
            if 'validateCSV' in content:
                print("✅ validateCSV method found")
            else:
                print("❌ validateCSV method not found")
                return False
                
        else:
            print("❌ CSVAnalyticsProvider.ts file not found")
            return False
            
        # Check upload wizard
        wizard_path = os.path.join(current_dir, 'src/components/upload/EnhancedUploadWizard.tsx')
        
        if os.path.exists(wizard_path):
            print("✅ EnhancedUploadWizard.tsx file exists")
        else:
            print("❌ EnhancedUploadWizard.tsx file not found")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Frontend provider test failed: {e}")
        return False

def test_database_models():
    """Test database models and connections"""
    print("\n🗄️  Testing Database Models")
    print("=" * 50)
    
    try:
from backend.models import Upload, ProcessedData
        print("✅ Successfully imported Upload and ProcessedData models")
        
        # Test model creation (without database)
        upload = Upload(
            filename="test.csv",
            original_filename="test.csv",
            file_size=1024,
            file_type="csv",
            user_id="test_user",
            org_id="test_org",
            status="completed"
        )
        print("✅ Successfully created Upload model instance")
        
        processed_data = ProcessedData(
            upload_id=1,
            org_id="test_org",
            data_type="csv_analytics",
            processed_data=json.dumps({"test": "data"})
        )
        print("✅ Successfully created ProcessedData model instance")
        
        return True
        
    except Exception as e:
        print(f"❌ Database model test failed: {e}")
        return False

def test_integration_files():
    """Test that all integration files are present"""
    print("\n📁 Testing Integration Files")
    print("=" * 50)
    
    required_files = [
        'backend/routes/upload_routes.py',
        'src/services/analytics/providers/CSVAnalyticsProvider.ts',
        'src/hooks/useCSVUpload.ts',
        'src/components/upload/EnhancedUploadWizard.tsx',
        'src/app/dashboard/page.tsx'
    ]
    
    all_present = True
    
    for file_path in required_files:
        full_path = os.path.join(current_dir, file_path)
        if os.path.exists(full_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - NOT FOUND")
            all_present = False
    
    return all_present

def main():
    """Run all tests"""
    print("🚀 CSV Analytics Integration Test Suite")
    print("=" * 60)
    
    tests = [
        ("Integration Files", test_integration_files),
        ("Database Models", test_database_models),
        ("CSV Processing", test_csv_processing),
        ("Analytics Engine", test_analytics_engine),
        ("Frontend Provider", test_frontend_provider),
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
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:20} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Integration is ready for deployment.")
        return True
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please review and fix issues.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)