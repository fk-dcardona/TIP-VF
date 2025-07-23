#!/usr/bin/env python3
"""
Simple CSV Integration Test
Tests our CSV analytics integration without complex dependencies
"""

import os
import sys
import tempfile
import json
import pandas as pd

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def create_sample_csv_files():
    """Create sample CSV files for testing"""
    print("📁 Creating Sample CSV Files")
    print("=" * 50)
    
    # Create sample inventory data with correct column names
    inventory_data = {
        'product_id': ['PROD001', 'PROD002', 'PROD003', 'PROD004', 'PROD005'],
        'product_name': ['Product 1', 'Product 2', 'Product 3', 'Product 4', 'Product 5'],
        'category': ['Electronics', 'Hardware', 'Software', 'Electronics', 'Hardware'],
        'current_stock': [100, 50, 200, 75, 120],
        'cost_per_unit': [25.50, 89.99, 15.00, 45.75, 67.50],
        'selling_price': [30.00, 100.00, 20.00, 55.00, 75.00]
    }
    
    # Create sample sales data with correct column names  
    sales_data = {
        'product_id': ['PROD001', 'PROD002', 'PROD001', 'PROD003', 'PROD004', 'PROD005'] * 3,
        'product_name': ['Product 1', 'Product 2', 'Product 1', 'Product 3', 'Product 4', 'Product 5'] * 3,
        'sales_quantity': [5, 3, 2, 4, 1, 6] * 3,
        'sales_period': [30, 30, 30, 30, 30, 30] * 3  # 30-day periods
    }
    
    # Create temporary files
    inventory_df = pd.DataFrame(inventory_data)
    sales_df = pd.DataFrame(sales_data)
    
    temp_dir = tempfile.mkdtemp()
    inventory_file = os.path.join(temp_dir, 'inventory_test.csv')
    sales_file = os.path.join(temp_dir, 'sales_test.csv')
    
    inventory_df.to_csv(inventory_file, index=False)
    sales_df.to_csv(sales_file, index=False)
    
    print(f"✅ Created inventory file: {inventory_file}")
    print(f"✅ Created sales file: {sales_file}")
    print(f"📊 Inventory records: {len(inventory_df)}")
    print(f"📊 Sales records: {len(sales_df)}")
    
    return inventory_file, sales_file, temp_dir

