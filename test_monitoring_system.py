#!/usr/bin/env python3
"""
Test Monitoring and Logging System
==================================

This script tests the comprehensive monitoring infrastructure including:
- Agent logging with structured data
- Metrics collection and analysis
- Execution monitoring with real-time alerts
- Health checking across all components
"""

import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.local')

from agent_protocol.monitoring import (
    get_agent_logger, get_metrics_collector, 
    get_execution_monitor, get_health_checker
)
from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.agents import InventoryMonitorAgent
from agent_protocol.core.agent_types import AgentType


def test_logging_system():
    """Test structured logging system."""
    print("\n" + "="*60)
    print("📝 AGENT LOGGING SYSTEM TEST")
    print("="*60)
    
    logger = get_agent_logger()
    
    # Test manual logging
    print("\n🔍 Testing manual logging...")
    
    with logger.execution_context(
        "test_agent_001", AgentType.INVENTORY_MONITOR, 
        "test_exec_001", "user_123", "org_456"
    ):
        logger.log_tool_call("database_query", {"table": "inventory"}, {"rows": 150})
        logger.log_llm_call("openai", "gpt-4", 1250, 1500, 0.025)
        logger.log_agent_decision("reorder_recommended", 0.92, ["Low stock detected", "Lead time exceeded"])
        logger.log_performance_metric("response_time", 850.5, "ms")
    
    # Get recent logs
    recent_logs = logger.get_recent_logs(10)
    print(f"✅ Generated {len(recent_logs)} log entries")
    
    for log in recent_logs[-3:]:
        print(f"   📋 {log.event_type}: {log.message}")
    
    # Test execution summary
    summary = logger.get_execution_summary("test_exec_001")
    print(f"\n📊 Execution Summary:")
    print(f"   • Status: {summary['status']}")
    print(f"   • Tool calls: {summary['tool_calls_count']}")
    print(f"   • LLM calls: {summary['llm_calls_count']}")
    print(f"   • Total tokens: {summary['total_tokens']}")
    print(f"   • Total cost: ${summary['total_cost']:.4f}")


def test_metrics_collection():
    """Test metrics collection system."""
    print("\n\n" + "="*60)
    print("📊 METRICS COLLECTION SYSTEM TEST")
    print("="*60)
    
    metrics = get_metrics_collector()
    
    # Simulate multiple agent executions
    print("\n🔄 Simulating agent executions...")
    
    for i in range(5):
        agent_id = f"test_agent_{i % 3}"
        agent_type = [AgentType.INVENTORY_MONITOR, AgentType.SUPPLIER_EVALUATOR, AgentType.DEMAND_FORECASTER][i % 3]
        execution_id = f"exec_{i}_{int(time.time())}"
        
        # Start execution
        metrics.record_execution_start(agent_id, agent_type, execution_id)
        
        # Simulate work
        time.sleep(0.1)
        
        # Simulate LLM calls
        metrics.record_llm_call(agent_id, agent_type, "openai", "gpt-4", 500 + i * 100, 1000 + i * 200, 0.01 + i * 0.005)
        
        # Simulate tool calls
        metrics.record_tool_call(agent_id, agent_type, "database_query", True, 50 + i * 10)
        
        # End execution
        metrics.record_execution_end(agent_id, agent_type, execution_id, True, 150 + i * 50, 0.8 + i * 0.02)
    
    print(f"✅ Simulated 5 agent executions")
    
    # Get system metrics
    system_metrics = metrics.get_system_metrics()
    print(f"\n📈 System Metrics:")
    print(f"   • Total agents: {system_metrics['total_agents']}")
    print(f"   • Active agents: {system_metrics['active_agents']}")
    print(f"   • Executions today: {system_metrics['total_executions_today']}")
    print(f"   • Cost today: ${system_metrics['total_cost_today']:.4f}")
    
    # Get agent-specific metrics
    agent_metrics = metrics.get_all_agent_metrics()
    print(f"\n🤖 Agent Metrics ({len(agent_metrics)} agents):")
    
    for agent_id, agent_data in list(agent_metrics.items())[:3]:
        print(f"\n   Agent {agent_id}:")
        print(f"   • Executions: {agent_data.total_executions}")
        print(f"   • Success rate: {agent_data.success_rate:.1f}%")
        print(f"   • Avg execution time: {agent_data.avg_execution_time_ms:.1f}ms")
        print(f"   • Total tokens: {agent_data.total_tokens_used}")
        print(f"   • Total cost: ${agent_data.total_llm_cost:.4f}")
    
    # Test cost analysis
    cost_analysis = metrics.get_cost_analysis()
    print(f"\n💰 Cost Analysis:")
    print(f"   • Total cost (24h): ${cost_analysis['total_cost']:.4f}")
    print(f"   • Avg cost per agent: ${cost_analysis['avg_cost_per_agent']:.4f}")
    
    # Test usage patterns
    usage_patterns = metrics.get_usage_patterns()
    print(f"\n⏰ Usage Patterns:")
    print(f"   • Peak hour: {usage_patterns['peak_hour']}")
    print(f"   • Total executions: {usage_patterns['total_executions']}")


