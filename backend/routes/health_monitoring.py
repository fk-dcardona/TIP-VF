"""
Health monitoring endpoints for production deployment.
Comprehensive health checks for all system components.
"""

import os
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from ..agent_registry import get_agent_registry
from ..config.monitoring import get_production_monitor
from ..agent_protocol.monitoring.health_checker import HealthChecker
from ..agent_protocol.monitoring.metrics_collector import get_metrics_collector
from ..agent_protocol.monitoring.agent_logger import get_agent_logger
from ..agent_protocol.security.permissions import get_permission_manager
from ..models import db

# Create blueprint
health_monitoring_bp = Blueprint('health_monitoring', __name__)

# Global instances
health_checker = HealthChecker()
metrics_collector = get_metrics_collector()
agent_logger = get_agent_logger()
permission_manager = get_permission_manager()


@health_monitoring_bp.route('/health', methods=['GET'])
@cross_origin()
def basic_health_check():
    """Basic health check endpoint."""
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'service': 'Agent System',
            'version': '1.0.0'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/detailed', methods=['GET'])
@cross_origin()
def detailed_health_check():
    """Detailed health check for all system components."""
    try:
        start_time = time.time()
        
        # Get registry health
        registry_health = {}
        try:
            registry = get_agent_registry()
            if registry:
                registry_health = registry.get_registry_health()
        except Exception as e:
            registry_health = {
                'status': 'error',
                'error': str(e)
            }
        
        # Get database health
        database_health = check_database_health()
        
        # Get monitoring system health
        monitoring_health = check_monitoring_health()
        
        # Get component health
        component_health = check_component_health()
        
        # Calculate overall health
        health_checks = [
            registry_health.get('registry_status') == 'healthy',
            database_health.get('status') == 'healthy',
            monitoring_health.get('status') == 'healthy',
            component_health.get('status') == 'healthy'
        ]
        
        overall_healthy = all(health_checks)
        health_score = (sum(health_checks) / len(health_checks)) * 100
        
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        return jsonify({
            'status': 'healthy' if overall_healthy else 'degraded',
            'health_score': health_score,
            'response_time_ms': response_time,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'components': {
                'registry': registry_health,
                'database': database_health,
                'monitoring': monitoring_health,
                'system_components': component_health
            },
            'summary': {
                'total_checks': len(health_checks),
                'passed_checks': sum(health_checks),
                'failed_checks': len(health_checks) - sum(health_checks)
            }
        }), 200 if overall_healthy else 503
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/ready', methods=['GET'])
@cross_origin()
def readiness_check():
    """Readiness check - can the system accept traffic?"""
    try:
        # Check critical components for readiness
        checks = {
            'database': check_database_connectivity(),
            'agent_registry': check_agent_registry_ready(),
            'metrics_collector': check_metrics_collector_ready(),
            'security_system': check_security_system_ready()
        }
        
        # All checks must pass for readiness
        is_ready = all(checks.values())
        
        return jsonify({
            'ready': is_ready,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'checks': checks,
            'message': 'System is ready to accept traffic' if is_ready else 'System is not ready'
        }), 200 if is_ready else 503
        
    except Exception as e:
        return jsonify({
            'ready': False,
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/live', methods=['GET'])
@cross_origin()
def liveness_check():
    """Liveness check - is the system alive?"""
    try:
        # Basic liveness indicators
        return jsonify({
            'alive': True,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'uptime_seconds': time.time() - get_system_start_time(),
            'pid': os.getpid()
        })
    except Exception as e:
        return jsonify({
            'alive': False,
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/agents', methods=['GET'])
@cross_origin()
def agent_health_check():
    """Health check for all agents."""
    try:
        registry = get_agent_registry()
        if not registry:
            return jsonify({
                'status': 'error',
                'error': 'Agent registry not available'
            }), 503
        
        # Get organization filter if provided
        org_id = request.args.get('org_id')
        
        # Get all agents
        all_agents = registry.list_agents(organization_id=org_id)
        
        # Check health for each agent
        agent_health_results = []
        healthy_count = 0
        
        for registered_agent in all_agents:
            agent_health = registry.get_agent_health(registered_agent.agent_id)
            
            health_info = {
                'agent_id': registered_agent.agent_id,
                'agent_type': registered_agent.agent_type,
                'organization_id': registered_agent.organization_id,
                'status': agent_health.get('status', 'unknown'),
                'healthy': agent_health.get('healthy', False),
                'last_heartbeat': agent_health.get('last_heartbeat'),
                'execution_count': agent_health.get('execution_count', 0),
                'error_count': agent_health.get('error_count', 0)
            }
            
            if health_info['healthy']:
                healthy_count += 1
            
            agent_health_results.append(health_info)
        
        # Calculate overall agent health
        total_agents = len(all_agents)
        health_percentage = (healthy_count / total_agents * 100) if total_agents > 0 else 100
        
        return jsonify({
            'status': 'healthy' if health_percentage >= 80 else 'degraded',
            'total_agents': total_agents,
            'healthy_agents': healthy_count,
            'unhealthy_agents': total_agents - healthy_count,
            'health_percentage': health_percentage,
            'agents': agent_health_results,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/metrics', methods=['GET'])
@cross_origin()
def metrics_health_check():
    """Health check for metrics system."""
    try:
        # Get metrics collector status
        metrics_status = metrics_collector.get_collector_status()
        
        # Get recent metrics
        recent_metrics = metrics_collector.get_recent_metrics(hours=1)
        
        # Check if metrics are being collected
        is_collecting = len(recent_metrics) > 0
        
        return jsonify({
            'status': 'healthy' if is_collecting else 'degraded',
            'metrics_collector': metrics_status,
            'recent_metrics_count': len(recent_metrics),
            'is_collecting': is_collecting,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/alerts', methods=['GET'])
@cross_origin()
def alerts_health_check():
    """Get current alerts and monitoring status."""
    try:
        production_monitor = get_production_monitor()
        
        # Get monitoring status
        monitoring_status = production_monitor.get_monitoring_status()
        
        # Get active alerts
        active_alerts = production_monitor.get_active_alerts()
        
        # Categorize alerts by severity
        alerts_by_severity = {}
        for alert in active_alerts:
            severity = alert['severity']
            if severity not in alerts_by_severity:
                alerts_by_severity[severity] = []
            alerts_by_severity[severity].append(alert)
        
        # Check if there are critical alerts
        has_critical_alerts = 'critical' in alerts_by_severity
        
        return jsonify({
            'status': 'critical' if has_critical_alerts else 'healthy',
            'monitoring_status': monitoring_status,
            'active_alerts': active_alerts,
            'alerts_by_severity': alerts_by_severity,
            'alert_summary': {
                'total_active': len(active_alerts),
                'critical': len(alerts_by_severity.get('critical', [])),
                'high': len(alerts_by_severity.get('high', [])),
                'medium': len(alerts_by_severity.get('medium', [])),
                'low': len(alerts_by_severity.get('low', []))
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


@health_monitoring_bp.route('/health/system', methods=['GET'])
@cross_origin()
def system_health_check():
    """System resource health check."""
    try:
        production_monitor = get_production_monitor()
        
        # Get current system metrics
        system_metrics = production_monitor.collect_system_metrics()
        
        # Check resource usage levels
        cpu_usage = system_metrics.get('cpu', {}).get('usage_percent', 0)
        memory_usage = system_metrics.get('memory', {}).get('usage_percent', 0)
        disk_usage = system_metrics.get('disk', {}).get('usage_percent', 0)
        
        # Determine system health based on resource usage
        health_indicators = {
            'cpu': {
                'usage_percent': cpu_usage,
                'status': 'healthy' if cpu_usage < 80 else 'warning' if cpu_usage < 95 else 'critical'
            },
            'memory': {
                'usage_percent': memory_usage,
                'status': 'healthy' if memory_usage < 85 else 'warning' if memory_usage < 95 else 'critical'
            },
            'disk': {
                'usage_percent': disk_usage,
                'status': 'healthy' if disk_usage < 90 else 'warning' if disk_usage < 98 else 'critical'
            }
        }
        
        # Overall system status
        statuses = [indicator['status'] for indicator in health_indicators.values()]
        if 'critical' in statuses:
            overall_status = 'critical'
        elif 'warning' in statuses:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'
        
        return jsonify({
            'status': overall_status,
            'system_metrics': system_metrics,
            'health_indicators': health_indicators,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 500


def check_database_health() -> Dict[str, Any]:
    """Check database health."""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db.session.commit()
        
        return {
            'status': 'healthy',
            'connection': 'available',
            'checked_at': datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'checked_at': datetime.now(timezone.utc).isoformat()
        }


def check_monitoring_health() -> Dict[str, Any]:
    """Check monitoring system health."""
    try:
        production_monitor = get_production_monitor()
        monitoring_status = production_monitor.get_monitoring_status()
        
        return {
            'status': 'healthy' if monitoring_status['monitoring_active'] else 'unhealthy',
            'monitoring_active': monitoring_status['monitoring_active'],
            'last_collection': monitoring_status['last_metrics_collection'],
            'active_alerts': monitoring_status['active_alerts']
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }


def check_component_health() -> Dict[str, Any]:
    """Check health of individual components."""
    try:
        components = {
            'health_checker': health_checker is not None,
            'metrics_collector': metrics_collector is not None,
            'agent_logger': agent_logger is not None,
            'permission_manager': permission_manager is not None
        }
        
        healthy_components = sum(components.values())
        total_components = len(components)
        
        return {
            'status': 'healthy' if healthy_components == total_components else 'degraded',
            'components': components,
            'healthy_count': healthy_components,
            'total_count': total_components
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }


def check_database_connectivity() -> bool:
    """Check if database is connected."""
    try:
        db.session.execute('SELECT 1')
        return True
    except Exception:
        return False


def check_agent_registry_ready() -> bool:
    """Check if agent registry is ready."""
    try:
        registry = get_agent_registry()
        return registry is not None and registry.startup_complete
    except Exception:
        return False


def check_metrics_collector_ready() -> bool:
    """Check if metrics collector is ready."""
    try:
        return metrics_collector is not None
    except Exception:
        return False


def check_security_system_ready() -> bool:
    """Check if security system is ready."""
    try:
        return permission_manager is not None
    except Exception:
        return False


def get_system_start_time() -> float:
    """Get system start time."""
    # This would be set when the system starts
    return time.time() - 3600  # Placeholder: 1 hour ago


# Add to main Flask app
def register_health_monitoring(app):
    """Register health monitoring blueprint with Flask app."""
    app.register_blueprint(health_monitoring_bp, url_prefix='/api/health')


# Export for external monitoring tools
__all__ = [
    'health_monitoring_bp',
    'basic_health_check',
    'detailed_health_check',
    'readiness_check',
    'liveness_check',
    'agent_health_check',
    'metrics_health_check',
    'alerts_health_check',
    'system_health_check',
    'register_health_monitoring'
]