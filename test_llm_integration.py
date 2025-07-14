#!/usr/bin/env python3
"""
Test LLM Integration with Real Providers
=======================================

This script tests the LLM integration with actual providers (OpenAI, Anthropic)
or falls back to mock if API keys are not available.
"""

import os
import sys
from pathlib import Path
import asyncio
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv('.env.local')

from agent_protocol.llm.llm_manager import get_llm_manager
from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.agents import InventoryMonitorAgent
from agent_protocol.core.agent_types import AgentType


def test_llm_manager():
    """Test LLM manager initialization and provider selection."""
    print("\n" + "="*60)
    print("🧠 LLM MANAGER INTEGRATION TEST")
    print("="*60)
    
    # Get LLM manager
    llm_manager = get_llm_manager()
    
    print(f"\n✅ LLM Manager initialized")
    print(f"📋 Available providers: {llm_manager.get_available_providers()}")
    print(f"🎯 Default provider: {llm_manager.default_provider}")
    
    # Check which real providers are available
    has_openai = os.getenv('OPENAI_API_KEY') is not None
    has_anthropic = os.getenv('ANTHROPIC_API_KEY') is not None
    
    print(f"\n🔑 API Key Status:")
    print(f"   • OpenAI: {'✅ Available' if has_openai else '❌ Not configured'}")
    print(f"   • Anthropic: {'✅ Available' if has_anthropic else '❌ Not configured'}")
    
    # Test health check
    print(f"\n🏥 Health Check:")
    health = llm_manager.health_check()
    print(f"   • Overall Status: {health['status']}")
    
    for provider, status in health['providers'].items():
        if status['status'] == 'healthy':
            print(f"   • {provider}: ✅ {status.get('model', 'unknown')} ({status.get('response_time_ms', 0)}ms)")
        else:
            print(f"   • {provider}: ❌ {status.get('error', 'Unknown error')}")
    
    return llm_manager


def test_simple_completion():
    """Test simple LLM completion."""
    print("\n\n" + "="*60)
    print("💬 SIMPLE COMPLETION TEST")
    print("="*60)
    
    llm_manager = get_llm_manager()
    
    # Test messages
    messages = [
        {"role": "system", "content": "You are a helpful supply chain assistant."},
        {"role": "user", "content": "What are the key metrics for supply chain performance?"}
    ]
    
    print(f"\n📝 Testing completion with: {llm_manager.default_provider}")
    
    try:
        response = llm_manager.complete(messages)
        
        print(f"✅ Completion successful!")
        print(f"📊 Model: {response.model}")
        print(f"🏭 Provider: {response.provider}")
        print(f"⏱️  Latency: {response.latency_ms}ms")
        print(f"🔢 Tokens: {response.total_tokens} (prompt: {response.prompt_tokens}, completion: {response.completion_tokens})")
        print(f"\n💭 Response (first 200 chars):")
        print(f"   {response.content[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Completion failed: {str(e)}")
        return False


def test_agent_specific_completion():
    """Test agent-specific model selection."""
    print("\n\n" + "="*60)
    print("🤖 AGENT-SPECIFIC COMPLETION TEST")
    print("="*60)
    
    llm_manager = get_llm_manager()
    
    # Test different agent types
    agent_types = ['inventory_monitor', 'supplier_evaluator', 'demand_forecaster']
    
    for agent_type in agent_types:
        print(f"\n🔍 Testing {agent_type}:")
        
        try:
            # Get client for this agent type
            client = llm_manager.get_client_for_agent(agent_type)
            
            print(f"   • Provider: {client.provider_name}")
            print(f"   • Model: {getattr(client, 'default_model', 'unknown')}")
            
            # Test simple completion
            messages = [
                {"role": "system", "content": f"You are a {agent_type.replace('_', ' ')} agent."},
                {"role": "user", "content": f"Analyze {agent_type.replace('_', ' ')} data."}
            ]
            
            response = llm_manager.complete(messages, agent_type=agent_type)
            print(f"   • Response: ✅ {response.total_tokens} tokens")
            
        except Exception as e:
            print(f"   • Response: ❌ {str(e)}")


