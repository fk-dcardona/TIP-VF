"""
Automated Health Check System - Comprehensive health monitoring and automated recovery
Continuously monitors system components and implements automated recovery procedures.
"""

import asyncio
import threading
import time
import json
import subprocess
import psutil
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import logging
import sqlite3
import requests
from pathlib import Path

from ..agent_protocol.monitoring.agent_logger import get_agent_logger
from .performance_metrics_collector import get_performance_metrics_collector
from .error_tracking_system import get_error_tracking_system
from .cost_tracking_system import get_cost_tracking_system


class HealthStatus(Enum):
    """Health status levels."""
    HEALTHY = "healthy"
    WARNING = "warning"
    DEGRADED = "degraded"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class ComponentType(Enum):
    """Types of components to monitor."""
    AGENT_SYSTEM = "agent_system"
    DATABASE = "database"
    LLM_PROVIDER = "llm_provider"
    API_ENDPOINT = "api_endpoint"
    SYSTEM_RESOURCE = "system_resource"
    EXTERNAL_SERVICE = "external_service"
    MESSAGE_QUEUE = "message_queue"
    CACHE = "cache"


class RecoveryAction(Enum):
    """Automated recovery actions."""
    RESTART_SERVICE = "restart_service"
    CLEAR_CACHE = "clear_cache"
    RESTART_PROCESS = "restart_process"
    SCALE_UP = "scale_up"
    FAILOVER = "failover"
    ALERT_ONLY = "alert_only"
    CUSTOM_SCRIPT = "custom_script"


@dataclass
class HealthCheckConfig:
    """Configuration for a health check."""
    component_id: str
    component_type: ComponentType
    check_interval: int  # seconds
    timeout: int  # seconds
    retry_count: int = 3
    retry_delay: int = 5
    enabled: bool = True
    dependencies: List[str] = field(default_factory=list)
    recovery_actions: List[RecoveryAction] = field(default_factory=list)
    custom_recovery_script: Optional[str] = None
    alert_thresholds: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class HealthCheckResult:
    """Result of a health check."""
    component_id: str
    timestamp: datetime
    status: HealthStatus
    response_time_ms: float
    success: bool
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    metrics: Dict[str, float] = field(default_factory=dict)


@dataclass
class RecoveryAttempt:
    """Record of a recovery attempt."""
    id: str
    component_id: str
    action: RecoveryAction
    triggered_at: datetime
    completed_at: Optional[datetime] = None
    success: bool = False
    error: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)


