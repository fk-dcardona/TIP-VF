# Agent API Documentation

## Overview

The Agent API provides comprehensive endpoints for managing AI agents with built-in multi-tenant isolation, role-based access control, and detailed monitoring capabilities.

## Authentication

All endpoints (except health check) require authentication headers:

```http
X-Organization-Id: <org_id>
X-User-Id: <user_id>
Authorization: Bearer <jwt_token> (production)
```

## Multi-Tenant Isolation Evidence

### 1. Organization-Scoped Data Access

All agent data is strictly isolated by organization:

```python
# Database query example
agents = AgentModel.query.filter_by(
    organization_id=g.org_id  # Only returns agents for authenticated org
).all()
```

### 2. Permission System with Org-Scoped Resources

Permissions are automatically scoped to the organization:

```python
# Permission template
Permission(ResourceType.DATABASE, "{{org_id}}_*", PermissionLevel.READ)

# Becomes at runtime for org_acme:
Permission(ResourceType.DATABASE, "org_acme_*", PermissionLevel.READ)
```

### 3. Agent ID Namespacing

Agent IDs include organization prefix for additional isolation:

```python
agent_id = f"{g.org_id}_{data['type']}_{uuid.uuid4().hex[:8]}"
# Example: org_acme_inventory_a3f2b1c8
```

## API Endpoints

### 1. Agent CRUD Operations

#### List Agents
```http
GET /api/agents
Headers: X-Organization-Id, X-User-Id

Response:
{
  "success": true,
  "agents": [
    {
      "id": "org_acme_inventory_a3f2b1c8",
      "name": "Inventory Monitor",
      "type": "inventory",
      "status": "active",
      "metrics": {
        "total_executions": 10,
        "success_rate": 90.0
      }
    }
  ],
  "total": 1,
  "organization_id": "org_acme"
}
```

#### Create Agent
```http
POST /api/agents
Headers: X-Organization-Id, X-User-Id
Body:
{
  "name": "Demand Forecaster",
  "type": "demand",
  "description": "Forecasts product demand",
  "config": {
    "forecast_horizon": 30,
    "confidence_threshold": 0.85
  }
}

Response:
{
  "success": true,
  "agent": {
    "id": "org_acme_demand_b4c3d2e1",
    "name": "Demand Forecaster",
    "status": "active"
  }
}
```

#### Get Agent Details
```http
GET /api/agents/<agent_id>
Headers: X-Organization-Id, X-User-Id

Response:
{
  "success": true,
  "agent": {
    "id": "org_acme_inventory_a3f2b1c8",
    "name": "Inventory Monitor",
    "type": "inventory",
    "config": {...},
    "metrics": {...},
    "recent_logs": [...]
  }
}
```

#### Update Agent
```http
PUT /api/agents/<agent_id>
Headers: X-Organization-Id, X-User-Id
Body:
{
  "name": "Updated Name",
  "config": {
    "new_setting": "value"
  }
}
```

#### Delete Agent
```http
DELETE /api/agents/<agent_id>
Headers: X-Organization-Id, X-User-Id
```

### 2. Agent Execution

#### Execute Agent
```http
POST /api/agents/<agent_id>/execute
Headers: X-Organization-Id, X-User-Id
Body:
{
  "input_data": {
    "product_id": "SKU_001",
    "current_stock": 5
  }
}

Response:
{
  "success": true,
  "execution_id": "exec_org_acme_inventory_a3f2b1c8_1234567890",
  "response": "Based on analysis, immediate reorder recommended...",
  "confidence": 0.92,
  "evidence": [
    {
      "type": "stock_level",
      "value": 5,
      "threshold": 10
    }
  ],
  "reasoning_steps": [...],
  "execution_time_ms": 1250,
  "tokens_used": 450
}
```

### 3. Performance Metrics

#### Get Agent Metrics
```http
GET /api/agents/<agent_id>/metrics?hours=24
Headers: X-Organization-Id, X-User-Id

Response:
{
  "success": true,
  "metrics": {
    "summary": {
      "total_executions": 50,
      "successful_executions": 47,
      "failed_executions": 3,
      "avg_execution_time_ms": 1100
    },
    "success_rate": 94.0,
    "avg_cost_per_execution": 0.025,
    "time_series": [...]
  }
}
```

#### Get Organization Metrics Summary
```http
GET /api/agents/metrics/summary
Headers: X-Organization-Id, X-User-Id

Response:
{
  "success": true,
  "organization_id": "org_acme",
  "summary": {
    "total_agents": 3,
    "active_agents": 3,
    "total_executions": 150,
    "overall_success_rate": 92.5,
    "total_cost": 3.75
  }
}
```

### 4. Configuration Management

#### Get Agent Configuration
```http
GET /api/agents/<agent_id>/config
Headers: X-Organization-Id, X-User-Id

Response:
{
  "success": true,
  "config": {
    "stored": {
      "reorder_threshold": 10,
      "safety_stock_days": 7
    },
    "runtime": {
      "capabilities": ["ANALYZE_DATA", "GENERATE_REPORT"],
      "tools": ["database_query", "data_analysis"],
      "status": "running"
    }
  }
}
```

#### Update Agent Configuration
```http
POST /api/agents/<agent_id>/config
Headers: X-Organization-Id, X-User-Id
Body:
{
  "config": {
    "reorder_threshold": 15,
    "enable_alerts": true
  }
}
```

### 5. Logs and Debugging

#### Get Agent Logs
```http
GET /api/agents/<agent_id>/logs?count=50&level=error&execution_id=exec_123
Headers: X-Organization-Id, X-User-Id

Response:
{
  "success": true,
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:45Z",
      "level": "ERROR",
      "message": "Failed to connect to supplier API",
      "event_type": "api_error",
      "execution_id": "exec_123",
      "context": {...}
    }
  ],
  "count": 1
}
```

### 6. Health Check

#### System Health
```http
GET /api/agents/health

Response:
{
  "success": true,
  "status": "healthy",
  "components": {
    "executor": true,
    "metrics": true,
    "logger": true
  },
  "timestamp": "2024-01-15T10:30:45Z"
}
```

## Security Patterns

### Role-Based Access Control

1. **Viewer**: Read-only access to agents and metrics
2. **Operator**: Can create, update, and execute agents
3. **Admin**: Full access including deletion

### Permission Checking Example

```python
def check_agent_permission(agent_id: str, permission_level: PermissionLevel) -> bool:
    # Creates org-scoped resource ID
    resource_id = f"agent_{g.org_id}_{agent_id}"
    
    # Checks against user's org-scoped permissions
    has_permission = permission_manager.check_permission(
        session_id,
        ResourceType.TOOL,
        resource_id,
        permission_level
    )
```

### Evidence of Isolation

1. **Database Queries**: All queries filter by `organization_id`
2. **Permission Scoping**: Resources prefixed with org_id
3. **ID Namespacing**: Agent IDs include org prefix
4. **API Response Filtering**: Only org-specific data returned
5. **Cross-Org Access**: Returns 404 (not 403) to prevent information leakage

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Production deployment should include:
- 100 requests/minute per organization
- 10 concurrent executions per organization
- 1000 API calls/hour per user

## Best Practices

1. **Always include organization headers** for proper isolation
2. **Use appropriate permission levels** for operations
3. **Monitor execution metrics** for cost optimization
4. **Implement retry logic** for transient failures
5. **Cache agent configurations** to reduce API calls