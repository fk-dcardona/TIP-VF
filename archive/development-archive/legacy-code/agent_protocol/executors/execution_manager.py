"""Execution management for tracking and controlling agent executions."""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import threading
import time
import logging
from collections import defaultdict
import json

from ..core.agent_context import AgentContext
from ..core.agent_result import AgentResult
from ..core.agent_types import AgentStatus


class ExecutionManager:
    """Manages agent execution history, metrics, and control."""
    
    def __init__(self, max_history: int = 1000):
        """Initialize execution manager."""
        self.max_history = max_history
        self._executions: Dict[str, Dict[str, Any]] = {}
        self._active_executions: Dict[str, Dict[str, Any]] = {}
        self._execution_history: List[Dict[str, Any]] = []
        self._metrics: Dict[str, Any] = defaultdict(lambda: {
            "total": 0,
            "successful": 0,
            "failed": 0,
            "total_duration_ms": 0,
            "avg_duration_ms": 0
        })
        self._lock = threading.RLock()
        self.logger = logging.getLogger("ExecutionManager")
    
    def start_execution(self, execution_id: str, agent_id: str, 
                       agent_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Record the start of an agent execution."""
        with self._lock:
            execution_record = {
                "execution_id": execution_id,
                "agent_id": agent_id,
                "agent_type": agent_type,
                "status": AgentStatus.INITIALIZING.value,
                "started_at": datetime.utcnow(),
                "input_data": input_data,
                "pid": threading.get_ident()
            }
            
            self._active_executions[execution_id] = execution_record
            self._executions[execution_id] = execution_record.copy()
            
            self.logger.info(f"Started execution: {execution_id} for agent {agent_id}")
            return execution_record
    
    def update_execution_status(self, execution_id: str, status: AgentStatus, 
                               metadata: Optional[Dict[str, Any]] = None):
        """Update the status of an active execution."""
        with self._lock:
            if execution_id in self._active_executions:
                self._active_executions[execution_id]["status"] = status.value
                self._active_executions[execution_id]["last_updated"] = datetime.utcnow()
                
                if metadata:
                    self._active_executions[execution_id].update(metadata)
                
                # Update main record
                self._executions[execution_id] = self._active_executions[execution_id].copy()
                
                self.logger.debug(f"Updated execution {execution_id} status to {status.value}")
    
    def complete_execution(self, execution_id: str, result: AgentResult, 
                          context: Optional[AgentContext] = None):
        """Mark an execution as complete and record results."""
        with self._lock:
            if execution_id not in self._active_executions:
                self.logger.warning(f"Execution {execution_id} not found in active executions")
                return
            
            execution = self._active_executions[execution_id]
            execution["completed_at"] = datetime.utcnow()
            execution["duration_ms"] = int(
                (execution["completed_at"] - execution["started_at"]).total_seconds() * 1000
            )
            execution["status"] = AgentStatus.COMPLETED.value if result.success else AgentStatus.FAILED.value
            execution["success"] = result.success
            execution["result"] = result.to_dict()
            
            if context:
                execution["context"] = context.to_dict()
            
            # Update metrics
            agent_id = execution["agent_id"]
            self._update_metrics(agent_id, execution)
            
            # Move to history
            self._execution_history.append(execution)
            if len(self._execution_history) > self.max_history:
                self._execution_history.pop(0)
            
            # Update main record and remove from active
            self._executions[execution_id] = execution
            del self._active_executions[execution_id]
            
            self.logger.info(
                f"Completed execution: {execution_id} - "
                f"Success: {result.success}, Duration: {execution['duration_ms']}ms"
            )
    
    def cancel_execution(self, execution_id: str, reason: str = "User cancelled"):
        """Cancel an active execution."""
        with self._lock:
            if execution_id in self._active_executions:
                execution = self._active_executions[execution_id]
                execution["status"] = AgentStatus.CANCELLED.value
                execution["cancelled_at"] = datetime.utcnow()
                execution["cancel_reason"] = reason
                
                # Move to history
                self._execution_history.append(execution)
                del self._active_executions[execution_id]
                
                self.logger.info(f"Cancelled execution: {execution_id} - Reason: {reason}")
                return True
            return False
    
    def get_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get execution details by ID."""
        with self._lock:
            return self._executions.get(execution_id)
    
    def get_active_executions(self, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get list of active executions."""
        with self._lock:
            executions = list(self._active_executions.values())
            if agent_id:
                executions = [e for e in executions if e["agent_id"] == agent_id]
            return executions
    
    def get_execution_history(self, agent_id: Optional[str] = None, 
                             limit: int = 100) -> List[Dict[str, Any]]:
        """Get execution history."""
        with self._lock:
            history = self._execution_history[-limit:]
            if agent_id:
                history = [e for e in history if e["agent_id"] == agent_id]
            return history
    
    def get_metrics(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """Get execution metrics."""
        with self._lock:
            if agent_id:
                return dict(self._metrics.get(agent_id, {}))
            return dict(self._metrics)
    
    def _update_metrics(self, agent_id: str, execution: Dict[str, Any]):
        """Update metrics for an agent."""
        metrics = self._metrics[agent_id]
        metrics["total"] += 1
        
        if execution.get("success"):
            metrics["successful"] += 1
        else:
            metrics["failed"] += 1
        
        duration = execution.get("duration_ms", 0)
        metrics["total_duration_ms"] += duration
        metrics["avg_duration_ms"] = metrics["total_duration_ms"] / metrics["total"]
        
        # Calculate success rate
        metrics["success_rate"] = (
            metrics["successful"] / metrics["total"] * 100 
            if metrics["total"] > 0 else 0
        )
    
    def cleanup_old_executions(self, days: int = 7):
        """Clean up executions older than specified days."""
        with self._lock:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Clean up completed executions
            old_execution_ids = [
                exec_id for exec_id, execution in self._executions.items()
                if execution.get("completed_at") and execution["completed_at"] < cutoff_date
            ]
            
            for exec_id in old_execution_ids:
                del self._executions[exec_id]
            
            # Clean up history
            self._execution_history = [
                e for e in self._execution_history
                if not (e.get("completed_at") and e["completed_at"] < cutoff_date)
            ]
            
            self.logger.info(f"Cleaned up {len(old_execution_ids)} old executions")
            return len(old_execution_ids)
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """Get overall execution statistics."""
        with self._lock:
            total_executions = sum(m["total"] for m in self._metrics.values())
            total_successful = sum(m["successful"] for m in self._metrics.values())
            total_failed = sum(m["failed"] for m in self._metrics.values())
            
            return {
                "total_executions": total_executions,
                "total_successful": total_successful,
                "total_failed": total_failed,
                "overall_success_rate": (
                    total_successful / total_executions * 100 
                    if total_executions > 0 else 0
                ),
                "active_executions": len(self._active_executions),
                "agents_with_executions": len(self._metrics),
                "history_size": len(self._execution_history)
            }