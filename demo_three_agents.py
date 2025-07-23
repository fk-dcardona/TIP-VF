#!/usr/bin/env python3
"""
Demonstrate All Three Core Agents with Evidence
==============================================

This script demonstrates:
1. InventoryMonitorAgent - Stock level analysis and alerts
2. SupplierEvaluatorAgent - Performance scoring and risk assessment  
3. DemandForecasterAgent - Trend analysis and predictions

Shows agent-specific logic, tool usage patterns, and cost optimization.
"""

import os
import sys
from pathlib import Path
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.local')

from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.agents import (
    InventoryMonitorAgent,
    SupplierEvaluatorAgent,
    DemandForecasterAgent
)
from agent_protocol.core.agent_types import AgentType
from backend.config.llm_settings import LLMSettings


def demonstrate_inventory_monitor():
    """Demonstrate Inventory Monitor Agent."""
    print("\n" + "="*60)
    print("🏭 INVENTORY MONITOR AGENT DEMONSTRATION")
    print("="*60)
    
    # Initialize executor and register agent
    executor = AgentExecutor(max_workers=2, default_timeout=120)
    executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
    
    # Create agent with specific configuration
    agent = executor.create_agent(
        agent_id="inv_demo_001",
        agent_type=AgentType.INVENTORY_MONITOR,
        name="Smart Inventory Monitor",
        description="Monitors stock levels with predictive alerts",
        config={
            "critical_threshold_days": 3,
            "warning_threshold_days": 7,
            "overstock_threshold_days": 90,
            "anomaly_detection_enabled": True
        }
    )
    
    print(f"\n✅ Created: {agent.name}")
    print(f"📋 Tools: {list(agent.get_tools().keys())}")
    
    # Execute monitoring
    print("\n📊 Executing Inventory Monitoring...")
    result = executor.execute_agent(
        agent_id="inv_demo_001",
        input_data={"action": "monitor"},
        org_id="demo_org"
    )
    
    if result.success:
        print(f"✅ {result.message}")
        
        # Show summary
        summary = result.data.get('summary', {})
        print(f"\n📈 Inventory Status:")
        print(f"   • Total SKUs: {summary.get('total_skus', 0)}")
        print(f"   • Critical Stockouts: {summary.get('critical_stockouts', 0)} ⚠️")
        print(f"   • Warning Stockouts: {summary.get('warning_stockouts', 0)} ⚡")
        print(f"   • Overstock Items: {summary.get('overstock_items', 0)} 📦")
        
        # Show critical alerts
        if result.data.get('stockout_risks'):
            print(f"\n🚨 Critical Alerts:")
            for risk in result.data['stockout_risks'][:3]:
                print(f"   • {risk['sku']}: {risk['days_remaining']:.1f} days remaining")
                print(f"     Recommended order: {risk['recommended_order_qty']} units")
        
        # Show evidence trail
        print(f"\n🔍 Evidence & Reasoning:")
        for step in result.reasoning[:5]:
            print(f"   • {step}")
    
    # Execute SKU-specific analysis
    print("\n\n📊 Executing SKU Analysis with Anomaly Detection...")
    sku_result = executor.execute_agent(
        agent_id="inv_demo_001",
        input_data={
            "action": "analyze_sku",
            "sku": "SKU123"
        },
        org_id="demo_org"
    )
    
    if sku_result.success:
        print(f"✅ {sku_result.message}")
        
        # Show anomalies
        if sku_result.data.get('anomalies'):
            anomalies = sku_result.data['anomalies']
            print(f"\n🚨 Anomaly Detection:")
            print(f"   • Anomalies found: {anomalies.get('anomalies_found', 0)}")
            print(f"   • Detection method: {anomalies.get('detection_method', 'unknown')}")
    
    # Show cost analysis
    print(f"\n💰 Cost Optimization:")
    model_config = LLMSettings.get_model_for_agent('inventory_monitor')
    print(f"   • Model: {model_config['model']} (fast, low-cost)")
    print(f"   • Max cost per call: ${model_config['max_cost_per_call']}")
    print(f"   • Reasoning: {model_config['reasoning']}")


