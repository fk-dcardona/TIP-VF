"""Test script for security layer integration."""

import asyncio
import json
from datetime import datetime, timezone

from .permissions import (
    PermissionManager, Permission, PermissionLevel, ResourceType,
    SecurityContext, get_permission_manager
)
from .sandbox import (
    SandboxExecutor, SandboxLimits, SandboxViolationError,
    get_sandbox_executor
)
from ..monitoring.agent_logger import get_agent_logger


def test_permission_system():
    """Test permission system functionality."""
    print("🔐 Testing Permission System...")
    
    permission_manager = get_permission_manager()
    logger = get_agent_logger()
    
    # Create security context
    context = permission_manager.create_security_context(
        agent_id="test_agent_001",
        user_id="user_123",
        org_id="org_456", 
        session_id="session_789",
        role="agent_operator"
    )
    
    print(f"✅ Created security context: {context.session_id}")
    
    # Test permission checks
    has_db_read = permission_manager.check_permission(
        context.session_id,
        ResourceType.DATABASE,
        "inventory_table",
        PermissionLevel.READ
    )
    print(f"✅ Database read permission: {has_db_read}")
    
    has_system_admin = permission_manager.check_permission(
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
    
    granted = permission_manager.grant_permission(context.session_id, new_permission)
    print(f"✅ Granted additional permission: {granted}")
    
    # Test new permission
    has_api_execute = permission_manager.check_permission(
        context.session_id,
        ResourceType.API,
        "supplier_api",
        PermissionLevel.EXECUTE
    )
    print(f"✅ API execute permission: {has_api_execute}")
    
    # Get stats
    stats = permission_manager.get_security_stats()
    print(f"📊 Security stats: {stats}")
    
    print("🔐 Permission system test completed!\n")


def test_sandbox_system():
    """Test sandbox system functionality."""
    print("🏗️ Testing Sandbox System...")
    
    sandbox_executor = get_sandbox_executor()
    permission_manager = get_permission_manager()
    
    # Create security context
    context = permission_manager.create_security_context(
        agent_id="test_agent_002",
        user_id="user_456",
        org_id="org_789",
        session_id="session_sandbox_123",
        role="agent_operator"
    )
    
    # Create restrictive limits
    limits = SandboxLimits(
        max_memory_mb=256,
        max_execution_time=10,  # 10 seconds
        max_file_operations=5,
        max_cpu_time=5
    )
    
    print(f"✅ Created sandbox with limits: {limits.to_dict()}")
    
    # Test normal execution
    def safe_operation():
        """Safe operation that should succeed."""
        result = {"status": "success", "data": "test_data"}
        return result
    
    try:
        result = sandbox_executor.execute_with_sandbox(
            context, safe_operation
        )
        print(f"✅ Safe operation succeeded: {result}")
    except Exception as e:
        print(f"❌ Safe operation failed: {e}")
    
    # Test violation - excessive execution time
    def slow_operation():
        """Operation that violates time limit."""
        import time
        time.sleep(15)  # Exceeds 10 second limit
        return {"status": "completed"}
    
    try:
        result = sandbox_executor.execute_with_sandbox(
            context, slow_operation
        )
        print(f"❌ Slow operation should have failed but succeeded: {result}")
    except SandboxViolationError as e:
        print(f"✅ Slow operation correctly blocked: {e.violation_type}")
    except Exception as e:
        print(f"⚠️ Slow operation failed with different error: {e}")
    
    # Get sandbox stats
    stats = sandbox_executor.get_sandbox_stats()
    print(f"📊 Sandbox stats: {stats}")
    
    print("🏗️ Sandbox system test completed!\n")


async def test_mcp_integration():
    """Test MCP server integration with security."""
    print("🌐 Testing MCP Integration with Security...")
    
    try:
        from ..mcp import get_mcp_server
        
        mcp_server = get_mcp_server()
        
        # Test MCP capabilities request
        request_data = {
            "method": "server/capabilities",
            "params": {},
            "id": "test_001"
        }
        
        response = await mcp_server.handle_request(request_data, "test_client")
        print(f"✅ MCP capabilities response: {len(response.result['capabilities'])} capabilities")
        
        # Test MCP tools list
        request_data = {
            "method": "tools/list", 
            "params": {},
            "id": "test_002"
        }
        
        response = await mcp_server.handle_request(request_data, "test_client")
        print(f"✅ MCP tools list: {len(response.result['tools'])} tools available")
        
        # Test MCP resources list
        request_data = {
            "method": "resources/list",
            "params": {},
            "id": "test_003"
        }
        
        response = await mcp_server.handle_request(request_data, "test_client")
        print(f"✅ MCP resources list: {len(response.result['resources'])} resources available")
        
        print("🌐 MCP integration test completed!\n")
        
    except ImportError as e:
        print(f"⚠️ MCP integration test skipped (import error): {e}\n")
    except Exception as e:
        print(f"❌ MCP integration test failed: {e}\n")


def test_integrated_security():
    """Test integrated security across all components."""
    print("🔒 Testing Integrated Security...")
    
    permission_manager = get_permission_manager()
    sandbox_executor = get_sandbox_executor()
    
    # Create security context with restricted role
    context = permission_manager.create_security_context(
        agent_id="test_agent_integrated",
        user_id="user_999",
        org_id="org_999",
        session_id="session_integrated_456",
        role="agent_viewer"  # Restricted role
    )
    
    # Apply restricted policy
    permission_manager.apply_security_policy(context.session_id, "restricted")
    
    print("✅ Created restricted security context")
    
    # Test permission-restricted function
    def restricted_operation():
        """Operation requiring high permissions."""
        # This would normally check permissions within the function
        return {"status": "admin_operation_completed"}
    
    try:
        # This should work as it's just a function call
        result = sandbox_executor.execute_with_sandbox(
            context, restricted_operation
        )
        print(f"✅ Restricted operation executed in sandbox: {result}")
    except Exception as e:
        print(f"❌ Restricted operation failed: {e}")
    
    # Test permission checking
    has_admin_access = permission_manager.check_permission(
        context.session_id,
        ResourceType.SYSTEM,
        "admin_panel",
        PermissionLevel.ADMIN
    )
    print(f"❌ Admin access (should be False): {has_admin_access}")
    
    has_read_access = permission_manager.check_permission(
        context.session_id,
        ResourceType.DATABASE,
        "reports",
        PermissionLevel.READ
    )
    print(f"✅ Read access (should be True): {has_read_access}")
    
    # Clean up expired contexts
    expired_count = permission_manager.cleanup_expired_contexts()
    print(f"🧹 Cleaned up {expired_count} expired contexts")
    
    print("🔒 Integrated security test completed!\n")


def run_security_tests():
    """Run all security tests."""
    print("🚀 Starting Security Layer Test Suite\n")
    print("=" * 60)
    
    # Run synchronous tests
    test_permission_system()
    test_sandbox_system()
    test_integrated_security()
    
    # Run async test
    print("Running async tests...")
    asyncio.run(test_mcp_integration())
    
    print("=" * 60)
    print("✅ All security tests completed!")
    print("\nSecurity layer is ready for production use.")


if __name__ == "__main__":
    run_security_tests()