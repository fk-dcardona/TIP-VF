#!/usr/bin/env python3
"""
Simple migration script for enhanced models
"""

from models_enhanced import db, UnifiedTransaction, DocumentInventoryLink
from main import app
import sqlite3

def migrate_enhanced_models():
    """Create enhanced models in the database"""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Enhanced models created successfully")
            
            # Verify tables exist using SQLite
            if 'sqlite' in str(db.engine.url):
                # For SQLite, check tables directly
                conn = sqlite3.connect('database/app.db')
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                conn.close()
                
                print(f"📋 Available tables: {tables}")
                
                # Check if our new tables were created
                if 'unified_transactions' in tables:
                    print("✅ UnifiedTransaction table created")
                else:
                    print("❌ UnifiedTransaction table not found")
                    
                if 'document_inventory_links' in tables:
                    print("✅ DocumentInventoryLink table created")
                else:
                    print("❌ DocumentInventoryLink table not found")
            else:
                print("📋 Database type not SQLite, skipping table verification")
                
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            return False
    
    return True

if __name__ == "__main__":
    print("🚀 Starting enhanced models migration...")
    success = migrate_enhanced_models()
    if success:
        print("🎉 Migration completed successfully!")
    else:
        print("💥 Migration failed!") 