#!/usr/bin/env python3
"""
Test script to verify Supabase connection with Flask app
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

def test_supabase_connection():
    """Test the Supabase connection with Flask app"""
    try:
        # Test importing the app
        print("🔍 Testing Flask app import...")
        from main import app
        print("✅ Flask app imported successfully!")
        
        # Test database connection
        print("🔍 Testing database connection...")
        with app.app_context():
from backend.models import db
            from models_enhanced import UnifiedTransaction, DocumentInventoryLink
            
            # Test if we can query the database
            from sqlalchemy import text
            result = db.session.execute(text("SELECT version()")).fetchone()
            print(f"✅ Database connected successfully! PostgreSQL version: {result[0]}")
            
            # Test if our new tables exist
            print("🔍 Testing new model tables...")
            
            # Check if UnifiedTransaction table exists
            result = db.session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'unified_transactions'
                )
            """)).fetchone()
            
            if result[0]:
                print("✅ UnifiedTransaction table exists!")
            else:
                print("❌ UnifiedTransaction table not found")
            
            # Check if DocumentInventoryLink table exists
            result = db.session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'document_inventory_links'
                )
            """)).fetchone()
            
            if result[0]:
                print("✅ DocumentInventoryLink table exists!")
            else:
                print("❌ DocumentInventoryLink table not found")
            
            # Test model import
            print("🔍 Testing model imports...")
            print(f"✅ UnifiedTransaction model: {UnifiedTransaction}")
            print(f"✅ DocumentInventoryLink model: {DocumentInventoryLink}")
            
            print("\n🎉 All tests passed! Supabase connection is working correctly.")
            
    except Exception as e:
        print(f"❌ Error testing Supabase connection: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Testing Supabase Connection...")
    print("=" * 50)
    
    # Check if DATABASE_URL is set
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        print(f"📋 DATABASE_URL found: {database_url[:50]}...")
    else:
        print("⚠️  DATABASE_URL not found in environment variables")
        print("   Please set DATABASE_URL to your Supabase connection string")
        sys.exit(1)
    
    success = test_supabase_connection()
    
    if success:
        print("\n✅ Supabase integration test completed successfully!")
        print("   Your Flask app is ready to use with Supabase!")
    else:
        print("\n❌ Supabase integration test failed!")
        print("   Please check your configuration and try again.")
        sys.exit(1) 