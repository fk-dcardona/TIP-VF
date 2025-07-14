"""Real-time execution monitoring and alerting system."""

import time
import threading
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from enum import Enum
import json
from collections import defaultdict, deque

from ..core.agent_types import AgentType
from .agent_logger import get_agent_logger
from .metrics_collector import get_metrics_collector


class AlertLevel(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class Alert:
    """System alert."""
    id: str
    level: AlertLevel
    title: str
    message: str
    timestamp: datetime
    agent_id: Optional[str] = None
    agent_type: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'id': self.id,
            'level': self.level.value,
            'title': self.title,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'agent_id': self.agent_id,
            'agent_type': self.agent_type,
            'metadata': self.metadata,
            'resolved': self.resolved,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


@dataclass
class ExecutionState:
    """Current execution state tracking."""
    execution_id: str
    agent_id: str
    agent_type: str
    start_time: datetime
    last_activity: datetime
    status: str  # running, completed, failed, timeout
    current_step: str = "initializing"
    progress: float = 0.0  # 0.0 to 1.0
    tokens_used: int = 0
    tool_calls: int = 0
    errors: List[str] = field(default_factory=list)
    
    @property
    def duration_ms(self) -> int:
        """Get current execution duration in milliseconds."""
        return int((datetime.now(timezone.utc) - self.start_time).total_seconds() * 1000)
    
    @property
    def is_stale(self) -> bool:
        """Check if execution is stale (no activity for 5+ minutes)."""
        return (datetime.now(timezone.utc) - self.last_activity) > timedelta(minutes=5)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'execution_id': self.execution_id,
            'agent_id': self.agent_id,
            'agent_type': self.agent_type,
            'start_time': self.start_time.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'status': self.status,
            'current_step': self.current_step,
            'progress': self.progress,
            'duration_ms': self.duration_ms,
            'tokens_used': self.tokens_used,
            'tool_calls': self.tool_calls,
            'errors': self.errors,
            'is_stale': self.is_stale
        }


