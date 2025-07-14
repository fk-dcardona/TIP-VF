"""
Production monitoring configuration for agent system.
Handles metrics collection, alerting, and performance monitoring.
"""

import os
import json
import time
import logging
import threading
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from enum import Enum
from pathlib import Path
import psutil
import signal

from ..agent_protocol.monitoring.metrics_collector import get_metrics_collector
from ..agent_protocol.monitoring.agent_logger import get_agent_logger
from ..agent_protocol.monitoring.health_checker import HealthChecker
from .settings import settings


class AlertSeverity(Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AlertRule:
    """Configuration for an alert rule."""
    name: str
    metric_name: str
    threshold: float
    operator: str  # >, <, >=, <=, ==, !=
    severity: AlertSeverity
    duration: int = 300  # 5 minutes
    cooldown: int = 1800  # 30 minutes
    enabled: bool = True
    description: str = ""
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class Alert:
    """Active alert instance."""
    rule_name: str
    severity: AlertSeverity
    message: str
    metric_value: float
    threshold: float
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class MonitoringConfig:
    """Production monitoring configuration."""
    
    def __init__(self):
        """Initialize monitoring configuration."""
        self.metrics_retention_days = int(os.getenv('METRICS_RETENTION_DAYS', '30'))
        self.alert_cooldown_seconds = int(os.getenv('ALERT_COOLDOWN_SECONDS', '1800'))
        self.health_check_interval = int(os.getenv('HEALTH_CHECK_INTERVAL', '30'))
        self.performance_sample_rate = float(os.getenv('PERFORMANCE_SAMPLE_RATE', '0.1'))
        self.log_aggregation_interval = int(os.getenv('LOG_AGGREGATION_INTERVAL', '300'))
        
        # Alert rules
        self.alert_rules = self._load_alert_rules()
        
        # Monitoring targets
        self.monitoring_targets = {
            'system': True,
            'database': True,
            'agents': True,
            'llm_providers': True,
            'api_endpoints': True,
            'mcp_server': True
        }
    
    def _load_alert_rules(self) -> List[AlertRule]:
        """Load alert rules from configuration."""
        rules = []
        
        # System resource alerts
        rules.extend([
            AlertRule(
                name="high_cpu_usage",
                metric_name="system.cpu.usage_percent",
                threshold=80.0,
                operator=">=",
                severity=AlertSeverity.HIGH,
                duration=300,
                description="System CPU usage is above 80%"
            ),
            AlertRule(
                name="high_memory_usage",
                metric_name="system.memory.usage_percent",
                threshold=85.0,
                operator=">=",
                severity=AlertSeverity.HIGH,
                duration=300,
                description="System memory usage is above 85%"
            ),
            AlertRule(
                name="low_disk_space",
                metric_name="system.disk.usage_percent",
                threshold=90.0,
                operator=">=",
                severity=AlertSeverity.CRITICAL,
                duration=60,
                description="Disk space usage is above 90%"
            )
        ])
        
        # Agent performance alerts
        rules.extend([
            AlertRule(
                name="high_agent_error_rate",
                metric_name="agent.error_rate",
                threshold=10.0,
                operator=">=",
                severity=AlertSeverity.HIGH,
                duration=300,
                description="Agent error rate is above 10%"
            ),
            AlertRule(
                name="slow_agent_response",
                metric_name="agent.avg_execution_time_ms",
                threshold=30000,  # 30 seconds
                operator=">=",
                severity=AlertSeverity.MEDIUM,
                duration=300,
                description="Agent average execution time is above 30 seconds"
            ),
            AlertRule(
                name="agent_queue_backlog",
                metric_name="agent.queue_size",
                threshold=100,
                operator=">=",
                severity=AlertSeverity.HIGH,
                duration=300,
                description="Agent execution queue backlog is above 100"
            )
        ])
        
        # Cost monitoring alerts
        rules.extend([
            AlertRule(
                name="daily_cost_limit",
                metric_name="llm.daily_cost",
                threshold=float(os.getenv('LLM_DAILY_COST_ALERT', '100.0')),
                operator=">=",
                severity=AlertSeverity.HIGH,
                duration=60,
                description="Daily LLM cost limit reached"
            ),
            AlertRule(
                name="monthly_cost_limit",
                metric_name="llm.monthly_cost",
                threshold=float(os.getenv('LLM_MONTHLY_COST_ALERT', '2000.0')),
                operator=">=",
                severity=AlertSeverity.CRITICAL,
                duration=60,
                description="Monthly LLM cost limit reached"
            )
        ])
        
        # Database alerts
        rules.extend([
            AlertRule(
                name="database_connection_pool_exhausted",
                metric_name="database.connection_pool_usage",
                threshold=90.0,
                operator=">=",
                severity=AlertSeverity.HIGH,
                duration=60,
                description="Database connection pool usage is above 90%"
            ),
            AlertRule(
                name="slow_database_query",
                metric_name="database.avg_query_time_ms",
                threshold=5000,  # 5 seconds
                operator=">=",
                severity=AlertSeverity.MEDIUM,
                duration=300,
                description="Database average query time is above 5 seconds"
            )
        ])
        
        return rules


class ProductionMonitor:
    """Production monitoring system for agent infrastructure."""
    
    def __init__(self, config: Optional[MonitoringConfig] = None):
        """Initialize production monitor."""
        self.config = config or MonitoringConfig()
        self.metrics_collector = get_metrics_collector()
        self.agent_logger = get_agent_logger()
        self.health_checker = HealthChecker()
        
        # Alert management
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.alert_callbacks: List[Callable[[Alert], None]] = []
        
        # Monitoring state
        self.monitoring_active = False
        self.monitoring_thread = None
        self.last_metrics_collection = datetime.now(timezone.utc)
        
        # Performance tracking
        self.performance_metrics = {
            'system': {},
            'agents': {},
            'database': {},
            'api': {}
        }
        
        # Logger
        self.logger = logging.getLogger('production_monitor')
        
        # Initialize monitoring
        self._initialize_monitoring()
    
    def _initialize_monitoring(self):
        """Initialize monitoring components."""
        self.logger.info("Initializing production monitoring")
        
        # Set up signal handlers
        self._setup_signal_handlers()
        
        # Initialize metrics collection
        self._initialize_metrics_collection()
        
        # Initialize alert system
        self._initialize_alerting()
        
        self.logger.info("Production monitoring initialized")
    
    def _setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown."""
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, stopping monitoring")
            self.stop_monitoring()
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def _initialize_metrics_collection(self):
        """Initialize metrics collection."""
        # Configure metrics collector for production
        self.metrics_collector.configure_production_mode(
            retention_days=self.config.metrics_retention_days,
            aggregation_interval=self.config.log_aggregation_interval
        )
    
    def _initialize_alerting(self):
        """Initialize alerting system."""
        # Add default alert handlers
        self.add_alert_callback(self._log_alert)
        
        # Add email alerting if configured
        if os.getenv('SMTP_HOST'):
            self.add_alert_callback(self._send_email_alert)
        
        # Add webhook alerting if configured
        if os.getenv('ALERT_WEBHOOK_URL'):
            self.add_alert_callback(self._send_webhook_alert)
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system-level metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            # Network metrics
            network = psutil.net_io_counters()
            
            # Process metrics
            process = psutil.Process()
            process_memory = process.memory_info()
            
            return {
                'cpu': {
                    'usage_percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': {
                    'usage_percent': memory_percent,
                    'available_bytes': memory_available,
                    'total_bytes': memory.total
                },
                'disk': {
                    'usage_percent': disk_percent,
                    'free_bytes': disk.free,
                    'total_bytes': disk.total
                },
                'network': {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                },
                'process': {
                    'memory_rss': process_memory.rss,
                    'memory_vms': process_memory.vms,
                    'cpu_percent': process.cpu_percent()
                }
            }
        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {e}")
            return {}
    
    def collect_agent_metrics(self) -> Dict[str, Any]:
        """Collect agent-specific metrics."""
        try:
            # Get agent metrics from registry
            from ..agent_registry import get_agent_registry
            registry = get_agent_registry()
            
            if not registry:
                return {}
            
            # Get registry health
            registry_health = registry.get_registry_health()
            
            # Get individual agent metrics
            agent_metrics = {}
            for agent_id in registry.agents:
                agent_health = registry.get_agent_health(agent_id)
                if agent_health:
                    agent_metrics[agent_id] = agent_health
            
            return {
                'registry': registry_health,
                'individual_agents': agent_metrics,
                'total_agents': len(registry.agents),
                'healthy_agents': sum(1 for a in agent_metrics.values() if a.get('healthy', False))
            }
        except Exception as e:
            self.logger.error(f"Error collecting agent metrics: {e}")
            return {}
    
    def collect_database_metrics(self) -> Dict[str, Any]:
        """Collect database metrics."""
        try:
            # This would integrate with your database monitoring
            # For now, return basic connection pool info
            return {
                'connection_pool_size': 20,  # From configuration
                'active_connections': 0,  # Would be dynamically calculated
                'idle_connections': 0,
                'query_count': 0,
                'slow_query_count': 0,
                'avg_query_time_ms': 0
            }
        except Exception as e:
            self.logger.error(f"Error collecting database metrics: {e}")
            return {}
    
    def collect_api_metrics(self) -> Dict[str, Any]:
        """Collect API endpoint metrics."""
        try:
            # This would integrate with Flask/API monitoring
            return {
                'total_requests': 0,
                'requests_per_second': 0,
                'avg_response_time_ms': 0,
                'error_rate': 0,
                'status_codes': {}
            }
        except Exception as e:
            self.logger.error(f"Error collecting API metrics: {e}")
            return {}
    
    def evaluate_alert_rules(self, metrics: Dict[str, Any]):
        """Evaluate alert rules against collected metrics."""
        current_time = datetime.now(timezone.utc)
        
        for rule in self.config.alert_rules:
            if not rule.enabled:
                continue
            
            try:
                # Extract metric value
                metric_value = self._extract_metric_value(metrics, rule.metric_name)
                if metric_value is None:
                    continue
                
                # Evaluate condition
                condition_met = self._evaluate_condition(
                    metric_value, rule.threshold, rule.operator
                )
                
                if condition_met:
                    # Check if alert is already active
                    if rule.name in self.active_alerts:
                        # Update existing alert
                        alert = self.active_alerts[rule.name]
                        alert.metric_value = metric_value
                        alert.metadata['last_updated'] = current_time.isoformat()
                    else:
                        # Create new alert
                        alert = Alert(
                            rule_name=rule.name,
                            severity=rule.severity,
                            message=f"{rule.description} (current: {metric_value}, threshold: {rule.threshold})",
                            metric_value=metric_value,
                            threshold=rule.threshold,
                            triggered_at=current_time,
                            tags=rule.tags,
                            metadata={
                                'rule_duration': rule.duration,
                                'rule_cooldown': rule.cooldown
                            }
                        )
                        
                        self.active_alerts[rule.name] = alert
                        self.alert_history.append(alert)
                        
                        # Trigger alert callbacks
                        for callback in self.alert_callbacks:
                            try:
                                callback(alert)
                            except Exception as e:
                                self.logger.error(f"Error in alert callback: {e}")
                
                else:
                    # Condition not met, resolve alert if active
                    if rule.name in self.active_alerts:
                        alert = self.active_alerts[rule.name]
                        alert.resolved_at = current_time
                        del self.active_alerts[rule.name]
                        
                        self.logger.info(f"Alert resolved: {rule.name}")
            
            except Exception as e:
                self.logger.error(f"Error evaluating alert rule {rule.name}: {e}")
    
    def _extract_metric_value(self, metrics: Dict[str, Any], metric_name: str) -> Optional[float]:
        """Extract metric value from nested dictionary."""
        try:
            parts = metric_name.split('.')
            value = metrics
            
            for part in parts:
                if isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    return None
            
            return float(value) if value is not None else None
        except (ValueError, TypeError):
            return None
    
    def _evaluate_condition(self, value: float, threshold: float, operator: str) -> bool:
        """Evaluate alert condition."""
        if operator == '>':
            return value > threshold
        elif operator == '<':
            return value < threshold
        elif operator == '>=':
            return value >= threshold
        elif operator == '<=':
            return value <= threshold
        elif operator == '==':
            return value == threshold
        elif operator == '!=':
            return value != threshold
        else:
            return False
    
    def _monitoring_loop(self):
        """Main monitoring loop."""
        self.logger.info("Starting monitoring loop")
        
        while self.monitoring_active:
            try:
                loop_start = time.time()
                
                # Collect all metrics
                all_metrics = {
                    'system': self.collect_system_metrics(),
                    'agents': self.collect_agent_metrics(),
                    'database': self.collect_database_metrics(),
                    'api': self.collect_api_metrics(),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
                # Store metrics
                self.performance_metrics = all_metrics
                
                # Send metrics to collector
                self.metrics_collector.record_system_metrics(all_metrics)
                
                # Evaluate alerts
                self.evaluate_alert_rules(all_metrics)
                
                # Update last collection time
                self.last_metrics_collection = datetime.now(timezone.utc)
                
                # Calculate sleep time
                loop_duration = time.time() - loop_start
                sleep_time = max(0, self.config.health_check_interval - loop_duration)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")
                time.sleep(self.config.health_check_interval)
        
        self.logger.info("Monitoring loop stopped")
    
    def start_monitoring(self):
        """Start monitoring."""
        if self.monitoring_active:
            self.logger.warning("Monitoring is already active")
            return
        
        self.logger.info("Starting production monitoring")
        self.monitoring_active = True
        
        # Start monitoring thread
        self.monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            daemon=True
        )
        self.monitoring_thread.start()
        
        self.logger.info("Production monitoring started")
    
    def stop_monitoring(self):
        """Stop monitoring."""
        if not self.monitoring_active:
            self.logger.warning("Monitoring is not active")
            return
        
        self.logger.info("Stopping production monitoring")
        self.monitoring_active = False
        
        # Wait for monitoring thread to finish
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            self.monitoring_thread.join(timeout=5)
        
        self.logger.info("Production monitoring stopped")
    
    def add_alert_callback(self, callback: Callable[[Alert], None]):
        """Add alert callback function."""
        self.alert_callbacks.append(callback)
    
    def _log_alert(self, alert: Alert):
        """Log alert to system logs."""
        self.logger.warning(f"ALERT [{alert.severity.value.upper()}]: {alert.message}")
        
        # Also log to agent logger for centralized logging
        self.agent_logger.log_custom_event(
            "system_alert",
            alert.message,
            {
                "alert_rule": alert.rule_name,
                "severity": alert.severity.value,
                "metric_value": alert.metric_value,
                "threshold": alert.threshold,
                "tags": alert.tags
            }
        )
    
    def _send_email_alert(self, alert: Alert):
        """Send email alert (placeholder)."""
        # This would integrate with your email service
        self.logger.info(f"Email alert would be sent for: {alert.rule_name}")
    
    def _send_webhook_alert(self, alert: Alert):
        """Send webhook alert (placeholder)."""
        # This would send HTTP POST to webhook URL
        self.logger.info(f"Webhook alert would be sent for: {alert.rule_name}")
    
    def get_monitoring_status(self) -> Dict[str, Any]:
        """Get current monitoring status."""
        return {
            'monitoring_active': self.monitoring_active,
            'last_metrics_collection': self.last_metrics_collection.isoformat(),
            'active_alerts': len(self.active_alerts),
            'alert_history_count': len(self.alert_history),
            'alert_rules_count': len(self.config.alert_rules),
            'performance_metrics': self.performance_metrics
        }
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active alerts."""
        return [
            {
                'rule_name': alert.rule_name,
                'severity': alert.severity.value,
                'message': alert.message,
                'metric_value': alert.metric_value,
                'threshold': alert.threshold,
                'triggered_at': alert.triggered_at.isoformat(),
                'tags': alert.tags
            }
            for alert in self.active_alerts.values()
        ]


# Global monitor instance
_production_monitor = None

def get_production_monitor() -> ProductionMonitor:
    """Get global production monitor instance."""
    global _production_monitor
    if _production_monitor is None:
        _production_monitor = ProductionMonitor()
    return _production_monitor


def main():
    """Main function for running monitor as standalone service."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Production Monitoring Service')
    parser.add_argument('--config', help='Config file path')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    
    args = parser.parse_args()
    
    # Create and start monitor
    monitor = ProductionMonitor()
    
    try:
        monitor.start_monitoring()
        
        if args.daemon:
            # Run as daemon
            while monitor.monitoring_active:
                time.sleep(1)
        else:
            # Interactive mode
            print("Production monitoring started. Press Ctrl+C to stop.")
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nStopping monitoring...")
    
    finally:
        monitor.stop_monitoring()


if __name__ == '__main__':
    main()