def demonstrate_supplier_evaluator():
    """Demonstrate Supplier Evaluator Agent."""
    print("\n\n" + "="*60)
    print("🤝 SUPPLIER EVALUATOR AGENT DEMONSTRATION")
    print("="*60)
    
    # Initialize executor and register agent
    executor = AgentExecutor(max_workers=2, default_timeout=180)
    executor.register_agent_class(AgentType.SUPPLIER_EVALUATOR, SupplierEvaluatorAgent)
    
    # Create agent
    agent = executor.create_agent(
        agent_id="sup_demo_001",
        agent_type=AgentType.SUPPLIER_EVALUATOR,
        name="Comprehensive Supplier Evaluator",
        description="Evaluates supplier performance and risks",
        config={
            "min_acceptable_score": 0.7,
            "quality_weight": 0.3,
            "delivery_weight": 0.3,
            "cost_weight": 0.2,
            "compliance_weight": 0.2,
            "high_risk_threshold": 0.3
        }
    )
    
    print(f"\n✅ Created: {agent.name}")
    print(f"📋 Tools: {list(agent.get_tools().keys())}")
    
    # Execute supplier evaluation
    print("\n📊 Executing Supplier Evaluation...")
    result = executor.execute_agent(
        agent_id="sup_demo_001",
        input_data={
            "action": "evaluate",
            "supplier_id": "SUPP001"
        },
        org_id="demo_org"
    )
    
    if result.success:
        print(f"✅ {result.message}")
        
        # Show scores
        data = result.data
        print(f"\n📈 Supplier Performance:")
        print(f"   • Overall Score: {data.get('overall_score', 0):.3f}")
        print(f"   • Rating: {data.get('performance_rating', 'Unknown')}")
        
        scores = data.get('scores', {})
        for category, score_data in scores.items():
            if isinstance(score_data, dict):
                print(f"\n   {category.upper()}:")
                print(f"   • Score: {score_data.get('score', 0):.3f}")
                if 'defect_rate' in score_data:
                    print(f"   • Defect Rate: {score_data['defect_rate']:.2%}")
                elif 'on_time_rate' in score_data:
                    print(f"   • On-Time Rate: {score_data['on_time_rate']:.1%}")
    
    # Execute supplier comparison
    print("\n\n📊 Executing Supplier Comparison...")
    comparison_result = executor.execute_agent(
        agent_id="sup_demo_001",
        input_data={
            "action": "compare",
            "supplier_ids": ["SUPP001", "SUPP002", "SUPP003"]
        },
        org_id="demo_org"
    )
    
    if comparison_result.success:
        print(f"✅ {comparison_result.message}")
        
        # Show ranking
        ranking = comparison_result.data.get('ranking', [])
        print(f"\n🏆 Supplier Ranking:")
        for supplier in ranking:
            print(f"   {supplier['rank']}. {supplier['supplier_id']}: {supplier['overall_score']:.3f}")
        
        print(f"\n✨ Recommendation: {comparison_result.data.get('recommended_supplier', 'Unknown')}")
    
    # Execute risk assessment
    print("\n\n📊 Executing Risk Assessment...")
    risk_result = executor.execute_agent(
        agent_id="sup_demo_001",
        input_data={
            "action": "risk_assessment",
            "supplier_id": "SUPP001"
        },
        org_id="demo_org"
    )
    
    if risk_result.success:
        print(f"✅ {risk_result.message}")
        
        risk_data = risk_result.data
        print(f"\n⚠️  Risk Assessment:")
        print(f"   • Overall Risk: {risk_data.get('risk_level', 'Unknown').upper()}")
        print(f"   • Risk Score: {risk_data.get('overall_risk_score', 0):.3f}")
        
        # Show risk breakdown
        categories = risk_data.get('risk_categories', {})
        if categories:
            print(f"\n   Risk Categories:")
            for cat, risk in categories.items():
                if isinstance(risk, dict):
                    print(f"   • {cat.capitalize()}: {risk.get('level', 'unknown')}")
    
    # Show cost analysis
    print(f"\n💰 Cost Optimization:")
    model_config = LLMSettings.get_model_for_agent('supplier_evaluator')
    print(f"   • Model: {model_config['model']} (complex analysis)")
    print(f"   • Max cost per call: ${model_config['max_cost_per_call']}")
    print(f"   • Reasoning: {model_config['reasoning']}")


