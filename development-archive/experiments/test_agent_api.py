"""Test script for agent API endpoints with multi-tenant isolation demonstration."""

import requests
import json
import time
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:5000/api"

# Test organizations and users
TEST_ORGS = {
    "org_acme": {"name": "ACME Corporation", "users": ["alice@acme.com", "bob@acme.com"]},
    "org_globex": {"name": "Globex Industries", "users": ["charlie@globex.com", "diana@globex.com"]}
}


def make_request(method, endpoint, headers=None, data=None):
    """Make API request with proper headers."""
    url = f"{BASE_URL}{endpoint}"
    default_headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if headers:
        default_headers.update(headers)
    
    if method == "GET":
        response = requests.get(url, headers=default_headers)
    elif method == "POST":
        response = requests.post(url, headers=default_headers, json=data)
    elif method == "PUT":
        response = requests.put(url, headers=default_headers, json=data)
    elif method == "DELETE":
        response = requests.delete(url, headers=default_headers)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    return response


def test_health_check():
    """Test health check endpoint."""
    print("🏥 Testing Health Check...")
    response = make_request("GET", "/agents/health")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Health check passed: {data['status']}")
        print(f"   Components: {data['components']}")
    else:
        print(f"❌ Health check failed: {response.status_code}")
    print()


def test_agent_crud_operations(org_id, user_id):
    """Test CRUD operations for agents."""
    print(f"📝 Testing CRUD Operations for {org_id} / {user_id}...")
    
    headers = {
        "X-Organization-Id": org_id,
        "X-User-Id": user_id
    }
    
    # 1. Create agent
    print("1️⃣ Creating agent...")
    agent_data = {
        "name": f"Test Inventory Agent - {org_id}",
        "type": "inventory",
        "description": "Test agent for inventory monitoring",
        "config": {
            "reorder_threshold": 10,
            "safety_stock_days": 7
        }
    }
    
    response = make_request("POST", "/agents", headers=headers, data=agent_data)
    if response.status_code == 201:
        created_agent = response.json()["agent"]
        agent_id = created_agent["id"]
        print(f"✅ Agent created: {agent_id}")
    else:
        print(f"❌ Failed to create agent: {response.json()}")
        return
    
    # 2. List agents
    print("2️⃣ Listing agents...")
    response = make_request("GET", "/agents", headers=headers)
    if response.status_code == 200:
        agents = response.json()["agents"]
        print(f"✅ Found {len(agents)} agents for {org_id}")
        for agent in agents:
            print(f"   - {agent['name']} ({agent['id']})")
    else:
        print(f"❌ Failed to list agents: {response.json()}")
    
    # 3. Get specific agent
    print("3️⃣ Getting agent details...")
    response = make_request("GET", f"/agents/{agent_id}", headers=headers)
    if response.status_code == 200:
        agent = response.json()["agent"]
        print(f"✅ Agent details retrieved: {agent['name']}")
        print(f"   Status: {agent['status']}")
        print(f"   Type: {agent['type']}")
    else:
        print(f"❌ Failed to get agent: {response.json()}")
    
    # 4. Update agent
    print("4️⃣ Updating agent...")
    update_data = {
        "name": f"Updated Inventory Agent - {org_id}",
        "config": {
            "reorder_threshold": 15,
            "safety_stock_days": 10
        }
    }
    
    response = make_request("PUT", f"/agents/{agent_id}", headers=headers, data=update_data)
    if response.status_code == 200:
        print(f"✅ Agent updated successfully")
    else:
        print(f"❌ Failed to update agent: {response.json()}")
    
    # 5. Execute agent
    print("5️⃣ Executing agent...")
    execution_data = {
        "input_data": {
            "product_id": "SKU_001",
            "current_stock": 5,
            "average_daily_demand": 10
        }
    }
    
    response = make_request("POST", f"/agents/{agent_id}/execute", headers=headers, data=execution_data)
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Agent executed successfully")
        print(f"   Execution ID: {result['execution_id']}")
        print(f"   Response: {result['response'][:100]}...")
        print(f"   Confidence: {result['confidence']}")
        print(f"   Execution time: {result['execution_time_ms']}ms")
    else:
        print(f"❌ Failed to execute agent: {response.json()}")
    
    # Wait for metrics to be recorded
    time.sleep(1)
    
    # 6. Get agent metrics
    print("6️⃣ Getting agent metrics...")
    response = make_request("GET", f"/agents/{agent_id}/metrics", headers=headers)
    if response.status_code == 200:
        metrics = response.json()["metrics"]
        print(f"✅ Agent metrics retrieved")
        if metrics["summary"]:
            print(f"   Total executions: {metrics['summary']['total_executions']}")
            print(f"   Success rate: {metrics['success_rate']:.1f}%")
            print(f"   Avg cost: ${metrics['avg_cost_per_execution']:.4f}")
    else:
        print(f"❌ Failed to get metrics: {response.json()}")
    
    # 7. Get agent logs
    print("7️⃣ Getting agent logs...")
    response = make_request("GET", f"/agents/{agent_id}/logs?count=5", headers=headers)
    if response.status_code == 200:
        logs = response.json()["logs"]
        print(f"✅ Retrieved {len(logs)} log entries")
        for log in logs[:3]:  # Show first 3
            print(f"   [{log['level']}] {log['message'][:60]}...")
    else:
        print(f"❌ Failed to get logs: {response.json()}")
    
    print()
    return agent_id


