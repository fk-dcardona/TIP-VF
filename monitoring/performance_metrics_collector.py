"""
Performance Metrics Collection System - Advanced metrics for agent performance analysis
Collects, aggregates, and analyzes performance data across all system components.
"""

import asyncio
import threading
import time
import json
import statistics
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import logging
import psutil
import sqlite3
from pathlib import Path

from ..agent_protocol.monitoring.agent_logger import get_agent_logger


class MetricType(Enum):
    """Types of performance metrics."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"
    RATE = "rate"


class MetricLevel(Enum):
    """Metric collection levels."""
    BASIC = "basic"
    DETAILED = "detailed"
    VERBOSE = "verbose"


@dataclass
class MetricPoint:
    """Individual metric data point."""
    timestamp: datetime
    metric_name: str
    metric_type: MetricType
    value: Union[float, int]
    tags: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PerformanceProfile:
    """Performance profile for an agent or system component."""
    component_id: str
    component_type: str  # agent, system, database, api
    profiling_start: datetime
    profiling_end: Optional[datetime] = None
    execution_count: int = 0
    total_execution_time_ms: float = 0.0
    min_execution_time_ms: float = float('inf')
    max_execution_time_ms: float = 0.0
    avg_execution_time_ms: float = 0.0
    p50_execution_time_ms: float = 0.0
    p95_execution_time_ms: float = 0.0
    p99_execution_time_ms: float = 0.0
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    throughput_per_minute: float = 0.0
    error_rate_percent: float = 0.0
    success_rate_percent: float = 0.0
    bottlenecks: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)


@dataclass
class SystemResourceMetrics:
    """System resource usage metrics."""
    timestamp: datetime
    cpu_usage_percent: float
    memory_usage_percent: float
    memory_available_mb: float
    disk_usage_percent: float
    disk_io_read_mb: float
    disk_io_write_mb: float
    network_io_sent_mb: float
    network_io_recv_mb: float
    process_count: int
    thread_count: int
    open_files: int
    load_average: List[float] = field(default_factory=list)


class PerformanceMetricsCollector:
    """Advanced performance metrics collection and analysis system."""
    
    def __init__(self, db_path: Optional[str] = None, collection_level: MetricLevel = MetricLevel.DETAILED):
        """Initialize performance metrics collector."""
        self.logger = get_agent_logger()
        self.collection_level = collection_level
        
        # Database setup
        self.db_path = db_path or "database/performance_metrics.db"
        self._init_database()
        
        # In-memory storage
        self.metrics_buffer: deque = deque(maxlen=10000)
        self.performance_profiles: Dict[str, PerformanceProfile] = {}
        self.active_timers: Dict[str, datetime] = {}
        
        # Metric definitions
        self.metric_definitions = self._initialize_metric_definitions()
        
        # System monitoring
        self.system_metrics_history: deque = deque(maxlen=1000)
        self.baseline_metrics: Optional[SystemResourceMetrics] = None
        
        # Performance thresholds
        self.performance_thresholds = {
            'cpu_usage_warning': 70.0,
            'cpu_usage_critical': 85.0,
            'memory_usage_warning': 75.0,
            'memory_usage_critical': 90.0,
            'response_time_warning_ms': 5000,
            'response_time_critical_ms': 10000,
            'error_rate_warning': 5.0,
            'error_rate_critical': 10.0
        }
        
        # Collection configuration
        self.collection_interval = 30  # seconds
        self.aggregation_interval = 300  # 5 minutes
        self.retention_days = 30
        
        # Callbacks
        self.metric_callbacks: List[Callable[[MetricPoint], None]] = []
        self.performance_callbacks: List[Callable[[PerformanceProfile], None]] = []
        self.alert_callbacks: List[Callable[[str, Dict[str, Any]], None]] = []
        
        # Threading
        self.metrics_lock = threading.RLock()
        self.collection_thread = None
        self.aggregation_thread = None
        self.system_monitor_thread = None
        self.collection_active = False
        
        # Start collection
        self._start_collection()
    
    def _init_database(self):
        """Initialize database for metrics storage."""
        db_dir = os.path.dirname(self.db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    metric_name TEXT NOT NULL,
                    metric_type TEXT NOT NULL,
                    value REAL NOT NULL,
                    tags TEXT,
                    metadata TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Performance profiles table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS performance_profiles (
                    id TEXT PRIMARY KEY,
                    component_id TEXT NOT NULL,
                    component_type TEXT NOT NULL,
                    profiling_start TEXT NOT NULL,
                    profiling_end TEXT,
                    execution_count INTEGER DEFAULT 0,
                    total_execution_time_ms REAL DEFAULT 0,
                    min_execution_time_ms REAL DEFAULT 0,
                    max_execution_time_ms REAL DEFAULT 0,
                    avg_execution_time_ms REAL DEFAULT 0,
                    p50_execution_time_ms REAL DEFAULT 0,
                    p95_execution_time_ms REAL DEFAULT 0,
                    p99_execution_time_ms REAL DEFAULT 0,
                    memory_usage_mb REAL DEFAULT 0,
                    cpu_usage_percent REAL DEFAULT 0,
                    throughput_per_minute REAL DEFAULT 0,
                    error_rate_percent REAL DEFAULT 0,
                    success_rate_percent REAL DEFAULT 0,
                    bottlenecks TEXT,
                    recommendations TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # System metrics table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    cpu_usage_percent REAL,
                    memory_usage_percent REAL,
                    memory_available_mb REAL,
                    disk_usage_percent REAL,
                    disk_io_read_mb REAL,
                    disk_io_write_mb REAL,
                    network_io_sent_mb REAL,
                    network_io_recv_mb REAL,
                    process_count INTEGER,
                    thread_count INTEGER,
                    open_files INTEGER,
                    load_average TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_profiles_component ON performance_profiles(component_id)')
            
            conn.commit()
    
    def _initialize_metric_definitions(self) -> Dict[str, Dict[str, Any]]:
        """Initialize metric definitions."""
        return {
            # Agent execution metrics
            'agent.execution.duration': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'Agent execution duration'
            },
            'agent.execution.count': {
                'type': MetricType.COUNTER,
                'unit': 'count',
                'description': 'Total agent executions'
            },
            'agent.execution.success_rate': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'Agent execution success rate'
            },
            'agent.execution.error_rate': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'Agent execution error rate'
            },
            'agent.queue.size': {
                'type': MetricType.GAUGE,
                'unit': 'count',
                'description': 'Agent execution queue size'
            },
            'agent.queue.wait_time': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'Time spent waiting in queue'
            },
            
            # LLM metrics
            'llm.request.duration': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'LLM request duration'
            },
            'llm.tokens.input': {
                'type': MetricType.HISTOGRAM,
                'unit': 'count',
                'description': 'Input tokens per request'
            },
            'llm.tokens.output': {
                'type': MetricType.HISTOGRAM,
                'unit': 'count',
                'description': 'Output tokens per request'
            },
            'llm.cost.per_request': {
                'type': MetricType.HISTOGRAM,
                'unit': 'usd',
                'description': 'Cost per LLM request'
            },
            'llm.rate_limit.hit': {
                'type': MetricType.COUNTER,
                'unit': 'count',
                'description': 'Rate limit hits'
            },
            
            # Tool metrics
            'tool.execution.duration': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'Tool execution duration'
            },
            'tool.execution.count': {
                'type': MetricType.COUNTER,
                'unit': 'count',
                'description': 'Tool execution count'
            },
            'tool.error.rate': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'Tool error rate'
            },
            
            # Database metrics
            'database.query.duration': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'Database query duration'
            },
            'database.connection.pool.usage': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'Database connection pool usage'
            },
            'database.connection.pool.wait_time': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'Database connection wait time'
            },
            
            # API metrics
            'api.request.duration': {
                'type': MetricType.HISTOGRAM,
                'unit': 'milliseconds',
                'description': 'API request duration'
            },
            'api.request.count': {
                'type': MetricType.COUNTER,
                'unit': 'count',
                'description': 'API request count'
            },
            'api.response.size': {
                'type': MetricType.HISTOGRAM,
                'unit': 'bytes',
                'description': 'API response size'
            },
            
            # System metrics
            'system.cpu.usage': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'System CPU usage'
            },
            'system.memory.usage': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'System memory usage'
            },
            'system.disk.usage': {
                'type': MetricType.GAUGE,
                'unit': 'percentage',
                'description': 'System disk usage'
            }
        }
    
    def _start_collection(self):
        """Start metrics collection threads."""
        self.collection_active = True
        
        # Start metrics collection thread
        self.collection_thread = threading.Thread(
            target=self._collection_loop,
            daemon=True
        )
        self.collection_thread.start()
        
        # Start aggregation thread
        self.aggregation_thread = threading.Thread(
            target=self._aggregation_loop,
            daemon=True
        )
        self.aggregation_thread.start()
        
        # Start system monitoring thread
        self.system_monitor_thread = threading.Thread(
            target=self._system_monitor_loop,
            daemon=True
        )
        self.system_monitor_thread.start()
        
        self.logger.log_custom_event(
            "performance_monitoring_started",
            "Performance metrics collection started",
            {"component": "performance_metrics", "level": self.collection_level.value}
        )
    
    def record_metric(
        self,
        metric_name: str,
        value: Union[float, int],
        tags: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Record a performance metric."""
        if metric_name not in self.metric_definitions:
            self.logger.log_warning(
                f"Unknown metric: {metric_name}",
                context={"metric_name": metric_name}
            )
        
        metric_def = self.metric_definitions.get(metric_name, {})
        metric_type = metric_def.get('type', MetricType.GAUGE)
        
        point = MetricPoint(
            timestamp=datetime.now(timezone.utc),
            metric_name=metric_name,
            metric_type=metric_type,
            value=float(value),
            tags=tags or {},
            metadata=metadata or {}
        )
        
        with self.metrics_lock:
            self.metrics_buffer.append(point)
        
        # Trigger callbacks
        for callback in self.metric_callbacks:
            try:
                callback(point)
            except Exception as e:
                self.logger.log_error(
                    "Error in metric callback",
                    error=str(e),
                    error_type="callback_error"
                )
        
        # Store in database (for detailed collection level)
        if self.collection_level in [MetricLevel.DETAILED, MetricLevel.VERBOSE]:
            self._store_metric(point)
    
    def start_timer(self, timer_id: str) -> str:
        """Start a performance timer."""
        with self.metrics_lock:
            self.active_timers[timer_id] = datetime.now(timezone.utc)
        return timer_id
    
    def stop_timer(
        self,
        timer_id: str,
        metric_name: str,
        tags: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[float]:
        """Stop a performance timer and record the duration."""
        with self.metrics_lock:
            if timer_id not in self.active_timers:
                return None
            
            start_time = self.active_timers.pop(timer_id)
            duration_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
            
            self.record_metric(metric_name, duration_ms, tags, metadata)
            return duration_ms
    
    def start_performance_profiling(
        self,
        component_id: str,
        component_type: str
    ) -> PerformanceProfile:
        """Start performance profiling for a component."""
        profile = PerformanceProfile(
            component_id=component_id,
            component_type=component_type,
            profiling_start=datetime.now(timezone.utc)
        )
        
        with self.metrics_lock:
            self.performance_profiles[component_id] = profile
        
        self.logger.log_custom_event(
            "performance_profiling_started",
            f"Started profiling: {component_id}",
            {
                "component_id": component_id,
                "component_type": component_type
            }
        )
        
        return profile
    
    def update_performance_profile(
        self,
        component_id: str,
        execution_time_ms: Optional[float] = None,
        memory_usage_mb: Optional[float] = None,
        cpu_usage_percent: Optional[float] = None,
        success: Optional[bool] = None,
        error: Optional[str] = None
    ):
        """Update performance profile with new data."""
        with self.metrics_lock:
            if component_id not in self.performance_profiles:
                return
            
            profile = self.performance_profiles[component_id]
            
            if execution_time_ms is not None:
                profile.execution_count += 1
                profile.total_execution_time_ms += execution_time_ms
                profile.min_execution_time_ms = min(profile.min_execution_time_ms, execution_time_ms)
                profile.max_execution_time_ms = max(profile.max_execution_time_ms, execution_time_ms)
                profile.avg_execution_time_ms = profile.total_execution_time_ms / profile.execution_count
            
            if memory_usage_mb is not None:
                profile.memory_usage_mb = memory_usage_mb
            
            if cpu_usage_percent is not None:
                profile.cpu_usage_percent = cpu_usage_percent
            
            if success is not None:
                # Update success/error rates (simplified calculation)
                if success:
                    profile.success_rate_percent = (
                        (profile.success_rate_percent * (profile.execution_count - 1) + 100) /
                        profile.execution_count
                    )
                else:
                    profile.error_rate_percent = (
                        (profile.error_rate_percent * (profile.execution_count - 1) + 100) /
                        profile.execution_count
                    )
    
    def finish_performance_profiling(self, component_id: str) -> Optional[PerformanceProfile]:
        """Finish performance profiling and generate analysis."""
        with self.metrics_lock:
            if component_id not in self.performance_profiles:
                return None
            
            profile = self.performance_profiles[component_id]
            profile.profiling_end = datetime.now(timezone.utc)
            
            # Calculate percentiles if we have execution times
            if profile.execution_count > 0:
                # Get recent execution times for percentile calculation
                execution_times = self._get_recent_execution_times(component_id)
                
                if execution_times:
                    execution_times.sort()
                    profile.p50_execution_time_ms = self._percentile(execution_times, 50)
                    profile.p95_execution_time_ms = self._percentile(execution_times, 95)
                    profile.p99_execution_time_ms = self._percentile(execution_times, 99)
                
                # Calculate throughput
                profiling_duration_minutes = (
                    profile.profiling_end - profile.profiling_start
                ).total_seconds() / 60
                
                if profiling_duration_minutes > 0:
                    profile.throughput_per_minute = profile.execution_count / profiling_duration_minutes
            
            # Generate performance analysis
            self._analyze_performance(profile)
            
            # Store profile
            self._store_performance_profile(profile)
            
            # Trigger callbacks
            for callback in self.performance_callbacks:
                try:
                    callback(profile)
                except Exception as e:
                    self.logger.log_error(
                        "Error in performance callback",
                        error=str(e),
                        error_type="callback_error"
                    )
            
            self.logger.log_custom_event(
                "performance_profiling_completed",
                f"Completed profiling: {component_id}",
                {
                    "component_id": component_id,
                    "execution_count": profile.execution_count,
                    "avg_execution_time_ms": profile.avg_execution_time_ms,
                    "success_rate": profile.success_rate_percent,
                    "throughput_per_minute": profile.throughput_per_minute
                }
            )
            
            return profile
    
    def collect_system_metrics(self) -> SystemResourceMetrics:
        """Collect current system resource metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_mb = memory.available / (1024 * 1024)
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            
            # Disk I/O
            disk_io = psutil.disk_io_counters()
            disk_io_read_mb = disk_io.read_bytes / (1024 * 1024) if disk_io else 0
            disk_io_write_mb = disk_io.write_bytes / (1024 * 1024) if disk_io else 0
            
            # Network I/O
            network_io = psutil.net_io_counters()
            network_sent_mb = network_io.bytes_sent / (1024 * 1024) if network_io else 0
            network_recv_mb = network_io.bytes_recv / (1024 * 1024) if network_io else 0
            
            # Process metrics
            process_count = len(psutil.pids())
            
            # Thread count (current process)
            current_process = psutil.Process()
            thread_count = current_process.num_threads()
            open_files = len(current_process.open_files())
            
            # Load average (Unix systems)
            try:
                load_average = list(psutil.getloadavg())
            except AttributeError:
                load_average = [0.0, 0.0, 0.0]
            
            metrics = SystemResourceMetrics(
                timestamp=datetime.now(timezone.utc),
                cpu_usage_percent=cpu_percent,
                memory_usage_percent=memory_percent,
                memory_available_mb=memory_available_mb,
                disk_usage_percent=disk_percent,
                disk_io_read_mb=disk_io_read_mb,
                disk_io_write_mb=disk_io_write_mb,
                network_io_sent_mb=network_sent_mb,
                network_io_recv_mb=network_recv_mb,
                process_count=process_count,
                thread_count=thread_count,
                open_files=open_files,
                load_average=load_average
            )
            
            # Store metrics
            with self.metrics_lock:
                self.system_metrics_history.append(metrics)
            
            # Record individual metrics
            self.record_metric('system.cpu.usage', cpu_percent, {'component': 'system'})
            self.record_metric('system.memory.usage', memory_percent, {'component': 'system'})
            self.record_metric('system.disk.usage', disk_percent, {'component': 'system'})
            
            # Check for performance alerts
            self._check_performance_thresholds(metrics)
            
            return metrics
            
        except Exception as e:
            self.logger.log_error(
                "Failed to collect system metrics",
                error=str(e),
                error_type="metrics_error"
            )
            
            # Return empty metrics
            return SystemResourceMetrics(
                timestamp=datetime.now(timezone.utc),
                cpu_usage_percent=0.0,
                memory_usage_percent=0.0,
                memory_available_mb=0.0,
                disk_usage_percent=0.0,
                disk_io_read_mb=0.0,
                disk_io_write_mb=0.0,
                network_io_sent_mb=0.0,
                network_io_recv_mb=0.0,
                process_count=0,
                thread_count=0,
                open_files=0,
                load_average=[0.0, 0.0, 0.0]
            )
    
    def get_performance_summary(
        self,
        component_id: Optional[str] = None,
        component_type: Optional[str] = None,
        time_range: Optional[timedelta] = None
    ) -> Dict[str, Any]:
        """Get performance summary for components."""
        time_range = time_range or timedelta(hours=24)
        cutoff_time = datetime.now(timezone.utc) - time_range
        
        # Get relevant metrics
        relevant_metrics = []
        with self.metrics_lock:
            for metric in self.metrics_buffer:
                if metric.timestamp >= cutoff_time:
                    if component_id and metric.tags.get('component_id') != component_id:
                        continue
                    if component_type and metric.tags.get('component_type') != component_type:
                        continue
                    relevant_metrics.append(metric)
        
        # Aggregate metrics by name
        metric_aggregates = defaultdict(list)
        for metric in relevant_metrics:
            metric_aggregates[metric.metric_name].append(metric.value)
        
        # Calculate statistics
        summary = {}
        for metric_name, values in metric_aggregates.items():
            if values:
                summary[metric_name] = {
                    'count': len(values),
                    'min': min(values),
                    'max': max(values),
                    'avg': statistics.mean(values),
                    'median': statistics.median(values),
                    'std_dev': statistics.stdev(values) if len(values) > 1 else 0.0
                }
                
                # Add percentiles for histograms
                if len(values) >= 5:
                    sorted_values = sorted(values)
                    summary[metric_name].update({
                        'p50': self._percentile(sorted_values, 50),
                        'p95': self._percentile(sorted_values, 95),
                        'p99': self._percentile(sorted_values, 99)
                    })
        
        return {
            'time_range_hours': time_range.total_seconds() / 3600,
            'component_id': component_id,
            'component_type': component_type,
            'metrics': summary,
            'total_data_points': len(relevant_metrics)
        }
    
    def get_system_health_score(self) -> Dict[str, Any]:
        """Calculate overall system health score."""
        if not self.system_metrics_history:
            return {'health_score': 0, 'status': 'unknown', 'details': {}}
        
        # Get recent metrics (last 10 minutes)
        recent_cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
        recent_metrics = [
            m for m in self.system_metrics_history
            if m.timestamp >= recent_cutoff
        ]
        
        if not recent_metrics:
            return {'health_score': 0, 'status': 'unknown', 'details': {}}
        
        # Calculate average metrics
        avg_cpu = statistics.mean(m.cpu_usage_percent for m in recent_metrics)
        avg_memory = statistics.mean(m.memory_usage_percent for m in recent_metrics)
        avg_disk = statistics.mean(m.disk_usage_percent for m in recent_metrics)
        
        # Calculate health scores (0-100)
        cpu_score = max(0, 100 - avg_cpu)
        memory_score = max(0, 100 - avg_memory)
        disk_score = max(0, 100 - avg_disk)
        
        # Weighted overall score
        health_score = (cpu_score * 0.4 + memory_score * 0.4 + disk_score * 0.2)
        
        # Determine status
        if health_score >= 80:
            status = 'excellent'
        elif health_score >= 60:
            status = 'good'
        elif health_score >= 40:
            status = 'fair'
        elif health_score >= 20:
            status = 'poor'
        else:
            status = 'critical'
        
        return {
            'health_score': round(health_score, 1),
            'status': status,
            'details': {
                'cpu_usage': round(avg_cpu, 1),
                'memory_usage': round(avg_memory, 1),
                'disk_usage': round(avg_disk, 1),
                'cpu_score': round(cpu_score, 1),
                'memory_score': round(memory_score, 1),
                'disk_score': round(disk_score, 1)
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def add_metric_callback(self, callback: Callable[[MetricPoint], None]):
        """Add callback for metric events."""
        self.metric_callbacks.append(callback)
    
    def add_performance_callback(self, callback: Callable[[PerformanceProfile], None]):
        """Add callback for performance profiling events."""
        self.performance_callbacks.append(callback)
    
    def add_alert_callback(self, callback: Callable[[str, Dict[str, Any]], None]):
        """Add callback for performance alerts."""
        self.alert_callbacks.append(callback)
    
    def _percentile(self, values: List[float], percentile: float) -> float:
        """Calculate percentile of values."""
        if not values:
            return 0.0
        
        k = (len(values) - 1) * (percentile / 100)
        f = int(k)
        c = k - f
        
        if f + 1 < len(values):
            return values[f] * (1 - c) + values[f + 1] * c
        else:
            return values[f]
    
    def _get_recent_execution_times(self, component_id: str, limit: int = 100) -> List[float]:
        """Get recent execution times for a component."""
        execution_times = []
        
        with self.metrics_lock:
            for metric in reversed(self.metrics_buffer):
                if (metric.metric_name.endswith('.duration') and
                    metric.tags.get('component_id') == component_id):
                    execution_times.append(metric.value)
                    
                    if len(execution_times) >= limit:
                        break
        
        return execution_times
    
    def _analyze_performance(self, profile: PerformanceProfile):
        """Analyze performance profile and generate recommendations."""
        bottlenecks = []
        recommendations = []
        
        # Analyze execution time
        if profile.avg_execution_time_ms > self.performance_thresholds['response_time_critical_ms']:
            bottlenecks.append("High average execution time")
            recommendations.append("Optimize agent logic and reduce complexity")
        
        if profile.max_execution_time_ms > profile.avg_execution_time_ms * 3:
            bottlenecks.append("High execution time variance")
            recommendations.append("Investigate outlier executions for performance issues")
        
        # Analyze error rate
        if profile.error_rate_percent > self.performance_thresholds['error_rate_critical']:
            bottlenecks.append("High error rate")
            recommendations.append("Review error handling and input validation")
        
        # Analyze throughput
        if profile.throughput_per_minute < 1.0:
            bottlenecks.append("Low throughput")
            recommendations.append("Consider parallelization or caching strategies")
        
        # Analyze resource usage
        if profile.memory_usage_mb > 500:  # 500MB threshold
            bottlenecks.append("High memory usage")
            recommendations.append("Optimize memory usage and implement garbage collection")
        
        if profile.cpu_usage_percent > 80:
            bottlenecks.append("High CPU usage")
            recommendations.append("Optimize CPU-intensive operations")
        
        profile.bottlenecks = bottlenecks
        profile.recommendations = recommendations
    
    def _check_performance_thresholds(self, metrics: SystemResourceMetrics):
        """Check performance thresholds and trigger alerts."""
        alerts = []
        
        # CPU usage alerts
        if metrics.cpu_usage_percent >= self.performance_thresholds['cpu_usage_critical']:
            alerts.append({
                'type': 'cpu_critical',
                'message': f"Critical CPU usage: {metrics.cpu_usage_percent:.1f}%",
                'value': metrics.cpu_usage_percent,
                'threshold': self.performance_thresholds['cpu_usage_critical']
            })
        elif metrics.cpu_usage_percent >= self.performance_thresholds['cpu_usage_warning']:
            alerts.append({
                'type': 'cpu_warning',
                'message': f"High CPU usage: {metrics.cpu_usage_percent:.1f}%",
                'value': metrics.cpu_usage_percent,
                'threshold': self.performance_thresholds['cpu_usage_warning']
            })
        
        # Memory usage alerts
        if metrics.memory_usage_percent >= self.performance_thresholds['memory_usage_critical']:
            alerts.append({
                'type': 'memory_critical',
                'message': f"Critical memory usage: {metrics.memory_usage_percent:.1f}%",
                'value': metrics.memory_usage_percent,
                'threshold': self.performance_thresholds['memory_usage_critical']
            })
        elif metrics.memory_usage_percent >= self.performance_thresholds['memory_usage_warning']:
            alerts.append({
                'type': 'memory_warning',
                'message': f"High memory usage: {metrics.memory_usage_percent:.1f}%",
                'value': metrics.memory_usage_percent,
                'threshold': self.performance_thresholds['memory_usage_warning']
            })
        
        # Trigger alert callbacks
        for alert in alerts:
            for callback in self.alert_callbacks:
                try:
                    callback(alert['type'], alert)
                except Exception as e:
                    self.logger.log_error(
                        "Error in performance alert callback",
                        error=str(e),
                        error_type="callback_error"
                    )
    
    def _store_metric(self, metric: MetricPoint):
        """Store metric in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO metrics (
                        timestamp, metric_name, metric_type, value, tags, metadata
                    ) VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    metric.timestamp.isoformat(),
                    metric.metric_name,
                    metric.metric_type.value,
                    metric.value,
                    json.dumps(metric.tags),
                    json.dumps(metric.metadata)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store metric",
                error=str(e),
                error_type="database_error"
            )
    
    def _store_performance_profile(self, profile: PerformanceProfile):
        """Store performance profile in database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO performance_profiles (
                        id, component_id, component_type, profiling_start, profiling_end,
                        execution_count, total_execution_time_ms, min_execution_time_ms,
                        max_execution_time_ms, avg_execution_time_ms, p50_execution_time_ms,
                        p95_execution_time_ms, p99_execution_time_ms, memory_usage_mb,
                        cpu_usage_percent, throughput_per_minute, error_rate_percent,
                        success_rate_percent, bottlenecks, recommendations
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    profile.component_id,
                    profile.component_id,
                    profile.component_type,
                    profile.profiling_start.isoformat(),
                    profile.profiling_end.isoformat() if profile.profiling_end else None,
                    profile.execution_count,
                    profile.total_execution_time_ms,
                    profile.min_execution_time_ms if profile.min_execution_time_ms != float('inf') else 0,
                    profile.max_execution_time_ms,
                    profile.avg_execution_time_ms,
                    profile.p50_execution_time_ms,
                    profile.p95_execution_time_ms,
                    profile.p99_execution_time_ms,
                    profile.memory_usage_mb,
                    profile.cpu_usage_percent,
                    profile.throughput_per_minute,
                    profile.error_rate_percent,
                    profile.success_rate_percent,
                    json.dumps(profile.bottlenecks),
                    json.dumps(profile.recommendations)
                ))
                conn.commit()
        except Exception as e:
            self.logger.log_error(
                "Failed to store performance profile",
                error=str(e),
                error_type="database_error"
            )
    
    def _collection_loop(self):
        """Main metrics collection loop."""
        while self.collection_active:
            try:
                # Flush metrics buffer to database
                if self.collection_level in [MetricLevel.DETAILED, MetricLevel.VERBOSE]:
                    with self.metrics_lock:
                        metrics_to_store = list(self.metrics_buffer)
                        self.metrics_buffer.clear()
                    
                    for metric in metrics_to_store:
                        self._store_metric(metric)
                
                time.sleep(self.collection_interval)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in metrics collection loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(self.collection_interval)
    
    def _aggregation_loop(self):
        """Metrics aggregation loop."""
        while self.collection_active:
            try:
                # Aggregate metrics (placeholder for future implementation)
                # This could calculate hourly/daily aggregates
                
                time.sleep(self.aggregation_interval)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in metrics aggregation loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(self.aggregation_interval)
    
    def _system_monitor_loop(self):
        """System monitoring loop."""
        while self.collection_active:
            try:
                self.collect_system_metrics()
                time.sleep(self.collection_interval)
                
            except Exception as e:
                self.logger.log_error(
                    "Error in system monitoring loop",
                    error=str(e),
                    error_type="monitoring_error"
                )
                time.sleep(self.collection_interval)
    
    def stop_collection(self):
        """Stop metrics collection."""
        self.collection_active = False
        
        if self.collection_thread and self.collection_thread.is_alive():
            self.collection_thread.join(timeout=5)
        
        if self.aggregation_thread and self.aggregation_thread.is_alive():
            self.aggregation_thread.join(timeout=5)
        
        if self.system_monitor_thread and self.system_monitor_thread.is_alive():
            self.system_monitor_thread.join(timeout=5)
        
        self.logger.log_custom_event(
            "performance_monitoring_stopped",
            "Performance metrics collection stopped",
            {"component": "performance_metrics"}
        )


# Global instance
_performance_metrics_collector = None

def get_performance_metrics_collector() -> PerformanceMetricsCollector:
    """Get global performance metrics collector instance."""
    global _performance_metrics_collector
    if _performance_metrics_collector is None:
        _performance_metrics_collector = PerformanceMetricsCollector()
    return _performance_metrics_collector