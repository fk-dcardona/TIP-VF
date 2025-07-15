"""Metrics collection and analysis for agent performance."""

import time
import threading
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from collections import defaultdict, deque
import statistics
import json
from pathlib import Path

from ..core.agent_types import AgentType


@dataclass
class MetricSnapshot:
    """Single metric measurement."""
    timestamp: datetime
    agent_id: str
    agent_type: str
    metric_name: str
    value: Union[float, int]
    unit: str
    labels: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'agent_id': self.agent_id,
            'agent_type': self.agent_type,
            'metric_name': self.metric_name,
            'value': self.value,
            'unit': self.unit,
            'labels': self.labels
        }


@dataclass
class AgentMetrics:
    """Aggregated metrics for an agent."""
    agent_id: str
    agent_type: str
    
    # Execution metrics
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    avg_execution_time_ms: float = 0.0
    
    # LLM metrics
    total_llm_calls: int = 0
    total_tokens_used: int = 0
    total_llm_cost: float = 0.0
    avg_llm_latency_ms: float = 0.0
    
    # Tool metrics
    total_tool_calls: int = 0
    tool_success_rate: float = 0.0
    
    # Performance metrics
    avg_confidence_score: float = 0.0
    quality_score: float = 0.0
    
    # Time-based metrics
    executions_per_hour: float = 0.0
    peak_usage_hour: Optional[int] = None
    
    # Last updated
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage."""
        if self.total_executions == 0:
            return 0.0
        return (self.successful_executions / self.total_executions) * 100
    
    @property
    def avg_cost_per_execution(self) -> float:
        """Calculate average cost per execution."""
        if self.successful_executions == 0:
            return 0.0
        return self.total_llm_cost / self.successful_executions
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'agent_id': self.agent_id,
            'agent_type': self.agent_type,
            'total_executions': self.total_executions,
            'successful_executions': self.successful_executions,
            'failed_executions': self.failed_executions,
            'success_rate': self.success_rate,
            'avg_execution_time_ms': self.avg_execution_time_ms,
            'total_llm_calls': self.total_llm_calls,
            'total_tokens_used': self.total_tokens_used,
            'total_llm_cost': self.total_llm_cost,
            'avg_llm_latency_ms': self.avg_llm_latency_ms,
            'avg_cost_per_execution': self.avg_cost_per_execution,
            'total_tool_calls': self.total_tool_calls,
            'tool_success_rate': self.tool_success_rate,
            'avg_confidence_score': self.avg_confidence_score,
            'quality_score': self.quality_score,
            'executions_per_hour': self.executions_per_hour,
            'peak_usage_hour': self.peak_usage_hour,
            'last_updated': self.last_updated.isoformat()
        }


class MetricsCollector:
    """Comprehensive metrics collection and analysis system."""
    
    def __init__(self, retention_hours: int = 24, export_interval: int = 300):
        """Initialize metrics collector."""
        self.retention_hours = retention_hours
        self.export_interval = export_interval  # seconds
        
        # Thread-safe storage
        self._lock = threading.RLock()
        
        # Raw metrics storage (time-series data)
        self._metrics: List[MetricSnapshot] = []
        
        # Aggregated metrics per agent
        self._agent_metrics: Dict[str, AgentMetrics] = {}
        
        # Time-series buckets for performance analysis
        self._execution_times: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self._llm_latencies: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self._confidence_scores: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        
        # Hourly usage tracking
        self._hourly_usage: Dict[str, Dict[int, int]] = defaultdict(lambda: defaultdict(int))
        
        # System-wide metrics
        self._system_metrics = {
            'total_agents': 0,
            'active_agents': set(),
            'total_executions_today': 0,
            'total_cost_today': 0.0,
            'avg_system_load': 0.0
        }
        
        # Start background export thread
        self._export_thread = threading.Thread(target=self._export_loop, daemon=True)
        self._export_thread.start()
    
    def record_metric(self, agent_id: str, agent_type: AgentType, metric_name: str, 
                     value: Union[float, int], unit: str = "", labels: Dict[str, str] = None):
        """Record a single metric measurement."""
        snapshot = MetricSnapshot(
            timestamp=datetime.now(timezone.utc),
            agent_id=agent_id,
            agent_type=agent_type.value,
            metric_name=metric_name,
            value=value,
            unit=unit,
            labels=labels or {}
        )
        
        with self._lock:
            self._metrics.append(snapshot)
            self._cleanup_old_metrics()
            
            # Update aggregated metrics
            self._update_agent_metrics(agent_id, agent_type, metric_name, value, labels)
    
    def record_execution_start(self, agent_id: str, agent_type: AgentType, execution_id: str):
        """Record execution start."""
        self.record_metric(
            agent_id, agent_type, "execution_start", 1, "count",
            {"execution_id": execution_id}
        )
        
        with self._lock:
            self._system_metrics['active_agents'].add(agent_id)
    
    def record_execution_end(self, agent_id: str, agent_type: AgentType, execution_id: str,
                           success: bool, duration_ms: int, confidence: float = None):
        """Record execution completion."""
        # Record execution metrics
        self.record_metric(
            agent_id, agent_type, "execution_duration", duration_ms, "ms",
            {"execution_id": execution_id, "success": str(success)}
        )
        
        self.record_metric(
            agent_id, agent_type, "execution_complete", 1, "count",
            {"execution_id": execution_id, "success": str(success)}
        )
        
        if confidence is not None:
            self.record_metric(
                agent_id, agent_type, "confidence_score", confidence, "score",
                {"execution_id": execution_id}
            )
        
        with self._lock:
            # Update time-series data
            self._execution_times[agent_id].append(duration_ms)
            if confidence is not None:
                self._confidence_scores[agent_id].append(confidence)
            
            # Update hourly usage
            hour = datetime.now(timezone.utc).hour
            self._hourly_usage[agent_id][hour] += 1
            
            # Update system metrics
            self._system_metrics['total_executions_today'] += 1
    
    def record_llm_call(self, agent_id: str, agent_type: AgentType, provider: str,
                       model: str, tokens_used: int, latency_ms: int, cost: float = None):
        """Record LLM API call metrics."""
        self.record_metric(
            agent_id, agent_type, "llm_tokens", tokens_used, "tokens",
            {"provider": provider, "model": model}
        )
        
        self.record_metric(
            agent_id, agent_type, "llm_latency", latency_ms, "ms",
            {"provider": provider, "model": model}
        )
        
        if cost is not None:
            self.record_metric(
                agent_id, agent_type, "llm_cost", cost, "usd",
                {"provider": provider, "model": model}
            )
            
            with self._lock:
                self._system_metrics['total_cost_today'] += cost
        
        with self._lock:
            self._llm_latencies[agent_id].append(latency_ms)
    
    def record_tool_call(self, agent_id: str, agent_type: AgentType, tool_name: str,
                        success: bool, duration_ms: int = None):
        """Record tool call metrics."""
        self.record_metric(
            agent_id, agent_type, "tool_call", 1, "count",
            {"tool_name": tool_name, "success": str(success)}
        )
        
        if duration_ms is not None:
            self.record_metric(
                agent_id, agent_type, "tool_duration", duration_ms, "ms",
                {"tool_name": tool_name}
            )
    
    def _update_agent_metrics(self, agent_id: str, agent_type: AgentType, 
                             metric_name: str, value: Union[float, int], labels: Dict[str, str]):
        """Update aggregated agent metrics."""
        if agent_id not in self._agent_metrics:
            self._agent_metrics[agent_id] = AgentMetrics(agent_id, agent_type.value)
        
        metrics = self._agent_metrics[agent_id]
        
        if metric_name == "execution_start":
            metrics.total_executions += 1
        elif metric_name == "execution_complete":
            if labels.get("success") == "True":
                metrics.successful_executions += 1
            else:
                metrics.failed_executions += 1
        elif metric_name == "execution_duration":
            # Update average execution time
            if metrics.total_executions > 0:
                current_avg = metrics.avg_execution_time_ms
                count = metrics.total_executions
                metrics.avg_execution_time_ms = ((current_avg * (count - 1)) + value) / count
        elif metric_name == "llm_tokens":
            metrics.total_llm_calls += 1
            metrics.total_tokens_used += value
        elif metric_name == "llm_latency":
            # Update average LLM latency
            if metrics.total_llm_calls > 0:
                current_avg = metrics.avg_llm_latency_ms
                count = metrics.total_llm_calls
                metrics.avg_llm_latency_ms = ((current_avg * (count - 1)) + value) / count
        elif metric_name == "llm_cost":
            metrics.total_llm_cost += value
        elif metric_name == "tool_call":
            metrics.total_tool_calls += 1
        elif metric_name == "confidence_score":
            # Update average confidence
            if metrics.successful_executions > 0:
                current_avg = metrics.avg_confidence_score
                count = metrics.successful_executions
                metrics.avg_confidence_score = ((current_avg * (count - 1)) + value) / count
        
        metrics.last_updated = datetime.now(timezone.utc)
    
    def get_agent_metrics(self, agent_id: str) -> Optional[AgentMetrics]:
        """Get metrics for specific agent."""
        with self._lock:
            return self._agent_metrics.get(agent_id)
    
    def get_all_agent_metrics(self) -> Dict[str, AgentMetrics]:
        """Get metrics for all agents."""
        with self._lock:
            return self._agent_metrics.copy()
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system-wide metrics."""
        with self._lock:
            metrics = self._system_metrics.copy()
            metrics['active_agents'] = len(metrics['active_agents'])
            metrics['total_agents'] = len(self._agent_metrics)
            
            # Calculate performance indicators
            if self._agent_metrics:
                success_rates = [m.success_rate for m in self._agent_metrics.values()]
                metrics['avg_success_rate'] = statistics.mean(success_rates) if success_rates else 0.0
                
                avg_execution_times = [m.avg_execution_time_ms for m in self._agent_metrics.values() 
                                     if m.avg_execution_time_ms > 0]
                metrics['avg_execution_time_ms'] = statistics.mean(avg_execution_times) if avg_execution_times else 0.0
            
            return metrics
    
    def get_performance_trends(self, agent_id: str, hours: int = 24) -> Dict[str, Any]:
        """Get performance trends for an agent."""
        with self._lock:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            # Filter metrics for time range
            recent_metrics = [
                m for m in self._metrics 
                if m.agent_id == agent_id and m.timestamp >= cutoff_time
            ]
            
            if not recent_metrics:
                return {"agent_id": agent_id, "trends": {}}
            
            # Group metrics by type
            metrics_by_type = defaultdict(list)
            for metric in recent_metrics:
                metrics_by_type[metric.metric_name].append(metric)
            
            trends = {}
            for metric_name, metric_list in metrics_by_type.items():
                values = [m.value for m in metric_list]
                if values:
                    trends[metric_name] = {
                        "count": len(values),
                        "avg": statistics.mean(values),
                        "min": min(values),
                        "max": max(values),
                        "latest": values[-1],
                        "trend": "up" if len(values) > 1 and values[-1] > values[0] else "down"
                    }
            
            return {
                "agent_id": agent_id,
                "time_range_hours": hours,
                "trends": trends
            }
    
    def get_usage_patterns(self, agent_id: str = None) -> Dict[str, Any]:
        """Get usage patterns (hourly distribution)."""
        with self._lock:
            if agent_id:
                hourly_data = self._hourly_usage.get(agent_id, {})
                agent_ids = [agent_id]
            else:
                # Aggregate all agents
                hourly_data = defaultdict(int)
                for agent_usage in self._hourly_usage.values():
                    for hour, count in agent_usage.items():
                        hourly_data[hour] += count
                agent_ids = list(self._hourly_usage.keys())
            
            # Find peak usage hour
            peak_hour = max(hourly_data.items(), key=lambda x: x[1])[0] if hourly_data else None
            
            return {
                "agent_ids": agent_ids,
                "hourly_distribution": dict(hourly_data),
                "peak_hour": peak_hour,
                "total_executions": sum(hourly_data.values()),
                "avg_executions_per_hour": statistics.mean(hourly_data.values()) if hourly_data else 0.0
            }
    
    def get_cost_analysis(self, hours: int = 24) -> Dict[str, Any]:
        """Get cost analysis across all agents."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        with self._lock:
            cost_metrics = [
                m for m in self._metrics 
                if m.metric_name == "llm_cost" and m.timestamp >= cutoff_time
            ]
            
            if not cost_metrics:
                return {"total_cost": 0.0, "cost_by_agent": {}, "cost_by_provider": {}}
            
            # Aggregate by agent
            cost_by_agent = defaultdict(float)
            cost_by_provider = defaultdict(float)
            
            for metric in cost_metrics:
                cost_by_agent[metric.agent_id] += metric.value
                provider = metric.labels.get("provider", "unknown")
                cost_by_provider[provider] += metric.value
            
            total_cost = sum(cost_by_agent.values())
            
            return {
                "time_range_hours": hours,
                "total_cost": total_cost,
                "cost_by_agent": dict(cost_by_agent),
                "cost_by_provider": dict(cost_by_provider),
                "avg_cost_per_agent": total_cost / len(cost_by_agent) if cost_by_agent else 0.0
            }
    
    def _cleanup_old_metrics(self):
        """Remove metrics older than retention period."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=self.retention_hours)
        self._metrics = [m for m in self._metrics if m.timestamp >= cutoff_time]
    
    def _export_loop(self):
        """Background thread for periodic metrics export."""
        while True:
            try:
                time.sleep(self.export_interval)
                self._export_metrics()
            except Exception as e:
                # Log error but don't stop the thread
                print(f"Metrics export error: {e}")
    
    def _export_metrics(self):
        """Export metrics to file for persistence."""
        export_dir = Path("logs/metrics")
        export_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        
        with self._lock:
            # Export agent metrics
            agent_metrics_file = export_dir / f"agent_metrics_{timestamp}.json"
            with open(agent_metrics_file, 'w') as f:
                metrics_data = {
                    agent_id: metrics.to_dict() 
                    for agent_id, metrics in self._agent_metrics.items()
                }
                json.dump(metrics_data, f, indent=2, default=str)
            
            # Export system metrics
            system_metrics_file = export_dir / f"system_metrics_{timestamp}.json"
            with open(system_metrics_file, 'w') as f:
                json.dump(self.get_system_metrics(), f, indent=2, default=str)
    
    def export_report(self, filepath: str = None) -> str:
        """Export comprehensive metrics report."""
        if filepath is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = f"logs/metrics_report_{timestamp}.json"
        
        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "system_metrics": self.get_system_metrics(),
            "agent_metrics": {
                agent_id: metrics.to_dict() 
                for agent_id, metrics in self.get_all_agent_metrics().items()
            },
            "cost_analysis": self.get_cost_analysis(),
            "usage_patterns": self.get_usage_patterns()
        }
        
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        return filepath


# Global metrics collector instance
_metrics_collector = None

def get_metrics_collector() -> MetricsCollector:
    """Get global metrics collector instance."""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector