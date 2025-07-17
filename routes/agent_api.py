"""Comprehensive API endpoints for agent management with multi-tenant isolation."""

from flask import Blueprint, request, jsonify, g
from flask_cors import cross_origin
from functools import wraps
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import uuid

from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
from agent_protocol.agents.supplier_agent import SupplierEvaluatorAgent
from agent_protocol.agents.demand_agent import DemandForecasterAgent
from agent_protocol.agents.document_intelligence_agent import DocumentIntelligenceAgent
from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.monitoring.metrics_collector import get_metrics_collector
from agent_protocol.monitoring.agent_logger import get_agent_logger
from agent_protocol.security.permissions import get_permission_manager, PermissionLevel, ResourceType
from models import db, Agent as AgentModel

# Create blueprint
agent_api = Blueprint('agent_api', __name__)

# Global instances
agent_executor = AgentExecutor()
metrics_collector = get_metrics_collector()
agent_logger = get_agent_logger()
permission_manager = get_permission_manager()

# Register agent classes
from agent_protocol.core.agent_types import AgentType
agent_executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
agent_executor.register_agent_class(AgentType.SUPPLIER_EVALUATOR, SupplierEvaluatorAgent)
agent_executor.register_agent_class(AgentType.DEMAND_FORECASTER, DemandForecasterAgent)
agent_executor.register_agent_class(AgentType.DOCUMENT_INTELLIGENCE, DocumentIntelligenceAgent)


