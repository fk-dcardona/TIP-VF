#!/usr/bin/env python3
"""Validate API keys for LLM providers."""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from config.llm_config import LLMConfig


def validate_api_keys():
    """Validate that all API keys are configured."""
    print("🔐 Validating API Keys Configuration")
    print("=" * 50)
    
    # Check each provider
    validation = LLMConfig.validate_config()
    
    all_valid = True
    for provider, is_valid in validation.items():
        status = "✅ Configured" if is_valid else "❌ Missing"
        print(f"{provider.upper()}: {status}")
        
        if is_valid and provider != 'agent_astra':
            # Show partial key for verification (first 10 chars only)
            key = LLMConfig.get_api_key(provider)
            if key:
                masked_key = key[:10] + "..." + key[-4:] if len(key) > 14 else "***"
                print(f"  → Key: {masked_key}")
        
        all_valid = all_valid and is_valid
    
    print("\n" + "=" * 50)
    
    if all_valid:
        print("✅ All API keys are configured!")
        print("\n📋 Available Models:")
        for provider in ['anthropic', 'openai', 'google']:
            if validation.get(provider):
                models = LLMConfig.MODELS.get(provider, {})
                print(f"\n{provider.upper()}:")
                for model_type, model_name in models.items():
                    print(f"  - {model_type}: {model_name}")
    else:
        print("❌ Some API keys are missing!")
        print("\nTo configure missing keys:")
        print("1. Copy .env.example to .env.local")
        print("2. Add your API keys to .env.local")
        print("3. Never commit .env.local to version control")
    
    return all_valid


def test_agent_config():
    """Test agent-specific LLM configuration."""
    from config.llm_config import AGENT_MODEL_MAPPING, get_agent_llm_config
    
    print("\n\n🤖 Agent LLM Configuration")
    print("=" * 50)
    
    for agent_type, mapping in AGENT_MODEL_MAPPING.items():
        print(f"\n{agent_type.upper()}:")
        print(f"  Provider: {mapping['provider']}")
        print(f"  Model Type: {mapping['model_type']}")
        print(f"  Temperature: {mapping['temperature']}")
        
        # Get full config
        try:
            config = get_agent_llm_config(agent_type)
            print(f"  Model: {config.get('model', 'N/A')}")
        except ValueError as e:
            print(f"  ⚠️  Error: {str(e)}")


if __name__ == "__main__":
    # Run validation
    keys_valid = validate_api_keys()
    
    # Test agent configuration if keys are valid
    if keys_valid:
        test_agent_config()
    
    # Exit with appropriate code
    sys.exit(0 if keys_valid else 1)