#!/usr/bin/env python3
"""Validate API keys for LLM providers."""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Optional

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from backend.config.llm_config import LLMConfig

# Configure logging
logger = logging.getLogger(__name__)


def validate_api_keys() -> Dict[str, bool]:
    """Validate that all required API keys are configured."""
    logger.info("🔐 Validating API Keys Configuration")
    
    # Define required API keys
    required_keys = {
        'ANTHROPIC_API_KEY': 'Anthropic Claude API key for LLM operations',
        'OPENAI_API_KEY': 'OpenAI API key for alternative LLM operations',
        'SUPABASE_URL': 'Supabase project URL',
        'SUPABASE_KEY': 'Supabase service role key',
        'CLERK_SECRET_KEY': 'Clerk authentication secret key'
    }
    
    validation_results = {}
    
    for key, description in required_keys.items():
        value = os.getenv(key)
        if value:
            # Mask the key for logging (show first 4 and last 4 characters)
            masked_key = f"{value[:4]}...{value[-4:]}" if len(value) > 8 else "***"
            logger.info(f"  → Key: {masked_key}")
            validation_results[key] = True
        else:
            logger.warning(f"  → Missing: {key} ({description})")
            validation_results[key] = False
    
    # Check overall status
    all_configured = all(validation_results.values())
    if all_configured:
        logger.info("✅ All API keys are configured!")
    else:
        logger.error("❌ Some API keys are missing!")
        logger.info("\nTo configure missing keys:")
        logger.info("1. Copy .env.example to .env.local")
        logger.info("2. Add your API keys to .env.local")
    
    return validation_results


def test_agent_config():
    """Test agent-specific LLM configuration."""
from backend.config.llm_config import AGENT_MODEL_MAPPING, get_agent_llm_config
    
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