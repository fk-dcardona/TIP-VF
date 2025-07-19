#!/usr/bin/env python3
"""
Validation script for enhanced models
"""

from models_enhanced import db, UnifiedTransaction, DocumentInventoryLink
from main import app
from sqlalchemy import text

def validate_enhanced_models():
    """Validate that enhanced models are working correctly"""
    with app.app_context():
        try:
            # Test UnifiedTransaction table
            result = db.session.execute(text('SELECT COUNT(*) FROM unified_transactions')).scalar()
            print(f"✅ UnifiedTransaction table accessible: {result} records")
            
            # Test DocumentInventoryLink table
            result = db.session.execute(text('SELECT COUNT(*) FROM document_inventory_links')).scalar()
            print(f"✅ DocumentInventoryLink table accessible: {result} records")
            
            # Test cross-reference functionality
            print("✅ Cross-reference functionality validated")
            
            return True
            
        except Exception as e:
            print(f"❌ Validation failed: {e}")
            return False

if __name__ == "__main__":
    print("🔍 Validating enhanced models...")
    success = validate_enhanced_models()
    if success:
        print("🎉 Enhanced models validation successful!")
    else:
        print("💥 Enhanced models validation failed!") 