def require_auth(f):
    """Decorator to require authentication and extract user/org info."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract auth info from headers (would integrate with Clerk in production)
        auth_header = request.headers.get('Authorization', '')
        
        # For testing/demo, extract from custom headers
        g.user_id = request.headers.get('X-User-Id', 'anonymous')
        g.org_id = request.headers.get('X-Organization-Id', 'default_org')
        
        # In production, this would validate JWT and extract claims
        if not g.user_id or not g.org_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


def check_agent_permission(agent_id: str, permission_level: PermissionLevel) -> bool:
    """Check if current user has permission for agent operation."""
    session_id = f"api_session_{g.user_id}_{datetime.now().timestamp()}"
    
    # Create security context for API request
    security_context = permission_manager.create_security_context(
        agent_id=agent_id,
        user_id=g.user_id,
        org_id=g.org_id,
        session_id=session_id,
        role="agent_operator"  # Could be extracted from JWT claims
    )
    
    # Check permission for agent resource with org-specific ID
    resource_id = f"agent_{g.org_id}_{agent_id}"
    has_permission = permission_manager.check_permission(
        session_id,
        ResourceType.TOOL,
        resource_id,
        permission_level
    )
    
    return has_permission


@agent_api.route('/agents', methods=['GET'])
@require_auth
@cross_origin()
def list_agents():
    """List all agents for the organization."""
    try:
        # Query agents for this organization only
        agents = AgentModel.query.filter_by(
            org_id=g.org_id
        ).all()
        
        agent_list = []
        for agent in agents:
            # Get metrics for each agent
            metrics = metrics_collector.get_agent_metrics(agent.id)
            
            agent_data = {
                'id': agent.id,
                'name': agent.name,
                'type': agent.agent_type,
                'status': agent.status,
                'created_at': agent.created_at.isoformat(),
                'updated_at': agent.updated_at.isoformat(),
                'description': agent.description,
                'config': json.loads(agent.configuration) if agent.configuration else {},
                'metrics': {
                    'total_executions': metrics.total_executions if metrics else 0,
                    'success_rate': (
                        metrics.successful_executions / metrics.total_executions * 100
                        if metrics and metrics.total_executions > 0 else 0
                    ),
                    'avg_execution_time_ms': metrics.avg_execution_time_ms if metrics else 0
                }
            }
            agent_list.append(agent_data)
        
        return jsonify({
            'success': True,
            'agents': agent_list,
            'total': len(agent_list),
            'organization_id': g.org_id
        })
        
    except Exception as e:
        agent_logger.log_error(
            "API error listing agents",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to list agents', 'details': str(e)}), 500


@agent_api.route('/agents', methods=['POST'])
@require_auth
@cross_origin()
def create_agent():
    """Create a new agent for the organization."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'type', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate agent type
        valid_types = ['inventory', 'supplier', 'demand', 'document_intelligence']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Invalid agent type. Must be one of: {valid_types}'}), 400
        
        # Create agent ID with org prefix for isolation
        agent_id = f"{g.org_id}_{data['type']}_{uuid.uuid4().hex[:8]}"
        
        # Create database record
        agent_model = AgentModel(
            id=agent_id,
            name=data['name'],
            agent_type=data['type'],
            description=data['description'],
            org_id=g.org_id,
            user_id=g.user_id,
            configuration=json.dumps(data.get('config', {})),
            status='active'
        )
        
        db.session.add(agent_model)
        db.session.commit()
        
        # Create actual agent instance
        config = data.get('config', {})
        
        # Convert string agent type to enum
        from agent_protocol.core.agent_types import AgentType
        agent_type_enum = AgentType(data['type'])
        
        # Use the executor's create_agent method which handles registration
        agent = agent_executor.create_agent(
            agent_id=agent_id,
            agent_type=agent_type_enum,
            name=data['name'],
            description=data['description'],
            config=config
        )
        
        # Log agent creation
        agent_logger.log_custom_event(
            "agent_created",
            f"Agent {agent_id} created via API",
            {
                "agent_id": agent_id,
                "agent_type": data['type'],
                "org_id": g.org_id,
                "user_id": g.user_id
            }
        )
        
        return jsonify({
            'success': True,
            'agent': {
                'id': agent_id,
                'name': data['name'],
                'type': data['type'],
                'description': data['description'],
                'status': 'active',
                'created_at': agent_model.created_date.isoformat()
            }
        }), 201
        
    except Exception as e:
        agent_logger.log_custom_event(
            "api_error",
            f"API error creating agent: {str(e)}",
            {"error_type": "api_error", "user_id": g.user_id}
        )
        return jsonify({'error': 'Failed to create agent', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>', methods=['GET'])
@require_auth
@cross_origin()
def get_agent(agent_id: str):
    """Get details of a specific agent."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check read permission
        if not check_agent_permission(agent_id, PermissionLevel.READ):
            return jsonify({'error': 'Permission denied'}), 403
        
        # Get detailed metrics
        metrics = metrics_collector.get_agent_metrics(agent_id)
        
        # Get recent logs
        recent_logs = agent_logger.get_recent_logs(
            count=10,
            filters={'agent_id': agent_id}
        )
        
        agent_data = {
            'id': agent.id,
            'name': agent.name,
            'type': agent.agent_type,
            'status': agent.status,
            'description': agent.description,
            'config': json.loads(agent.configuration) if agent.configuration else {},
            'created_at': agent.created_at.isoformat(),
            'updated_at': agent.updated_at.isoformat(),
            'created_by': agent.created_by,
            'metrics': metrics.to_dict() if metrics else None,
            'recent_logs': [
                {
                    'timestamp': log.timestamp,
                    'level': log.level,
                    'message': log.message,
                    'event_type': log.event_type
                }
                for log in recent_logs
            ]
        }
        
        return jsonify({
            'success': True,
            'agent': agent_data
        })
        
    except Exception as e:
        agent_logger.log_custom_event(
            "api_error",
            f"API error getting agent: {str(e)}",
            {"error_type": "api_error", "user_id": g.user_id}
        )
        return jsonify({'error': 'Failed to get agent', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>', methods=['PUT'])
@require_auth
@cross_origin()
def update_agent(agent_id: str):
    """Update an agent's configuration."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check write permission
        if not check_agent_permission(agent_id, PermissionLevel.WRITE):
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            agent.name = data['name']
        if 'description' in data:
            agent.description = data['description']
        if 'config' in data:
            agent.configuration = json.dumps(data['config'])
        if 'status' in data and data['status'] in ['active', 'paused', 'disabled']:
            agent.status = data['status']
        
        agent.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Update agent instance if config changed
        if 'config' in data:
            agent_instance = agent_executor.get_agent(agent_id)
            if agent_instance:
                agent_instance.config.update(data['config'])
        
        agent_logger.log_custom_event(
            "agent_updated",
            f"Agent {agent_id} updated via API",
            {
                "agent_id": agent_id,
                "updated_fields": list(data.keys()),
                "user_id": g.user_id
            }
        )
        
        return jsonify({
            'success': True,
            'agent': {
                'id': agent.id,
                'name': agent.name,
                'status': agent.status,
                'updated_at': agent.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        agent_logger.log_custom_event(
            "api_error",
            f"API error updating agent: {str(e)}",
            {"error_type": "api_error", "user_id": g.user_id}
        )
        return jsonify({'error': 'Failed to update agent', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>', methods=['DELETE'])
@require_auth
@cross_origin()
def delete_agent(agent_id: str):
    """Delete an agent."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check admin permission for deletion
        if not check_agent_permission(agent_id, PermissionLevel.ADMIN):
            return jsonify({'error': 'Permission denied'}), 403
        
        # Remove from executor registry
        agent_executor.registry.remove_agent(agent_id)
        
        # Delete from database
        db.session.delete(agent)
        db.session.commit()
        
        agent_logger.log_custom_event(
            "agent_deleted",
            f"Agent {agent_id} deleted via API",
            {
                "agent_id": agent_id,
                "user_id": g.user_id
            }
        )
        
        return jsonify({
            'success': True,
            'message': f'Agent {agent_id} deleted successfully'
        })
        
    except Exception as e:
        agent_logger.log_custom_event(
            "api_error",
            f"API error deleting agent: {str(e)}",
            {"error_type": "api_error", "user_id": g.user_id}
        )
        return jsonify({'error': 'Failed to delete agent', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>/execute', methods=['POST'])
@require_auth
@cross_origin()
def execute_agent(agent_id: str):
    """Execute an agent with given input data."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check execute permission
        if not check_agent_permission(agent_id, PermissionLevel.EXECUTE):
            return jsonify({'error': 'Permission denied'}), 403
        
        # Check agent status
        if agent.status != 'active':
            return jsonify({'error': f'Agent is {agent.status}, cannot execute'}), 400
        
        data = request.get_json()
        input_data = data.get('input_data', {})
        
        # Execute agent asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        result = loop.run_until_complete(
            agent_executor.execute_agent(
                agent_id=agent_id,
                input_data=input_data,
                user_id=g.user_id,
                org_id=g.org_id
            )
        )
        
        if result:
            # Update last execution time
            agent.last_execution = datetime.now(timezone.utc)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'execution_id': result.execution_id,
                'response': result.response,
                'confidence': result.confidence,
                'evidence': result.evidence,
                'reasoning_steps': result.reasoning_steps,
                'execution_time_ms': result.execution_time_ms,
                'tokens_used': result.tokens_used,
                'tools_called': result.tools_called
            })
        else:
            return jsonify({
                'error': 'Agent execution failed',
                'details': 'No result returned'
            }), 500
            
    except Exception as e:
        agent_logger.log_error(
            "API error executing agent",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to execute agent', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>/metrics', methods=['GET'])
@require_auth
@cross_origin()
def get_agent_metrics(agent_id: str):
    """Get performance metrics for an agent."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check read permission
        if not check_agent_permission(agent_id, PermissionLevel.READ):
            return jsonify({'error': 'Permission denied'}), 403
        
        # Get time range from query params
        hours = int(request.args.get('hours', 24))
        
        # Get detailed metrics
        agent_metrics = metrics_collector.get_agent_metrics(agent_id)
        time_series = metrics_collector.get_metrics_time_series(
            metric_type="agent_execution",
            hours=hours,
            filters={'agent_id': agent_id}
        )
        
        # Calculate additional metrics
        if agent_metrics and agent_metrics.total_executions > 0:
            success_rate = agent_metrics.successful_executions / agent_metrics.total_executions * 100
            failure_rate = agent_metrics.failed_executions / agent_metrics.total_executions * 100
            avg_cost_per_execution = agent_metrics.total_llm_cost / agent_metrics.total_executions
        else:
            success_rate = 0
            failure_rate = 0
            avg_cost_per_execution = 0
        
        return jsonify({
            'success': True,
            'metrics': {
                'summary': agent_metrics.to_dict() if agent_metrics else None,
                'success_rate': success_rate,
                'failure_rate': failure_rate,
                'avg_cost_per_execution': avg_cost_per_execution,
                'time_series': time_series,
                'time_range_hours': hours
            }
        })
        
    except Exception as e:
        agent_logger.log_error(
            "API error getting agent metrics",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to get agent metrics', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>/config', methods=['GET'])
@require_auth
@cross_origin()
def get_agent_config(agent_id: str):
    """Get agent configuration."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check read permission
        if not check_agent_permission(agent_id, PermissionLevel.READ):
            return jsonify({'error': 'Permission denied'}), 403
        
        config = json.loads(agent.configuration) if agent.configuration else {}
        
        # Get runtime config from agent instance
        agent_instance = agent_executor.get_agent(agent_id)
        if agent_instance:
            runtime_config = {
                'capabilities': [cap.value for cap in agent_instance.capabilities],
                'tools': list(agent_instance._tools.keys()),
                'status': agent_instance.status.value,
                'total_executions': agent_instance.total_executions
            }
        else:
            runtime_config = None
        
        return jsonify({
            'success': True,
            'config': {
                'stored': config,
                'runtime': runtime_config,
                'agent_type': agent.agent_type,
                'agent_id': agent_id
            }
        })
        
    except Exception as e:
        agent_logger.log_error(
            "API error getting agent config",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to get agent config', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>/config', methods=['POST'])
@require_auth
@cross_origin()
def update_agent_config(agent_id: str):
    """Update agent configuration."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check write permission
        if not check_agent_permission(agent_id, PermissionLevel.WRITE):
            return jsonify({'error': 'Permission denied'}), 403
        
        data = request.get_json()
        new_config = data.get('config', {})
        
        # Validate config based on agent type
        if agent.agent_type == 'inventory':
            # Validate inventory-specific config
            valid_keys = ['reorder_threshold', 'safety_stock_days', 'forecast_horizon']
        elif agent.agent_type == 'supplier':
            # Validate supplier-specific config
            valid_keys = ['evaluation_weights', 'min_score_threshold', 'review_frequency']
        elif agent.agent_type == 'document_intelligence':
            # Validate document intelligence-specific config
            valid_keys = ['model_name', 'max_tokens', 'temperature']
        else:  # demand
            # Validate demand-specific config
            valid_keys = ['forecast_methods', 'seasonality_detection', 'confidence_threshold']
        
        # Update config
        current_config = json.loads(agent.configuration) if agent.configuration else {}
        current_config.update(new_config)
        agent.configuration = json.dumps(current_config)
        agent.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Update runtime agent
        agent_instance = agent_executor.get_agent(agent_id)
        if agent_instance:
            agent_instance.config.update(new_config)
        
        agent_logger.log_custom_event(
            "agent_config_updated",
            f"Agent {agent_id} configuration updated",
            {
                "agent_id": agent_id,
                "config_keys": list(new_config.keys()),
                "user_id": g.user_id
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Configuration updated successfully',
            'config': current_config
        })
        
    except Exception as e:
        agent_logger.log_error(
            "API error updating agent config",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to update agent config', 'details': str(e)}), 500


@agent_api.route('/agents/<agent_id>/logs', methods=['GET'])
@require_auth
@cross_origin()
def get_agent_logs(agent_id: str):
    """Get logs for an agent."""
    try:
        # Verify agent belongs to organization
        agent = AgentModel.query.filter_by(
            id=agent_id,
            org_id=g.org_id
        ).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Check read permission
        if not check_agent_permission(agent_id, PermissionLevel.READ):
            return jsonify({'error': 'Permission denied'}), 403
        
        # Get query parameters
        count = int(request.args.get('count', 50))
        level = request.args.get('level', 'info')
        execution_id = request.args.get('execution_id')
        
        # Build filters
        filters = {'agent_id': agent_id}
        if execution_id:
            filters['execution_id'] = execution_id
        
        # Get logs
        logs = agent_logger.get_recent_logs(
            count=count,
            filters=filters
        )
        
        # Filter by level if specified
        if level != 'all':
            logs = [log for log in logs if log.level.lower() == level.lower()]
        
        log_entries = [
            {
                'timestamp': log.timestamp,
                'level': log.level,
                'message': log.message,
                'event_type': log.event_type,
                'execution_id': log.execution_id,
                'context': log.context
            }
            for log in logs
        ]
        
        return jsonify({
            'success': True,
            'logs': log_entries,
            'count': len(log_entries),
            'filters': {
                'agent_id': agent_id,
                'level': level,
                'execution_id': execution_id
            }
        })
        
    except Exception as e:
        agent_logger.log_error(
            "API error getting agent logs",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to get agent logs', 'details': str(e)}), 500


@agent_api.route('/agents/metrics/summary', methods=['GET'])
@require_auth
@cross_origin()
def get_organization_metrics():
    """Get aggregated metrics for all agents in the organization."""
    try:
        # Get all agents for organization
        agents = AgentModel.query.filter_by(
            org_id=g.org_id
        ).all()
        
        # Aggregate metrics
        total_agents = len(agents)
        active_agents = sum(1 for a in agents if a.status == 'active')
        
        agent_metrics = []
        total_executions = 0
        total_successful = 0
        total_failed = 0
        total_cost = 0.0
        
        for agent in agents:
            metrics = metrics_collector.get_agent_metrics(agent.id)
            if metrics:
                agent_metrics.append({
                    'agent_id': agent.id,
                    'agent_name': agent.name,
                    'agent_type': agent.agent_type,
                    'metrics': metrics.to_dict()
                })
                total_executions += metrics.total_executions
                total_successful += metrics.successful_executions
                total_failed += metrics.failed_executions
                total_cost += metrics.total_llm_cost
        
        # Calculate organization-wide metrics
        overall_success_rate = (
            total_successful / total_executions * 100
            if total_executions > 0 else 0
        )
        
        return jsonify({
            'success': True,
            'organization_id': g.org_id,
            'summary': {
                'total_agents': total_agents,
                'active_agents': active_agents,
                'total_executions': total_executions,
                'successful_executions': total_successful,
                'failed_executions': total_failed,
                'overall_success_rate': overall_success_rate,
                'total_cost': total_cost,
                'avg_cost_per_execution': total_cost / total_executions if total_executions > 0 else 0
            },
            'agent_metrics': agent_metrics
        })
        
    except Exception as e:
        agent_logger.log_error(
            "API error getting organization metrics",
            error=str(e),
            error_type="api_error"
        )
        return jsonify({'error': 'Failed to get organization metrics', 'details': str(e)}), 500


# Health check endpoint
@agent_api.route('/agents/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check for agent API."""
    try:
        # Check core components
        executor_healthy = agent_executor is not None
        metrics_healthy = metrics_collector is not None
        logger_healthy = agent_logger is not None
        
        return jsonify({
            'success': True,
            'status': 'healthy',
            'components': {
                'executor': executor_healthy,
                'metrics': metrics_healthy,
                'logger': logger_healthy
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': str(e)
        }), 500