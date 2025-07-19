"""Enhanced logging infrastructure for agent operations."""

import os
import json
import logging
import logging.handlers
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from pathlib import Path
import threading
from contextlib import contextmanager

from ..core.agent_types import AgentType


@dataclass
class LogEntry:
    """Structured log entry for agent operations."""
    timestamp: str
    level: str
    agent_id: str
    agent_type: str
    event_type: str
    message: str
    context: Dict[str, Any]
    execution_id: Optional[str] = None
    user_id: Optional[str] = None
    org_id: Optional[str] = None
    duration_ms: Optional[int] = None
    error_type: Optional[str] = None
    stack_trace: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), default=str)


class AgentLogger:
    """Advanced logging system for agent operations."""
    
    def __init__(self, log_level: str = "INFO", log_dir: str = "logs"):
        """Initialize agent logger."""
        self.log_level = getattr(logging, log_level.upper())
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Thread-local storage for execution context
        self._local = threading.local()
        
        # Setup loggers
        self._setup_loggers()
        
        # Structured log buffer for real-time monitoring
        self._log_buffer: List[LogEntry] = []
        self._buffer_lock = threading.Lock()
        self._max_buffer_size = 1000
    
    def _setup_loggers(self):
        """Setup different loggers for different purposes."""
        # Main agent logger
        self.agent_logger = logging.getLogger("agent_protocol")
        self.agent_logger.setLevel(self.log_level)
        self.agent_logger.handlers.clear()
        
        # Console handler with structured format
        console_handler = logging.StreamHandler()
        console_handler.setLevel(self.log_level)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        self.agent_logger.addHandler(console_handler)
        
        # File handler for general logs
        file_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / "agent_operations.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(self.log_level)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        self.agent_logger.addHandler(file_handler)
        
        # Structured JSON logger for analytics
        self.json_logger = logging.getLogger("agent_analytics")
        self.json_logger.setLevel(logging.INFO)
        self.json_logger.handlers.clear()
        json_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / "agent_analytics.jsonl",
            maxBytes=50*1024*1024,  # 50MB
            backupCount=10
        )
        json_handler.setLevel(logging.INFO)
        self.json_logger.addHandler(json_handler)
        
        # Error logger
        self.error_logger = logging.getLogger("agent_errors")
        self.error_logger.setLevel(logging.ERROR)
        self.error_logger.handlers.clear()
        error_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / "agent_errors.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=10
        )
        error_handler.setLevel(logging.ERROR)
        error_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s\\n%(exc_info)s'
        )
        error_handler.setFormatter(error_formatter)
        self.error_logger.addHandler(error_handler)
    
    @contextmanager
    def execution_context(self, agent_id: str, agent_type: AgentType, 
                         execution_id: str, user_id: str = None, org_id: str = None):
        """Context manager for execution logging."""
        # Store context in thread-local storage
        self._local.agent_id = agent_id
        self._local.agent_type = agent_type.value
        self._local.execution_id = execution_id
        self._local.user_id = user_id
        self._local.org_id = org_id
        self._local.start_time = datetime.now(timezone.utc)
        
        try:
            self.log_execution_start()
            yield
            self.log_execution_success()
        except Exception as e:
            self.log_execution_error(e)
            raise
        finally:
            # Clear context
            for attr in ['agent_id', 'agent_type', 'execution_id', 'user_id', 'org_id', 'start_time']:
                if hasattr(self._local, attr):
                    delattr(self._local, attr)
    
    def _get_context(self) -> Dict[str, Any]:
        """Get current execution context."""
        context = {}
        for attr in ['agent_id', 'agent_type', 'execution_id', 'user_id', 'org_id']:
            if hasattr(self._local, attr):
                context[attr] = getattr(self._local, attr)
        return context
    
    def _calculate_duration(self) -> Optional[int]:
        """Calculate execution duration in milliseconds."""
        if hasattr(self._local, 'start_time'):
            duration = datetime.now(timezone.utc) - self._local.start_time
            return int(duration.total_seconds() * 1000)
        return None
    
    def _create_log_entry(self, level: str, event_type: str, message: str, 
                         context: Dict[str, Any] = None, error_type: str = None,
                         stack_trace: str = None) -> LogEntry:
        """Create structured log entry."""
        exec_context = self._get_context()
        
        entry = LogEntry(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=level,
            agent_id=exec_context.get('agent_id', 'unknown'),
            agent_type=exec_context.get('agent_type', 'unknown'),
            event_type=event_type,
            message=message,
            context={**exec_context, **(context or {})},
            execution_id=exec_context.get('execution_id'),
            user_id=exec_context.get('user_id'),
            org_id=exec_context.get('org_id'),
            duration_ms=self._calculate_duration(),
            error_type=error_type,
            stack_trace=stack_trace
        )
        
        # Add to buffer for real-time monitoring
        with self._buffer_lock:
            self._log_buffer.append(entry)
            if len(self._log_buffer) > self._max_buffer_size:
                self._log_buffer.pop(0)
        
        return entry
    
    def log_execution_start(self):
        """Log execution start."""
        entry = self._create_log_entry("INFO", "execution_start", "Agent execution started")
        self.agent_logger.info(entry.message)
        self.json_logger.info(entry.to_json())
    
    def log_execution_success(self):
        """Log successful execution."""
        entry = self._create_log_entry("INFO", "execution_success", "Agent execution completed successfully")
        self.agent_logger.info(f"{entry.message} (Duration: {entry.duration_ms}ms)")
        self.json_logger.info(entry.to_json())
    
    def log_execution_error(self, error: Exception):
        """Log execution error."""
        import traceback
        
        entry = self._create_log_entry(
            "ERROR", 
            "execution_error", 
            f"Agent execution failed: {str(error)}",
            error_type=type(error).__name__,
            stack_trace=traceback.format_exc()
        )
        self.agent_logger.error(entry.message)
        self.error_logger.error(entry.message, exc_info=True)
        self.json_logger.error(entry.to_json())
    
    def log_tool_call(self, tool_name: str, parameters: Dict[str, Any], 
                     result: Any = None, error: Exception = None):
        """Log tool call."""
        if error:
            entry = self._create_log_entry(
                "ERROR",
                "tool_error",
                f"Tool call failed: {tool_name}",
                context={
                    "tool_name": tool_name,
                    "parameters": parameters,
                    "error": str(error)
                },
                error_type=type(error).__name__
            )
            self.agent_logger.error(entry.message)
            self.json_logger.error(entry.to_json())
        else:
            entry = self._create_log_entry(
                "INFO",
                "tool_call",
                f"Tool call successful: {tool_name}",
                context={
                    "tool_name": tool_name,
                    "parameters": parameters,
                    "result_type": type(result).__name__ if result else None
                }
            )
            self.agent_logger.info(entry.message)
            self.json_logger.info(entry.to_json())
    
    def log_llm_call(self, provider: str, model: str, tokens_used: int, 
                    latency_ms: int, cost: float = None):
        """Log LLM API call."""
        entry = self._create_log_entry(
            "INFO",
            "llm_call",
            f"LLM call: {provider}/{model}",
            context={
                "provider": provider,
                "model": model,
                "tokens_used": tokens_used,
                "latency_ms": latency_ms,
                "cost": cost
            }
        )
        self.agent_logger.info(f"{entry.message} - {tokens_used} tokens, {latency_ms}ms")
        self.json_logger.info(entry.to_json())
    
    def log_agent_decision(self, decision: str, confidence: float, reasoning: List[str]):
        """Log agent decision making."""
        entry = self._create_log_entry(
            "INFO",
            "agent_decision",
            f"Agent decision: {decision}",
            context={
                "decision": decision,
                "confidence": confidence,
                "reasoning": reasoning
            }
        )
        self.agent_logger.info(f"{entry.message} (confidence: {confidence:.2f})")
        self.json_logger.info(entry.to_json())
    
    def log_performance_metric(self, metric_name: str, value: float, unit: str = None):
        """Log performance metric."""
        entry = self._create_log_entry(
            "INFO",
            "performance_metric",
            f"Metric: {metric_name} = {value}{unit or ''}",
            context={
                "metric_name": metric_name,
                "value": value,
                "unit": unit
            }
        )
        self.json_logger.info(entry.to_json())
    
    def log_custom_event(self, event_type: str, message: str, context: Dict[str, Any] = None):
        """Log custom event."""
        entry = self._create_log_entry("INFO", event_type, message, context)
        self.agent_logger.info(entry.message)
        self.json_logger.info(entry.to_json())
    
    def get_recent_logs(self, count: int = 100) -> List[LogEntry]:
        """Get recent log entries from buffer."""
        with self._buffer_lock:
            return self._log_buffer[-count:] if count < len(self._log_buffer) else self._log_buffer.copy()
    
    def get_logs_by_agent(self, agent_id: str, count: int = 100) -> List[LogEntry]:
        """Get logs for specific agent."""
        with self._buffer_lock:
            agent_logs = [entry for entry in self._log_buffer if entry.agent_id == agent_id]
            return agent_logs[-count:] if count < len(agent_logs) else agent_logs
    
    def get_error_logs(self, count: int = 50) -> List[LogEntry]:
        """Get recent error logs."""
        with self._buffer_lock:
            error_logs = [entry for entry in self._log_buffer if entry.level == "ERROR"]
            return error_logs[-count:] if count < len(error_logs) else error_logs
    
    def get_execution_summary(self, execution_id: str) -> Dict[str, Any]:
        """Get summary for specific execution."""
        with self._buffer_lock:
            execution_logs = [entry for entry in self._log_buffer if entry.execution_id == execution_id]
        
        if not execution_logs:
            return {"execution_id": execution_id, "status": "not_found"}
        
        start_log = next((log for log in execution_logs if log.event_type == "execution_start"), None)
        end_log = next((log for log in execution_logs if log.event_type in ["execution_success", "execution_error"]), None)
        
        tool_calls = [log for log in execution_logs if log.event_type == "tool_call"]
        llm_calls = [log for log in execution_logs if log.event_type == "llm_call"]
        errors = [log for log in execution_logs if log.level == "ERROR"]
        
        return {
            "execution_id": execution_id,
            "agent_id": execution_logs[0].agent_id,
            "agent_type": execution_logs[0].agent_type,
            "status": "success" if end_log and end_log.event_type == "execution_success" else "error",
            "start_time": start_log.timestamp if start_log else None,
            "end_time": end_log.timestamp if end_log else None,
            "duration_ms": end_log.duration_ms if end_log else None,
            "tool_calls_count": len(tool_calls),
            "llm_calls_count": len(llm_calls),
            "errors_count": len(errors),
            "total_tokens": sum(log.context.get("tokens_used", 0) for log in llm_calls),
            "total_cost": sum(log.context.get("cost", 0) for log in llm_calls if log.context.get("cost"))
        }


# Global logger instance
_agent_logger = None

def get_agent_logger() -> AgentLogger:
    """Get global agent logger instance."""
    global _agent_logger
    if _agent_logger is None:
        log_level = os.getenv('AGENT_LOG_LEVEL', 'INFO')
        log_dir = os.getenv('AGENT_LOG_DIR', 'logs')
        _agent_logger = AgentLogger(log_level, log_dir)
    return _agent_logger