class ExecutionMonitor:
    """Real-time monitoring system for agent executions."""
    
    def __init__(self):
        """Initialize execution monitor."""
        self.logger = get_agent_logger()
        self.metrics = get_metrics_collector()
        
        # Thread-safe storage
        self._lock = threading.RLock()
        
        # Active executions tracking
        self._active_executions: Dict[str, ExecutionState] = {}
        
        # Alert system
        self._alerts: List[Alert] = []
        self._alert_callbacks: List[Callable[[Alert], None]] = []
        self._alert_counter = 0
        
        # Performance thresholds
        self._thresholds = {
            'max_execution_time_ms': 300000,  # 5 minutes
            'max_tokens_per_execution': 10000,
            'max_tool_calls_per_execution': 50,
            'min_success_rate': 0.8,  # 80%
            'max_cost_per_execution': 5.0  # $5
        }
        
        # System health tracking
        self._health_status = {
            'status': 'healthy',
            'last_check': datetime.now(timezone.utc),
            'issues': []
        }
        
        # Rate limiting tracking
        self._rate_limits: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        
        # Start monitoring threads
        self._start_monitoring_threads()
    
    def _start_monitoring_threads(self):
        """Start background monitoring threads."""
        # Health check thread
        health_thread = threading.Thread(target=self._health_check_loop, daemon=True)
        health_thread.start()
        
        # Stale execution cleanup thread
        cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        cleanup_thread.start()
        
        # Alert processing thread
        alert_thread = threading.Thread(target=self._alert_processing_loop, daemon=True)
        alert_thread.start()
    
    def start_execution(self, execution_id: str, agent_id: str, agent_type: AgentType,
                       context: Dict[str, Any] = None) -> ExecutionState:
        """Start monitoring an execution."""
        state = ExecutionState(
            execution_id=execution_id,
            agent_id=agent_id,
            agent_type=agent_type.value,
            start_time=datetime.now(timezone.utc),
            last_activity=datetime.now(timezone.utc),
            status="running"
        )
        
        with self._lock:
            self._active_executions[execution_id] = state
            
            # Check for concurrent execution limits
            agent_executions = sum(1 for s in self._active_executions.values() 
                                 if s.agent_id == agent_id and s.status == "running")
            
            if agent_executions > 5:  # Max 5 concurrent executions per agent
                self._create_alert(
                    AlertLevel.WARNING,
                    "High Concurrent Executions",
                    f"Agent {agent_id} has {agent_executions} concurrent executions",
                    agent_id=agent_id,
                    metadata={"concurrent_count": agent_executions}
                )
        
        self.logger.log_custom_event(
            "execution_monitor_start",
            f"Started monitoring execution {execution_id}",
            {"agent_id": agent_id, "agent_type": agent_type.value}
        )
        
        return state
    
    def update_execution(self, execution_id: str, step: str = None, progress: float = None,
                        tokens_used: int = None, error: str = None):
        """Update execution state."""
        with self._lock:
            if execution_id not in self._active_executions:
                return
            
            state = self._active_executions[execution_id]
            state.last_activity = datetime.now(timezone.utc)
            
            if step:
                state.current_step = step
            if progress is not None:
                state.progress = max(0.0, min(1.0, progress))
            if tokens_used:
                state.tokens_used += tokens_used
            if error:
                state.errors.append(f"{datetime.now(timezone.utc).isoformat()}: {error}")
            
            # Check thresholds
            self._check_execution_thresholds(state)
    
    def record_tool_call(self, execution_id: str, tool_name: str, success: bool):
        """Record tool call in execution."""
        with self._lock:
            if execution_id not in self._active_executions:
                return
            
            state = self._active_executions[execution_id]
            state.tool_calls += 1
            state.last_activity = datetime.now(timezone.utc)
            
            if not success:
                state.errors.append(f"Tool call failed: {tool_name}")
            
            # Check tool call limits
            if state.tool_calls > self._thresholds['max_tool_calls_per_execution']:
                self._create_alert(
                    AlertLevel.WARNING,
                    "Excessive Tool Calls",
                    f"Execution {execution_id} has made {state.tool_calls} tool calls",
                    agent_id=state.agent_id,
                    metadata={"execution_id": execution_id, "tool_calls": state.tool_calls}
                )
    
    def end_execution(self, execution_id: str, success: bool, final_tokens: int = None):
        """End execution monitoring."""
        with self._lock:
            if execution_id not in self._active_executions:
                return
            
            state = self._active_executions[execution_id]
            state.status = "completed" if success else "failed"
            state.progress = 1.0
            state.last_activity = datetime.now(timezone.utc)
            
            if final_tokens:
                state.tokens_used = final_tokens
            
            # Record completion metrics
            self.metrics.record_execution_end(
                state.agent_id,
                AgentType(state.agent_type),
                execution_id,
                success,
                state.duration_ms
            )
            
            # Check for performance issues
            if not success:
                self._create_alert(
                    AlertLevel.ERROR,
                    "Execution Failed",
                    f"Execution {execution_id} failed after {state.duration_ms}ms",
                    agent_id=state.agent_id,
                    metadata={
                        "execution_id": execution_id,
                        "duration_ms": state.duration_ms,
                        "errors": state.errors
                    }
                )
            elif state.duration_ms > self._thresholds['max_execution_time_ms']:
                self._create_alert(
                    AlertLevel.WARNING,
                    "Slow Execution",
                    f"Execution {execution_id} took {state.duration_ms}ms",
                    agent_id=state.agent_id,
                    metadata={"execution_id": execution_id, "duration_ms": state.duration_ms}
                )
            
            # Move to completed executions (keep for analysis)
            # For now, just remove from active
            del self._active_executions[execution_id]
    
    def _check_execution_thresholds(self, state: ExecutionState):
        """Check if execution exceeds thresholds."""
        # Check execution time
        if state.duration_ms > self._thresholds['max_execution_time_ms']:
            self._create_alert(
                AlertLevel.WARNING,
                "Long Running Execution",
                f"Execution {state.execution_id} has been running for {state.duration_ms}ms",
                agent_id=state.agent_id,
                metadata={"execution_id": state.execution_id, "duration_ms": state.duration_ms}
            )
        
        # Check token usage
        if state.tokens_used > self._thresholds['max_tokens_per_execution']:
            self._create_alert(
                AlertLevel.WARNING,
                "High Token Usage",
                f"Execution {state.execution_id} has used {state.tokens_used} tokens",
                agent_id=state.agent_id,
                metadata={"execution_id": state.execution_id, "tokens_used": state.tokens_used}
            )
    
    def _create_alert(self, level: AlertLevel, title: str, message: str,
                     agent_id: str = None, agent_type: str = None, metadata: Dict[str, Any] = None):
        """Create and queue an alert."""
        with self._lock:
            self._alert_counter += 1
            alert = Alert(
                id=f"alert_{self._alert_counter}_{int(time.time())}",
                level=level,
                title=title,
                message=message,
                timestamp=datetime.now(timezone.utc),
                agent_id=agent_id,
                agent_type=agent_type,
                metadata=metadata or {}
            )
            
            self._alerts.append(alert)
            
            # Keep only recent alerts (last 1000)
            if len(self._alerts) > 1000:
                self._alerts = self._alerts[-1000:]
        
        # Log alert
        self.logger.log_custom_event(
            f"alert_{level.value}",
            f"Alert: {title} - {message}",
            {"alert_id": alert.id, "agent_id": agent_id}
        )
        
        # Notify callbacks
        for callback in self._alert_callbacks:
            try:
                callback(alert)
            except Exception as e:
                print(f"Alert callback error: {e}")
    
    def get_active_executions(self) -> Dict[str, ExecutionState]:
        """Get all active executions."""
        with self._lock:
            return {eid: state for eid, state in self._active_executions.items()}
    
    def get_execution_state(self, execution_id: str) -> Optional[ExecutionState]:
        """Get specific execution state."""
        with self._lock:
            return self._active_executions.get(execution_id)
    
    def get_agent_executions(self, agent_id: str) -> List[ExecutionState]:
        """Get executions for specific agent."""
        with self._lock:
            return [state for state in self._active_executions.values() 
                   if state.agent_id == agent_id]
    
    def get_recent_alerts(self, count: int = 50, level: AlertLevel = None) -> List[Alert]:
        """Get recent alerts."""
        with self._lock:
            alerts = self._alerts
            if level:
                alerts = [a for a in alerts if a.level == level]
            return alerts[-count:] if count < len(alerts) else alerts
    
    def resolve_alert(self, alert_id: str):
        """Resolve an alert."""
        with self._lock:
            for alert in self._alerts:
                if alert.id == alert_id and not alert.resolved:
                    alert.resolved = True
                    alert.resolved_at = datetime.now(timezone.utc)
                    break
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status."""
        with self._lock:
            active_count = len(self._active_executions)
            stale_count = sum(1 for state in self._active_executions.values() if state.is_stale)
            
            # Count recent alerts by level
            recent_alerts = [a for a in self._alerts 
                           if not a.resolved and 
                           (datetime.now(timezone.utc) - a.timestamp) < timedelta(hours=1)]
            
            alert_counts = {level.value: 0 for level in AlertLevel}
            for alert in recent_alerts:
                alert_counts[alert.level.value] += 1
            
            # Determine overall health
            health_status = "healthy"
            if alert_counts["critical"] > 0:
                health_status = "critical"
            elif alert_counts["error"] > 0:
                health_status = "unhealthy" 
            elif alert_counts["warning"] > 5:
                health_status = "degraded"
            
            return {
                "status": health_status,
                "last_check": datetime.now(timezone.utc).isoformat(),
                "active_executions": active_count,
                "stale_executions": stale_count,
                "recent_alerts": alert_counts,
                "unresolved_alerts": len(recent_alerts),
                "system_uptime": "monitoring_active",
                "thresholds": self._thresholds
            }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary across all agents."""
        with self._lock:
            active_executions = list(self._active_executions.values())
            
            if not active_executions:
                return {"message": "No active executions"}
            
            # Calculate aggregates
            total_executions = len(active_executions)
            avg_duration = sum(s.duration_ms for s in active_executions) / total_executions
            total_tokens = sum(s.tokens_used for s in active_executions)
            total_tool_calls = sum(s.tool_calls for s in active_executions)
            error_count = sum(len(s.errors) for s in active_executions)
            
            # Group by agent type
            by_agent_type = defaultdict(list)
            for state in active_executions:
                by_agent_type[state.agent_type].append(state)
            
            agent_type_summary = {}
            for agent_type, states in by_agent_type.items():
                agent_type_summary[agent_type] = {
                    "count": len(states),
                    "avg_duration_ms": sum(s.duration_ms for s in states) / len(states),
                    "total_tokens": sum(s.tokens_used for s in states),
                    "total_errors": sum(len(s.errors) for s in states)
                }
            
            return {
                "total_active_executions": total_executions,
                "avg_execution_duration_ms": avg_duration,
                "total_tokens_used": total_tokens,
                "total_tool_calls": total_tool_calls,
                "total_errors": error_count,
                "by_agent_type": agent_type_summary,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def add_alert_callback(self, callback: Callable[[Alert], None]):
        """Add callback for alert notifications."""
        self._alert_callbacks.append(callback)
    
    def set_threshold(self, name: str, value: Any):
        """Update performance threshold."""
        if name in self._thresholds:
            self._thresholds[name] = value
    
    def _health_check_loop(self):
        """Background health check loop."""
        while True:
            try:
                time.sleep(60)  # Check every minute
                self._perform_health_check()
            except Exception as e:
                print(f"Health check error: {e}")
    
    def _perform_health_check(self):
        """Perform comprehensive health check."""
        issues = []
        
        with self._lock:
            # Check for stale executions
            stale_executions = [s for s in self._active_executions.values() if s.is_stale]
            if stale_executions:
                issues.append(f"{len(stale_executions)} stale executions detected")
                
                for state in stale_executions:
                    self._create_alert(
                        AlertLevel.WARNING,
                        "Stale Execution",
                        f"Execution {state.execution_id} has been inactive for over 5 minutes",
                        agent_id=state.agent_id,
                        metadata={"execution_id": state.execution_id}
                    )
            
            # Check system resource usage
            if len(self._active_executions) > 50:
                issues.append(f"High number of active executions: {len(self._active_executions)}")
                self._create_alert(
                    AlertLevel.WARNING,
                    "High System Load",
                    f"System has {len(self._active_executions)} active executions",
                    metadata={"active_count": len(self._active_executions)}
                )
        
        # Update health status
        self._health_status = {
            "status": "healthy" if not issues else "degraded",
            "last_check": datetime.now(timezone.utc),
            "issues": issues
        }
    
    def _cleanup_loop(self):
        """Background cleanup loop."""
        while True:
            try:
                time.sleep(300)  # Cleanup every 5 minutes
                self._cleanup_stale_executions()
            except Exception as e:
                print(f"Cleanup error: {e}")
    
    def _cleanup_stale_executions(self):
        """Clean up very old stale executions."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
        
        with self._lock:
            stale_ids = []
            for execution_id, state in self._active_executions.items():
                if state.last_activity < cutoff_time:
                    stale_ids.append(execution_id)
            
            for execution_id in stale_ids:
                state = self._active_executions[execution_id]
                self.logger.log_custom_event(
                    "execution_cleanup",
                    f"Cleaning up stale execution {execution_id}",
                    {"agent_id": state.agent_id, "duration_ms": state.duration_ms}
                )
                del self._active_executions[execution_id]
    
    def _alert_processing_loop(self):
        """Background alert processing loop."""
        while True:
            try:
                time.sleep(30)  # Process alerts every 30 seconds
                self._process_alert_rules()
            except Exception as e:
                print(f"Alert processing error: {e}")
    
    def _process_alert_rules(self):
        """Process automated alert rules."""
        # Example: Auto-resolve old warning alerts
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        with self._lock:
            for alert in self._alerts:
                if (not alert.resolved and 
                    alert.level == AlertLevel.WARNING and 
                    alert.timestamp < cutoff_time):
                    alert.resolved = True
                    alert.resolved_at = datetime.now(timezone.utc)


# Global execution monitor instance
_execution_monitor = None

def get_execution_monitor() -> ExecutionMonitor:
    """Get global execution monitor instance."""
    global _execution_monitor
    if _execution_monitor is None:
        _execution_monitor = ExecutionMonitor()
    return _execution_monitor