class AutomatedHealthChecker:
    """Comprehensive automated health checking and recovery system."""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize automated health checker."""
        self.logger = get_agent_logger()
        self.performance_collector = get_performance_metrics_collector()
        self.error_tracker = get_error_tracking_system()
        self.cost_tracker = get_cost_tracking_system()
        
        # Database setup
        self.db_path = db_path or "database/health_checks.db"
        self._init_database()
        
        # Health check configurations
        self.health_configs: Dict[str, HealthCheckConfig] = {}
        self.check_results: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.component_statuses: Dict[str, HealthStatus] = {}
        
        # Recovery tracking
        self.recovery_attempts: deque = deque(maxlen=1000)
        self.failed_recoveries: Dict[str, int] = defaultdict(int)
        self.recovery_cooldowns: Dict[str, datetime] = {}
        
        # System metrics tracking
        self.system_health_history: deque = deque(maxlen=1000)
        self.alert_history: deque = deque(maxlen=500)
        
        # Configuration
        self.global_timeout = 30
        self.max_concurrent_checks = 10
        self.recovery_cooldown_minutes = 15
        self.max_recovery_attempts = 3
        
        # Callbacks
        self.health_callbacks: List[Callable[[HealthCheckResult], None]] = []
        self.recovery_callbacks: List[Callable[[RecoveryAttempt], None]] = []
        self.alert_callbacks: List[Callable[[str, Dict[str, Any]], None]] = []
        
        # Threading
        self.monitoring_lock = threading.RLock()
        self.monitor_thread = None
        self.recovery_thread = None
        self.monitoring_active = False
        
        # Initialize default checks and start monitoring
        self._initialize_default_health_checks()
        self._start_monitoring()
    
    def _init_database(self):
        """Initialize database for health check data."""
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Health check results table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS health_check_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    component_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    response_time_ms REAL NOT NULL,
                    success INTEGER NOT NULL,
                    message TEXT,
                    details TEXT,
                    error TEXT,
                    metrics TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Recovery attempts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recovery_attempts (
                    id TEXT PRIMARY KEY,
                    component_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    triggered_at TEXT NOT NULL,
                    completed_at TEXT,
                    success INTEGER DEFAULT 0,
                    error TEXT,
                    details TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Health configurations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS health_configs (
                    component_id TEXT PRIMARY KEY,
                    component_type TEXT NOT NULL,
                    check_interval INTEGER NOT NULL,
                    timeout INTEGER NOT NULL,
                    retry_count INTEGER DEFAULT 3,
                    retry_delay INTEGER DEFAULT 5,
                    enabled INTEGER DEFAULT 1,
                    dependencies TEXT,
                    recovery_actions TEXT,
                    custom_recovery_script TEXT,
                    alert_thresholds TEXT,
                    metadata TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_health_results_component ON health_check_results(component_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_health_results_timestamp ON health_check_results(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_recovery_attempts_component ON recovery_attempts(component_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_recovery_attempts_triggered ON recovery_attempts(triggered_at)')
            
            conn.commit()
    
    def _initialize_default_health_checks(self):
        """Initialize default health check configurations."""
        default_configs = [
            # Agent System Health
            HealthCheckConfig(
                component_id="agent_registry",
                component_type=ComponentType.AGENT_SYSTEM,
                check_interval=60,
                timeout=10,
                recovery_actions=[RecoveryAction.RESTART_SERVICE, RecoveryAction.ALERT_ONLY],
                alert_thresholds={"max_response_time": 5000, "min_success_rate": 95}
            ),
            
            # Database Health
            HealthCheckConfig(
                component_id="primary_database",
                component_type=ComponentType.DATABASE,
                check_interval=30,
                timeout=15,
                recovery_actions=[RecoveryAction.RESTART_SERVICE, RecoveryAction.FAILOVER],
                alert_thresholds={"max_response_time": 1000, "max_connection_pool_usage": 80}
            ),
            
            # LLM Provider Health
            HealthCheckConfig(
                component_id="openai_api",
                component_type=ComponentType.LLM_PROVIDER,
                check_interval=120,
                timeout=30,
                recovery_actions=[RecoveryAction.ALERT_ONLY],
                alert_thresholds={"max_response_time": 10000, "min_success_rate": 98}
            ),
            HealthCheckConfig(
                component_id="anthropic_api",
                component_type=ComponentType.LLM_PROVIDER,
                check_interval=120,
                timeout=30,
                recovery_actions=[RecoveryAction.ALERT_ONLY],
                alert_thresholds={"max_response_time": 10000, "min_success_rate": 98}
            ),
            
            # API Endpoints Health
            HealthCheckConfig(
                component_id="api_health_endpoint",
                component_type=ComponentType.API_ENDPOINT,
                check_interval=60,
                timeout=10,
                recovery_actions=[RecoveryAction.RESTART_SERVICE],
                alert_thresholds={"max_response_time": 2000, "min_success_rate": 99}
            ),
            HealthCheckConfig(
                component_id="agent_api_endpoints",
                component_type=ComponentType.API_ENDPOINT,
                check_interval=90,
                timeout=15,
                recovery_actions=[RecoveryAction.RESTART_SERVICE],
                alert_thresholds={"max_response_time": 3000, "min_success_rate": 95}
            ),
            
            # System Resources Health
            HealthCheckConfig(
                component_id="system_resources",
                component_type=ComponentType.SYSTEM_RESOURCE,
                check_interval=30,
                timeout=5,
                recovery_actions=[RecoveryAction.CLEAR_CACHE, RecoveryAction.ALERT_ONLY],
                alert_thresholds={
                    "max_cpu_usage": 80,
                    "max_memory_usage": 85,
                    "max_disk_usage": 90,
                    "min_free_memory_mb": 500
                }
            ),
            
            # External Services Health
            HealthCheckConfig(
                component_id="internet_connectivity",
                component_type=ComponentType.EXTERNAL_SERVICE,
                check_interval=300,  # 5 minutes
                timeout=10,
                recovery_actions=[RecoveryAction.ALERT_ONLY],
                alert_thresholds={"max_response_time": 5000}
            )
        ]
        
        # Load existing configs from database
        try:
            self._load_health_configs()
        except Exception as e:
            self.logger.log_error(
                "Failed to load health configs from database",
                error=str(e),
                error_type="initialization_error"
            )
        
        # Add default configs if they don't exist
        for config in default_configs:
            if config.component_id not in self.health_configs:
                self.add_health_check(config)
    
    def _start_monitoring(self):
        """Start health monitoring threads."""
        self.monitoring_active = True
        
        # Start main monitoring thread
        self.monitor_thread = threading.Thread(
            target=self._monitoring_loop,
            daemon=True
        )
        self.monitor_thread.start()
        
        # Start recovery thread
        self.recovery_thread = threading.Thread(
            target=self._recovery_loop,
            daemon=True
        )
        self.recovery_thread.start()
        
        self.logger.log_custom_event(
            "automated_health_monitoring_started",
            "Automated health monitoring started",
            {"component": "health_checker", "configs_count": len(self.health_configs)}
        )
    
    def add_health_check(self, config: HealthCheckConfig):
        """Add or update a health check configuration."""
        with self.monitoring_lock:
            self.health_configs[config.component_id] = config
            self.component_statuses[config.component_id] = HealthStatus.UNKNOWN
        
        # Store in database
        self._store_health_config(config)
        
        self.logger.log_custom_event(
            "health_check_added",
            f"Health check configured: {config.component_id}",
            {
                "component_id": config.component_id,
                "component_type": config.component_type.value,
                "check_interval": config.check_interval
            }
        )
    
    def perform_health_check(self, component_id: str) -> HealthCheckResult:
        """Perform a health check for a specific component."""
        if component_id not in self.health_configs:
            raise ValueError(f"Health check not configured for component: {component_id}")
        
        config = self.health_configs[component_id]
        start_time = time.time()
        
        try:
            # Perform the actual health check based on component type
            if config.component_type == ComponentType.AGENT_SYSTEM:
                result = self._check_agent_system_health(config)
            elif config.component_type == ComponentType.DATABASE:
                result = self._check_database_health(config)
            elif config.component_type == ComponentType.LLM_PROVIDER:
                result = self._check_llm_provider_health(config)
            elif config.component_type == ComponentType.API_ENDPOINT:
                result = self._check_api_endpoint_health(config)
            elif config.component_type == ComponentType.SYSTEM_RESOURCE:
                result = self._check_system_resource_health(config)
            elif config.component_type == ComponentType.EXTERNAL_SERVICE:
                result = self._check_external_service_health(config)
            else:
                result = HealthCheckResult(
                    component_id=component_id,
                    timestamp=datetime.now(timezone.utc),
                    status=HealthStatus.UNKNOWN,
                    response_time_ms=0,
                    success=False,
                    message="Unknown component type"
                )
            
            response_time_ms = (time.time() - start_time) * 1000
            result.response_time_ms = response_time_ms
            
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            result = HealthCheckResult(
                component_id=component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=response_time_ms,
                success=False,
                message=f"Health check failed: {str(e)}",
                error=str(e)
            )
        
        # Store result
        with self.monitoring_lock:
            self.check_results[component_id].append(result)
            self.component_statuses[component_id] = result.status
        
        # Store in database
        self._store_health_result(result)
        
        # Check if recovery is needed
        if not result.success and config.recovery_actions:
            self._trigger_recovery(config, result)
        
        # Trigger callbacks
        for callback in self.health_callbacks:
            try:
                callback(result)
            except Exception as e:
                self.logger.log_error(
                    "Error in health check callback",
                    error=str(e),
                    error_type="callback_error"
                )
        
        return result
    
    def _check_agent_system_health(self, config: HealthCheckConfig) -> HealthCheckResult:
        """Check agent system health."""
        try:
            # Get agent registry status
            from ..agent_registry import get_agent_registry
            registry = get_agent_registry()
            
            if not registry:
                return HealthCheckResult(
                    component_id=config.component_id,
                    timestamp=datetime.now(timezone.utc),
                    status=HealthStatus.CRITICAL,
                    response_time_ms=0,
                    success=False,
                    message="Agent registry not available"
                )
            
            registry_health = registry.get_registry_health()
            
            # Determine status based on registry health
            if registry_health['registry_status'] == 'healthy':
                status = HealthStatus.HEALTHY
                message = "Agent system is healthy"
            else:
                status = HealthStatus.DEGRADED
                message = f"Agent system status: {registry_health['registry_status']}"
            
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=status,
                response_time_ms=0,  # Will be set by caller
                success=status in [HealthStatus.HEALTHY, HealthStatus.WARNING],
                message=message,
                details=registry_health,
                metrics={
                    'total_agents': registry_health['agents']['total'],
                    'healthy_agents': registry_health['agents']['healthy'],
                    'uptime_seconds': registry_health['uptime_seconds']
                }
            )
            
        except Exception as e:
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                success=False,
                message=f"Agent system check failed: {str(e)}",
                error=str(e)
            )
    
    def _check_database_health(self, config: HealthCheckConfig) -> HealthCheckResult:
        """Check database health."""
        try:
            from ..models import db
            
            # Simple query to test database connectivity
            start_time = time.time()
            db.session.execute('SELECT 1')
            db.session.commit()
            query_time_ms = (time.time() - start_time) * 1000
            
            # Check if query time is acceptable
            if query_time_ms > config.alert_thresholds.get('max_response_time', 1000):
                status = HealthStatus.WARNING
                message = f"Database response time high: {query_time_ms:.1f}ms"
            else:
                status = HealthStatus.HEALTHY
                message = "Database is healthy"
            
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=status,
                response_time_ms=0,
                success=True,
                message=message,
                metrics={'query_time_ms': query_time_ms}
            )
            
        except Exception as e:
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                success=False,
                message=f"Database check failed: {str(e)}",
                error=str(e)
            )
    
    def _check_llm_provider_health(self, config: HealthCheckConfig) -> HealthCheckResult:
        """Check LLM provider health."""
        try:
            # Simple health check - try to make a minimal request
            if 'openai' in config.component_id.lower():
                # Check OpenAI API
                import openai
                from ..config.settings import settings
                
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                
                start_time = time.time()
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "ping"}],
                    max_tokens=1
                )
                response_time_ms = (time.time() - start_time) * 1000
                
                status = HealthStatus.HEALTHY
                message = "OpenAI API is healthy"
                
            elif 'anthropic' in config.component_id.lower():
                # Check Anthropic API
                import anthropic
                from ..config.settings import settings
                
                client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
                
                start_time = time.time()
                message = client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=1,
                    messages=[{"role": "user", "content": "ping"}]
                )
                response_time_ms = (time.time() - start_time) * 1000
                
                status = HealthStatus.HEALTHY
                message = "Anthropic API is healthy"
                
            else:
                raise ValueError(f"Unknown LLM provider: {config.component_id}")
            
            # Check response time threshold
            max_response_time = config.alert_thresholds.get('max_response_time', 10000)
            if response_time_ms > max_response_time:
                status = HealthStatus.WARNING
                message = f"LLM provider response time high: {response_time_ms:.1f}ms"
            
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=status,
                response_time_ms=0,
                success=True,
                message=message,
                metrics={'api_response_time_ms': response_time_ms}
            )
            
        except Exception as e:
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                success=False,
                message=f"LLM provider check failed: {str(e)}",
                error=str(e)
            )
    
    def _check_api_endpoint_health(self, config: HealthCheckConfig) -> HealthCheckResult:
        """Check API endpoint health."""
        try:
            # Determine endpoint URL
            if config.component_id == "api_health_endpoint":
                url = "http://localhost:5000/api/health"
            elif config.component_id == "agent_api_endpoints":
                url = "http://localhost:5000/api/agents/health"
            else:
                # Custom endpoint from metadata
                url = config.metadata.get('url', 'http://localhost:5000/api/health')
            
            start_time = time.time()
            response = requests.get(url, timeout=config.timeout)
            response_time_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                status = HealthStatus.HEALTHY
                message = f"API endpoint is healthy (HTTP {response.status_code})"
                success = True
            elif 400 <= response.status_code < 500:
                status = HealthStatus.WARNING
                message = f"API endpoint client error (HTTP {response.status_code})"
                success = False
            else:
                status = HealthStatus.CRITICAL
                message = f"API endpoint server error (HTTP {response.status_code})"
                success = False
            
            # Check response time threshold
            max_response_time = config.alert_thresholds.get('max_response_time', 2000)
            if response_time_ms > max_response_time and status == HealthStatus.HEALTHY:
                status = HealthStatus.WARNING
                message = f"API endpoint response time high: {response_time_ms:.1f}ms"
            
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=status,
                response_time_ms=0,
                success=success,
                message=message,
                details={'status_code': response.status_code, 'url': url},
                metrics={'http_response_time_ms': response_time_ms}
            )
            
        except requests.exceptions.RequestException as e:
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                success=False,
                message=f"API endpoint unreachable: {str(e)}",
                error=str(e)
            )
    
    def _check_system_resource_health(self, config: HealthCheckConfig) -> HealthCheckResult:
        """Check system resource health."""
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_mb = memory.available / (1024 * 1024)
            
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            # Determine overall status
            issues = []
            status = HealthStatus.HEALTHY
            
            # Check CPU threshold
            max_cpu = config.alert_thresholds.get('max_cpu_usage', 80)
            if cpu_percent > max_cpu:
                issues.append(f"High CPU usage: {cpu_percent:.1f}%")
                status = HealthStatus.WARNING if cpu_percent < 90 else HealthStatus.CRITICAL
            
            # Check memory threshold
            max_memory = config.alert_thresholds.get('max_memory_usage', 85)
            min_free_memory = config.alert_thresholds.get('min_free_memory_mb', 500)
            if memory_percent > max_memory or memory_available_mb < min_free_memory:
                issues.append(f"High memory usage: {memory_percent:.1f}% ({memory_available_mb:.0f}MB free)")
                if status != HealthStatus.CRITICAL:
                    status = HealthStatus.WARNING if memory_percent < 95 else HealthStatus.CRITICAL
            
            # Check disk threshold
            max_disk = config.alert_thresholds.get('max_disk_usage', 90)
            if disk_percent > max_disk:
                issues.append(f"High disk usage: {disk_percent:.1f}%")
                if status != HealthStatus.CRITICAL:
                    status = HealthStatus.CRITICAL
            
            if issues:
                message = f"System resource issues: {'; '.join(issues)}"
            else:
                message = "System resources are healthy"
            
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=status,
                response_time_ms=0,
                success=status in [HealthStatus.HEALTHY, HealthStatus.WARNING],
                message=message,
                details={
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory_percent,
                    'memory_available_mb': memory_available_mb,
                    'disk_percent': disk_percent
                },
                metrics={
                    'cpu_usage': cpu_percent,
                    'memory_usage': memory_percent,
                    'disk_usage': disk_percent,
                    'memory_available_mb': memory_available_mb
                }
            )
            
        except Exception as e:
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                success=False,
                message=f"System resource check failed: {str(e)}",
                error=str(e)
            )
    
    def _check_external_service_health(self, config: HealthCheckConfig) -> HealthCheckResult:
        """Check external service health."""
        try:
            # Simple internet connectivity check
            start_time = time.time()
            response = requests.get("https://httpbin.org/status/200", timeout=config.timeout)
            response_time_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                status = HealthStatus.HEALTHY
                message = "External connectivity is healthy"
                success = True
            else:
                status = HealthStatus.WARNING
                message = f"External connectivity issue (HTTP {response.status_code})"
                success = False
            
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=status,
                response_time_ms=0,
                success=success,
                message=message,
                metrics={'connectivity_response_time_ms': response_time_ms}
            )
            
        except Exception as e:
            return HealthCheckResult(
                component_id=config.component_id,
                timestamp=datetime.now(timezone.utc),
                status=HealthStatus.CRITICAL,
                response_time_ms=0,
                success=False,
                message=f"External service check failed: {str(e)}",
                error=str(e)
            )
    
    def _trigger_recovery(self, config: HealthCheckConfig, result: HealthCheckResult):
        """Trigger automated recovery for a failed component."""
        component_id = config.component_id
        
        # Check cooldown period
        if component_id in self.recovery_cooldowns:
            cooldown_end = self.recovery_cooldowns[component_id]
            if datetime.now(timezone.utc) < cooldown_end:
                self.logger.log_custom_event(
                    "recovery_skipped_cooldown",
                    f"Recovery skipped for {component_id} (cooldown active)",
                    {"component_id": component_id}
                )
                return
        
        # Check max recovery attempts
        if self.failed_recoveries[component_id] >= self.max_recovery_attempts:
            self.logger.log_custom_event(
                "recovery_max_attempts_reached",
                f"Max recovery attempts reached for {component_id}",
                {"component_id": component_id, "attempts": self.failed_recoveries[component_id]}
            )
            return
        
        # Execute recovery actions
        for action in config.recovery_actions:
            try:
                recovery_id = f"recovery_{component_id}_{int(time.time())}_{action.value}"
                
                recovery_attempt = RecoveryAttempt(
                    id=recovery_id,
                    component_id=component_id,
                    action=action,
                    triggered_at=datetime.now(timezone.utc)
                )
                
                # Execute recovery action
                if action == RecoveryAction.RESTART_SERVICE:
                    success = self._restart_service(component_id, config)
                elif action == RecoveryAction.CLEAR_CACHE:
                    success = self._clear_cache(component_id, config)
                elif action == RecoveryAction.RESTART_PROCESS:
                    success = self._restart_process(component_id, config)
                elif action == RecoveryAction.CUSTOM_SCRIPT:
                    success = self._run_custom_script(component_id, config)
                elif action == RecoveryAction.ALERT_ONLY:
                    success = self._send_alert(component_id, result)
                else:
                    success = False
                    recovery_attempt.error = f"Unsupported recovery action: {action.value}"
                
                recovery_attempt.completed_at = datetime.now(timezone.utc)
                recovery_attempt.success = success
                
                # Track recovery attempt
                with self.monitoring_lock:
                    self.recovery_attempts.append(recovery_attempt)
                
                # Store in database
                self._store_recovery_attempt(recovery_attempt)
                
                # Update recovery tracking
                if success:
                    self.failed_recoveries[component_id] = 0
                    self.logger.log_custom_event(
                        "recovery_successful",
                        f"Recovery successful for {component_id} using {action.value}",
                        {"component_id": component_id, "action": action.value}
                    )
                    break  # Stop trying other actions if one succeeds
                else:
                    self.failed_recoveries[component_id] += 1
                
                # Trigger recovery callbacks
                for callback in self.recovery_callbacks:
                    try:
                        callback(recovery_attempt)
                    except Exception as e:
                        self.logger.log_error(
                            "Error in recovery callback",
                            error=str(e),
                            error_type="callback_error"
                        )
                
            except Exception as e:
                self.logger.log_error(
                    f"Recovery action failed: {action.value}",
                    error=str(e),
                    error_type="recovery_error",
                    context={"component_id": component_id}
                )
        
        # Set cooldown period
        self.recovery_cooldowns[component_id] = (
            datetime.now(timezone.utc) + timedelta(minutes=self.recovery_cooldown_minutes)
        )
    
    def _restart_service(self, component_id: str, config: HealthCheckConfig) -> bool:
        """Restart a service (placeholder implementation)."""
        try:
            # This would contain actual service restart logic
            self.logger.log_custom_event(
                "service_restart_attempted",
                f"Attempting to restart service for {component_id}",
                {"component_id": component_id}
            )
            
            # Placeholder: In real implementation, this would restart the actual service
            # For example, using systemctl, docker restart, etc.
            
            return True
            
        except Exception as e:
            self.logger.log_error(
                "Service restart failed",
                error=str(e),
                error_type="recovery_error",
                context={"component_id": component_id}
            )
            return False
    
    def _clear_cache(self, component_id: str, config: HealthCheckConfig) -> bool:
        """Clear cache for a component."""
        try:
            # Clear various caches
            if 'system' in component_id.lower():
                # Clear system caches
                subprocess.run(['sync'], check=True)
                
                # Clear page cache (Linux)
                try:
                    subprocess.run(['sudo', 'sh', '-c', 'echo 1 > /proc/sys/vm/drop_caches'], check=True)
                except (subprocess.CalledProcessError, FileNotFoundError):
                    pass  # May not have permissions or not on Linux
            
            self.logger.log_custom_event(
                "cache_cleared",
                f"Cache cleared for {component_id}",
                {"component_id": component_id}
            )
            
            return True
            
        except Exception as e:
            self.logger.log_error(
                "Cache clear failed",
                error=str(e),
                error_type="recovery_error",
                context={"component_id": component_id}
            )
            return False
    
    def _restart_process(self, component_id: str, config: HealthCheckConfig) -> bool:
        """Restart a process (placeholder implementation)."""
        try:
            # This would contain process restart logic
            self.logger.log_custom_event(
                "process_restart_attempted",
                f"Attempting to restart process for {component_id}",
                {"component_id": component_id}
            )
            
            # Placeholder: In real implementation, this would restart the actual process
            
            return True
            
        except Exception as e:
            self.logger.log_error(
                "Process restart failed",
                error=str(e),
                error_type="recovery_error",
                context={"component_id": component_id}
            )
            return False
    
    def _run_custom_script(self, component_id: str, config: HealthCheckConfig) -> bool:
        """Run custom recovery script."""
        try:
            if not config.custom_recovery_script:
                return False
            
            result = subprocess.run(
                config.custom_recovery_script,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            success = result.returncode == 0
            
            self.logger.log_custom_event(
                "custom_script_executed",
                f"Custom recovery script executed for {component_id}",
                {
                    "component_id": component_id,
                    "success": success,
                    "return_code": result.returncode,
                    "stdout": result.stdout[:500],
                    "stderr": result.stderr[:500]
                }
            )
            
            return success
            
        except Exception as e:
            self.logger.log_error(
                "Custom script execution failed",
                error=str(e),
                error_type="recovery_error",
                context={"component_id": component_id}
            )
            return False
    
    def _send_alert(self, component_id: str, result: HealthCheckResult) -> bool:
        """Send alert for component failure."""
        try:
            alert_data = {
                "component_id": component_id,
                "status": result.status.value,
                "message": result.message,
                "timestamp": result.timestamp.isoformat(),
                "error": result.error,
                "details": result.details
            }
            
            # Trigger alert callbacks
            for callback in self.alert_callbacks:
                try:
                    callback(f"health_check_failed", alert_data)
                except Exception as e:
                    self.logger.log_error(
                        "Error in alert callback",
                        error=str(e),
                        error_type="callback_error"
                    )
            
            self.logger.log_custom_event(
                "health_alert_sent",
                f"Health alert sent for {component_id}",
                alert_data
            )
            
            return True
            
        except Exception as e:
            self.logger.log_error(
                "Alert sending failed",
                error=str(e),
                error_type="recovery_error",
                context={"component_id": component_id}
            )
            return False
    
    def get_overall_health_status(self) -> Dict[str, Any]:
        """Get overall system health status."""
        with self.monitoring_lock:
            if not self.component_statuses:
                return {
                    'overall_status': HealthStatus.UNKNOWN.value,
                    'health_score': 0,
                    'component_count': 0,
                    'healthy_components': 0,
                    'degraded_components': 0,
                    'critical_components': 0
                }
            
            status_counts = defaultdict(int)
            for status in self.component_statuses.values():
                status_counts[status] += 1
            
            total_components = len(self.component_statuses)
            healthy_count = status_counts[HealthStatus.HEALTHY]
            warning_count = status_counts[HealthStatus.WARNING]
            degraded_count = status_counts[HealthStatus.DEGRADED]
            critical_count = status_counts[HealthStatus.CRITICAL]
            
            # Calculate health score (0-100)
            health_score = (
                (healthy_count * 100 + warning_count * 75 + degraded_count * 50 + critical_count * 0) /
                total_components
            )
            
            # Determine overall status
            if critical_count > 0:
                overall_status = HealthStatus.CRITICAL
            elif degraded_count > 0:
                overall_status = HealthStatus.DEGRADED
            elif warning_count > 0:
                overall_status = HealthStatus.WARNING
            else:
                overall_status = HealthStatus.HEALTHY
            
            return {
                'overall_status': overall_status.value,
                'health_score': round(health_score, 1),
                'component_count': total_components,
                'healthy_components': healthy_count,
                'warning_components': warning_count,
                'degraded_components': degraded_count,
                'critical_components': critical_count,
                'status_breakdown': {status.value: count for status, count in status_counts.items()},
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
    
    def get_component_health_history(
        self,
        component_id: str,
        hours: int = 24
    ) -> List[HealthCheckResult]:
        """Get health check history for a component."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        with self.monitoring_lock:
            if component_id not in self.check_results:
                return []
            
            return [
                result for result in self.check_results[component_id]
                if result.timestamp >= cutoff_time
            ]
    
    def add_health_callback(self, callback: Callable[[HealthCheckResult], None]):
        """Add callback for health check events."""
        self.health_callbacks.append(callback)
    
    def add_recovery_callback(self, callback: Callable[[RecoveryAttempt], None]):
        """Add callback for recovery events."""
        self.recovery_callbacks.append(callback)
    
    def add_alert_callback(self, callback: Callable[[str, Dict[str, Any]], None]):
        """Add callback for health alerts."""
        self.alert_callbacks.append(callback)
    
    def _load_health_configs(self):
        """Load health configurations from database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM health_configs WHERE enabled = 1')
                
                for row in cursor.fetchall():
                    config = HealthCheckConfig(
                        component_id=row[0],
                        component_type=ComponentType(row[1]),
                        check_interval=row[2],
                        timeout=row[3],
                        retry_count=row[4],
                        retry_delay=row[5],
                        enabled=bool(row[6]),
                        dependencies=json.loads(row[7] or '[]'),
                        recovery_actions=[RecoveryAction(action) for action in json.loads(row[8] or '[]')],
                        custom_recovery_script=row[9],
                        alert_thresholds=json.loads(row[10] or '{}'),
                        metadata=json.loads(row[11] or '{}')
                    )
                    self.health_configs[config.component_id] = config
        
        except Exception as e:
            self.logger.log_error(
                "Failed to load health configurations",
                error=str(e),
                error_type="database_error"
            )
    
    def _store_health_config(self, config: HealthCheckConfig):
        """Store health configuration in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO health_configs (
                        component_id, component_type, check_interval, timeout,
                        retry_count, retry_delay, enabled, dependencies,
                        recovery_actions, custom_recovery_script, alert_thresholds,
                        metadata, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    config.component_id,
                    config.component_type.value,
                    config.check_interval,
                    config.timeout,
                    config.retry_count,
                    config.retry_delay,
                    1 if config.enabled else 0,
                    json.dumps(config.dependencies),
                    json.dumps([action.value for action in config.recovery_actions]),
                    config.custom_recovery_script,
                    json.dumps(config.alert_thresholds),
                    json.dumps(config.metadata),
                    datetime.now(timezone.utc).isoformat()
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store health config",
                error=str(e),
                error_type="database_error"
            )
    
    def _store_health_result(self, result: HealthCheckResult):
        """Store health check result in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO health_check_results (
                        component_id, timestamp, status, response_time_ms,
                        success, message, details, error, metrics
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    result.component_id,
                    result.timestamp.isoformat(),
                    result.status.value,
                    result.response_time_ms,
                    1 if result.success else 0,
                    result.message,
                    json.dumps(result.details),
                    result.error,
                    json.dumps(result.metrics)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store health result",
                error=str(e),
                error_type="database_error"
            )
    
    def _store_recovery_attempt(self, attempt: RecoveryAttempt):
        """Store recovery attempt in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO recovery_attempts (
                        id, component_id, action, triggered_at, completed_at,
                        success, error, details
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    attempt.id,
                    attempt.component_id,
                    attempt.action.value,
                    attempt.triggered_at.isoformat(),
                    attempt.completed_at.isoformat() if attempt.completed_at else None,
                    1 if attempt.success else 0,
                    attempt.error,
                    json.dumps(attempt.details)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store recovery attempt",
                error=str(e),
                error_type="database_error"
            )
    
    def _monitoring_loop(self):
        """Main monitoring loop."""
        while self.monitoring_active:
            try:
                current_time = datetime.now(timezone.utc)
                
                # Check each configured component
                for component_id, config in list(self.health_configs.items()):
                    if not config.enabled:
                        continue
                    
                    # Check if it's time for this component's health check
                    last_check = None
                    if component_id in self.check_results and self.check_results[component_id]:
                        last_check = self.check_results[component_id][-1].timestamp
                    
                    if (not last_check or 
                        (current_time - last_check).total_seconds() >= config.check_interval):
                        
                        try:
                            self.perform_health_check(component_id)
                        except Exception as e:
                            self.logger.log_error(
                                f"Health check failed for {component_id}",
                                error=str(e),
                                error_type="health_check_error"
                            )
                
                # Sleep for a short interval before next iteration
                time.sleep(10)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in monitoring loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(10)
    
    def _recovery_loop(self):
        """Recovery management loop."""
        while self.monitoring_active:
            try:
                # Clean up old recovery cooldowns
                current_time = datetime.now(timezone.utc)
                expired_cooldowns = [
                    component_id for component_id, cooldown_end in self.recovery_cooldowns.items()
                    if current_time >= cooldown_end
                ]
                
                for component_id in expired_cooldowns:
                    del self.recovery_cooldowns[component_id]
                
                # Reset failed recovery counts for components that have been healthy
                for component_id, status in self.component_statuses.items():
                    if status == HealthStatus.HEALTHY and component_id in self.failed_recoveries:
                        self.failed_recoveries[component_id] = 0
                
                # Sleep for 1 minute
                time.sleep(60)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in recovery loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(60)
    
    def stop_monitoring(self):
        """Stop health monitoring."""
        self.monitoring_active = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        if self.recovery_thread and self.recovery_thread.is_alive():
            self.recovery_thread.join(timeout=5)
        
        self.logger.log_custom_event(
            "automated_health_monitoring_stopped",
            "Automated health monitoring stopped",
            {"component": "health_checker"}
        )


# Global instance
_automated_health_checker = None

def get_automated_health_checker() -> AutomatedHealthChecker:
    """Get global automated health checker instance."""
    global _automated_health_checker
    if _automated_health_checker is None:
        _automated_health_checker = AutomatedHealthChecker()
    return _automated_health_checker