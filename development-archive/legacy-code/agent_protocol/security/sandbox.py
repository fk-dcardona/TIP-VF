"""Sandboxing system for secure agent execution."""

import os
import sys
import threading
import subprocess
import tempfile
import shutil
import resource
import signal
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from contextlib import contextmanager
import json

from .permissions import SecurityContext, PermissionManager, get_permission_manager
from ..monitoring.agent_logger import get_agent_logger


@dataclass
class SandboxLimits:
    """Resource limits for sandbox execution."""
    max_memory_mb: int = 512
    max_execution_time: int = 300  # 5 minutes
    max_file_operations: int = 100
    max_network_connections: int = 10
    max_cpu_time: int = 60  # CPU seconds
    max_processes: int = 1
    max_file_size_mb: int = 10
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "max_memory_mb": self.max_memory_mb,
            "max_execution_time": self.max_execution_time,
            "max_file_operations": self.max_file_operations,
            "max_network_connections": self.max_network_connections,
            "max_cpu_time": self.max_cpu_time,
            "max_processes": self.max_processes,
            "max_file_size_mb": self.max_file_size_mb
        }


@dataclass
class SandboxUsage:
    """Resource usage tracking for sandbox."""
    memory_used_mb: float = 0.0
    execution_time: float = 0.0
    file_operations: int = 0
    network_connections: int = 0
    cpu_time: float = 0.0
    processes_created: int = 0
    files_created: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "memory_used_mb": self.memory_used_mb,
            "execution_time": self.execution_time,
            "file_operations": self.file_operations,
            "network_connections": self.network_connections,
            "cpu_time": self.cpu_time,
            "processes_created": self.processes_created,
            "files_created": self.files_created
        }


class SandboxViolationError(Exception):
    """Exception raised when sandbox limits are violated."""
    
    def __init__(self, message: str, violation_type: str, current_value: Any, limit: Any):
        super().__init__(message)
        self.violation_type = violation_type
        self.current_value = current_value
        self.limit = limit


