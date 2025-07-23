#!/usr/bin/env python3
"""
Demonstrate LLM Integration with Cost Tracking
=============================================

This script demonstrates the complete LLM integration including:
1. Model selection based on agent type
2. Cost tracking and monitoring
3. Evidence-based decision making
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.local')

from backend.config.llm_settings import LLMSettings, demonstrate_model_selection
from backend.config.settings import settings
from backend.utils.llm_cost_tracker import get_cost_tracker
import json


def demonstrate_cost_optimization():
    """Demonstrate cost optimization strategies."""
    print("\n🎯 Cost Optimization Demonstration")
    print("=" * 60)
    
    # Scenario 1: High-volume monitoring
    print("\nScenario 1: High-Volume Inventory Monitoring")
    print("-" * 40)
    
    # Calculate costs for different models
    models_to_compare = ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'gpt-3.5-turbo']
    daily_calls = 500  # Every 3 minutes
    
    for model in models_to_compare:
        if model in LLMSettings.MODEL_SPECS:
            spec = LLMSettings.MODEL_SPECS[model]
            # Assume 500 input, 200 output tokens per call
            cost_per_call = spec.calculate_cost(500, 200)
            daily_cost = cost_per_call * daily_calls
            
            print(f"\n{model}:")
            print(f"  Cost per call: ${cost_per_call:.5f}")
            print(f"  Daily cost: ${daily_cost:.2f}")
            print(f"  Monthly cost: ${daily_cost * 30:.2f}")
            print(f"  Annual cost: ${daily_cost * 365:.2f}")
    
    # Scenario 2: Complex analysis
    print("\n\nScenario 2: Complex Risk Assessment")
    print("-" * 40)
    
    models_to_compare = ['claude-3-opus-20240229', 'gpt-4-turbo-preview', 'gpt-4']
    daily_calls = 10
    
    for model in models_to_compare:
        if model in LLMSettings.MODEL_SPECS:
            spec = LLMSettings.MODEL_SPECS[model]
            # Assume 2000 input, 1500 output tokens per call
            cost_per_call = spec.calculate_cost(2000, 1500)
            daily_cost = cost_per_call * daily_calls
            
            print(f"\n{model}:")
            print(f"  Cost per call: ${cost_per_call:.4f}")
            print(f"  Daily cost: ${daily_cost:.2f}")
            print(f"  Monthly cost: ${daily_cost * 30:.2f}")
            print(f"  Context window: {spec.context_window:,} tokens")


def demonstrate_agent_configuration():
    """Show agent-specific configurations."""
    print("\n\n🤖 Agent Configuration Summary")
    print("=" * 60)
    
    tracker = get_cost_tracker()
    
    for agent_type, prefs in LLMSettings.AGENT_MODEL_PREFERENCES.items():
        print(f"\n{agent_type.upper()}:")
        print(f"  Primary Model: {prefs['primary']}")
        print(f"  Temperature: {prefs['temperature']}")
        print(f"  Max Tokens: {prefs['max_tokens']}")
        print(f"  Max Cost/Call: ${prefs['max_cost_per_call']}")
        print(f"  Reasoning: {prefs['reasoning']}")
        
        # Show fallback strategy
        if prefs['fallback']:
            print(f"  Fallback Models: {', '.join(prefs['fallback'])}")


def simulate_production_usage():
    """Simulate production usage patterns."""
    print("\n\n📊 Simulating Production Usage")
    print("=" * 60)
    
    tracker = get_cost_tracker()
    
    # Simulate a day of operations
    usage_patterns = [
        # Inventory monitoring - high frequency
        {'agent': 'inventory_monitor', 'calls': 288, 'tokens': (500, 200)},
        # Supplier evaluation - medium frequency
        {'agent': 'supplier_evaluator', 'calls': 20, 'tokens': (1500, 1000)},
        # Demand forecasting - scheduled
        {'agent': 'demand_forecaster', 'calls': 4, 'tokens': (2000, 1500)},
        # Document analysis - on demand
        {'agent': 'document_analyzer', 'calls': 50, 'tokens': (1000, 500)},
        # Risk assessment - periodic
        {'agent': 'risk_assessor', 'calls': 5, 'tokens': (2500, 2000)},
    ]
    
    print("\nSimulating agent usage...")
    total_daily_cost = 0
    
    for pattern in usage_patterns:
        agent_type = pattern['agent']
        config = LLMSettings.get_model_for_agent(agent_type)
        model_spec = config['model_spec']
        
        # Calculate costs
        input_tokens, output_tokens = pattern['tokens']
        cost_per_call = model_spec.calculate_cost(input_tokens, output_tokens)
        daily_cost = cost_per_call * pattern['calls']
        total_daily_cost += float(daily_cost)
        
        print(f"\n{agent_type}:")
        print(f"  Model: {config['model']}")
        print(f"  Calls/day: {pattern['calls']}")
        print(f"  Cost/call: ${cost_per_call:.4f}")
        print(f"  Daily cost: ${daily_cost:.2f}")
        
        # Track usage
        for i in range(min(5, pattern['calls'])):  # Track sample calls
            tracker.track_usage(
                agent_type=agent_type,
                model=config['model'],
                provider=config['provider'],
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                execution_id=f"{agent_type}_{i}",
                success=True
            )
    
    print(f"\n{'='*40}")
    print(f"TOTAL ESTIMATED DAILY COST: ${total_daily_cost:.2f}")
    print(f"TOTAL ESTIMATED MONTHLY COST: ${total_daily_cost * 30:.2f}")
    print(f"TOTAL ESTIMATED ANNUAL COST: ${total_daily_cost * 365:.2f}")
    
    # Get efficiency report
    efficiency_report = tracker.get_agent_efficiency_report()
    print("\n\n📈 Efficiency Analysis:")
    print(json.dumps(efficiency_report, indent=2))


def show_evidence_based_selection():
    """Demonstrate evidence-based model selection."""
    print("\n\n🔍 Evidence-Based Model Selection")
    print("=" * 60)
    
    # Example task requirements
    tasks = [
        {
            'name': 'Simple data extraction',
            'requirements': {
                'capabilities': ['basic_reasoning'],
                'max_tokens': 1000,
                'latency_sensitive': True
            }
        },
        {
            'name': 'Complex supply chain optimization',
            'requirements': {
                'capabilities': ['reasoning', 'code', 'analysis'],
                'max_tokens': 4000,
                'high_quality': True,
                'deep_reasoning': True
            }
        },
        {
            'name': 'Document analysis with images',
            'requirements': {
                'capabilities': ['vision', 'analysis'],
                'max_tokens': 2000
            }
        }
    ]
    
    for task in tasks:
        print(f"\nTask: {task['name']}")
        print(f"Requirements: {task['requirements']}")
        
        # Get optimal models for different strategies
        cost_model = LLMSettings._select_cost_optimal_model(task['requirements'])
        speed_model = LLMSettings._select_speed_optimal_model(task['requirements'])
        quality_model = LLMSettings._select_quality_optimal_model(task['requirements'])
        
        print(f"  Cost-optimized: {cost_model}")
        print(f"  Speed-optimized: {speed_model}")
        print(f"  Quality-optimized: {quality_model}")
        
        # Show cost comparison
        if cost_model in LLMSettings.MODEL_SPECS:
            cost_spec = LLMSettings.MODEL_SPECS[cost_model]
            quality_spec = LLMSettings.MODEL_SPECS[quality_model]
            
            cost_diff = quality_spec.calculate_cost(1000, 500) - cost_spec.calculate_cost(1000, 500)
            print(f"  Potential savings: ${cost_diff:.4f} per call ({cost_diff/quality_spec.calculate_cost(1000, 500)*100:.0f}%)")


def main():
    """Run all demonstrations."""
    print("🚀 LLM Integration Demonstration")
    print("=" * 60)
    
    # Validate environment
    print("\n1. Environment Validation:")
    validation = LLMSettings.validate_environment()
    if all(validation.values()):
        print("✅ All API keys configured!")
    else:
        print("⚠️  Some API keys missing (using defaults for demo)")
    
    # Show model selection logic
    demonstrate_model_selection()
    
    # Show cost optimization
    demonstrate_cost_optimization()
    
    # Show agent configurations
    demonstrate_agent_configuration()
    
    # Show evidence-based selection
    show_evidence_based_selection()
    
    # Simulate production usage
    simulate_production_usage()
    
    print("\n\n✅ Demonstration Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()