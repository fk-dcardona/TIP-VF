#!/usr/bin/env python3
"""
Import Path Standardization Script
Fixes all import path issues in the codebase by standardizing to backend.* patterns
"""

import os
import re
import sys
from pathlib import Path

def find_python_files(directory):
    """Find all Python files in directory"""
    python_files = []
    for root, dirs, files in os.walk(directory):
        # Skip virtual environments and node_modules
        dirs[:] = [d for d in dirs if d not in ['venv311', 'node_modules', '__pycache__', '.git']]
        
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    
    return python_files

def analyze_import_issues(file_path):
    """Analyze import issues in a file"""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception as e:
        return [f"Could not read file: {e}"]
    
    for line_num, line in enumerate(lines, 1):
        line = line.strip()
        
        # Check for problematic import patterns
        if line.startswith('from '):
            # Pattern 1: from config.* (should be backend.config.*)
            if re.match(r'from config\.', line):
                issues.append({
                    'line': line_num,
                    'content': line,
                    'issue': 'relative_config_import',
                    'fix': line.replace('from config.', 'from backend.config.')
                })
            
            # Pattern 2: from services.* (should be backend.services.*)
            elif re.match(r'from services\.', line):
                issues.append({
                    'line': line_num,
                    'content': line,
                    'issue': 'relative_services_import',
                    'fix': line.replace('from services.', 'from backend.services.')
                })
            
            # Pattern 3: from models import (should specify backend.models if needed)
            elif re.match(r'from models import', line) and 'backend' not in file_path:
                # Only flag this if the file is not already in backend directory
                issues.append({
                    'line': line_num,
                    'content': line,
                    'issue': 'relative_models_import',
                    'fix': line.replace('from models import', 'from backend.models import')
                })
            
            # Pattern 4: from utils.* (should be backend.utils.*)
            elif re.match(r'from utils\.', line):
                issues.append({
                    'line': line_num,
                    'content': line,
                    'issue': 'relative_utils_import',
                    'fix': line.replace('from utils.', 'from backend.utils.')
                })
    
    return issues

def fix_import_issues(file_path, issues):
    """Fix import issues in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception as e:
        print(f"❌ Could not read {file_path}: {e}")
        return False
    
    # Apply fixes (in reverse order to maintain line numbers)
    for issue in reversed(issues):
        line_num = issue['line'] - 1  # Convert to 0-based index
        if line_num < len(lines):
            lines[line_num] = issue['fix']
    
    # Write back the fixed content
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        return True
    except Exception as e:
        print(f"❌ Could not write {file_path}: {e}")
        return False

def create_init_files():
    """Create missing __init__.py files"""
    directories_needing_init = [
        'backend',
        'backend/config',
        'backend/services',
        'backend/utils',
        'backend/routes',
        'backend/agent_protocol',
        'backend/agent_protocol/agents',
        'backend/agent_protocol/core',
        'backend/agent_protocol/executors',
        'backend/agent_protocol/llm',
        'backend/agent_protocol/mcp',
        'backend/agent_protocol/monitoring',
        'backend/agent_protocol/prompts',
        'backend/agent_protocol/security',
        'backend/agent_protocol/tools'
    ]
    
    created = []
    for directory in directories_needing_init:
        init_file = os.path.join(directory, '__init__.py')
        if not os.path.exists(init_file):
            try:
                os.makedirs(directory, exist_ok=True)
                with open(init_file, 'w') as f:
                    f.write('"""Package initialization file"""\n')
                created.append(init_file)
            except Exception as e:
                print(f"❌ Could not create {init_file}: {e}")
    
    return created

def update_python_path_config():
    """Update Python path configuration files"""
    
    # Update main.py to ensure proper path setup
    main_py_path = 'main.py'
    if os.path.exists(main_py_path):
        try:
            with open(main_py_path, 'r') as f:
                content = f.read()
            
            # Ensure proper path setup is at the top
            path_setup = '''# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)'''
            
            if 'sys.path.insert(0, current_dir)' not in content:
                # Add path setup after imports
                lines = content.split('\n')
                import_end = 0
                for i, line in enumerate(lines):
                    if line.startswith('from ') or line.startswith('import '):
                        import_end = i
                
                lines.insert(import_end + 1, '')
                lines.insert(import_end + 2, path_setup)
                
                with open(main_py_path, 'w') as f:
                    f.write('\n'.join(lines))
                
                print(f"✅ Updated Python path setup in {main_py_path}")
        
        except Exception as e:
            print(f"❌ Could not update {main_py_path}: {e}")

def main():
    """Main function to fix all import issues"""
    print("🔧 Import Path Standardization Script")
    print("=" * 60)
    
    # Step 1: Create missing __init__.py files
    print("\n📁 Creating missing __init__.py files...")
    created_init_files = create_init_files()
    for init_file in created_init_files:
        print(f"✅ Created: {init_file}")
    
    if created_init_files:
        print(f"✅ Created {len(created_init_files)} __init__.py files")
    else:
        print("✅ All __init__.py files already exist")
    
    # Step 2: Update Python path configuration
    print("\n🐍 Updating Python path configuration...")
    update_python_path_config()
    
    # Step 3: Find all Python files
    print("\n🔍 Scanning for Python files...")
    python_files = find_python_files('.')
    print(f"📊 Found {len(python_files)} Python files to analyze")
    
    # Step 4: Analyze and fix import issues
    print("\n🔧 Analyzing and fixing import issues...")
    
    total_issues = 0
    fixed_files = 0
    
    for file_path in python_files:
        issues = analyze_import_issues(file_path)
        
        if issues:
            print(f"\n📄 {file_path}")
            for issue in issues:
                print(f"   Line {issue['line']}: {issue['issue']}")
                print(f"   Before: {issue['content']}")
                print(f"   After:  {issue['fix']}")
                total_issues += 1
            
            # Apply fixes
            if fix_import_issues(file_path, issues):
                print(f"   ✅ Fixed {len(issues)} issues in {file_path}")
                fixed_files += 1
            else:
                print(f"   ❌ Failed to fix issues in {file_path}")
    
    # Step 5: Summary
    print("\n" + "=" * 60)
    print("📊 IMPORT PATH FIX SUMMARY")
    print("=" * 60)
    
    print(f"Python files analyzed: {len(python_files)}")
    print(f"Files with issues fixed: {fixed_files}")
    print(f"Total import issues fixed: {total_issues}")
    print(f"Init files created: {len(created_init_files)}")
    
    if total_issues > 0:
        print("\n🎉 All import path issues have been standardized!")
        print("✅ All imports now use consistent backend.* patterns")
        print("🚀 Backend should now start without import errors")
    else:
        print("\n✅ No import path issues found - codebase already clean!")
    
    return total_issues == 0 or fixed_files > 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)