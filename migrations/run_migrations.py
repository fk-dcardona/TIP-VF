#!/usr/bin/env python3
"""
Database migration runner for agent system deployment.
Handles both SQLite (development) and PostgreSQL (production) databases.
"""

import os
import sys
import sqlite3
import psycopg2
from datetime import datetime
from pathlib import Path
import logging

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, '..'))

from config.settings import settings

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('migration_runner')

class MigrationRunner:
    """Database migration runner with support for multiple database types."""
    
    def __init__(self):
        """Initialize migration runner."""
        self.database_url = settings.DATABASE_URL
        self.migration_dir = Path(__file__).parent
        self.db_type = self._detect_database_type()
        
    def _detect_database_type(self) -> str:
        """Detect database type from URL."""
        if self.database_url.startswith('sqlite'):
            return 'sqlite'
        elif self.database_url.startswith('postgresql'):
            return 'postgresql'
        else:
            raise ValueError(f"Unsupported database type: {self.database_url}")
    
    def _get_sqlite_connection(self):
        """Get SQLite database connection."""
        # Extract database path from URL
        db_path = self.database_url.replace('sqlite:///', '')
        
        # Create directory if it doesn't exist
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        
        return sqlite3.connect(db_path)
    
    def _get_postgresql_connection(self):
        """Get PostgreSQL database connection."""
        return psycopg2.connect(self.database_url)
    
    def _get_connection(self):
        """Get database connection based on type."""
        if self.db_type == 'sqlite':
            return self._get_sqlite_connection()
        elif self.db_type == 'postgresql':
            return self._get_postgresql_connection()
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")
    
    def _create_migration_table(self, cursor):
        """Create migration tracking table."""
        if self.db_type == 'sqlite':
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    description TEXT
                )
            ''')
        elif self.db_type == 'postgresql':
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(255) PRIMARY KEY,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    description TEXT
                )
            ''')
    
    def _get_applied_migrations(self, cursor) -> set:
        """Get list of applied migrations."""
        try:
            cursor.execute("SELECT version FROM schema_migrations")
            return {row[0] for row in cursor.fetchall()}
        except Exception:
            # Table doesn't exist yet
            return set()
    
    def _convert_sql_for_postgresql(self, sql_content: str) -> str:
        """Convert SQLite SQL to PostgreSQL compatible SQL."""
        # Basic conversions for PostgreSQL
        conversions = {
            'INTEGER PRIMARY KEY AUTOINCREMENT': 'SERIAL PRIMARY KEY',
            'DATETIME': 'TIMESTAMP',
            'DECIMAL(10,4)': 'NUMERIC(10,4)',
            'DECIMAL(3,2)': 'NUMERIC(3,2)',
            'DECIMAL(5,2)': 'NUMERIC(5,2)',
            'DECIMAL(10,2)': 'NUMERIC(10,2)',
            'BOOLEAN': 'BOOLEAN',
            'JSON': 'JSONB',
            'TEXT': 'TEXT',
            'VARCHAR(255)': 'VARCHAR(255)',
            'CURRENT_TIMESTAMP': 'CURRENT_TIMESTAMP',
            'INDEX idx_': 'CREATE INDEX IF NOT EXISTS idx_',
            'UNIQUE(': 'CONSTRAINT unique_constraint UNIQUE(',
        }
        
        result = sql_content
        for old, new in conversions.items():
            result = result.replace(old, new)
        
        # Fix INDEX creation syntax
        lines = result.split('\n')
        processed_lines = []
        
        for line in lines:
            if 'CREATE INDEX IF NOT EXISTS idx_' in line and 'ON ' not in line:
                # This is an inline index definition, convert to separate CREATE INDEX
                if '(' in line and ')' in line:
                    # Extract table name from previous CREATE TABLE statement
                    table_name = None
                    for prev_line in reversed(processed_lines):
                        if 'CREATE TABLE' in prev_line:
                            table_name = prev_line.split('CREATE TABLE IF NOT EXISTS ')[1].split(' ')[0]
                            break
                    
                    if table_name:
                        index_name = line.strip().split('CREATE INDEX IF NOT EXISTS ')[1].split(' ')[0]
                        columns = line.split('(')[1].split(')')[0]
                        new_line = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({columns});"
                        processed_lines.append(new_line)
                        continue
            
            processed_lines.append(line)
        
        return '\n'.join(processed_lines)
    
    def _execute_migration(self, cursor, sql_content: str, version: str, description: str):
        """Execute a migration."""
        logger.info(f"Applying migration {version}: {description}")
        
        # Convert SQL if needed
        if self.db_type == 'postgresql':
            sql_content = self._convert_sql_for_postgresql(sql_content)
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                try:
                    cursor.execute(statement)
                    logger.debug(f"Executed: {statement[:100]}...")
                except Exception as e:
                    logger.error(f"Error executing statement: {statement[:100]}...")
                    logger.error(f"Error: {e}")
                    raise
        
        # Record migration as applied
        cursor.execute(
            "INSERT INTO schema_migrations (version, description) VALUES (?, ?)" 
            if self.db_type == 'sqlite' else
            "INSERT INTO schema_migrations (version, description) VALUES (%s, %s)",
            (version, description)
        )
        
        logger.info(f"Migration {version} applied successfully")
    
    def run_migrations(self):
        """Run all pending migrations."""
        logger.info(f"Starting migrations for {self.db_type} database")
        
        # Get all migration files
        migration_files = sorted([
            f for f in os.listdir(self.migration_dir)
            if f.endswith('.sql') and f[0].isdigit()
        ])
        
        if not migration_files:
            logger.info("No migration files found")
            return
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Create migration tracking table
            self._create_migration_table(cursor)
            conn.commit()
            
            # Get applied migrations
            applied_migrations = self._get_applied_migrations(cursor)
            
            # Run pending migrations
            for migration_file in migration_files:
                version = migration_file.split('_')[0]
                
                if version in applied_migrations:
                    logger.info(f"Migration {version} already applied, skipping")
                    continue
                
                # Read migration file
                migration_path = self.migration_dir / migration_file
                with open(migration_path, 'r') as f:
                    sql_content = f.read()
                
                # Extract description from filename
                description = migration_file.replace('.sql', '').replace('_', ' ')
                
                # Execute migration
                self._execute_migration(cursor, sql_content, version, description)
                conn.commit()
        
        logger.info("All migrations completed successfully")
    
    def rollback_migration(self, version: str):
        """Rollback a specific migration (if rollback file exists)."""
        rollback_file = self.migration_dir / f"{version}_rollback.sql"
        
        if not rollback_file.exists():
            logger.error(f"Rollback file not found for migration {version}")
            return False
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if migration was applied
            cursor.execute(
                "SELECT version FROM schema_migrations WHERE version = ?" 
                if self.db_type == 'sqlite' else
                "SELECT version FROM schema_migrations WHERE version = %s",
                (version,)
            )
            
            if not cursor.fetchone():
                logger.error(f"Migration {version} was not applied")
                return False
            
            # Read rollback file
            with open(rollback_file, 'r') as f:
                sql_content = f.read()
            
            # Execute rollback
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            for statement in statements:
                if statement:
                    cursor.execute(statement)
            
            # Remove migration record
            cursor.execute(
                "DELETE FROM schema_migrations WHERE version = ?" 
                if self.db_type == 'sqlite' else
                "DELETE FROM schema_migrations WHERE version = %s",
                (version,)
            )
            
            conn.commit()
            logger.info(f"Migration {version} rolled back successfully")
            return True
    
    def get_migration_status(self):
        """Get status of all migrations."""
        migration_files = sorted([
            f for f in os.listdir(self.migration_dir)
            if f.endswith('.sql') and f[0].isdigit()
        ])
        
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                applied_migrations = self._get_applied_migrations(cursor)
        except Exception:
            applied_migrations = set()
        
        status = []
        for migration_file in migration_files:
            version = migration_file.split('_')[0]
            description = migration_file.replace('.sql', '').replace('_', ' ')
            is_applied = version in applied_migrations
            
            status.append({
                'version': version,
                'description': description,
                'applied': is_applied,
                'file': migration_file
            })
        
        return status


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database migration runner')
    parser.add_argument('--rollback', help='Rollback specific migration version')
    parser.add_argument('--status', action='store_true', help='Show migration status')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    
    args = parser.parse_args()
    
    runner = MigrationRunner()
    
    if args.status:
        status = runner.get_migration_status()
        print("\nMigration Status:")
        print("=" * 60)
        for migration in status:
            status_str = "✓ Applied" if migration['applied'] else "✗ Pending"
            print(f"{migration['version']:3} | {status_str:10} | {migration['description']}")
        print("=" * 60)
    
    elif args.rollback:
        success = runner.rollback_migration(args.rollback)
        if success:
            print(f"Migration {args.rollback} rolled back successfully")
        else:
            print(f"Failed to rollback migration {args.rollback}")
            sys.exit(1)
    
    elif args.dry_run:
        print("DRY RUN: The following migrations would be applied:")
        status = runner.get_migration_status()
        pending = [m for m in status if not m['applied']]
        
        if not pending:
            print("No pending migrations")
        else:
            for migration in pending:
                print(f"  {migration['version']} - {migration['description']}")
    
    else:
        runner.run_migrations()


if __name__ == '__main__':
    main()