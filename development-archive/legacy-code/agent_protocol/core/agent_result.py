"""Agent execution result structure."""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
from datetime import datetime


@dataclass
class AgentResult:
    """Result of agent execution with evidence-based approach."""
    
    # Core result data
    success: bool
    message: str
    data: Dict[str, Any] = field(default_factory=dict)
    
    # Evidence and reasoning (SuperClaude requirement)
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    reasoning: List[str] = field(default_factory=list)
    confidence: float = 1.0
    
    # Actions and recommendations
    actions: List[Dict[str, Any]] = field(default_factory=list)
    recommendations: List[Dict[str, Any]] = field(default_factory=list)
    
    # Metrics and insights
    metrics: Dict[str, Any] = field(default_factory=dict)
    insights: List[Dict[str, Any]] = field(default_factory=list)
    
    # Execution metadata
    execution_time_ms: int = 0
    tokens_used: int = 0
    tools_called: List[str] = field(default_factory=list)
    
    # Error handling
    error_type: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    warnings: List[str] = field(default_factory=list)
    
    # Traceability
    execution_id: Optional[str] = None
    agent_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def add_action(self, action_type: str, description: str, 
                   priority: str = "medium", metadata: Optional[Dict[str, Any]] = None):
        """Add an action item to the result."""
        self.actions.append({
            "type": action_type,
            "description": description,
            "priority": priority,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        })
    
    def add_recommendation(self, title: str, description: str, 
                          impact: str = "medium", metadata: Optional[Dict[str, Any]] = None):
        """Add a recommendation to the result."""
        self.recommendations.append({
            "title": title,
            "description": description,
            "impact": impact,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat()
        })
    
    def add_insight(self, category: str, insight: str, 
                    severity: str = "info", data: Optional[Dict[str, Any]] = None):
        """Add an insight to the result."""
        self.insights.append({
            "category": category,
            "insight": insight,
            "severity": severity,
            "data": data or {},
            "created_at": datetime.utcnow().isoformat()
        })
    
    def set_error(self, error_type: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Set error information."""
        self.success = False
        self.error_type = error_type
        self.message = message
        self.error_details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for API response."""
        result = {
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "confidence": self.confidence,
            "timestamp": self.timestamp.isoformat()
        }
        
        # Add optional fields if they have values
        if self.evidence:
            result["evidence"] = self.evidence
        if self.reasoning:
            result["reasoning"] = self.reasoning
        if self.actions:
            result["actions"] = self.actions
        if self.recommendations:
            result["recommendations"] = self.recommendations
        if self.metrics:
            result["metrics"] = self.metrics
        if self.insights:
            result["insights"] = self.insights
        if self.warnings:
            result["warnings"] = self.warnings
        if self.error_type:
            result["error"] = {
                "type": self.error_type,
                "details": self.error_details
            }
        
        # Add execution metadata
        result["_metadata"] = {
            "execution_id": self.execution_id,
            "agent_id": self.agent_id,
            "execution_time_ms": self.execution_time_ms,
            "tokens_used": self.tokens_used,
            "tools_called": self.tools_called
        }
        
        return result