def demonstrate_demand_forecaster():
    """Demonstrate Demand Forecaster Agent."""
    print("\n\n" + "="*60)
    print("📈 DEMAND FORECASTER AGENT DEMONSTRATION")
    print("="*60)
    
    # Initialize executor and register agent
    executor = AgentExecutor(max_workers=2, default_timeout=180)
    executor.register_agent_class(AgentType.DEMAND_FORECASTER, DemandForecasterAgent)
    
    # Create agent
    agent = executor.create_agent(
        agent_id="dem_demo_001",
        agent_type=AgentType.DEMAND_FORECASTER,
        name="Predictive Demand Forecaster",
        description="Forecasts demand with pattern recognition",
        config={
            "forecast_horizon": 30,
            "confidence_level": 0.95,
            "min_data_points": 30,
            "seasonality_detection": True,
            "preferred_methods": ["moving_average", "exponential_smoothing", "arima"]
        }
    )
    
    print(f"\n✅ Created: {agent.name}")
    print(f"📋 Tools: {list(agent.get_tools().keys())}")
    
    # Execute demand forecast
    print("\n📊 Executing Demand Forecast...")
    result = executor.execute_agent(
        agent_id="dem_demo_001",
        input_data={
            "action": "forecast",
            "product_ids": ["PROD001", "PROD002"],
            "horizon": 14,  # 14-day forecast
            "method": "auto"  # Auto-select best method
        },
        org_id="demo_org"
    )
    
    if result.success:
        print(f"✅ {result.message}")
        
        # Show summary
        summary = result.data.get('summary', {})
        print(f"\n📈 Forecast Summary:")
        print(f"   • Products Forecasted: {summary.get('products_forecasted', 0)}")
        print(f"   • Horizon: {summary.get('forecast_horizon', 0)} days")
        print(f"   • Average Confidence: {summary.get('average_confidence', 0):.1%}")
        print(f"   • Methods Used: {', '.join(summary.get('methods_used', []))}")
        
        # Show sample forecast
        forecasts = result.data.get('forecasts', {})
        for product_id, forecast in list(forecasts.items())[:1]:
            print(f"\n📊 Forecast for {product_id}:")
            print(f"   • Method: {forecast.get('method', 'unknown')}")
            print(f"   • Confidence: {forecast.get('confidence_score', 0):.1%}")
            
            # Show patterns
            patterns = forecast.get('patterns', {})
            if patterns:
                print(f"   • Trend: {patterns.get('trend', 'unknown')}")
                print(f"   • Volatility: {patterns.get('volatility', 'unknown')}")
            
            # Show first 3 forecast points
            forecast_values = forecast.get('forecast', [])
            if forecast_values:
                print(f"\n   Next 3 days forecast:")
                for f in forecast_values[:3]:
                    print(f"   • Day {f['period']}: {f['value']:.0f} units")
    
    # Execute pattern analysis
    print("\n\n📊 Executing Pattern Analysis...")
    pattern_result = executor.execute_agent(
        agent_id="dem_demo_001",
        input_data={
            "action": "analyze_patterns",
            "product_id": "PROD001"
        },
        org_id="demo_org"
    )
    
    if pattern_result.success:
        print(f"✅ {pattern_result.message}")
        
        # Show pattern insights
        analysis = pattern_result.data.get('pattern_analysis', {})
        for product_id, patterns in list(analysis.items())[:1]:
            print(f"\n📈 Patterns for {product_id}:")
            
            if patterns.get('trend'):
                trend = patterns['trend']
                print(f"   • Trend: {trend.get('trend_direction', 'unknown')}")
                print(f"   • Change Rate: {trend.get('change_rate', 0):.1f}%")
            
            if patterns.get('seasonality'):
                seasonal = patterns['seasonality']
                print(f"   • Seasonal: {'Yes' if seasonal.get('is_seasonal') else 'No'}")
                if seasonal.get('peak_season'):
                    print(f"   • Peak Season: {seasonal['peak_season']}")
            
            print(f"   • Demand Type: {patterns.get('demand_type', 'unknown')}")
    
    # Execute forecast optimization
    print("\n\n📊 Executing Forecast Method Optimization...")
    optimize_result = executor.execute_agent(
        agent_id="dem_demo_001",
        input_data={
            "action": "optimize_forecast",
            "product_ids": ["PROD001"],
            "goal": "balanced"  # Balance accuracy and cost
        },
        org_id="demo_org"
    )
    
    if optimize_result.success:
        print(f"✅ {optimize_result.message}")
        
        # Show optimization results
        opt_summary = optimize_result.data.get('summary', {})
        print(f"\n🎯 Optimization Results:")
        print(f"   • Goal: {opt_summary.get('optimization_goal', 'unknown')}")
        print(f"   • Potential Accuracy Gain: {opt_summary.get('potential_accuracy_gain', 0):.1%}")
        print(f"   • Potential Cost Saving: ${opt_summary.get('potential_cost_saving', 0):.2f}/month")
    
    # Show cost analysis
    print(f"\n💰 Cost Optimization:")
    model_config = LLMSettings.get_model_for_agent('demand_forecaster')
    print(f"   • Model: {model_config['model']} (mathematical reasoning)")
    print(f"   • Max cost per call: ${model_config['max_cost_per_call']}")
    print(f"   • Reasoning: {model_config['reasoning']}")