def test_multi_tenant_isolation():
    """Test multi-tenant isolation between organizations."""
    print("🔒 Testing Multi-Tenant Isolation...")
    
    # Create agents for each organization
    created_agents = {}
    
    for org_id, org_info in TEST_ORGS.items():
        user_id = org_info["users"][0]
        print(f"\n📁 Organization: {org_info['name']}")
        agent_id = test_agent_crud_operations(org_id, user_id)
        if agent_id:
            created_agents[org_id] = agent_id
    
    # Test cross-organization access (should fail)
    print("\n🚫 Testing Cross-Organization Access (Should Fail)...")
    
    # Try to access ACME's agent from Globex user
    if "org_acme" in created_agents and "org_globex" in TEST_ORGS:
        acme_agent_id = created_agents["org_acme"]
        globex_user = TEST_ORGS["org_globex"]["users"][0]
        
        headers = {
            "X-Organization-Id": "org_globex",
            "X-User-Id": globex_user
        }
        
        print(f"Attempting to access ACME agent from Globex user...")
        response = make_request("GET", f"/agents/{acme_agent_id}", headers=headers)
        
        if response.status_code == 404:
            print("✅ Access correctly denied (404 - Agent not found)")
        elif response.status_code == 403:
            print("✅ Access correctly denied (403 - Permission denied)")
        else:
            print(f"❌ SECURITY ISSUE: Access was allowed! Status: {response.status_code}")
            print(f"   Response: {response.json()}")
    
    # Test organization metrics isolation
    print("\n📊 Testing Organization Metrics Isolation...")
    
    for org_id, org_info in TEST_ORGS.items():
        headers = {
            "X-Organization-Id": org_id,
            "X-User-Id": org_info["users"][0]
        }
        
        response = make_request("GET", "/agents/metrics/summary", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {org_info['name']} metrics:")
            print(f"   Total agents: {data['summary']['total_agents']}")
            print(f"   Active agents: {data['summary']['active_agents']}")
            print(f"   Organization ID confirmed: {data['organization_id']}")
        else:
            print(f"❌ Failed to get metrics for {org_id}")


def test_permission_levels():
    """Test different permission levels."""
    print("\n🔑 Testing Permission Levels...")
    
    org_id = "org_test_perms"
    
    # Test with different roles (simulated by headers)
    roles = ["viewer", "operator", "admin"]
    
    for role in roles:
        print(f"\n👤 Testing with role: {role}")
        user_id = f"test_{role}@example.com"
        
        headers = {
            "X-Organization-Id": org_id,
            "X-User-Id": user_id,
            "X-User-Role": role  # In production, this would come from JWT
        }
        
        # Try to create an agent (should only work for operator/admin)
        agent_data = {
            "name": f"Test Agent - {role}",
            "type": "demand",
            "description": f"Testing {role} permissions"
        }
        
        response = make_request("POST", "/agents", headers=headers, data=agent_data)
        if response.status_code == 201:
            print(f"✅ {role} can create agents")
            agent_id = response.json()["agent"]["id"]
            
            # Try to delete (should only work for admin)
            response = make_request("DELETE", f"/agents/{agent_id}", headers=headers)
            if response.status_code == 200:
                print(f"✅ {role} can delete agents")
            else:
                print(f"❌ {role} cannot delete agents (expected for non-admin)")
        else:
            print(f"❌ {role} cannot create agents")


def run_all_tests():
    """Run all API tests."""
    print("🚀 Starting Agent API Test Suite")
    print("=" * 60)
    print(f"API Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Run tests
    test_health_check()
    test_multi_tenant_isolation()
    test_permission_levels()
    
    print("\n" + "=" * 60)
    print("✅ Agent API Test Suite Completed!")
    print("=" * 60)


if __name__ == "__main__":
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("❌ Backend server is not running. Start it with: python main.py")
            exit(1)
    except requests.ConnectionError:
        print("❌ Cannot connect to backend server. Start it with: python main.py")
        exit(1)
    
    # Run tests
    run_all_tests()