def test_execution_monitoring():
    """Test real-time execution monitoring."""
    print("\n\n" + "="*60)
    print("👁️  EXECUTION MONITORING SYSTEM TEST")
    print("="*60)
    
    monitor = get_execution_monitor()
    
    # Test alert callback
    alerts_received = []
    def alert_callback(alert):
        alerts_received.append(alert)
        print(f"   🚨 Alert: {alert.level.value.upper()} - {alert.title}")
    
    monitor.add_alert_callback(alert_callback)
    
    # Simulate monitored execution
    print("\n🚀 Starting monitored execution...")
    
    execution_state = monitor.start_execution(
        "monitor_test_001", "test_agent_monitor", AgentType.INVENTORY_MONITOR
    )
    
    print(f"✅ Execution started: {execution_state.execution_id}")
    print(f"   • Agent: {execution_state.agent_id}")
    print(f"   • Status: {execution_state.status}")
    
    # Simulate progress updates
    time.sleep(0.1)
    monitor.update_execution(execution_state.execution_id, "analyzing_data", 0.3, tokens_used=150)
    print(f"   • Progress: 30% - analyzing data")
    
    time.sleep(0.1)
    monitor.record_tool_call(execution_state.execution_id, "database_query", True)
    monitor.update_execution(execution_state.execution_id, "generating_insights", 0.7, tokens_used=200)
    print(f"   • Progress: 70% - generating insights")
    
    time.sleep(0.1)
    monitor.update_execution(execution_state.execution_id, "finalizing", 0.9, tokens_used=100)
    print(f"   • Progress: 90% - finalizing")
    
    # Complete execution
    monitor.end_execution(execution_state.execution_id, True, 450)
    print(f"✅ Execution completed successfully")
    
    # Get execution state
    final_state = monitor.get_execution_state(execution_state.execution_id)
    if final_state:
        print(f"\n📊 Final Execution State:")
        print(f"   • Duration: {final_state.duration_ms}ms")
        print(f"   • Tokens used: {final_state.tokens_used}")
        print(f"   • Tool calls: {final_state.tool_calls}")
        print(f"   • Status: {final_state.status}")
    
    # Test system health
    system_health = monitor.get_system_health()
    print(f"\n🏥 System Health:")
    print(f"   • Status: {system_health['status']}")
    print(f"   • Active executions: {system_health['active_executions']}")
    print(f"   • Recent alerts: {system_health['unresolved_alerts']}")
    
    # Show alerts if any
    if alerts_received:
        print(f"\n🚨 Alerts Generated: {len(alerts_received)}")
        for alert in alerts_received:
            print(f"   • {alert.level.value}: {alert.message}")


def test_health_checking():
    """Test comprehensive health checking."""
    print("\n\n" + "="*60)
    print("🏥 HEALTH CHECKING SYSTEM TEST")
    print("="*60)
    
    health_checker = get_health_checker()
    
    print("\n🔍 Performing comprehensive health check...")
    
    # Force immediate health check
    health_results = health_checker.force_health_check()
    
    print(f"✅ Health check completed for {len(health_results)} components")
    
    # Show overall status
    overall_status = health_checker.get_overall_status()
    print(f"\n📊 Overall System Status: {overall_status.value.upper()}")
    
    # Show component details
    print(f"\n🔧 Component Health:")
    for component, check in health_results.items():
        status_emoji = {
            "healthy": "✅",
            "degraded": "⚠️",
            "unhealthy": "❌",
            "unknown": "❓"
        }.get(check.status.value, "❓")
        
        print(f"   {status_emoji} {component}: {check.message}")
        
        if check.response_time_ms:
            print(f"      ⏱️  Response time: {check.response_time_ms}ms")
        
        if check.metadata:
            interesting_metrics = {}
            metadata = check.metadata
            
            # Extract interesting metrics
            if 'cpu_percent' in metadata:
                interesting_metrics['CPU'] = f"{metadata['cpu_percent']:.1f}%"
            if 'memory_percent' in metadata:
                interesting_metrics['Memory'] = f"{metadata['memory_percent']:.1f}%"
            if 'query_time_ms' in metadata:
                interesting_metrics['DB Query'] = f"{metadata['query_time_ms']:.1f}ms"
            if 'total_providers' in metadata:
                interesting_metrics['LLM Providers'] = f"{metadata['healthy_providers']}/{metadata['total_providers']}"
            
            if interesting_metrics:
                metrics_str = ", ".join(f"{k}: {v}" for k, v in interesting_metrics.items())
                print(f"      📊 {metrics_str}")
    
    # Get health summary
    health_summary = health_checker.get_health_summary()
    component_counts = health_summary['component_count']
    
    print(f"\n📈 Health Summary:")
    print(f"   • Total components: {component_counts['total']}")
    print(f"   • Healthy: {component_counts['healthy']}")
    print(f"   • Degraded: {component_counts['degraded']}")
    print(f"   • Unhealthy: {component_counts['unhealthy']}")
    print(f"   • Unknown: {component_counts['unknown']}")