def show_evidence_based_reasoning():
    """Show evidence-based reasoning across all agents."""
    print("\n\n" + "="*60)
    print("🔬 EVIDENCE-BASED REASONING PATTERNS")
    print("="*60)
    
    print("\n📋 Evidence Collection Flow:")
    print("1. Input Analysis → Identify data requirements")
    print("2. Tool Selection → Choose appropriate tools")
    print("3. Data Gathering → Query databases, call APIs")
    print("4. Evidence Recording → Track source, confidence")
    print("5. Pattern Recognition → Analyze trends, anomalies")
    print("6. Decision Making → Weight evidence, generate insights")
    
    print("\n🎯 Agent-Specific Evidence Patterns:")
    
    print("\n🏭 Inventory Monitor:")
    print("   • Historical consumption data → Trend analysis")
    print("   • Current stock levels → Risk assessment")
    print("   • Lead time data → Reorder calculations")
    print("   • Evidence confidence: 0.85-0.95")
    
    print("\n🤝 Supplier Evaluator:")
    print("   • Performance metrics → Score calculation")
    print("   • Document analysis → Compliance verification")
    print("   • Historical trends → Risk prediction")
    print("   • Evidence confidence: 0.80-0.90")
    
    print("\n📈 Demand Forecaster:")
    print("   • Time series data → Pattern detection")
    print("   • External factors → Correlation analysis")
    print("   • Model performance → Method selection")
    print("   • Evidence confidence: 0.70-0.90")