def test_agent_execution_with_llm():
    """Test full agent execution with LLM integration."""
    print("\n\n" + "="*60)
    print("🏭 FULL AGENT EXECUTION TEST")
    print("="*60)
    
    # Create executor
    executor = AgentExecutor(max_workers=1, default_timeout=60)
    executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)
    
    # Create agent
    agent = executor.create_agent(
        agent_id="llm_test_001",
        agent_type=AgentType.INVENTORY_MONITOR,
        name="LLM Test Inventory Agent",
        description="Testing LLM integration with inventory monitoring",
        config={
            "critical_threshold_days": 3,
            "warning_threshold_days": 7,
            "max_conversation_length": 5  # Keep it short for testing
        }
    )
    
    print(f"\n✅ Created agent: {agent.name}")
    print(f"🧠 LLM Client: {agent.llm_client.provider_name if hasattr(agent, 'llm_client') and agent.llm_client else 'Not initialized'}")
    
    # Execute agent
    print(f"\n🚀 Executing agent...")
    
    try:
        result = executor.execute_agent(
            agent_id="llm_test_001",
            input_data={
                "action": "monitor",
                "query": "Check current inventory levels and identify any critical stockouts"
            },
            org_id="test_org"
        )
        
        if result.success:
            print(f"✅ Agent execution successful!")
            print(f"📊 Confidence: {result.confidence:.2f}")
            print(f"⏱️  Tokens used: {result.tokens_used}")
            print(f"💭 Message: {result.message}")
            
            # Show reasoning steps
            if result.reasoning:
                print(f"\n🔍 Reasoning steps:")
                for i, step in enumerate(result.reasoning[:5], 1):
                    print(f"   {i}. {step}")
            
            # Show data summary
            if result.data:
                print(f"\n📈 Data summary:")
                summary = result.data.get('summary', {})
                for key, value in summary.items():
                    print(f"   • {key}: {value}")
        else:
            print(f"❌ Agent execution failed: {result.message}")
            
    except Exception as e:
        print(f"❌ Agent execution error: {str(e)}")
        import traceback
        traceback.print_exc()


def test_provider_metrics():
    """Test provider performance metrics."""
    print("\n\n" + "="*60)
    print("📊 PROVIDER METRICS TEST")
    print("="*60)
    
    llm_manager = get_llm_manager()
    metrics = llm_manager.get_provider_metrics()
    
    for provider, provider_metrics in metrics.items():
        print(f"\n📈 {provider.upper()} Metrics:")
        print(f"   • Total Requests: {provider_metrics['total_requests']}")
        print(f"   • Success Rate: {provider_metrics['success_rate']}%")
        print(f"   • Total Tokens: {provider_metrics['total_tokens']}")
        print(f"   • Avg Latency: {provider_metrics['avg_latency_ms']}ms")


def main():
    """Run all LLM integration tests."""
    print("🚀 LLM INTEGRATION TESTING SUITE")
    print("=" * 60)
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test 1: LLM Manager
        llm_manager = test_llm_manager()
        
        # Test 2: Simple completion
        completion_success = test_simple_completion()
        
        # Test 3: Agent-specific completion
        test_agent_specific_completion()
        
        # Test 4: Full agent execution (only if basic completion works)
        if completion_success:
            test_agent_execution_with_llm()
        else:
            print("\n⚠️  Skipping agent execution test due to completion failure")
        
        # Test 5: Provider metrics
        test_provider_metrics()
        
        print("\n\n✅ LLM INTEGRATION TESTS COMPLETED!")
        print("=" * 60)
        
        # Summary
        has_real_provider = any(p != "mock" for p in llm_manager.get_available_providers())
        if has_real_provider:
            print("🎉 Real LLM providers are working!")
        else:
            print("ℹ️  Only mock provider available. Configure API keys for full functionality.")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()