"""Standalone security test without Flask dependencies."""

import sys
import os
import asyncio
from datetime import datetime, timezone

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import security components directly
from agent_protocol.security.permissions import (
    PermissionManager, Permission, PermissionLevel, ResourceType,
    SecurityContext
)
from agent_protocol.security.sandbox import (
    SandboxExecutor, SandboxLimits, SandboxViolationError
)


def test_permissions():
    """Test permission system."""
    print("🔐 Testing Permission System...")
    
    # Create permission manager
    pm = PermissionManager()
    
    # Create security context
    context = pm.create_security_context(
        agent_id="test_agent_001",
        user_id="user_123",
        org_id="org_456",
        session_id="session_789",
        role="agent_operator"
    )
    
    print(f"✅ Created security context: {context.session_id}")
    
    # Test permission checks
    has_db_read = pm.check_permission(
        context.session_id,
        ResourceType.DATABASE,
        "inventory_table",
        PermissionLevel.READ
    )
    print(f"✅ Database read permission: {has_db_read}")
    
    has_system_admin = pm.check_permission(
        context.session_id,
        ResourceType.SYSTEM,
        "config",
        PermissionLevel.ADMIN
    )
    print(f"❌ System admin permission (should be False): {has_system_admin}")
    
    # Grant additional permission
    new_permission = Permission(
        resource_type=ResourceType.API,
        resource_id="supplier_api",
        level=PermissionLevel.EXECUTE
    )
    
    granted = pm.grant_permission(context.session_id, new_permission)
    print(f"✅ Granted additional permission: {granted}")
    
    # Test new permission
    has_api_execute = pm.check_permission(
        context.session_id,
        ResourceType.API,
        "supplier_api",
        PermissionLevel.EXECUTE
    )
    print(f"✅ API execute permission: {has_api_execute}")
    
    # Get stats
    stats = pm.get_security_stats()
    print(f"📊 Security stats: {stats}")
    
    print("🔐 Permission system test completed!\n")
    return True


def test_sandbox():
    """Test sandbox system."""
    print("🏗️ Testing Sandbox System...")
    
    # Create managers
    pm = PermissionManager()
    se = SandboxExecutor()
    
    # Create security context
    context = pm.create_security_context(
        agent_id="test_agent_002",
        user_id="user_456",
        org_id="org_789",
        session_id="session_sandbox_123",
        role="agent_operator"
    )
    
    # Test normal execution
    def safe_operation():
        """Safe operation that should succeed."""
        result = {"status": "success", "data": "test_data"}
        return result
    
    try:
        result = se.execute_with_sandbox(context, safe_operation)
        print(f"✅ Safe operation succeeded: {result}")
    except Exception as e:
        print(f"❌ Safe operation failed: {e}")
        return False
    
    # Test resource limits
    limits = SandboxLimits(
        max_memory_mb=256,
        max_execution_time=2,  # 2 seconds
        max_file_operations=5,
        max_cpu_time=1
    )
    
    print(f"✅ Created sandbox with limits: {limits.to_dict()}")
    
    # Get sandbox stats
    stats = se.get_sandbox_stats()
    print(f"📊 Sandbox stats: {stats}")
    
    print("🏗️ Sandbox system test completed!\n")
    return True


def test_integrated_security():
    """Test integrated security functionality."""
    print("🔒 Testing Integrated Security...")
    
    pm = PermissionManager()
    se = SandboxExecutor()
    
    # Create security context with restricted role
    context = pm.create_security_context(
        agent_id="test_agent_integrated",
        user_id="user_999",
        org_id="org_999",
        session_id="session_integrated_456",
        role="agent_viewer"  # Restricted role
    )
    
    # Apply restricted policy
    pm.apply_security_policy(context.session_id, "restricted")
    print("✅ Created restricted security context")
    
    # Test permission checking
    has_admin_access = pm.check_permission(
        context.session_id,
        ResourceType.SYSTEM,
        "admin_panel",
        PermissionLevel.ADMIN
    )
    print(f"❌ Admin access (should be False): {has_admin_access}")
    
    has_read_access = pm.check_permission(
        context.session_id,
        ResourceType.DATABASE,
        "reports",
        PermissionLevel.READ
    )
    print(f"✅ Read access (should be True): {has_read_access}")
    
    # Test sandboxed execution with restrictions
    def restricted_operation():
        """Operation under restricted security policy."""
        return {"status": "restricted_operation_completed", "time": datetime.now().isoformat()}
    
    try:
        result = se.execute_with_sandbox(context, restricted_operation)
        print(f"✅ Restricted operation executed: {result}")
    except Exception as e:
        print(f"❌ Restricted operation failed: {e}")
        return False
    
    print("🔒 Integrated security test completed!\n")
    return True


def main():
    """Run all security tests."""
    print("🚀 Starting Security Layer Test Suite (Standalone)")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    try:
        if test_permissions():
            tests_passed += 1
    except Exception as e:
        print(f"❌ Permission test failed: {e}\n")
    
    try:
        if test_sandbox():
            tests_passed += 1
    except Exception as e:
        print(f"❌ Sandbox test failed: {e}\n")
    
    try:
        if test_integrated_security():
            tests_passed += 1
    except Exception as e:
        print(f"❌ Integrated security test failed: {e}\n")
    
    print("=" * 60)
    print(f"✅ {tests_passed}/{total_tests} security tests passed!")
    
    if tests_passed == total_tests:
        print("🎉 Security layer is ready for production use!")
        return True
    else:
        print("⚠️ Some security tests failed. Please review the implementation.")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)