def show_tool_usage_patterns():
    """Show tool usage patterns for each agent."""
    print("\n\n" + "="*60)
    print("🔧 TOOL USAGE PATTERNS")
    print("="*60)
    
    tool_usage = {
        "InventoryMonitorAgent": {
            "primary_tools": ["DatabaseQueryTool", "MetricsCalculatorTool"],
            "analysis_tools": ["DataAnalysisTool", "InsightGeneratorTool"],
            "frequency": "High (every 5-30 minutes)",
            "cost_profile": "Low - uses simple queries and calculations"
        },
        "SupplierEvaluatorAgent": {
            "primary_tools": ["DocumentSearchTool", "AgentAstraTool"],
            "analysis_tools": ["DataAnalysisTool", "MetricsCalculatorTool"],
            "frequency": "Medium (daily to weekly)",
            "cost_profile": "Medium - document processing and complex analysis"
        },
        "DemandForecasterAgent": {
            "primary_tools": ["DatabaseQueryTool", "DataAnalysisTool"],
            "analysis_tools": ["MetricsCalculatorTool", "InsightGeneratorTool"],
            "frequency": "Medium (daily forecasts)",
            "cost_profile": "Variable - depends on forecast method complexity"
        }
    }
    
    for agent, usage in tool_usage.items():
        print(f"\n🤖 {agent}:")
        print(f"   • Primary Tools: {', '.join(usage['primary_tools'])}")
        print(f"   • Analysis Tools: {', '.join(usage['analysis_tools'])}")
        print(f"   • Frequency: {usage['frequency']}")
        print(f"   • Cost Profile: {usage['cost_profile']}")


def show_cost_optimization_summary():
    """Show cost optimization strategies."""
    print("\n\n" + "="*60)
    print("💰 COST OPTIMIZATION SUMMARY")
    print("="*60)
    
    print("\n📊 Model Selection by Agent Type:")
    
    agents = ['inventory_monitor', 'supplier_evaluator', 'demand_forecaster']
    total_daily_cost = 0
    
    for agent_type in agents:
        config = LLMSettings.get_model_for_agent(agent_type)
        
        # Estimate daily calls
        daily_calls = {
            'inventory_monitor': 288,  # Every 5 minutes
            'supplier_evaluator': 20,   # 20 suppliers daily
            'demand_forecaster': 50     # 50 products daily
        }
        
        # Calculate costs
        cost_estimate = LLMSettings.calculate_estimated_cost(
            agent_type, 
            daily_calls[agent_type]
        )
        
        total_daily_cost += float(cost_estimate['daily_cost'])
        
        print(f"\n{agent_type.replace('_', ' ').title()}:")
        print(f"   • Model: {config['model']}")
        print(f"   • Daily Calls: {daily_calls[agent_type]}")
        print(f"   • Cost per Call: ${cost_estimate['cost_per_call']:.4f}")
        print(f"   • Daily Cost: ${cost_estimate['daily_cost']:.2f}")
        print(f"   • Monthly Cost: ${cost_estimate['monthly_cost']:.2f}")
    
    print(f"\n💵 Total Estimated Costs:")
    print(f"   • Daily: ${total_daily_cost:.2f}")
    print(f"   • Monthly: ${total_daily_cost * 30:.2f}")
    print(f"   • Annual: ${total_daily_cost * 365:.2f}")
    
    print(f"\n🎯 Optimization Strategies Applied:")
    print("   • Fast models for high-frequency monitoring")
    print("   • Smart models for complex analysis only")
    print("   • Auto-selection based on data patterns")
    print("   • Caching for repeated queries")
    print("   • Batch processing where possible")


if __name__ == "__main__":
    print("🚀 THREE CORE AGENTS DEMONSTRATION")
    print("=" * 60)
    
    # Demonstrate each agent
    demonstrate_inventory_monitor()
    demonstrate_supplier_evaluator()
    demonstrate_demand_forecaster()
    
    # Show patterns
    show_evidence_based_reasoning()
    show_tool_usage_patterns()
    show_cost_optimization_summary()
    
    print("\n\n✅ Demonstration Complete!")
    print("=" * 60)