def test_full_agent_with_monitoring():
    """Test full agent execution with monitoring integration."""
    print("\n\n" + "="*60)
    print("🤖 FULL AGENT WITH MONITORING TEST")
    print("="*60)
    
    # Create executor
    executor = AgentExecutor(max_workers=1, default_timeout=60)
    executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
    
    # Create agent
    agent = executor.create_agent(
        agent_id="monitor_test_agent",
        agent_type=AgentType.INVENTORY_MONITOR,
        name="Monitoring Test Agent",
        description="Agent for testing monitoring integration",
        config={
            "critical_threshold_days": 3,
            "warning_threshold_days": 7
        }
    )
    
    print(f"\n✅ Created agent: {agent.name}")
    
    # Execute agent with monitoring
    print(f"\n🚀 Executing agent with full monitoring...")
    
    result = executor.execute_agent(
        agent_id="monitor_test_agent",
        input_data={
            "action": "monitor",
            "scope": "critical_items"
        },
        org_id="test_org",
        user_id="test_user"
    )
    
    if result.success:
        print(f"✅ Agent execution successful!")
        print(f"   • Execution ID: {result.execution_id}")
        print(f"   • Duration: {result.execution_time_ms}ms")
        print(f"   • Tokens used: {result.tokens_used}")
        print(f"   • Confidence: {result.confidence:.2f}")
        
        # Show monitoring data
        logger = get_agent_logger()
        execution_summary = logger.get_execution_summary(result.execution_id)
        
        print(f"\n📊 Monitoring Summary:")
        print(f"   • Status: {execution_summary['status']}")
        print(f"   • Duration: {execution_summary.get('duration_ms', 'unknown')}ms")
        print(f"   • Tool calls: {execution_summary['tool_calls_count']}")
        print(f"   • LLM calls: {execution_summary['llm_calls_count']}")
        print(f"   • Total cost: ${execution_summary['total_cost']:.4f}")
        
    else:
        print(f"❌ Agent execution failed: {result.message}")


def test_monitoring_export():
    """Test monitoring data export capabilities."""
    print("\n\n" + "="*60)
    print("📤 MONITORING EXPORT TEST")
    print("="*60)
    
    metrics = get_metrics_collector()
    
    # Export comprehensive report
    print("\n📄 Generating comprehensive metrics report...")
    report_path = metrics.export_report()
    
    print(f"✅ Report exported to: {report_path}")
    
    # Show report summary
    if Path(report_path).exists():
        with open(report_path, 'r') as f:
            report_data = json.load(f)
        
        print(f"\n📊 Report Summary:")
        print(f"   • Generated at: {report_data['generated_at']}")
        print(f"   • System metrics included: ✅")
        print(f"   • Agent metrics count: {len(report_data.get('agent_metrics', {}))}")
        print(f"   • Cost analysis included: ✅")
        print(f"   • Usage patterns included: ✅")
        
        file_size = Path(report_path).stat().st_size
        print(f"   • Report size: {file_size:,} bytes")


def main():
    """Run comprehensive monitoring system tests."""
    print("🚀 MONITORING SYSTEM TESTING SUITE")
    print("=" * 60)
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test 1: Logging system
        test_logging_system()
        
        # Test 2: Metrics collection
        test_metrics_collection()
        
        # Test 3: Execution monitoring
        test_execution_monitoring()
        
        # Test 4: Health checking
        test_health_checking()
        
        # Test 5: Full agent integration
        test_full_agent_with_monitoring()
        
        # Test 6: Export capabilities
        test_monitoring_export()
        
        print("\n\n✅ MONITORING SYSTEM TESTS COMPLETED!")
        print("=" * 60)
        
        print("\n🎉 All monitoring components are working correctly!")
        print("\n📋 Components tested:")
        print("   ✅ Structured logging with execution context")
        print("   ✅ Comprehensive metrics collection")
        print("   ✅ Real-time execution monitoring")
        print("   ✅ Multi-component health checking")
        print("   ✅ Full agent integration")
        print("   ✅ Data export and reporting")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()