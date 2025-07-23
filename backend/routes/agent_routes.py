"""API routes for agent management and execution."""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import logging
import json
import uuid

from backend.agent_protocol.executors.agent_executor import get_global_executor
from backend.agent_protocol.agents import (
    InventoryMonitorAgent,
    SupplierEvaluatorAgent, 
    DemandForecasterAgent
)
from backend.agent_protocol.agents.document_intelligence_agent import DocumentIntelligenceAgent
from backend.agent_protocol.core.agent_types import AgentType
from backend.utils.llm_cost_tracker import get_cost_tracker
from models import db, Agent as AgentModel

# Create blueprint
agent_routes = Blueprint('agents', __name__, url_prefix='/api/agents')
logger = logging.getLogger(__name__)

# Get global executor
executor = get_global_executor()

# Register all agent classes
executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
executor.register_agent_class(AgentType.SUPPLIER_EVALUATOR, SupplierEvaluatorAgent)
executor.register_agent_class(AgentType.DEMAND_FORECASTER, DemandForecasterAgent)
executor.register_agent_class(AgentType.DOCUMENT_INTELLIGENCE, DocumentIntelligenceAgent)


@agent_routes.route('', methods=['GET'])
def list_agents():
    """List all registered agents."""
    try:
        # Get organization ID from request
        org_id = request.args.get('org_id')
        
        if org_id:
            # Get agents from database for organization
            db_agents = AgentModel.query.filter_by(org_id=org_id).all()
            agents_data = []
            
            for agent in db_agents:
                # Check if agent is registered in executor
                executor_agent = executor.get_agent(agent.id)
                
                agent_info = {
                    "id": agent.id,
                    "name": agent.name,
                    "type": agent.agent_type,
                    "description": agent.description,
                    "status": agent.status,
                    "created_at": agent.created_at.isoformat(),
                    "last_run": agent.last_run.isoformat() if agent.last_run else None,
                    "is_active": executor_agent is not None
                }
                
                # Add execution summary if agent is active
                if executor_agent:
                    agent_info["execution_summary"] = executor_agent.get_execution_summary()
                
                agents_data.append(agent_info)
        else:
            # Get all agents from executor
            agents_data = executor.list_agents()
        
        return jsonify({
            "success": True,
            "agents": agents_data,
            "count": len(agents_data)
        })
        
    except Exception as e:
        logger.error(f"Failed to list agents: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('', methods=['POST'])
def create_agent():
    """Create a new agent."""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'type', 'description', 'org_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Validate agent type
        try:
            agent_type = AgentType(data['type'])
        except ValueError:
            return jsonify({
                "success": False,
                "error": f"Invalid agent type: {data['type']}"
            }), 400
        
        # Generate agent ID
        agent_id = f"{data['org_id']}_{data['type']}_{uuid.uuid4().hex[:8]}"
        
        # Create database record
        db_agent = AgentModel(
            id=agent_id,
            org_id=data['org_id'],
            user_id=data.get('user_id'),
            name=data['name'],
            description=data['description'],
            agent_type=data['type'],
            configuration=json.dumps(data.get('configuration', {})),
            status='active'
        )
        
        db.session.add(db_agent)
        db.session.commit()
        
        # Create agent in executor
        agent = executor.create_agent(
            agent_id=db_agent.id,
            agent_type=agent_type,
            name=data['name'],
            description=data['description'],
            config=data.get('configuration', {})
        )
        
        return jsonify({
            "success": True,
            "agent": {
                "id": db_agent.id,
                "name": db_agent.name,
                "type": db_agent.agent_type,
                "status": db_agent.status,
                "created_at": db_agent.created_date.isoformat()
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create agent: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/<agent_id>', methods=['GET'])
def get_agent(agent_id):
    """Get agent details."""
    try:
        # Get from database
        db_agent = AgentModel.query.get(agent_id)
        if not db_agent:
            return jsonify({
                "success": False,
                "error": "Agent not found"
            }), 404
        
        # Get from executor if active
        executor_agent = executor.get_agent(agent_id)
        
        agent_data = {
            "id": db_agent.id,
            "name": db_agent.name,
            "type": db_agent.agent_type,
            "description": db_agent.description,
            "status": db_agent.status,
            "configuration": db_agent.configuration,
            "created_at": db_agent.created_at.isoformat(),
            "updated_at": db_agent.updated_at.isoformat(),
            "last_run": db_agent.last_run.isoformat() if db_agent.last_run else None,
            "is_active": executor_agent is not None
        }
        
        # Add execution details if active
        if executor_agent:
            agent_data["execution_summary"] = executor_agent.get_execution_summary()
        
        return jsonify({
            "success": True,
            "agent": agent_data
        })
        
    except Exception as e:
        logger.error(f"Failed to get agent: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/<agent_id>/execute', methods=['POST'])
def execute_agent(agent_id):
    """Execute a specific agent."""
    try:
        data = request.get_json()
        
        # Get agent from database
        db_agent = AgentModel.query.get(agent_id)
        if not db_agent:
            return jsonify({
                "success": False,
                "error": "Agent not found"
            }), 404
        
        # Check if agent is active
        if db_agent.status != 'active':
            return jsonify({
                "success": False,
                "error": f"Agent is {db_agent.status}"
            }), 400
        
        # Ensure agent is registered in executor
        executor_agent = executor.get_agent(agent_id)
        if not executor_agent:
            # Re-create agent in executor
            try:
                agent_type = AgentType(db_agent.agent_type)
                executor.create_agent(
                    agent_id=db_agent.id,
                    agent_type=agent_type,
                    name=db_agent.name,
                    description=db_agent.description,
                    config=db_agent.configuration
                )
            except Exception as e:
                logger.error(f"Failed to recreate agent in executor: {str(e)}")
                return jsonify({
                    "success": False,
                    "error": "Agent initialization failed"
                }), 500
        
        # Execute agent
        result = executor.execute_agent(
            agent_id=agent_id,
            input_data=data.get('input', {}),
            org_id=db_agent.org_id,
            user_id=data.get('user_id', db_agent.user_id),
            timeout=data.get('timeout', 300)  # 5 minutes default
        )
        
        # Update last run
        db_agent.last_run = datetime.utcnow()
        if not result.success:
            db_agent.status = 'error'
        db.session.commit()
        
        # Track cost if LLM was used
        if result.tokens_used > 0:
            cost_tracker = get_cost_tracker()
            # This would track actual LLM usage
        
        return jsonify({
            "success": result.success,
            "result": result.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Failed to execute agent: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/<agent_id>/status', methods=['PUT'])
def update_agent_status(agent_id):
    """Update agent status."""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['active', 'paused', 'error']:
            return jsonify({
                "success": False,
                "error": "Invalid status. Must be 'active', 'paused', or 'error'"
            }), 400
        
        # Update in database
        db_agent = AgentModel.query.get(agent_id)
        if not db_agent:
            return jsonify({
                "success": False,
                "error": "Agent not found"
            }), 404
        
        db_agent.status = new_status
        db_agent.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "success": True,
            "agent": {
                "id": db_agent.id,
                "status": db_agent.status,
                "updated_at": db_agent.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to update agent status: {str(e)}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/executions', methods=['GET'])
def get_executions():
    """Get agent execution history."""
    try:
        agent_id = request.args.get('agent_id')
        limit = int(request.args.get('limit', 100))
        
        executions = executor.get_execution_history(agent_id, limit)
        
        return jsonify({
            "success": True,
            "executions": executions,
            "count": len(executions)
        })
        
    except Exception as e:
        logger.error(f"Failed to get executions: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/executions/active', methods=['GET'])
def get_active_executions():
    """Get currently active executions."""
    try:
        agent_id = request.args.get('agent_id')
        
        active = executor.get_active_executions(agent_id)
        
        return jsonify({
            "success": True,
            "active_executions": active,
            "count": len(active)
        })
        
    except Exception as e:
        logger.error(f"Failed to get active executions: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/metrics', methods=['GET'])
def get_agent_metrics():
    """Get agent performance metrics."""
    try:
        agent_id = request.args.get('agent_id')
        
        metrics = executor.get_metrics(agent_id)
        
        # Add cost metrics if available
        cost_tracker = get_cost_tracker()
        cost_report = cost_tracker.get_agent_efficiency_report()
        
        return jsonify({
            "success": True,
            "execution_metrics": metrics,
            "cost_metrics": cost_report.get('agent_efficiency', {})
        })
        
    except Exception as e:
        logger.error(f"Failed to get metrics: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@agent_routes.route('/stats', methods=['GET'])
def get_executor_stats():
    """Get overall executor statistics."""
    try:
        stats = executor.get_stats()
        
        return jsonify({
            "success": True,
            "stats": stats
        })
        
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Register error handlers
@agent_routes.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Resource not found"
    }), 404


@agent_routes.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500