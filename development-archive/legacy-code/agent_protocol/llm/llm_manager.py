"""LLM Manager for provider selection and client management."""

import os
import logging
from typing import Dict, Any, List, Optional, Union

from .llm_client import LLMClient, LLMResponse
from .openai_client import OpenAIClient
from .anthropic_client import AnthropicClient
from config.llm_settings import LLMSettings


class MockLLMClient(LLMClient):
    """Mock LLM client for testing and fallback."""
    
    def __init__(self, api_key: str = "mock", config: Dict[str, Any] = None):
        """Initialize mock client."""
        super().__init__(api_key, config or {})
        self.default_model = config.get('model', 'mock-model') if config else 'mock-model'
    
    @property
    def provider_name(self) -> str:
        """Get provider name."""
        return "mock"
    
    def complete(self, messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
        """Generate mock completion."""
        # Simple mock response based on messages
        user_content = ""
        for msg in messages:
            if msg.get('role') == 'user':
                user_content = msg.get('content', '')
                break
        
        # Generate contextual mock response
        if 'inventory' in user_content.lower():
            content = "Based on the inventory analysis, I found 3 critical stockouts and 5 warning-level items. Recommended immediate reordering for SKU123, SKU456, and SKU789."
        elif 'supplier' in user_content.lower():
            content = "Supplier evaluation completed. SUPP001 scored 0.85/1.0 with excellent quality (0.92) and delivery (0.88) metrics. Recommend continued partnership."
        elif 'demand' in user_content.lower():
            content = "Demand forecast shows 15% growth trend over next 30 days. High confidence (0.87) with seasonal patterns detected. Recommend inventory buffer increase."
        else:
            content = "Analysis completed successfully. Mock response generated for demonstration purposes."
        
        return LLMResponse(
            content=content,
            model=self.default_model,
            provider=self.provider_name,
            usage={
                'prompt_tokens': 150,
                'completion_tokens': 75,
                'total_tokens': 225
            },
            finish_reason='stop',
            latency_ms=100
        )
    
    def complete_with_tools(self, messages: List[Dict[str, str]], 
                           tools: List[Dict[str, Any]], **kwargs) -> LLMResponse:
        """Generate mock completion with tool calls."""
        # Mock tool call based on available tools
        tool_calls = []
        if tools:
            first_tool = tools[0]
            tool_name = first_tool.get('function', {}).get('name', 'unknown_tool')
            tool_calls.append({
                'id': 'mock_call_1',
                'type': 'function',
                'function': {
                    'name': tool_name,
                    'arguments': '{"query": "sample query"}'
                }
            })
        
        content = "I'll analyze the data using the available tools."
        if tool_calls:
            content += f"\n\nTOOL_CALLS: {tool_calls}"
        
        return LLMResponse(
            content=content,
            model=self.default_model,
            provider=self.provider_name,
            usage={
                'prompt_tokens': 200,
                'completion_tokens': 100,
                'total_tokens': 300
            },
            finish_reason='tool_calls' if tool_calls else 'stop',
            latency_ms=150,
            metadata={'tool_calls': tool_calls}
        )


class LLMManager:
    """Manager for LLM clients and provider selection."""
    
    def __init__(self):
        """Initialize LLM manager."""
        self.logger = logging.getLogger(self.__class__.__name__)
        self.clients: Dict[str, LLMClient] = {}
        self.default_provider = "mock"
        
        # Initialize available providers
        self._initialize_providers()
        
        self.logger.info(f"LLM Manager initialized with providers: {list(self.clients.keys())}")
        self.logger.info(f"Default provider: {self.default_provider}")
    
    def _initialize_providers(self):
        """Initialize available LLM providers."""
        # Always add mock provider
        self.clients["mock"] = MockLLMClient()
        
        # Initialize OpenAI if API key available
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            try:
                config = LLMSettings.get_provider_config('openai')
                self.clients["openai"] = OpenAIClient(openai_key, config)
                if self.default_provider == "mock":
                    self.default_provider = "openai"
                self.logger.info("OpenAI provider initialized successfully")
            except Exception as e:
                self.logger.error(f"Failed to initialize OpenAI provider: {str(e)}")
        
        # Initialize Anthropic if API key available
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            try:
                config = LLMSettings.get_provider_config('anthropic')
                self.clients["anthropic"] = AnthropicClient(anthropic_key, config)
                if self.default_provider == "mock":
                    self.default_provider = "anthropic"
                self.logger.info("Anthropic provider initialized successfully")
            except Exception as e:
                self.logger.error(f"Failed to initialize Anthropic provider: {str(e)}")
    
    def get_client_for_agent(self, agent_type: str) -> LLMClient:
        """Get the optimal LLM client for an agent type."""
        # Get agent-specific configuration
        config = LLMSettings.get_model_for_agent(agent_type)
        provider = config.get('provider', self.default_provider)
        
        # Return client or fallback to default
        if provider in self.clients:
            return self.clients[provider]
        else:
            self.logger.warning(f"Provider {provider} not available for {agent_type}, using {self.default_provider}")
            return self.clients[self.default_provider]
    
    def get_client(self, provider: str = None) -> LLMClient:
        """Get LLM client by provider name."""
        if provider is None:
            provider = self.default_provider
        
        if provider in self.clients:
            return self.clients[provider]
        else:
            self.logger.warning(f"Provider {provider} not available, using {self.default_provider}")
            return self.clients[self.default_provider]
    
    def complete(self, messages: List[Dict[str, str]], 
                agent_type: str = None, provider: str = None, **kwargs) -> LLMResponse:
        """Generate completion using appropriate client."""
        if agent_type:
            client = self.get_client_for_agent(agent_type)
            # Get model configuration for the agent
            config = LLMSettings.get_model_for_agent(agent_type)
            kwargs.setdefault('model', config.get('model'))
        else:
            client = self.get_client(provider)
        
        return client.complete(messages, **kwargs)
    
    def complete_with_tools(self, messages: List[Dict[str, str]], 
                           tools: List[Dict[str, Any]],
                           agent_type: str = None, provider: str = None, **kwargs) -> LLMResponse:
        """Generate completion with tools using appropriate client."""
        if agent_type:
            client = self.get_client_for_agent(agent_type)
            # Get model configuration for the agent
            config = LLMSettings.get_model_for_agent(agent_type)
            kwargs.setdefault('model', config.get('model'))
        else:
            client = self.get_client(provider)
        
        return client.complete_with_tools(messages, tools, **kwargs)
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers."""
        return list(self.clients.keys())
    
    def get_provider_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all providers."""
        metrics = {}
        for provider, client in self.clients.items():
            metrics[provider] = client.get_metrics()
        return metrics
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on all providers."""
        health = {
            'status': 'healthy',
            'providers': {},
            'default_provider': self.default_provider
        }
        
        for provider, client in self.clients.items():
            try:
                # Simple test completion
                test_messages = [
                    {"role": "system", "content": "You are a test assistant."},
                    {"role": "user", "content": "Test message"}
                ]
                
                response = client.complete(test_messages, max_tokens=10)
                
                health['providers'][provider] = {
                    'status': 'healthy',
                    'model': getattr(client, 'default_model', 'unknown'),
                    'response_time_ms': response.latency_ms
                }
                
            except Exception as e:
                health['providers'][provider] = {
                    'status': 'unhealthy',
                    'error': str(e)
                }
                
                # If default provider is unhealthy, mark overall as degraded
                if provider == self.default_provider:
                    health['status'] = 'degraded'
        
        return health


# Global LLM manager instance
_llm_manager = None

def get_llm_manager() -> LLMManager:
    """Get global LLM manager instance."""
    global _llm_manager
    if _llm_manager is None:
        _llm_manager = LLMManager()
    return _llm_manager