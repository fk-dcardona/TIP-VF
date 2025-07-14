"""
Agent Execution Monitor - Real-time monitoring of agent executions
Tracks execution lifecycle, performance, and provides detailed insights.
"""

import asyncio
import threading
import time
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import uuid
from collections import defaultdict, deque
import logging

from ..agent_protocol.monitoring.agent_logger import get_agent_logger
from ..agent_protocol.monitoring.metrics_collector import get_metrics_collector


class ExecutionStatus(Enum):
    """Agent execution status."""
    QUEUED = "queued"
    STARTING = "starting"
    RUNNING = "running"
    TOOL_CALLING = "tool_calling"
    WAITING_LLM = "waiting_llm"
    COMPLETING = "completing"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


class ExecutionPriority(Enum):
    """Execution priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4
    CRITICAL = 5


@dataclass
class ExecutionContext:
    """Context information for agent execution."""
    execution_id: str
    agent_id: str
    agent_type: str
    organization_id: str
    user_id: str
    input_data: Dict[str, Any]
    priority: ExecutionPriority = ExecutionPriority.NORMAL
    timeout_seconds: int = 300
    retry_count: int = 0
    max_retries: int = 3
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecutionStep:
    """Individual step in agent execution."""
    step_id: str
    execution_id: str
    step_type: str  # initialization, tool_call, llm_request, processing, completion
    step_name: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    status: str = "running"
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    cost: float = 0.0
    tokens_used: int = 0
    confidence_score: Optional[float] = None


@dataclass
class ExecutionTrace:
    """Complete trace of agent execution."""
    context: ExecutionContext
    status: ExecutionStatus = ExecutionStatus.QUEUED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    steps: List[ExecutionStep] = field(default_factory=list)
    current_step: Optional[ExecutionStep] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    total_cost: float = 0.0
    total_tokens: int = 0
    tools_called: List[str] = field(default_factory=list)
    llm_requests: int = 0
    confidence_score: Optional[float] = None
    performance_metrics: Dict[str, Any] = field(default_factory=dict)


class AgentExecutionMonitor:
    """Real-time monitoring system for agent executions."""
    
    def __init__(self):
        """Initialize execution monitor."""
        self.logger = get_agent_logger()
        self.metrics_collector = get_metrics_collector()
        
        # Execution tracking
        self.active_executions: Dict[str, ExecutionTrace] = {}
        self.completed_executions: deque = deque(maxlen=1000)
        self.execution_queue: Dict[ExecutionPriority, deque] = {
            priority: deque() for priority in ExecutionPriority
        }
        
        # Real-time statistics
        self.stats = {
            'total_executions': 0,
            'active_executions': 0,
            'completed_today': 0,
            'failed_today': 0,
            'avg_execution_time_ms': 0.0,
            'total_cost_today': 0.0,
            'total_tokens_today': 0,
            'queue_size': 0
        }
        
        # Performance tracking
        self.performance_history = defaultdict(list)
        self.error_patterns = defaultdict(int)
        
        # Monitoring configuration
        self.monitoring_enabled = True
        self.real_time_updates = True
        self.detailed_logging = True
        
        # Event callbacks
        self.execution_callbacks: List[Callable[[ExecutionTrace], None]] = []
        self.step_callbacks: List[Callable[[ExecutionStep], None]] = []
        self.error_callbacks: List[Callable[[ExecutionTrace, str], None]] = []
        
        # Threading
        self.monitor_lock = threading.RLock()
        self.stats_thread = None
        self.cleanup_thread = None
        self.monitoring_active = False
        
        # Initialize monitoring
        self._start_monitoring()
    
    def _start_monitoring(self):
        """Start monitoring threads."""
        self.monitoring_active = True
        
        # Start statistics update thread
        self.stats_thread = threading.Thread(
            target=self._update_stats_loop,
            daemon=True
        )
        self.stats_thread.start()
        
        # Start cleanup thread
        self.cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True
        )
        self.cleanup_thread.start()
        
        self.logger.log_custom_event(
            "monitoring_started",
            "Agent execution monitoring started",
            {"component": "execution_monitor"}
        )
    
    def create_execution_context(
        self,
        agent_id: str,
        agent_type: str,
        organization_id: str,
        user_id: str,
        input_data: Dict[str, Any],
        priority: ExecutionPriority = ExecutionPriority.NORMAL,
        timeout_seconds: int = 300,
        max_retries: int = 3,
        tags: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ExecutionContext:
        """Create execution context for monitoring."""
        execution_id = f"exec_{agent_id}_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
        
        context = ExecutionContext(
            execution_id=execution_id,
            agent_id=agent_id,
            agent_type=agent_type,
            organization_id=organization_id,
            user_id=user_id,
            input_data=input_data,
            priority=priority,
            timeout_seconds=timeout_seconds,
            max_retries=max_retries,
            tags=tags or {},
            metadata=metadata or {}
        )
        
        return context
    
    def start_execution(self, context: ExecutionContext) -> ExecutionTrace:
        """Start monitoring an agent execution."""
        with self.monitor_lock:
            # Create execution trace
            trace = ExecutionTrace(
                context=context,
                status=ExecutionStatus.QUEUED,
                started_at=datetime.now(timezone.utc)
            )
            
            # Add to active executions
            self.active_executions[context.execution_id] = trace
            
            # Add to queue
            self.execution_queue[context.priority].append(context.execution_id)
            
            # Update statistics
            self.stats['total_executions'] += 1
            self.stats['active_executions'] += 1
            self.stats['queue_size'] = sum(len(q) for q in self.execution_queue.values())
            
            # Log execution start
            self.logger.log_custom_event(
                "execution_started",
                f"Agent execution started: {context.execution_id}",
                {
                    "execution_id": context.execution_id,
                    "agent_id": context.agent_id,
                    "agent_type": context.agent_type,
                    "organization_id": context.organization_id,
                    "user_id": context.user_id,
                    "priority": context.priority.name,
                    "timeout_seconds": context.timeout_seconds
                }
            )
            
            # Trigger callbacks
            for callback in self.execution_callbacks:
                try:
                    callback(trace)
                except Exception as e:
                    self.logger.log_error(
                        "Error in execution callback",
                        error=str(e),
                        error_type="callback_error"
                    )
            
            return trace
    
    def update_execution_status(
        self,
        execution_id: str,
        status: ExecutionStatus,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Update execution status."""
        with self.monitor_lock:
            if execution_id not in self.active_executions:
                return
            
            trace = self.active_executions[execution_id]
            previous_status = trace.status
            trace.status = status
            
            # Update metadata
            if metadata:
                trace.context.metadata.update(metadata)
            
            # Handle status-specific logic
            if status == ExecutionStatus.RUNNING:
                # Remove from queue
                for priority_queue in self.execution_queue.values():
                    if execution_id in priority_queue:
                        priority_queue.remove(execution_id)
                        break
                
                self.stats['queue_size'] = sum(len(q) for q in self.execution_queue.values())
            
            elif status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, 
                          ExecutionStatus.TIMEOUT, ExecutionStatus.CANCELLED]:
                # Execution finished
                trace.completed_at = datetime.now(timezone.utc)
                if trace.started_at:
                    trace.duration_ms = int((trace.completed_at - trace.started_at).total_seconds() * 1000)
                
                # Update daily statistics
                if status == ExecutionStatus.COMPLETED:
                    self.stats['completed_today'] += 1
                else:
                    self.stats['failed_today'] += 1
                
                # Move to completed executions
                self.completed_executions.append(trace)
                del self.active_executions[execution_id]
                self.stats['active_executions'] -= 1
            
            # Log status change
            self.logger.log_custom_event(
                "execution_status_changed",
                f"Execution {execution_id} status: {previous_status.value} -> {status.value}",
                {
                    "execution_id": execution_id,
                    "agent_id": trace.context.agent_id,
                    "previous_status": previous_status.value,
                    "new_status": status.value,
                    "duration_ms": trace.duration_ms
                }
            )
    
    def start_execution_step(
        self,
        execution_id: str,
        step_type: str,
        step_name: str,
        input_data: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """Start a new execution step."""
        with self.monitor_lock:
            if execution_id not in self.active_executions:
                return None
            
            trace = self.active_executions[execution_id]
            
            # Create step
            step_id = f"step_{len(trace.steps)}_{uuid.uuid4().hex[:6]}"
            step = ExecutionStep(
                step_id=step_id,
                execution_id=execution_id,
                step_type=step_type,
                step_name=step_name,
                started_at=datetime.now(timezone.utc),
                input_data=input_data,
                status="running"
            )
            
            # Complete previous step if exists
            if trace.current_step and trace.current_step.status == "running":
                self.complete_execution_step(execution_id, trace.current_step.step_id)
            
            # Add step to trace
            trace.steps.append(step)
            trace.current_step = step
            
            # Log step start
            self.logger.log_custom_event(
                "execution_step_started",
                f"Step started: {step_name}",
                {
                    "execution_id": execution_id,
                    "step_id": step_id,
                    "step_type": step_type,
                    "step_name": step_name,
                    "agent_id": trace.context.agent_id
                }
            )
            
            # Trigger callbacks
            for callback in self.step_callbacks:
                try:
                    callback(step)
                except Exception as e:
                    self.logger.log_error(
                        "Error in step callback",
                        error=str(e),
                        error_type="callback_error"
                    )
            
            return step_id
    
    def complete_execution_step(
        self,
        execution_id: str,
        step_id: str,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        cost: float = 0.0,
        tokens_used: int = 0,
        confidence_score: Optional[float] = None
    ):
        """Complete an execution step."""
        with self.monitor_lock:
            if execution_id not in self.active_executions:
                return
            
            trace = self.active_executions[execution_id]
            
            # Find step
            step = None
            for s in trace.steps:
                if s.step_id == step_id:
                    step = s
                    break
            
            if not step:
                return
            
            # Complete step
            step.completed_at = datetime.now(timezone.utc)
            step.duration_ms = int((step.completed_at - step.started_at).total_seconds() * 1000)
            step.status = "failed" if error_message else "completed"
            step.output_data = output_data
            step.error_message = error_message
            step.cost = cost
            step.tokens_used = tokens_used
            step.confidence_score = confidence_score
            
            # Update trace totals
            trace.total_cost += cost
            trace.total_tokens += tokens_used
            
            if step.step_type == "tool_call":
                tool_name = step.step_name.replace("tool_call_", "")
                if tool_name not in trace.tools_called:
                    trace.tools_called.append(tool_name)
            elif step.step_type == "llm_request":
                trace.llm_requests += 1
            
            # Update daily statistics
            self.stats['total_cost_today'] += cost
            self.stats['total_tokens_today'] += tokens_used
            
            # Log step completion
            self.logger.log_custom_event(
                "execution_step_completed",
                f"Step completed: {step.step_name}",
                {
                    "execution_id": execution_id,
                    "step_id": step_id,
                    "step_name": step.step_name,
                    "duration_ms": step.duration_ms,
                    "status": step.status,
                    "cost": cost,
                    "tokens_used": tokens_used,
                    "confidence_score": confidence_score,
                    "error": error_message
                }
            )
            
            # Handle errors
            if error_message:
                self.record_error(execution_id, error_message, step_id)
    
    def record_error(
        self,
        execution_id: str,
        error_message: str,
        step_id: Optional[str] = None
    ):
        """Record an error during execution."""
        with self.monitor_lock:
            if execution_id not in self.active_executions:
                return
            
            trace = self.active_executions[execution_id]
            
            # Update trace error
            if not trace.error:
                trace.error = error_message
            
            # Track error patterns
            error_type = self._classify_error(error_message)
            self.error_patterns[error_type] += 1
            
            # Log error
            self.logger.log_error(
                f"Execution error: {error_message}",
                error=error_message,
                error_type="execution_error",
                context={
                    "execution_id": execution_id,
                    "agent_id": trace.context.agent_id,
                    "step_id": step_id,
                    "error_type": error_type
                }
            )
            
            # Trigger error callbacks
            for callback in self.error_callbacks:
                try:
                    callback(trace, error_message)
                except Exception as e:
                    self.logger.log_error(
                        "Error in error callback",
                        error=str(e),
                        error_type="callback_error"
                    )
    
    def complete_execution(
        self,
        execution_id: str,
        result: Optional[Dict[str, Any]] = None,
        confidence_score: Optional[float] = None,
        performance_metrics: Optional[Dict[str, Any]] = None
    ):
        """Complete an execution."""
        with self.monitor_lock:
            if execution_id not in self.active_executions:
                return
            
            trace = self.active_executions[execution_id]
            
            # Complete current step if running
            if trace.current_step and trace.current_step.status == "running":
                self.complete_execution_step(execution_id, trace.current_step.step_id)
            
            # Update trace
            trace.result = result
            trace.confidence_score = confidence_score
            trace.performance_metrics = performance_metrics or {}
            
            # Determine final status
            if trace.error:
                self.update_execution_status(execution_id, ExecutionStatus.FAILED)
            else:
                self.update_execution_status(execution_id, ExecutionStatus.COMPLETED)
            
            # Record performance metrics
            self._record_performance_metrics(trace)
    
    def get_execution_trace(self, execution_id: str) -> Optional[ExecutionTrace]:
        """Get execution trace by ID."""
        with self.monitor_lock:
            # Check active executions
            if execution_id in self.active_executions:
                return self.active_executions[execution_id]
            
            # Check completed executions
            for trace in self.completed_executions:
                if trace.context.execution_id == execution_id:
                    return trace
            
            return None
    
    def get_active_executions(
        self,
        agent_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> List[ExecutionTrace]:
        """Get list of active executions."""
        with self.monitor_lock:
            executions = list(self.active_executions.values())
            
            if agent_id:
                executions = [e for e in executions if e.context.agent_id == agent_id]
            
            if organization_id:
                executions = [e for e in executions if e.context.organization_id == organization_id]
            
            return executions
    
    def get_execution_statistics(
        self,
        time_range: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """Get execution statistics."""
        with self.monitor_lock:
            stats = self.stats.copy()
            
            # Add queue information
            stats['queue_details'] = {
                priority.name.lower(): len(queue)
                for priority, queue in self.execution_queue.items()
            }
            
            # Add error patterns
            stats['error_patterns'] = dict(self.error_patterns)
            
            # Add performance history
            if time_range:
                cutoff_time = datetime.now(timezone.utc) - time_range
                recent_executions = [
                    trace for trace in self.completed_executions
                    if trace.completed_at and trace.completed_at >= cutoff_time
                ]
                
                if recent_executions:
                    total_duration = sum(trace.duration_ms or 0 for trace in recent_executions)
                    avg_duration = total_duration / len(recent_executions)
                    total_cost = sum(trace.total_cost for trace in recent_executions)
                    
                    stats['recent_stats'] = {
                        'count': len(recent_executions),
                        'avg_duration_ms': avg_duration,
                        'total_cost': total_cost,
                        'success_rate': len([t for t in recent_executions if t.status == ExecutionStatus.COMPLETED]) / len(recent_executions) * 100
                    }
            
            return stats
    
    def get_agent_performance(
        self,
        agent_id: str,
        time_range: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """Get performance metrics for specific agent."""
        cutoff_time = datetime.now(timezone.utc) - (time_range or timedelta(hours=24))
        
        # Get relevant executions
        executions = []
        
        with self.monitor_lock:
            # Check active executions
            for trace in self.active_executions.values():
                if trace.context.agent_id == agent_id:
                    executions.append(trace)
            
            # Check completed executions
            for trace in self.completed_executions:
                if (trace.context.agent_id == agent_id and
                    trace.started_at and trace.started_at >= cutoff_time):
                    executions.append(trace)
        
        if not executions:
            return {
                'agent_id': agent_id,
                'total_executions': 0,
                'active_executions': 0,
                'completed_executions': 0,
                'failed_executions': 0,
                'avg_duration_ms': 0,
                'total_cost': 0,
                'total_tokens': 0,
                'success_rate': 0
            }
        
        # Calculate metrics
        active_count = len([e for e in executions if e.status not in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]])
        completed_count = len([e for e in executions if e.status == ExecutionStatus.COMPLETED])
        failed_count = len([e for e in executions if e.status == ExecutionStatus.FAILED])
        
        completed_executions = [e for e in executions if e.duration_ms is not None]
        avg_duration = sum(e.duration_ms for e in completed_executions) / len(completed_executions) if completed_executions else 0
        
        total_cost = sum(e.total_cost for e in executions)
        total_tokens = sum(e.total_tokens for e in executions)
        
        success_rate = (completed_count / (completed_count + failed_count) * 100) if (completed_count + failed_count) > 0 else 0
        
        return {
            'agent_id': agent_id,
            'total_executions': len(executions),
            'active_executions': active_count,
            'completed_executions': completed_count,
            'failed_executions': failed_count,
            'avg_duration_ms': avg_duration,
            'total_cost': total_cost,
            'total_tokens': total_tokens,
            'success_rate': success_rate,
            'time_range_hours': time_range.total_seconds() / 3600 if time_range else 24
        }
    
    def add_execution_callback(self, callback: Callable[[ExecutionTrace], None]):
        """Add callback for execution events."""
        self.execution_callbacks.append(callback)
    
    def add_step_callback(self, callback: Callable[[ExecutionStep], None]):
        """Add callback for step events."""
        self.step_callbacks.append(callback)
    
    def add_error_callback(self, callback: Callable[[ExecutionTrace, str], None]):
        """Add callback for error events."""
        self.error_callbacks.append(callback)
    
    def _classify_error(self, error_message: str) -> str:
        """Classify error type based on message."""
        error_lower = error_message.lower()
        
        if 'timeout' in error_lower:
            return 'timeout'
        elif 'permission' in error_lower or 'unauthorized' in error_lower:
            return 'permission'
        elif 'rate limit' in error_lower or 'quota' in error_lower:
            return 'rate_limit'
        elif 'network' in error_lower or 'connection' in error_lower:
            return 'network'
        elif 'validation' in error_lower or 'invalid' in error_lower:
            return 'validation'
        elif 'llm' in error_lower or 'model' in error_lower:
            return 'llm_error'
        elif 'tool' in error_lower:
            return 'tool_error'
        else:
            return 'unknown'
    
    def _record_performance_metrics(self, trace: ExecutionTrace):
        """Record performance metrics for analysis."""
        if trace.duration_ms:
            agent_type = trace.context.agent_type
            self.performance_history[agent_type].append({
                'timestamp': trace.completed_at.isoformat(),
                'duration_ms': trace.duration_ms,
                'cost': trace.total_cost,
                'tokens': trace.total_tokens,
                'success': trace.status == ExecutionStatus.COMPLETED,
                'confidence': trace.confidence_score,
                'tools_count': len(trace.tools_called),
                'llm_requests': trace.llm_requests
            })
            
            # Keep only last 100 entries per agent type
            if len(self.performance_history[agent_type]) > 100:
                self.performance_history[agent_type] = self.performance_history[agent_type][-100:]
    
    def _update_stats_loop(self):
        """Update statistics periodically."""
        while self.monitoring_active:
            try:
                with self.monitor_lock:
                    # Update average execution time
                    recent_completed = [
                        trace for trace in self.completed_executions
                        if trace.duration_ms is not None
                    ]
                    
                    if recent_completed:
                        total_duration = sum(trace.duration_ms for trace in recent_completed[-50:])
                        self.stats['avg_execution_time_ms'] = total_duration / len(recent_completed[-50:])
                
                # Sleep for 30 seconds
                time.sleep(30)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in stats update loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(30)
    
    def _cleanup_loop(self):
        """Cleanup old data periodically."""
        while self.monitoring_active:
            try:
                # Sleep for 1 hour
                time.sleep(3600)
                
                with self.monitor_lock:
                    # Reset daily stats at midnight
                    now = datetime.now(timezone.utc)
                    if now.hour == 0 and now.minute < 5:
                        self.stats['completed_today'] = 0
                        self.stats['failed_today'] = 0
                        self.stats['total_cost_today'] = 0.0
                        self.stats['total_tokens_today'] = 0
                
            except Exception as e:
                self.logger.log_error(
                    "Error in cleanup loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
    
    def stop_monitoring(self):
        """Stop monitoring."""
        self.monitoring_active = False
        
        if self.stats_thread and self.stats_thread.is_alive():
            self.stats_thread.join(timeout=5)
        
        if self.cleanup_thread and self.cleanup_thread.is_alive():
            self.cleanup_thread.join(timeout=5)
        
        self.logger.log_custom_event(
            "monitoring_stopped",
            "Agent execution monitoring stopped",
            {"component": "execution_monitor"}
        )


# Global instance
_execution_monitor = None

def get_execution_monitor() -> AgentExecutionMonitor:
    """Get global execution monitor instance."""
    global _execution_monitor
    if _execution_monitor is None:
        _execution_monitor = AgentExecutionMonitor()
    return _execution_monitor