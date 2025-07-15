#!/usr/bin/env python3
"""
Demonstrate Complete Agent Protocol Lifecycle
============================================

This script demonstrates:
1. Agent creation and registration
2. Tool integration patterns
3. Evidence-based execution
4. Lifecycle management
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.local')

from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
from agent_protocol.core.agent_types import AgentType
import json
from datetime import datetime


def demonstrate_agent_lifecycle():
    """Demonstrate the complete agent lifecycle with evidence."""
    print("🚀 Agent Protocol Lifecycle Demonstration")
    print("=" * 60)
    
    # Initialize executor
    print("\n1. Initializing Agent Executor...")
    executor = AgentExecutor(max_workers=3, default_timeout=300)
    print("   ✅ Executor initialized with 3 workers, 5-minute timeout")
    
    # Register agent class
    print("\n2. Registering Agent Classes...")
    executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
    print("   ✅ Registered InventoryMonitorAgent")
    
    # Create agent instance
    print("\n3. Creating Agent Instance...")
    agent = executor.create_agent(
        agent_id="demo_inv_001",
        agent_type=AgentType.INVENTORY_MONITOR,
        name="Demo Inventory Monitor",
        description="Demonstration of inventory monitoring capabilities",
        config={
            "critical_threshold_days": 3,
            "warning_threshold_days": 7,
            "overstock_threshold_days": 90,
            "anomaly_detection_enabled": True
        }
    )
    print(f"   ✅ Created agent: {agent.name}")
    print(f"   📋 Registered tools: {list(agent.get_tools().keys())}")
    
    # Show agent lifecycle states
    print("\n4. Agent Lifecycle States:")
    print("   • IDLE → INITIALIZING → RUNNING → EXECUTING_TOOL → COMPLETED")
    print("   • Current status:", agent.status.value)
    
    # Execute basic monitoring
    print("\n5. Executing Basic Inventory Monitoring...")
    print("   📊 Input: Monitor overall inventory status")
    
    result = executor.execute_agent(
        agent_id="demo_inv_001",
        input_data={
            "action": "monitor"
        },
        org_id="demo_org_123"
    )
    
    if result.success:
        print("   ✅ Execution successful!")
        print(f"   📝 Message: {result.message}")
        print(f"   🎯 Confidence: {result.confidence}")
        
        # Show summary
        if 'summary' in result.data:
            summary = result.data['summary']
            print("\n   📊 Inventory Summary:")
            print(f"      • Total SKUs: {summary.get('total_skus', 0)}")
            print(f"      • Critical Stockouts: {summary.get('critical_stockouts', 0)}")
            print(f"      • Warning Stockouts: {summary.get('warning_stockouts', 0)}")
            print(f"      • Overstock Items: {summary.get('overstock_items', 0)}")
        
        # Show evidence trail
        print("\n   🔍 Evidence Trail:")
        if result.evidence:
            for i, evidence in enumerate(result.evidence[:3], 1):
                print(f"      {i}. Source: {evidence['source']}")
                print(f"         Confidence: {evidence.get('confidence', 'N/A')}")
        
        # Show reasoning steps
        print("\n   🧠 Reasoning Steps:")
        if result.reasoning:
            for step in result.reasoning[:5]:
                print(f"      • {step}")
        
        # Show actions
        if result.actions:
            print("\n   ⚡ Recommended Actions:")
            for action in result.actions[:3]:
                print(f"      • {action['type'].upper()}: {action['description']}")
                print(f"        Priority: {action['priority']}")
    else:
        print(f"   ❌ Execution failed: {result.message}")
    
    # Execute SKU analysis
    print("\n\n6. Executing SKU-Specific Analysis...")
    print("   📊 Input: Analyze specific SKU with anomaly detection")
    
    sku_result = executor.execute_agent(
        agent_id="demo_inv_001",
        input_data={
            "action": "analyze_sku",
            "sku": "SKU001"
        },
        org_id="demo_org_123"
    )
    
    if sku_result.success:
        print("   ✅ SKU Analysis completed!")
        
        if 'trend' in sku_result.data and sku_result.data['trend']:
            trend = sku_result.data['trend']
            print(f"\n   📈 Trend Analysis:")
            print(f"      • Direction: {trend.get('trend_direction', 'unknown')}")
            print(f"      • Change Rate: {trend.get('change_rate', 0):.1f}%")
            print(f"      • R-squared: {trend.get('r_squared', 0):.3f}")
        
        if 'anomalies' in sku_result.data and sku_result.data['anomalies']:
            anomalies = sku_result.data['anomalies']
            print(f"\n   🚨 Anomaly Detection:")
            print(f"      • Anomalies Found: {anomalies.get('anomalies_found', 0)}")
            print(f"      • Detection Method: {anomalies.get('detection_method', 'unknown')}")
        
        if 'forecast' in sku_result.data and sku_result.data['forecast']:
            forecast = sku_result.data['forecast']
            print(f"\n   🔮 Demand Forecast:")
            for f in forecast.get('forecasts', [])[:3]:
                print(f"      • Period {f['period']}: {f['forecast']:.0f} units")
    
    # Show execution metrics
    print("\n\n7. Execution Metrics:")
    metrics = executor.get_metrics("demo_inv_001")
    if metrics:
        print(f"   • Total Executions: {metrics.get('total', 0)}")
        print(f"   • Success Rate: {metrics.get('success_rate', 0):.1f}%")
        print(f"   • Avg Duration: {metrics.get('avg_duration_ms', 0):.0f}ms")
    
    # Show active executions
    print("\n8. Active Executions:")
    active = executor.get_active_executions()
    print(f"   • Currently Active: {len(active)}")
    
    # Show executor stats
    print("\n9. Executor Statistics:")
    stats = executor.get_stats()
    print(f"   • Max Workers: {stats['executor']['max_workers']}")
    print(f"   • Registered Agents: {stats['registry']['registered_agents']}")
    print(f"   • Total Executions: {stats['executions']['total_executions']}")
    
    print("\n" + "=" * 60)
    print("✅ Agent Lifecycle Demonstration Complete!")


def demonstrate_tool_integration():
    """Demonstrate tool integration patterns."""
    print("\n\n🔧 Tool Integration Patterns")
    print("=" * 60)
    
    # Show available tools
    from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
    
    # Create a temporary agent to show tools
    agent = InventoryMonitorAgent(
        agent_id="temp_001",
        name="Temp Agent",
        description="For tool demonstration",
        config={}
    )
    
    print("\n📦 Registered Tools:")
    for tool_name, tool in agent.get_tools().items():
        print(f"\n   🔨 {tool_name}:")
        print(f"      Description: {tool.description}")
        print(f"      Parameters:")
        for param in tool.get_parameters()[:3]:  # Show first 3 params
            print(f"         • {param.name} ({param.type}): {param.description}")
            if param.enum:
                print(f"           Options: {', '.join(param.enum)}")
    
    print("\n📊 Tool Execution Flow:")
    print("   1. Agent receives task")
    print("   2. Agent selects appropriate tool")
    print("   3. Tool validates parameters")
    print("   4. Tool executes with error handling")
    print("   5. Results added to evidence")
    print("   6. Agent reasoning updated")
    
    print("\n🔍 Evidence Collection Pattern:")
    print("   • Every tool call generates evidence")
    print("   • Evidence includes confidence scores")
    print("   • Evidence tracked in agent context")
    print("   • Used for final decision making")


def demonstrate_evidence_based_execution():
    """Demonstrate evidence-based execution patterns."""
    print("\n\n🔬 Evidence-Based Execution")
    print("=" * 60)
    
    print("\n📋 Evidence Flow:")
    print("   1. Input Analysis")
    print("      → Parse user request")
    print("      → Identify required data")
    print("   2. Data Collection")
    print("      → Query database")
    print("      → Call external APIs")
    print("      → Aggregate metrics")
    print("   3. Evidence Recording")
    print("      → Source attribution")
    print("      → Confidence scoring")
    print("      → Timestamp tracking")
    print("   4. Analysis & Reasoning")
    print("      → Apply business rules")
    print("      → Statistical analysis")
    print("      → Pattern detection")
    print("   5. Decision Making")
    print("      → Weight evidence")
    print("      → Generate insights")
    print("      → Formulate recommendations")
    
    print("\n🎯 Confidence Calculation:")
    print("   • Data quality: 0.0 - 1.0")
    print("   • Source reliability: 0.0 - 1.0")
    print("   • Analysis certainty: 0.0 - 1.0")
    print("   • Overall confidence: Weighted average")
    
    print("\n✅ Benefits:")
    print("   • Transparent decision making")
    print("   • Auditable reasoning")
    print("   • Continuous improvement")
    print("   • Trust building")


if __name__ == "__main__":
    # Run demonstrations
    demonstrate_agent_lifecycle()
    demonstrate_tool_integration()
    demonstrate_evidence_based_execution()
    
    print("\n\n🎉 All demonstrations complete!")
    print("=" * 60)