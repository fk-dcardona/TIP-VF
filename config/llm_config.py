"""LLM Configuration for Agent Protocol."""

import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')
load_dotenv('.env')


class LLMConfig:
    """Configuration for LLM providers."""
    
    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    AGENT_ASTRA_API_KEY = os.getenv('AGENT_ASTRA_API_KEY', 'aa_UFMDHMpOdW0bSy8SuGF0NpOu6I8iy4gu0G049xcIhFk')
    
    # Model configurations
    MODELS = {
        'openai': {
            'default': 'gpt-4-turbo-preview',
            'fast': 'gpt-3.5-turbo',
            'smart': 'gpt-4-turbo-preview',
            'vision': 'gpt-4-vision-preview'
        },
        'anthropic': {
            'default': 'claude-3-sonnet-20240229',
            'fast': 'claude-3-haiku-20240307',
            'smart': 'claude-3-opus-20240229',
            'vision': 'claude-3-sonnet-20240229'
        },
        'google': {
            'default': 'gemini-pro',
            'fast': 'gemini-pro',
            'smart': 'gemini-pro',
            'vision': 'gemini-pro-vision'
        }
    }
    
    # Default settings
    DEFAULT_PROVIDER = 'anthropic'  # Primary provider
    FALLBACK_PROVIDERS = ['openai', 'google']  # Fallback order
    
    # Model parameters
    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_MAX_TOKENS = 4096
    DEFAULT_TOP_P = 0.9
    
    # Rate limiting
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds
    REQUEST_TIMEOUT = 60  # seconds
    
    @classmethod
    def get_api_key(cls, provider: str) -> Optional[str]:
        """Get API key for a provider."""
        key_map = {
            'openai': cls.OPENAI_API_KEY,
            'anthropic': cls.ANTHROPIC_API_KEY,
            'google': cls.GOOGLE_API_KEY,
            'agent_astra': cls.AGENT_ASTRA_API_KEY
        }
        return key_map.get(provider)
    
    @classmethod
    def get_model(cls, provider: str, model_type: str = 'default') -> str:
        """Get model name for provider and type."""
        provider_models = cls.MODELS.get(provider, {})
        return provider_models.get(model_type, provider_models.get('default', ''))
    
    @classmethod
    def get_provider_config(cls, provider: str) -> Dict[str, Any]:
        """Get complete configuration for a provider."""
        api_key = cls.get_api_key(provider)
        if not api_key:
            raise ValueError(f"No API key configured for provider: {provider}")
        
        return {
            'api_key': api_key,
            'models': cls.MODELS.get(provider, {}),
            'default_model': cls.get_model(provider),
            'temperature': cls.DEFAULT_TEMPERATURE,
            'max_tokens': cls.DEFAULT_MAX_TOKENS,
            'top_p': cls.DEFAULT_TOP_P,
            'timeout': cls.REQUEST_TIMEOUT,
            'max_retries': cls.MAX_RETRIES
        }
    
    @classmethod
    def validate_config(cls) -> Dict[str, bool]:
        """Validate that required API keys are present."""
        return {
            'openai': bool(cls.OPENAI_API_KEY),
            'anthropic': bool(cls.ANTHROPIC_API_KEY),
            'google': bool(cls.GOOGLE_API_KEY),
            'agent_astra': bool(cls.AGENT_ASTRA_API_KEY)
        }


# Agent-specific model recommendations
AGENT_MODEL_MAPPING = {
    'inventory_monitor': {
        'provider': 'anthropic',
        'model_type': 'fast',  # High-frequency monitoring
        'temperature': 0.3     # More deterministic
    },
    'supplier_evaluator': {
        'provider': 'anthropic',
        'model_type': 'smart',  # Complex analysis
        'temperature': 0.5
    },
    'demand_forecaster': {
        'provider': 'openai',
        'model_type': 'smart',  # Mathematical reasoning
        'temperature': 0.3
    },
    'document_analyzer': {
        'provider': 'anthropic',
        'model_type': 'vision',  # Document processing
        'temperature': 0.4
    },
    'risk_assessor': {
        'provider': 'anthropic',
        'model_type': 'smart',  # Risk analysis
        'temperature': 0.6
    },
    'optimization_agent': {
        'provider': 'openai',
        'model_type': 'smart',  # Complex optimization
        'temperature': 0.5
    }
}


def get_agent_llm_config(agent_type: str) -> Dict[str, Any]:
    """Get LLM configuration for a specific agent type."""
    mapping = AGENT_MODEL_MAPPING.get(agent_type, {
        'provider': LLMConfig.DEFAULT_PROVIDER,
        'model_type': 'default',
        'temperature': LLMConfig.DEFAULT_TEMPERATURE
    })
    
    provider = mapping['provider']
    config = LLMConfig.get_provider_config(provider)
    
    # Override with agent-specific settings
    config['model'] = LLMConfig.get_model(provider, mapping['model_type'])
    config['temperature'] = mapping.get('temperature', config['temperature'])
    config['agent_type'] = agent_type
    
    return config