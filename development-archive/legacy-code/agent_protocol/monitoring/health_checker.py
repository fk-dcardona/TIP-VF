"""Comprehensive health checking and system diagnostics."""

import time
import threading
import subprocess
import psutil
import json
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
from enum import Enum
import requests

from ..core.agent_types import AgentType
from .agent_logger import get_agent_logger
from .metrics_collector import get_metrics_collector


class ComponentStatus(Enum):
    """Component health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


@dataclass
class HealthCheck:
    """Individual health check result."""
    component: str
    status: ComponentStatus
    message: str
    timestamp: datetime
    response_time_ms: Optional[int] = None
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'component': self.component,
            'status': self.status.value,
            'message': self.message,
            'timestamp': self.timestamp.isoformat(),
            'response_time_ms': self.response_time_ms,
            'metadata': self.metadata or {}
        }


class HealthChecker:
    """Comprehensive system health monitoring."""
    
    def __init__(self, check_interval: int = 60):
        """Initialize health checker."""
        self.check_interval = check_interval
        self.logger = get_agent_logger()
        self.metrics = get_metrics_collector()
        
        # Health check results storage
        self._lock = threading.RLock()
        self._health_results: Dict[str, HealthCheck] = {}
        self._health_history: List[Dict[str, Any]] = []
        
        # System thresholds
        self._thresholds = {
            'cpu_usage_percent': 80.0,
            'memory_usage_percent': 85.0,
            'disk_usage_percent': 90.0,
            'response_time_ms': 5000,
            'error_rate_percent': 10.0
        }
        
        # Health check callbacks
        self._health_callbacks: List[Callable[[Dict[str, HealthCheck]], None]] = []
        
        # Start health monitoring
        self._monitoring_active = True
        self._start_monitoring()
    
    def _start_monitoring(self):
        """Start background health monitoring."""
        monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        monitor_thread.start()
    
    def _monitoring_loop(self):
        """Main health monitoring loop."""
        while self._monitoring_active:
            try:
                self._perform_all_checks()
                time.sleep(self.check_interval)
            except Exception as e:
                self.logger.log_custom_event(
                    "health_check_error",
                    f"Health monitoring error: {str(e)}",
                    {"error_type": type(e).__name__}
                )
                time.sleep(self.check_interval)
    
    def _perform_all_checks(self):
        """Perform all health checks."""
        checks = {
            'system_resources': self._check_system_resources,
            'database': self._check_database,
            'llm_providers': self._check_llm_providers,
            'agent_executor': self._check_agent_executor,
            'file_system': self._check_file_system,
            'external_services': self._check_external_services,
            'agent_performance': self._check_agent_performance
        }
        
        results = {}
        overall_status = ComponentStatus.HEALTHY
        
        for component, check_func in checks.items():
            try:
                start_time = time.time()
                result = check_func()
                response_time = int((time.time() - start_time) * 1000)
                
                if result:
                    result.response_time_ms = response_time
                    results[component] = result
                    
                    # Update overall status
                    if result.status == ComponentStatus.UNHEALTHY:
                        overall_status = ComponentStatus.UNHEALTHY
                    elif result.status == ComponentStatus.DEGRADED and overall_status == ComponentStatus.HEALTHY:
                        overall_status = ComponentStatus.DEGRADED
                
            except Exception as e:
                results[component] = HealthCheck(
                    component=component,
                    status=ComponentStatus.UNKNOWN,
                    message=f"Health check failed: {str(e)}",
                    timestamp=datetime.now(timezone.utc),
                    metadata={"error": str(e)}
                )
                overall_status = ComponentStatus.DEGRADED
        
        # Store results
        with self._lock:
            self._health_results = results
            
            # Add to history
            health_summary = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'overall_status': overall_status.value,
                'component_count': len(results),
                'healthy_count': sum(1 for r in results.values() if r.status == ComponentStatus.HEALTHY),
                'degraded_count': sum(1 for r in results.values() if r.status == ComponentStatus.DEGRADED),
                'unhealthy_count': sum(1 for r in results.values() if r.status == ComponentStatus.UNHEALTHY)
            }
            
            self._health_history.append(health_summary)
            
            # Keep only recent history (last 100 checks)
            if len(self._health_history) > 100:
                self._health_history = self._health_history[-100:]
        
        # Notify callbacks
        for callback in self._health_callbacks:
            try:
                callback(results)
            except Exception as e:
                print(f"Health check callback error: {e}")
        
        # Log overall health status
        self.logger.log_custom_event(
            "health_check_complete",
            f"System health: {overall_status.value}",
            {
                "overall_status": overall_status.value,
                "healthy_components": sum(1 for r in results.values() if r.status == ComponentStatus.HEALTHY),
                "total_components": len(results)
            }
        )
    
    def _check_system_resources(self) -> HealthCheck:
        """Check system resource usage."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            # Load average (Unix-like systems)
            try:
                load_avg = psutil.getloadavg()[0]  # 1-minute load average
            except AttributeError:
                load_avg = 0.0  # Windows doesn't have load average
            
            # Determine status
            status = ComponentStatus.HEALTHY
            issues = []
            
            if cpu_percent > self._thresholds['cpu_usage_percent']:
                status = ComponentStatus.DEGRADED
                issues.append(f"High CPU usage: {cpu_percent:.1f}%")
            
            if memory_percent > self._thresholds['memory_usage_percent']:
                status = ComponentStatus.DEGRADED
                issues.append(f"High memory usage: {memory_percent:.1f}%")
            
            if disk_percent > self._thresholds['disk_usage_percent']:
                status = ComponentStatus.UNHEALTHY
                issues.append(f"High disk usage: {disk_percent:.1f}%")
            
            message = "System resources normal"
            if issues:
                message = "; ".join(issues)
            
            return HealthCheck(
                component="system_resources",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory_percent,
                    "disk_percent": disk_percent,
                    "load_average": load_avg,
                    "available_memory_gb": memory.available / (1024**3)
                }
            )
            
        except Exception as e:
            return HealthCheck(
                component="system_resources",
                status=ComponentStatus.UNKNOWN,
                message=f"Failed to check system resources: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def _check_database(self) -> HealthCheck:
        """Check database connectivity and performance."""
        try:
            from models import db
            
            start_time = time.time()
            
            # Simple database query
            result = db.session.execute('SELECT 1').fetchone()
            
            query_time = (time.time() - start_time) * 1000
            
            if result and result[0] == 1:
                status = ComponentStatus.HEALTHY if query_time < 1000 else ComponentStatus.DEGRADED
                message = f"Database responsive (query: {query_time:.1f}ms)"
            else:
                status = ComponentStatus.UNHEALTHY
                message = "Database query failed"
            
            return HealthCheck(
                component="database",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "query_time_ms": query_time,
                    "connection_pool_size": getattr(db.engine.pool, 'size', 'unknown')
                }
            )
            
        except Exception as e:
            return HealthCheck(
                component="database",
                status=ComponentStatus.UNHEALTHY,
                message=f"Database check failed: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def _check_llm_providers(self) -> HealthCheck:
        """Check LLM provider health."""
        try:
            from ..llm.llm_manager import get_llm_manager
            
            llm_manager = get_llm_manager()
            health_report = llm_manager.health_check()
            
            overall_status = health_report.get('status', 'unknown')
            providers = health_report.get('providers', {})
            
            healthy_providers = sum(1 for p in providers.values() if p.get('status') == 'healthy')
            total_providers = len(providers)
            
            if overall_status == 'healthy':
                status = ComponentStatus.HEALTHY
                message = f"All {total_providers} LLM providers healthy"
            elif overall_status == 'degraded':
                status = ComponentStatus.DEGRADED
                message = f"{healthy_providers}/{total_providers} LLM providers healthy"
            else:
                status = ComponentStatus.UNHEALTHY
                message = f"LLM providers unhealthy: {overall_status}"
            
            return HealthCheck(
                component="llm_providers",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "total_providers": total_providers,
                    "healthy_providers": healthy_providers,
                    "provider_details": providers
                }
            )
            
        except Exception as e:
            return HealthCheck(
                component="llm_providers",
                status=ComponentStatus.UNKNOWN,
                message=f"LLM provider check failed: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def _check_agent_executor(self) -> HealthCheck:
        """Check agent executor health."""
        try:
            from ..executors.agent_executor import get_global_executor
            
            executor = get_global_executor()
            stats = executor.get_stats()
            
            active_executions = stats.get('active_executions', 0)
            total_agents = stats.get('total_agents', 0)
            
            # Check for reasonable limits
            if active_executions > 20:
                status = ComponentStatus.DEGRADED
                message = f"High number of active executions: {active_executions}"
            elif active_executions > 50:
                status = ComponentStatus.UNHEALTHY
                message = f"Excessive active executions: {active_executions}"
            else:
                status = ComponentStatus.HEALTHY
                message = f"Agent executor normal ({active_executions} active, {total_agents} total)"
            
            return HealthCheck(
                component="agent_executor",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata=stats
            )
            
        except Exception as e:
            return HealthCheck(
                component="agent_executor",
                status=ComponentStatus.UNKNOWN,
                message=f"Agent executor check failed: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def _check_file_system(self) -> HealthCheck:
        """Check file system health."""
        try:
            import os
            from pathlib import Path
            
            # Check log directory
            log_dir = Path("logs")
            if not log_dir.exists():
                log_dir.mkdir(parents=True)
            
            # Test file write/read
            test_file = log_dir / "health_check.tmp"
            test_content = f"health_check_{int(time.time())}"
            
            start_time = time.time()
            test_file.write_text(test_content)
            read_content = test_file.read_text()
            test_file.unlink()  # Clean up
            write_time = (time.time() - start_time) * 1000
            
            if read_content == test_content:
                status = ComponentStatus.HEALTHY if write_time < 100 else ComponentStatus.DEGRADED
                message = f"File system responsive (write: {write_time:.1f}ms)"
            else:
                status = ComponentStatus.UNHEALTHY
                message = "File system write/read test failed"
            
            return HealthCheck(
                component="file_system",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "write_time_ms": write_time,
                    "log_dir_exists": log_dir.exists(),
                    "log_dir_writable": os.access(log_dir, os.W_OK)
                }
            )
            
        except Exception as e:
            return HealthCheck(
                component="file_system",
                status=ComponentStatus.UNHEALTHY,
                message=f"File system check failed: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def _check_external_services(self) -> HealthCheck:
        """Check external service connectivity."""
        try:
            services_to_check = [
                ("openai", "https://api.openai.com/v1/models"),
                ("anthropic", "https://api.anthropic.com/v1/models")
            ]
            
            service_status = {}
            overall_healthy = True
            
            for service_name, url in services_to_check:
                try:
                    start_time = time.time()
                    response = requests.get(url, timeout=5, headers={
                        "Authorization": "Bearer test"  # This will fail auth but test connectivity
                    })
                    response_time = (time.time() - start_time) * 1000
                    
                    # We expect 401 (unauthorized) which means the service is up
                    if response.status_code in [200, 401, 403]:
                        service_status[service_name] = {
                            "status": "reachable",
                            "response_time_ms": response_time
                        }
                    else:
                        service_status[service_name] = {
                            "status": "unreachable",
                            "status_code": response.status_code
                        }
                        overall_healthy = False
                        
                except requests.RequestException as e:
                    service_status[service_name] = {
                        "status": "error",
                        "error": str(e)
                    }
                    overall_healthy = False
            
            reachable_count = sum(1 for s in service_status.values() if s.get("status") == "reachable")
            total_count = len(service_status)
            
            if overall_healthy:
                status = ComponentStatus.HEALTHY
                message = f"All {total_count} external services reachable"
            elif reachable_count > 0:
                status = ComponentStatus.DEGRADED
                message = f"{reachable_count}/{total_count} external services reachable"
            else:
                status = ComponentStatus.UNHEALTHY
                message = "No external services reachable"
            
            return HealthCheck(
                component="external_services",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "services": service_status,
                    "reachable_count": reachable_count,
                    "total_count": total_count
                }
            )
            
        except Exception as e:
            return HealthCheck(
                component="external_services",
                status=ComponentStatus.UNKNOWN,
                message=f"External services check failed: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def _check_agent_performance(self) -> HealthCheck:
        """Check overall agent performance metrics."""
        try:
            system_metrics = self.metrics.get_system_metrics()
            
            success_rate = system_metrics.get('avg_success_rate', 0)
            avg_execution_time = system_metrics.get('avg_execution_time_ms', 0)
            total_executions = system_metrics.get('total_executions_today', 0)
            
            issues = []
            status = ComponentStatus.HEALTHY
            
            if success_rate < self._thresholds['error_rate_percent']:
                status = ComponentStatus.DEGRADED
                issues.append(f"Low success rate: {success_rate:.1f}%")
            
            if avg_execution_time > self._thresholds['response_time_ms']:
                status = ComponentStatus.DEGRADED
                issues.append(f"Slow execution time: {avg_execution_time:.1f}ms")
            
            message = f"Agent performance normal ({total_executions} executions today)"
            if issues:
                message = "; ".join(issues)
            
            return HealthCheck(
                component="agent_performance",
                status=status,
                message=message,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "success_rate": success_rate,
                    "avg_execution_time_ms": avg_execution_time,
                    "total_executions_today": total_executions,
                    "active_agents": system_metrics.get('active_agents', 0)
                }
            )
            
        except Exception as e:
            return HealthCheck(
                component="agent_performance",
                status=ComponentStatus.UNKNOWN,
                message=f"Agent performance check failed: {str(e)}",
                timestamp=datetime.now(timezone.utc)
            )
    
    def get_current_health(self) -> Dict[str, HealthCheck]:
        """Get current health status for all components."""
        with self._lock:
            return self._health_results.copy()
    
    def get_component_health(self, component: str) -> Optional[HealthCheck]:
        """Get health status for specific component."""
        with self._lock:
            return self._health_results.get(component)
    
    def get_overall_status(self) -> ComponentStatus:
        """Get overall system health status."""
        with self._lock:
            if not self._health_results:
                return ComponentStatus.UNKNOWN
            
            statuses = [check.status for check in self._health_results.values()]
            
            if any(status == ComponentStatus.UNHEALTHY for status in statuses):
                return ComponentStatus.UNHEALTHY
            elif any(status == ComponentStatus.DEGRADED for status in statuses):
                return ComponentStatus.DEGRADED
            elif any(status == ComponentStatus.UNKNOWN for status in statuses):
                return ComponentStatus.UNKNOWN
            else:
                return ComponentStatus.HEALTHY
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get comprehensive health summary."""
        with self._lock:
            current_health = self._health_results
            overall_status = self.get_overall_status()
            
            summary = {
                "overall_status": overall_status.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "components": {name: check.to_dict() for name, check in current_health.items()},
                "component_count": {
                    "total": len(current_health),
                    "healthy": sum(1 for c in current_health.values() if c.status == ComponentStatus.HEALTHY),
                    "degraded": sum(1 for c in current_health.values() if c.status == ComponentStatus.DEGRADED),
                    "unhealthy": sum(1 for c in current_health.values() if c.status == ComponentStatus.UNHEALTHY),
                    "unknown": sum(1 for c in current_health.values() if c.status == ComponentStatus.UNKNOWN)
                },
                "thresholds": self._thresholds
            }
            
            return summary
    
    def get_health_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get health check history."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        with self._lock:
            return [
                entry for entry in self._health_history
                if datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00')) >= cutoff_time
            ]
    
    def add_health_callback(self, callback: Callable[[Dict[str, HealthCheck]], None]):
        """Add callback for health status changes."""
        self._health_callbacks.append(callback)
    
    def set_threshold(self, name: str, value: Any):
        """Update health check threshold."""
        if name in self._thresholds:
            self._thresholds[name] = value
    
    def force_health_check(self) -> Dict[str, HealthCheck]:
        """Force immediate health check."""
        self._perform_all_checks()
        return self.get_current_health()
    
    def stop_monitoring(self):
        """Stop health monitoring."""
        self._monitoring_active = False


# Global health checker instance
_health_checker = None

def get_health_checker() -> HealthChecker:
    """Get global health checker instance."""
    global _health_checker
    if _health_checker is None:
        _health_checker = HealthChecker()
    return _health_checker