class SandboxMonitor:
    """Monitor and enforce sandbox resource limits."""
    
    def __init__(self, limits: SandboxLimits):
        """Initialize sandbox monitor."""
        self.limits = limits
        self.usage = SandboxUsage()
        self.start_time = datetime.now(timezone.utc)
        self.logger = get_agent_logger()
        
        # Monitoring state
        self._monitoring = False
        self._lock = threading.RLock()
        
        # Resource tracking
        self._original_limits = {}
        self._temp_files: List[Path] = []
        self._processes: List[int] = []
    
    def start_monitoring(self):
        """Start resource monitoring."""
        with self._lock:
            if self._monitoring:
                return
            
            self._monitoring = True
            self.start_time = datetime.now(timezone.utc)
            
            # Set system resource limits
            self._set_system_limits()
        
        self.logger.log_custom_event(
            "sandbox_monitoring_started",
            "Sandbox monitoring started",
            {"limits": self.limits.to_dict()}
        )
    
    def stop_monitoring(self):
        """Stop resource monitoring and cleanup."""
        with self._lock:
            if not self._monitoring:
                return
            
            self._monitoring = False
            
            # Restore original limits
            self._restore_system_limits()
            
            # Cleanup temporary files
            self._cleanup_temp_files()
        
        final_usage = self.get_current_usage()
        self.logger.log_custom_event(
            "sandbox_monitoring_stopped",
            "Sandbox monitoring stopped",
            {"final_usage": final_usage.to_dict()}
        )
    
    def check_limits(self):
        """Check if current usage exceeds limits."""
        current_usage = self.get_current_usage()
        
        # Check execution time
        if current_usage.execution_time > self.limits.max_execution_time:
            raise SandboxViolationError(
                f"Execution time limit exceeded: {current_usage.execution_time}s > {self.limits.max_execution_time}s",
                "execution_time",
                current_usage.execution_time,
                self.limits.max_execution_time
            )
        
        # Check memory usage
        if current_usage.memory_used_mb > self.limits.max_memory_mb:
            raise SandboxViolationError(
                f"Memory limit exceeded: {current_usage.memory_used_mb}MB > {self.limits.max_memory_mb}MB",
                "memory",
                current_usage.memory_used_mb,
                self.limits.max_memory_mb
            )
        
        # Check file operations
        if current_usage.file_operations > self.limits.max_file_operations:
            raise SandboxViolationError(
                f"File operations limit exceeded: {current_usage.file_operations} > {self.limits.max_file_operations}",
                "file_operations",
                current_usage.file_operations,
                self.limits.max_file_operations
            )
        
        # Check CPU time
        if current_usage.cpu_time > self.limits.max_cpu_time:
            raise SandboxViolationError(
                f"CPU time limit exceeded: {current_usage.cpu_time}s > {self.limits.max_cpu_time}s",
                "cpu_time",
                current_usage.cpu_time,
                self.limits.max_cpu_time
            )
    
    def get_current_usage(self) -> SandboxUsage:
        """Get current resource usage."""
        with self._lock:
            # Update execution time
            self.usage.execution_time = (datetime.now(timezone.utc) - self.start_time).total_seconds()
            
            # Get memory usage (simplified)
            try:
                import psutil
                process = psutil.Process()
                self.usage.memory_used_mb = process.memory_info().rss / 1024 / 1024
                self.usage.cpu_time = process.cpu_times().user + process.cpu_times().system
            except ImportError:
                # Fallback if psutil not available
                pass
        
        return self.usage
    
    def record_file_operation(self):
        """Record a file operation."""
        with self._lock:
            self.usage.file_operations += 1
            self.check_limits()
    
    def record_network_connection(self):
        """Record a network connection."""
        with self._lock:
            self.usage.network_connections += 1
            if self.usage.network_connections > self.limits.max_network_connections:
                raise SandboxViolationError(
                    f"Network connections limit exceeded: {self.usage.network_connections} > {self.limits.max_network_connections}",
                    "network_connections",
                    self.usage.network_connections,
                    self.limits.max_network_connections
                )
    
    def record_process_creation(self, pid: int):
        """Record process creation."""
        with self._lock:
            self.usage.processes_created += 1
            self._processes.append(pid)
            
            if self.usage.processes_created > self.limits.max_processes:
                raise SandboxViolationError(
                    f"Process limit exceeded: {self.usage.processes_created} > {self.limits.max_processes}",
                    "processes",
                    self.usage.processes_created,
                    self.limits.max_processes
                )
    
    def register_temp_file(self, file_path: Path):
        """Register temporary file for cleanup."""
        with self._lock:
            self._temp_files.append(file_path)
            self.usage.files_created += 1
    
    def _set_system_limits(self):
        """Set system resource limits."""
        try:
            # Set memory limit (virtual memory)
            memory_limit = self.limits.max_memory_mb * 1024 * 1024
            self._original_limits['memory'] = resource.getrlimit(resource.RLIMIT_AS)
            resource.setrlimit(resource.RLIMIT_AS, (memory_limit, memory_limit))
            
            # Set CPU time limit
            self._original_limits['cpu'] = resource.getrlimit(resource.RLIMIT_CPU)
            resource.setrlimit(resource.RLIMIT_CPU, (self.limits.max_cpu_time, self.limits.max_cpu_time))
            
            # Set file size limit
            file_size_limit = self.limits.max_file_size_mb * 1024 * 1024
            self._original_limits['file_size'] = resource.getrlimit(resource.RLIMIT_FSIZE)
            resource.setrlimit(resource.RLIMIT_FSIZE, (file_size_limit, file_size_limit))
            
        except (ValueError, OSError) as e:
            self.logger.log_custom_event(
                "sandbox_limit_warning",
                f"Could not set system limits: {str(e)}",
                {"error": str(e)}
            )
    
    def _restore_system_limits(self):
        """Restore original system limits."""
        try:
            for limit_type, original_limit in self._original_limits.items():
                if limit_type == 'memory':
                    resource.setrlimit(resource.RLIMIT_AS, original_limit)
                elif limit_type == 'cpu':
                    resource.setrlimit(resource.RLIMIT_CPU, original_limit)
                elif limit_type == 'file_size':
                    resource.setrlimit(resource.RLIMIT_FSIZE, original_limit)
        except (ValueError, OSError):
            pass  # Best effort restoration
    
    def _cleanup_temp_files(self):
        """Clean up temporary files."""
        for file_path in self._temp_files:
            try:
                if file_path.exists():
                    if file_path.is_file():
                        file_path.unlink()
                    elif file_path.is_dir():
                        shutil.rmtree(file_path)
            except OSError:
                pass  # Best effort cleanup