def test_supply_chain_engine():
    """Test the Supply Chain Analytics Engine directly"""
    print("\n🔧 Testing Supply Chain Analytics Engine")
    print("=" * 50)
    
    try:
        # Import the engine
        from supply_chain_engine import SupplyChainAnalyticsEngine
        print("✅ Successfully imported SupplyChainAnalyticsEngine")
        
        # Create engine instance
        engine = SupplyChainAnalyticsEngine()
        print("✅ Successfully created analytics engine instance")
        
        # Create sample combined data
        combined_data = pd.DataFrame({
            'product_id': ['PROD001', 'PROD002', 'PROD003'],
            'product_name': ['Product 1', 'Product 2', 'Product 3'],
            'current_stock': [100, 50, 200],
            'cost_per_unit': [25.50, 89.99, 15.00],
            'selling_price': [30.00, 100.00, 20.00],
            'sales_quantity': [5, 3, 4],
            'sales_period': [30, 30, 30],
            'category': ['Electronics', 'Hardware', 'Software']
        })
        
        print("✅ Created sample combined data")
        print(f"📊 Sample data shape: {combined_data.shape}")
        print(f"📊 Columns: {list(combined_data.columns)}")
        
        # Process the data
        result = engine.process_inventory_sales_csv(combined_data)
        print("✅ Successfully processed sample data")
        
        # Validate results
        if isinstance(result, dict):
            print(f"📈 Analytics result keys: {list(result.keys())}")
            
            # Check key sections
            if 'key_metrics' in result:
                metrics = result['key_metrics']
                print(f"   📊 Key metrics: {len(metrics)} items")
                for key, value in metrics.items():
                    print(f"      {key}: {value}")
            
            if 'product_performance' in result:
                products = result['product_performance']
                print(f"   🛍️  Product insights: {len(products)} products")
                
            if 'inventory_alerts' in result:
                alerts = result['inventory_alerts']
                print(f"   🚨 Inventory alerts: {len(alerts)} alerts")
                
            if 'recommendations' in result:
                recommendations = result['recommendations']
                print(f"   💡 Recommendations: {len(recommendations)} items")
                for rec in recommendations[:3]:  # Show first 3
                    print(f"      - {rec}")
                    
            return True, result
        else:
            print(f"❌ Unexpected result type: {type(result)}")
            return False, None
            
    except Exception as e:
        print(f"❌ Analytics engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_csv_processing_functions():
    """Test CSV processing functions from upload routes"""
    print("\n🔍 Testing CSV Processing Functions")
    print("=" * 50)
    
    try:
        # Import functions
        from backend.routes.upload_routes import detect_csv_type, validate_csv_data
        print("✅ Successfully imported CSV processing functions")
        
        # Test inventory detection
        inventory_data = pd.DataFrame({
            'product_id': ['PROD001', 'PROD002'],
            'product_name': ['Product 1', 'Product 2'],
            'current_stock': [100, 50],
            'cost_per_unit': [25.50, 89.99]
        })
        
        csv_type = detect_csv_type(inventory_data)
        print(f"✅ Detected inventory CSV type: {csv_type}")
        
        validation = validate_csv_data(inventory_data, csv_type)
        print(f"✅ Inventory validation: {validation}")
        
        # Test sales detection
        sales_data = pd.DataFrame({
            'product_id': ['PROD001', 'PROD002'],
            'sales_quantity': [5, 3],
            'sales_period': [30, 30]
        })
        
        csv_type = detect_csv_type(sales_data)
        print(f"✅ Detected sales CSV type: {csv_type}")
        
        validation = validate_csv_data(sales_data, csv_type)
        print(f"✅ Sales validation: {validation}")
        
        return True
        
    except Exception as e:
        print(f"❌ CSV processing functions test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_data_transformation():
    """Test data transformation for analytics"""
    print("\n🔄 Testing Data Transformation")
    print("=" * 50)
    
    try:
        from supply_chain_engine import SupplyChainAnalyticsEngine
        
        # Create sample inventory and sales data separately
        inventory_data = pd.DataFrame({
            'product_id': ['PROD001', 'PROD002', 'PROD003'],
            'product_name': ['Product 1', 'Product 2', 'Product 3'],
            'current_stock': [100, 50, 200],
            'cost_per_unit': [25.50, 89.99, 15.00],
            'selling_price': [30.00, 100.00, 20.00],
            'category': ['Electronics', 'Hardware', 'Software']
        })
        
        sales_data = pd.DataFrame({
            'product_id': ['PROD001', 'PROD002', 'PROD001', 'PROD003'],
            'sales_quantity': [5, 3, 2, 4],
            'sales_period': [30, 30, 30, 30]
        })
        
        print("✅ Created separate inventory and sales datasets")
        print(f"📦 Inventory shape: {inventory_data.shape}")
        print(f"💰 Sales shape: {sales_data.shape}")
        
        # Merge data (this is what our CSV processing would do)
        merged_data = inventory_data.merge(
            sales_data.groupby('product_id').agg({
                'sales_quantity': 'sum',
                'sales_period': 'first'
            }).reset_index(),
            on='product_id',
            how='left'
        )
        
        # Fill missing sales data
        merged_data['sales_quantity'] = merged_data['sales_quantity'].fillna(0)
        merged_data['sales_period'] = merged_data['sales_period'].fillna(30)
        
        print("✅ Successfully merged inventory and sales data")
        print(f"📊 Merged data shape: {merged_data.shape}")
        print(f"📊 Merged columns: {list(merged_data.columns)}")
        
        # Process with analytics engine
        engine = SupplyChainAnalyticsEngine()
        result = engine.process_inventory_sales_csv(merged_data)
        
        print("✅ Successfully processed merged data")
        print(f"📈 Result contains: {list(result.keys())}")
        
        return True, result
        
    except Exception as e:
        print(f"❌ Data transformation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_integration_readiness():
    """Test integration readiness"""
    print("\n🎯 Testing Integration Readiness")
    print("=" * 50)
    
    integration_components = [
        ('Supply Chain Engine', 'supply_chain_engine.py'),
        ('Enhanced Upload Routes', 'backend/routes/upload_routes.py'),
        ('CSV Analytics Provider', 'src/services/analytics/providers/CSVAnalyticsProvider.ts'),
        ('Upload Hook', 'src/hooks/useCSVUpload.ts'),
        ('Upload Wizard', 'src/components/upload/EnhancedUploadWizard.tsx'),
        ('Dashboard Integration', 'src/app/dashboard/page.tsx')
    ]
    
    success = True
    
    for component_name, file_path in integration_components:
        if os.path.exists(file_path):
            print(f"✅ {component_name}")
        else:
            print(f"❌ {component_name} - Missing: {file_path}")
            success = False
    
    if success:
        print("\n🎉 All integration components are present!")
        print("🚀 CSV Analytics Integration is ready for testing!")
    else:
        print("\n⚠️  Some integration components are missing")
    
    return success

def cleanup_test_files(temp_dir):
    """Clean up temporary test files"""
    try:
        import shutil
        shutil.rmtree(temp_dir)
        print(f"\n🧹 Cleaned up test files: {temp_dir}")
    except Exception as e:
        print(f"\n⚠️  Could not clean up test files: {e}")

def main():
    """Run simple CSV integration tests"""
    print("🚀 Simple CSV Integration Test Suite")
    print("=" * 70)
    
    # Create sample data
    inventory_file, sales_file, temp_dir = create_sample_csv_files()
    
    results = []
    
    # Test 1: Supply Chain Engine
    engine_success, analytics_result = test_supply_chain_engine()
    results.append(('Analytics Engine', engine_success))
    
    # Test 2: CSV Processing Functions  
    csv_functions_success = test_csv_processing_functions()
    results.append(('CSV Processing Functions', csv_functions_success))
    
    # Test 3: Data Transformation
    transform_success, transform_result = test_data_transformation()
    results.append(('Data Transformation', transform_success))
    
    # Test 4: Integration Readiness
    integration_success = test_integration_readiness()
    results.append(('Integration Readiness', integration_success))
    
    # Clean up
    cleanup_test_files(temp_dir)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SIMPLE INTEGRATION TEST SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:25} {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ CSV Analytics Integration is working correctly!")
        print("🚀 Ready for end-to-end testing with backend API!")
        return True
    else:
        print(f"\n⚠️  {total - passed} tests failed.")
        print("💡 Review failed tests before proceeding.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)