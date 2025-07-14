"""Agent execution context management."""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid


@dataclass
class AgentContext:
    """Context for agent execution with evidence tracking."""
    
    # Identification
    execution_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: Optional[str] = None
    agent_type: Optional[str] = None
    org_id: Optional[str] = None
    user_id: Optional[str] = None
    
    # Execution metadata
    started_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    # Input/Output
    input_data: Dict[str, Any] = field(default_factory=dict)
    output_data: Dict[str, Any] = field(default_factory=dict)
    
    # Evidence tracking (SuperClaude requirement)
    evidence: List[Dict[str, Any]] = field(default_factory=list)
    reasoning_steps: List[str] = field(default_factory=list)
    confidence_scores: Dict[str, float] = field(default_factory=dict)
    
    # Tool usage tracking
    tools_used: List[Dict[str, Any]] = field(default_factory=list)
    tool_call_count: int = 0
    
    # Performance metrics
    tokens_used: int = 0
    execution_time_ms: int = 0
    
    # Error tracking
    errors: List[Dict[str, Any]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    # State management
    current_state: str = "initialized"
    state_history: List[Dict[str, Any]] = field(default_factory=list)
    
    # Memory/conversation
    conversation_history: List[Dict[str, Any]] = field(default_factory=list)
    working_memory: Dict[str, Any] = field(default_factory=dict)
    
    def add_evidence(self, source: str, data: Any, confidence: float = 1.0):
        """Add evidence to the context."""
        self.evidence.append({
            "timestamp": datetime.utcnow().isoformat(),
            "source": source,
            "data": data,
            "confidence": confidence
        })
    
    def add_reasoning_step(self, step: str):
        """Add a reasoning step."""
        self.reasoning_steps.append(f"[{len(self.reasoning_steps) + 1}] {step}")
    
    def track_tool_usage(self, tool_name: str, input_data: Any, output_data: Any, duration_ms: int):
        """Track tool usage for analysis."""
        self.tools_used.append({
            "tool": tool_name,
            "timestamp": datetime.utcnow().isoformat(),
            "input": input_data,
            "output": output_data,
            "duration_ms": duration_ms
        })
        self.tool_call_count += 1
    
    def update_state(self, new_state: str, metadata: Optional[Dict[str, Any]] = None):
        """Update execution state with history tracking."""
        self.state_history.append({
            "from_state": self.current_state,
            "to_state": new_state,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        })
        self.current_state = new_state
    
    def add_error(self, error_type: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Add error to context."""
        self.errors.append({
            "type": error_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        })
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary for serialization."""
        return {
            "execution_id": self.execution_id,
            "agent_id": self.agent_id,
            "agent_type": self.agent_type,
            "org_id": self.org_id,
            "user_id": self.user_id,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "evidence": self.evidence,
            "reasoning_steps": self.reasoning_steps,
            "confidence_scores": self.confidence_scores,
            "tools_used": self.tools_used,
            "tool_call_count": self.tool_call_count,
            "tokens_used": self.tokens_used,
            "execution_time_ms": self.execution_time_ms,
            "errors": self.errors,
            "warnings": self.warnings,
            "current_state": self.current_state,
            "state_history": self.state_history
        }