class SandboxExecutor:
    """Secure execution environment for agent operations."""
    
    def __init__(self):
        """Initialize sandbox executor."""
        self.logger = get_agent_logger()
        self.permission_manager = get_permission_manager()
        
        # Active sandboxes
        self._active_sandboxes: Dict[str, SandboxMonitor] = {}
        self._lock = threading.RLock()
    
    def create_sandbox(self, session_id: str, limits: Optional[SandboxLimits] = None) -> SandboxMonitor:
        """Create a new sandbox for execution."""
        if limits is None:
            limits = SandboxLimits()
        
        monitor = SandboxMonitor(limits)
        
        with self._lock:
            self._active_sandboxes[session_id] = monitor
        
        self.logger.log_custom_event(
            "sandbox_created",
            f"Sandbox created for session {session_id}",
            {
                "session_id": session_id,
                "limits": limits.to_dict()
            }
        )
        
        return monitor
    
    def get_sandbox(self, session_id: str) -> Optional[SandboxMonitor]:
        """Get existing sandbox for session."""
        with self._lock:
            return self._active_sandboxes.get(session_id)
    
    def destroy_sandbox(self, session_id: str) -> bool:
        """Destroy sandbox and cleanup resources."""
        with self._lock:
            monitor = self._active_sandboxes.get(session_id)
            if not monitor:
                return False
            
            monitor.stop_monitoring()
            del self._active_sandboxes[session_id]
        
        self.logger.log_custom_event(
            "sandbox_destroyed",
            f"Sandbox destroyed for session {session_id}",
            {"session_id": session_id}
        )
        
        return True
    
    @contextmanager
    def secure_execution(self, security_context: SecurityContext, 
                        limits: Optional[SandboxLimits] = None):
        """Context manager for secure execution."""
        session_id = security_context.session_id
        monitor = self.create_sandbox(session_id, limits)
        
        try:
            monitor.start_monitoring()
            yield monitor
        except SandboxViolationError as e:
            self.logger.log_custom_event(
                "sandbox_violation",
                f"Sandbox violation: {e.violation_type}",
                {
                    "session_id": session_id,
                    "violation_type": e.violation_type,
                    "current_value": e.current_value,
                    "limit": e.limit
                }
            )
            raise
        except Exception as e:
            self.logger.log_custom_event(
                "sandbox_error",
                f"Sandbox execution error: {str(e)}",
                {
                    "session_id": session_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            raise
        finally:
            self.destroy_sandbox(session_id)
    
    def execute_with_sandbox(self, security_context: SecurityContext,
                           func: Callable, *args, **kwargs) -> Any:
        """Execute function within sandbox."""
        limits = SandboxLimits()
        
        # Apply security policy limits if available
        if security_context.restrictions:
            if 'max_execution_time' in security_context.restrictions:
                limits.max_execution_time = security_context.restrictions['max_execution_time']
            if 'max_file_size' in security_context.restrictions:
                limits.max_file_size_mb = security_context.restrictions['max_file_size'] // (1024 * 1024)
        
        with self.secure_execution(security_context, limits) as monitor:
            # Execute function with monitoring
            result = func(*args, **kwargs)
            
            # Final limit check
            monitor.check_limits()
            
            return result
    
    def get_sandbox_stats(self) -> Dict[str, Any]:
        """Get sandbox system statistics."""
        with self._lock:
            active_count = len(self._active_sandboxes)
            total_usage = {}
            
            for session_id, monitor in self._active_sandboxes.items():
                usage = monitor.get_current_usage()
                for key, value in usage.to_dict().items():
                    if isinstance(value, (int, float)):
                        total_usage[key] = total_usage.get(key, 0) + value
        
        return {
            "active_sandboxes": active_count,
            "total_usage": total_usage
        }


# Sandbox-aware decorators
def sandboxed_execution(limits: Optional[SandboxLimits] = None):
    """Decorator for sandboxed function execution."""
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            # Find SecurityContext in arguments
            security_context = None
            for arg in args:
                if isinstance(arg, SecurityContext):
                    security_context = arg
                    break
            
            if not security_context:
                # Try to extract from kwargs
                security_context = kwargs.get('security_context')
            
            if not security_context:
                raise ValueError("SecurityContext required for sandboxed execution")
            
            executor = get_sandbox_executor()
            return executor.execute_with_sandbox(security_context, func, *args, **kwargs)
        
        return wrapper
    return decorator


def track_file_operation(monitor: SandboxMonitor):
    """Decorator to track file operations."""
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            monitor.record_file_operation()
            return func(*args, **kwargs)
        return wrapper
    return decorator


# Global sandbox executor instance
_sandbox_executor = None

def get_sandbox_executor() -> SandboxExecutor:
    """Get global sandbox executor instance."""
    global _sandbox_executor
    if _sandbox_executor is None:
        _sandbox_executor = SandboxExecutor()
    return _sandbox_executor