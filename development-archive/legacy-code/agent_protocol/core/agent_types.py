"""Agent types and status definitions."""

from enum import Enum
from typing import Dict, Any


class AgentType(Enum):
    """Supported agent types in the system."""
    INVENTORY_MONITOR = "inventory_monitor"
    SUPPLIER_EVALUATOR = "supplier_evaluator"
    DEMAND_FORECASTER = "demand_forecaster"
    DOCUMENT_ANALYZER = "document_analyzer"
    RISK_ASSESSOR = "risk_assessor"
    OPTIMIZATION_AGENT = "optimization_agent"


class AgentStatus(Enum):
    """Agent execution status."""
    IDLE = "idle"
    INITIALIZING = "initializing"
    RUNNING = "running"
    THINKING = "thinking"
    EXECUTING_TOOL = "executing_tool"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class AgentCapability(Enum):
    """Agent capabilities/permissions."""
    READ_DATABASE = "read_database"
    WRITE_DATABASE = "write_database"
    CALL_EXTERNAL_API = "call_external_api"
    EXECUTE_ANALYSIS = "execute_analysis"
    GENERATE_REPORTS = "generate_reports"
    SEND_NOTIFICATIONS = "send_notifications"
    MANAGE_WORKFLOWS = "manage_workflows"


AGENT_CAPABILITIES: Dict[AgentType, list[AgentCapability]] = {
    AgentType.INVENTORY_MONITOR: [
        AgentCapability.READ_DATABASE,
        AgentCapability.EXECUTE_ANALYSIS,
        AgentCapability.GENERATE_REPORTS,
        AgentCapability.SEND_NOTIFICATIONS
    ],
    AgentType.SUPPLIER_EVALUATOR: [
        AgentCapability.READ_DATABASE,
        AgentCapability.CALL_EXTERNAL_API,
        AgentCapability.EXECUTE_ANALYSIS,
        AgentCapability.GENERATE_REPORTS
    ],
    AgentType.DEMAND_FORECASTER: [
        AgentCapability.READ_DATABASE,
        AgentCapability.EXECUTE_ANALYSIS,
        AgentCapability.GENERATE_REPORTS,
        AgentCapability.WRITE_DATABASE
    ],
    AgentType.DOCUMENT_ANALYZER: [
        AgentCapability.READ_DATABASE,
        AgentCapability.CALL_EXTERNAL_API,
        AgentCapability.EXECUTE_ANALYSIS,
        AgentCapability.WRITE_DATABASE
    ],
    AgentType.RISK_ASSESSOR: [
        AgentCapability.READ_DATABASE,
        AgentCapability.EXECUTE_ANALYSIS,
        AgentCapability.GENERATE_REPORTS,
        AgentCapability.SEND_NOTIFICATIONS
    ],
    AgentType.OPTIMIZATION_AGENT: [
        AgentCapability.READ_DATABASE,
        AgentCapability.EXECUTE_ANALYSIS,
        AgentCapability.GENERATE_REPORTS,
        AgentCapability.MANAGE_WORKFLOWS
    ]
}