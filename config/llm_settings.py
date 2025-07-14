"""
LLM Model Configuration and Cost Tracking
========================================

Comprehensive configuration for LLM providers including model specifications,
context windows, pricing, and agent-specific preferences with cost optimization.
"""

import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal


@dataclass
class ModelSpecification:
    """Detailed specification for an LLM model."""
    name: str
    provider: str
    context_window: int
    max_output_tokens: int
    input_cost_per_1k: Decimal  # USD per 1000 tokens
    output_cost_per_1k: Decimal  # USD per 1000 tokens
    capabilities: List[str] = field(default_factory=list)
    recommended_for: List[str] = field(default_factory=list)
    latency_category: str = "medium"  # fast, medium, slow
    
    @property
    def total_context(self) -> int:
        """Total available context (input + output)."""
        return self.context_window
    
    def calculate_cost(self, input_tokens: int, output_tokens: int) -> Decimal:
        """Calculate cost for a specific usage."""
        input_cost = (Decimal(input_tokens) / 1000) * self.input_cost_per_1k
        output_cost = (Decimal(output_tokens) / 1000) * self.output_cost_per_1k
        return input_cost + output_cost


class LLMSettings:
    """Comprehensive LLM configuration with cost tracking."""
    
    # Environment variable validation
    REQUIRED_ENV_VARS = {
        'OPENAI_API_KEY': 'OpenAI API key for GPT models',
        'ANTHROPIC_API_KEY': 'Anthropic API key for Claude models',
        'GOOGLE_API_KEY': 'Google API key for Gemini models'
    }
    
    # Model Specifications (as of January 2025)
    MODEL_SPECS = {
        # OpenAI Models
        'gpt-4-turbo-preview': ModelSpecification(
            name='gpt-4-turbo-preview',
            provider='openai',
            context_window=128000,
            max_output_tokens=4096,
            input_cost_per_1k=Decimal('0.01'),
            output_cost_per_1k=Decimal('0.03'),
            capabilities=['reasoning', 'code', 'analysis', 'vision'],
            recommended_for=['complex_analysis', 'optimization', 'forecasting'],
            latency_category='medium'
        ),
        'gpt-4': ModelSpecification(
            name='gpt-4',
            provider='openai',
            context_window=8192,
            max_output_tokens=4096,
            input_cost_per_1k=Decimal('0.03'),
            output_cost_per_1k=Decimal('0.06'),
            capabilities=['reasoning', 'code', 'analysis'],
            recommended_for=['high_accuracy_tasks'],
            latency_category='slow'
        ),
        'gpt-3.5-turbo': ModelSpecification(
            name='gpt-3.5-turbo',
            provider='openai',
            context_window=16385,
            max_output_tokens=4096,
            input_cost_per_1k=Decimal('0.0005'),
            output_cost_per_1k=Decimal('0.0015'),
            capabilities=['basic_reasoning', 'code', 'simple_analysis'],
            recommended_for=['simple_queries', 'high_volume_tasks'],
            latency_category='fast'
        ),
        
        # Anthropic Models
        'claude-3-opus-20240229': ModelSpecification(
            name='claude-3-opus-20240229',
            provider='anthropic',
            context_window=200000,
            max_output_tokens=4096,
            input_cost_per_1k=Decimal('0.015'),
            output_cost_per_1k=Decimal('0.075'),
            capabilities=['deep_reasoning', 'code', 'analysis', 'creative'],
            recommended_for=['complex_analysis', 'risk_assessment', 'evaluation'],
            latency_category='slow'
        ),
        'claude-3-sonnet-20240229': ModelSpecification(
            name='claude-3-sonnet-20240229',
            provider='anthropic',
            context_window=200000,
            max_output_tokens=4096,
            input_cost_per_1k=Decimal('0.003'),
            output_cost_per_1k=Decimal('0.015'),
            capabilities=['reasoning', 'code', 'analysis', 'vision'],
            recommended_for=['document_analysis', 'balanced_tasks'],
            latency_category='medium'
        ),
        'claude-3-haiku-20240307': ModelSpecification(
            name='claude-3-haiku-20240307',
            provider='anthropic',
            context_window=200000,
            max_output_tokens=4096,
            input_cost_per_1k=Decimal('0.00025'),
            output_cost_per_1k=Decimal('0.00125'),
            capabilities=['basic_reasoning', 'code', 'fast_processing'],
            recommended_for=['monitoring', 'high_frequency_tasks'],
            latency_category='fast'
        ),
        
        # Google Models
        'gemini-pro': ModelSpecification(
            name='gemini-pro',
            provider='google',
            context_window=32760,
            max_output_tokens=8192,
            input_cost_per_1k=Decimal('0.00025'),
            output_cost_per_1k=Decimal('0.0005'),
            capabilities=['reasoning', 'code', 'analysis'],
            recommended_for=['cost_effective_analysis'],
            latency_category='medium'
        ),
        'gemini-pro-vision': ModelSpecification(
            name='gemini-pro-vision',
            provider='google',
            context_window=32760,
            max_output_tokens=8192,
            input_cost_per_1k=Decimal('0.00025'),
            output_cost_per_1k=Decimal('0.0005'),
            capabilities=['reasoning', 'code', 'analysis', 'vision'],
            recommended_for=['document_processing_with_images'],
            latency_category='medium'
        )
    }
    
    # Agent-specific model preferences with evidence-based selection
    AGENT_MODEL_PREFERENCES = {
        'inventory_monitor': {
            'primary': 'claude-3-haiku-20240307',
            'fallback': ['gpt-3.5-turbo', 'gemini-pro'],
            'reasoning': 'High-frequency monitoring requires fast, cost-effective model',
            'max_cost_per_call': Decimal('0.10'),
            'temperature': 0.3,
            'max_tokens': 2048
        },
        'supplier_evaluator': {
            'primary': 'claude-3-opus-20240229',
            'fallback': ['gpt-4-turbo-preview', 'claude-3-sonnet-20240229'],
            'reasoning': 'Complex supplier analysis requires advanced reasoning capabilities',
            'max_cost_per_call': Decimal('1.00'),
            'temperature': 0.5,
            'max_tokens': 4096
        },
        'demand_forecaster': {
            'primary': 'gpt-4-turbo-preview',
            'fallback': ['claude-3-opus-20240229', 'gpt-4'],
            'reasoning': 'Mathematical and statistical analysis benefits from GPT-4 capabilities',
            'max_cost_per_call': Decimal('0.50'),
            'temperature': 0.3,
            'max_tokens': 3072
        },
        'document_analyzer': {
            'primary': 'claude-3-sonnet-20240229',
            'fallback': ['gemini-pro-vision', 'gpt-4-turbo-preview'],
            'reasoning': 'Balance of vision capabilities and cost for document processing',
            'max_cost_per_call': Decimal('0.30'),
            'temperature': 0.4,
            'max_tokens': 4096
        },
        'risk_assessor': {
            'primary': 'claude-3-opus-20240229',
            'fallback': ['gpt-4-turbo-preview', 'claude-3-sonnet-20240229'],
            'reasoning': 'Risk assessment requires deep analytical capabilities',
            'max_cost_per_call': Decimal('0.75'),
            'temperature': 0.6,
            'max_tokens': 4096
        },
        'optimization_agent': {
            'primary': 'gpt-4-turbo-preview',
            'fallback': ['claude-3-opus-20240229', 'gpt-4'],
            'reasoning': 'Optimization problems benefit from GPT-4 mathematical reasoning',
            'max_cost_per_call': Decimal('0.60'),
            'temperature': 0.5,
            'max_tokens': 4096
        }
    }
    
    # Cost tracking configuration
    COST_TRACKING = {
        'enabled': os.getenv('LLM_COST_TRACKING_ENABLED', 'true').lower() == 'true',
        'alert_threshold_daily': Decimal(os.getenv('LLM_DAILY_COST_ALERT', '100.00')),
        'alert_threshold_monthly': Decimal(os.getenv('LLM_MONTHLY_COST_ALERT', '2000.00')),
        'cost_log_file': os.getenv('LLM_COST_LOG_FILE', 'logs/llm_costs.log'),
        'detailed_logging': os.getenv('LLM_DETAILED_LOGGING', 'true').lower() == 'true'
    }
    
    # Rate limiting configuration
    RATE_LIMITS = {
        'openai': {
            'requests_per_minute': int(os.getenv('OPENAI_RPM', '500')),
            'tokens_per_minute': int(os.getenv('OPENAI_TPM', '90000'))
        },
        'anthropic': {
            'requests_per_minute': int(os.getenv('ANTHROPIC_RPM', '50')),
            'tokens_per_minute': int(os.getenv('ANTHROPIC_TPM', '100000'))
        },
        'google': {
            'requests_per_minute': int(os.getenv('GOOGLE_RPM', '60')),
            'tokens_per_minute': int(os.getenv('GOOGLE_TPM', '60000'))
        }
    }
    
    # Optimization strategies
    OPTIMIZATION_STRATEGIES = {
        'cost_priority': {
            'description': 'Minimize costs while maintaining quality',
            'model_selection': lambda task: LLMSettings._select_cost_optimal_model(task),
            'batch_size': 10,
            'cache_ttl': 3600
        },
        'speed_priority': {
            'description': 'Minimize latency for real-time responses',
            'model_selection': lambda task: LLMSettings._select_speed_optimal_model(task),
            'batch_size': 1,
            'cache_ttl': 300
        },
        'quality_priority': {
            'description': 'Maximize output quality regardless of cost',
            'model_selection': lambda task: LLMSettings._select_quality_optimal_model(task),
            'batch_size': 5,
            'cache_ttl': 1800
        }
    }
    
    @classmethod
    def get_provider_config(cls, provider: str) -> Dict[str, Any]:
        """Get configuration for a specific provider."""
        if provider == 'openai':
            return {
                'model': 'gpt-4-turbo-preview',
                'temperature': 0.7,
                'max_tokens': 1000,
                'rate_limit': cls.RATE_LIMITS.get('openai', {}),
                'api_key_env': 'OPENAI_API_KEY'
            }
        elif provider == 'anthropic':
            return {
                'model': 'claude-3-haiku-20240307',
                'temperature': 0.7,
                'max_tokens': 1000,
                'rate_limit': cls.RATE_LIMITS.get('anthropic', {}),
                'api_key_env': 'ANTHROPIC_API_KEY'
            }
        elif provider == 'google':
            return {
                'model': 'gemini-pro',
                'temperature': 0.7,
                'max_tokens': 1000,
                'rate_limit': cls.RATE_LIMITS.get('google', {}),
                'api_key_env': 'GOOGLE_API_KEY'
            }
        else:
            return {
                'model': 'mock-model',
                'temperature': 0.7,
                'max_tokens': 1000,
                'provider': 'mock'
            }
    
    @classmethod
    def validate_environment(cls) -> Dict[str, bool]:
        """Validate that all required environment variables are set."""
        validation_results = {}
        
        for env_var, description in cls.REQUIRED_ENV_VARS.items():
            value = os.getenv(env_var)
            validation_results[env_var] = bool(value and len(value) > 0)
            
            if not validation_results[env_var]:
                print(f"⚠️  Missing {env_var}: {description}")
        
        # Check optional but recommended variables
        optional_vars = {
            'LLM_COST_TRACKING_ENABLED': 'Enable cost tracking',
            'LLM_DAILY_COST_ALERT': 'Daily cost alert threshold',
            'LLM_MONTHLY_COST_ALERT': 'Monthly cost alert threshold'
        }
        
        for env_var, description in optional_vars.items():
            if not os.getenv(env_var):
                print(f"ℹ️  Optional {env_var} not set: {description}")
        
        return validation_results
    
    @classmethod
    def get_model_for_agent(cls, agent_type: str, 
                           optimization_strategy: str = 'cost_priority') -> Dict[str, Any]:
        """
        Get optimal model configuration for an agent type.
        
        Returns model selection with evidence-based reasoning.
        """
        if agent_type not in cls.AGENT_MODEL_PREFERENCES:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        prefs = cls.AGENT_MODEL_PREFERENCES[agent_type]
        primary_model = prefs['primary']
        
        # Get model specification
        model_spec = cls.MODEL_SPECS.get(primary_model)
        if not model_spec:
            # Fall back to first available fallback model
            for fallback in prefs['fallback']:
                if fallback in cls.MODEL_SPECS:
                    model_spec = cls.MODEL_SPECS[fallback]
                    primary_model = fallback
                    break
        
        if not model_spec:
            raise ValueError(f"No valid model found for agent {agent_type}")
        
        return {
            'model': primary_model,
            'provider': model_spec.provider,
            'temperature': prefs['temperature'],
            'max_tokens': prefs['max_tokens'],
            'max_cost_per_call': float(prefs['max_cost_per_call']),
            'reasoning': prefs['reasoning'],
            'model_spec': model_spec,
            'optimization_strategy': optimization_strategy,
            'fallback_models': prefs['fallback']
        }
    
    @classmethod
    def _select_cost_optimal_model(cls, task_requirements: Dict[str, Any]) -> str:
        """Select the most cost-effective model for a task."""
        required_capabilities = task_requirements.get('capabilities', [])
        max_tokens_needed = task_requirements.get('max_tokens', 2048)
        
        # Filter models by capabilities
        suitable_models = []
        for model_name, spec in cls.MODEL_SPECS.items():
            if all(cap in spec.capabilities for cap in required_capabilities):
                if spec.max_output_tokens >= max_tokens_needed:
                    suitable_models.append((model_name, spec))
        
        # Sort by cost (assuming average 1:1 input/output ratio)
        suitable_models.sort(key=lambda x: x[1].input_cost_per_1k + x[1].output_cost_per_1k)
        
        return suitable_models[0][0] if suitable_models else 'gpt-3.5-turbo'
    
    @classmethod
    def _select_speed_optimal_model(cls, task_requirements: Dict[str, Any]) -> str:
        """Select the fastest model for a task."""
        fast_models = [
            (name, spec) for name, spec in cls.MODEL_SPECS.items()
            if spec.latency_category == 'fast'
        ]
        
        # Among fast models, pick the one with best capabilities
        if task_requirements.get('high_quality', False):
            return 'claude-3-haiku-20240307'
        else:
            return 'gpt-3.5-turbo'
    
    @classmethod
    def _select_quality_optimal_model(cls, task_requirements: Dict[str, Any]) -> str:
        """Select the highest quality model for a task."""
        if 'vision' in task_requirements.get('capabilities', []):
            return 'gpt-4-turbo-preview'
        elif task_requirements.get('deep_reasoning', False):
            return 'claude-3-opus-20240229'
        else:
            return 'gpt-4-turbo-preview'
    
    @classmethod
    def calculate_estimated_cost(cls, agent_type: str, 
                               estimated_calls_per_day: int) -> Dict[str, Decimal]:
        """Calculate estimated costs for an agent."""
        config = cls.get_model_for_agent(agent_type)
        model_spec = config['model_spec']
        
        # Estimate tokens per call (conservative estimate)
        avg_input_tokens = 1000
        avg_output_tokens = config['max_tokens'] // 2
        
        cost_per_call = model_spec.calculate_cost(avg_input_tokens, avg_output_tokens)
        
        return {
            'cost_per_call': cost_per_call,
            'daily_cost': cost_per_call * estimated_calls_per_day,
            'monthly_cost': cost_per_call * estimated_calls_per_day * 30,
            'model': config['model'],
            'breakdown': {
                'input_cost': (Decimal(avg_input_tokens) / 1000) * model_spec.input_cost_per_1k,
                'output_cost': (Decimal(avg_output_tokens) / 1000) * model_spec.output_cost_per_1k
            }
        }
    
    @classmethod
    def get_cost_report(cls, usage_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate cost report from usage data."""
        total_cost = Decimal('0')
        by_provider = {}
        by_model = {}
        by_agent = {}
        
        for usage in usage_data:
            model = usage['model']
            input_tokens = usage['input_tokens']
            output_tokens = usage['output_tokens']
            agent_type = usage.get('agent_type', 'unknown')
            
            if model in cls.MODEL_SPECS:
                spec = cls.MODEL_SPECS[model]
                cost = spec.calculate_cost(input_tokens, output_tokens)
                total_cost += cost
                
                # Aggregate by provider
                if spec.provider not in by_provider:
                    by_provider[spec.provider] = Decimal('0')
                by_provider[spec.provider] += cost
                
                # Aggregate by model
                if model not in by_model:
                    by_model[model] = {'cost': Decimal('0'), 'calls': 0}
                by_model[model]['cost'] += cost
                by_model[model]['calls'] += 1
                
                # Aggregate by agent
                if agent_type not in by_agent:
                    by_agent[agent_type] = Decimal('0')
                by_agent[agent_type] += cost
        
        return {
            'total_cost': float(total_cost),
            'by_provider': {k: float(v) for k, v in by_provider.items()},
            'by_model': {k: {'cost': float(v['cost']), 'calls': v['calls']} 
                        for k, v in by_model.items()},
            'by_agent': {k: float(v) for k, v in by_agent.items()},
            'timestamp': datetime.utcnow().isoformat()
        }


# Model selection logic example
def demonstrate_model_selection():
    """Demonstrate evidence-based model selection and cost optimization."""
    
    print("🤖 LLM Model Selection Logic Demonstration")
    print("=" * 60)
    
    # Example: Inventory monitoring task
    print("\n1. Inventory Monitoring Task:")
    task = {
        'agent_type': 'inventory_monitor',
        'frequency': 'every_5_minutes',
        'estimated_daily_calls': 288  # 24 hours * 12 calls/hour
    }
    
    config = LLMSettings.get_model_for_agent('inventory_monitor')
    costs = LLMSettings.calculate_estimated_cost('inventory_monitor', task['estimated_daily_calls'])
    
    print(f"   Selected Model: {config['model']}")
    print(f"   Reasoning: {config['reasoning']}")
    print(f"   Cost per call: ${costs['cost_per_call']:.4f}")
    print(f"   Daily cost: ${costs['daily_cost']:.2f}")
    print(f"   Monthly cost: ${costs['monthly_cost']:.2f}")
    
    # Example: Complex risk assessment
    print("\n2. Risk Assessment Task:")
    task = {
        'agent_type': 'risk_assessor',
        'frequency': 'on_demand',
        'estimated_daily_calls': 10
    }
    
    config = LLMSettings.get_model_for_agent('risk_assessor')
    costs = LLMSettings.calculate_estimated_cost('risk_assessor', task['estimated_daily_calls'])
    
    print(f"   Selected Model: {config['model']}")
    print(f"   Reasoning: {config['reasoning']}")
    print(f"   Cost per call: ${costs['cost_per_call']:.4f}")
    print(f"   Daily cost: ${costs['daily_cost']:.2f}")
    print(f"   Monthly cost: ${costs['monthly_cost']:.2f}")
    
    # Cost optimization comparison
    print("\n3. Cost Optimization Strategy:")
    requirements = {
        'capabilities': ['basic_reasoning', 'code'],
        'max_tokens': 2048
    }
    
    cost_optimal = LLMSettings._select_cost_optimal_model(requirements)
    speed_optimal = LLMSettings._select_speed_optimal_model(requirements)
    quality_optimal = LLMSettings._select_quality_optimal_model(requirements)
    
    print(f"   Cost-optimized choice: {cost_optimal}")
    print(f"   Speed-optimized choice: {speed_optimal}")
    print(f"   Quality-optimized choice: {quality_optimal}")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    # Validate environment
    print("🔐 Validating LLM Environment Variables")
    print("=" * 60)
    validation = LLMSettings.validate_environment()
    
    all_valid = all(validation.values())
    if all_valid:
        print("✅ All required environment variables are configured!")
    else:
        print("❌ Some required environment variables are missing!")
    
    print("\n")
    
    # Demonstrate model selection
    demonstrate_model_selection()