"""Anthropic Claude LLM client implementation."""

import json
import time
import logging
from typing import Dict, Any, List, Optional

import anthropic
from anthropic import Anthropic

from .llm_client import LLMClient, LLMResponse


class AnthropicClient(LLMClient):
    """Anthropic Claude client implementation."""
    
    def __init__(self, api_key: str, config: Dict[str, Any]):
        """Initialize Anthropic client."""
        super().__init__(api_key, config)
        
        self.client = Anthropic(api_key=api_key)
        self.default_model = config.get('model', 'claude-3-haiku-20240307')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 1000)
        
        self.logger.info(f"Anthropic client initialized with model: {self.default_model}")
    
    @property
    def provider_name(self) -> str:
        """Get provider name."""
        return "anthropic"
    
    def complete(self, messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
        """Generate completion from messages."""
        start_time = time.time()
        
        try:
            # Separate system message from other messages
            system_prompt = ""
            formatted_messages = []
            
            for msg in messages:
                if msg['role'] == 'system':
                    system_prompt = msg['content']
                else:
                    formatted_messages.append(msg)
            
            # Prepare parameters
            params = {
                'model': kwargs.get('model', self.default_model),
                'messages': formatted_messages,
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'temperature': kwargs.get('temperature', self.temperature),
            }
            
            # Add system prompt if present
            if system_prompt:
                params['system'] = system_prompt
            
            # Optional parameters
            if 'top_p' in kwargs:
                params['top_p'] = kwargs['top_p']
            if 'top_k' in kwargs:
                params['top_k'] = kwargs['top_k']
            if 'stop_sequences' in kwargs:
                params['stop_sequences'] = kwargs['stop_sequences']
            
            # Make API call
            response = self.client.messages.create(**params)
            
            # Extract content
            content = ""
            for content_block in response.content:
                if content_block.type == 'text':
                    content += content_block.text
            
            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Create standardized response
            llm_response = LLMResponse(
                content=content,
                model=response.model,
                provider=self.provider_name,
                usage={
                    'prompt_tokens': response.usage.input_tokens,
                    'completion_tokens': response.usage.output_tokens,
                    'total_tokens': response.usage.input_tokens + response.usage.output_tokens
                },
                finish_reason=response.stop_reason,
                latency_ms=latency_ms,
                metadata={
                    'id': response.id,
                    'type': response.type,
                    'role': response.role
                }
            )
            
            # Track metrics
            self.track_metrics(llm_response, success=True)
            
            return llm_response
            
        except anthropic.RateLimitError as e:
            self.logger.warning(f"Anthropic rate limit hit: {str(e)}")
            self.handle_rate_limit()
            raise
            
        except anthropic.APIError as e:
            self.logger.error(f"Anthropic API error: {str(e)}")
            self.track_metrics(None, success=False)
            raise
            
        except Exception as e:
            self.logger.error(f"Anthropic completion failed: {str(e)}")
            self.track_metrics(None, success=False)
            raise
    
    def complete_with_tools(self, messages: List[Dict[str, str]], 
                           tools: List[Dict[str, Any]], **kwargs) -> LLMResponse:
        """Generate completion with tool/function calling."""
        start_time = time.time()
        
        try:
            # Separate system message from other messages
            system_prompt = ""
            formatted_messages = []
            
            for msg in messages:
                if msg['role'] == 'system':
                    system_prompt = msg['content']
                else:
                    formatted_messages.append(msg)
            
            # Convert OpenAI-style tools to Anthropic format
            anthropic_tools = []
            for tool in tools:
                if 'function' in tool:
                    anthropic_tools.append({
                        'name': tool['function']['name'],
                        'description': tool['function'].get('description', ''),
                        'input_schema': tool['function'].get('parameters', {})
                    })
            
            # Prepare parameters
            params = {
                'model': kwargs.get('model', self.default_model),
                'messages': formatted_messages,
                'tools': anthropic_tools,
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'temperature': kwargs.get('temperature', self.temperature),
            }
            
            # Add system prompt if present
            if system_prompt:
                params['system'] = system_prompt
            
            # Make API call
            response = self.client.messages.create(**params)
            
            # Extract content and tool uses
            content = ""
            tool_calls = []
            
            for content_block in response.content:
                if content_block.type == 'text':
                    content += content_block.text
                elif content_block.type == 'tool_use':
                    tool_calls.append({
                        'id': content_block.id,
                        'type': 'function',
                        'function': {
                            'name': content_block.name,
                            'arguments': json.dumps(content_block.input)
                        }
                    })
            
            # Add tool calls to content if present
            if tool_calls:
                content += f"\n\nTOOL_CALLS: {json.dumps(tool_calls, indent=2)}"
            
            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Create standardized response
            llm_response = LLMResponse(
                content=content,
                model=response.model,
                provider=self.provider_name,
                usage={
                    'prompt_tokens': response.usage.input_tokens,
                    'completion_tokens': response.usage.output_tokens,
                    'total_tokens': response.usage.input_tokens + response.usage.output_tokens
                },
                finish_reason=response.stop_reason,
                latency_ms=latency_ms,
                metadata={
                    'id': response.id,
                    'type': response.type,
                    'role': response.role,
                    'tool_calls': tool_calls
                }
            )
            
            # Track metrics
            self.track_metrics(llm_response, success=True)
            
            return llm_response
            
        except anthropic.RateLimitError as e:
            self.logger.warning(f"Anthropic rate limit hit: {str(e)}")
            self.handle_rate_limit()
            raise
            
        except anthropic.APIError as e:
            self.logger.error(f"Anthropic API error: {str(e)}")
            self.track_metrics(None, success=False)
            raise
            
        except Exception as e:
            self.logger.error(f"Anthropic completion with tools failed: {str(e)}")
            self.track_metrics(None, success=False)
            raise
    
    def extract_tool_calls(self, response_content: str) -> List[Dict[str, Any]]:
        """Extract tool calls from response content."""
        if "TOOL_CALLS:" not in response_content:
            return []
        
        try:
            # Find the tool calls JSON
            tool_calls_start = response_content.find("TOOL_CALLS:")
            tool_calls_json = response_content[tool_calls_start + 11:].strip()
            
            # Parse the JSON
            tool_calls = json.loads(tool_calls_json)
            return tool_calls if isinstance(tool_calls, list) else []
            
        except (json.JSONDecodeError, ValueError) as e:
            self.logger.warning(f"Failed to parse tool calls: {str(e)}")
            return []
    
    def format_messages(self, system_prompt: str, user_input: str,
                       conversation_history: Optional[List[Dict[str, str]]] = None) -> List[Dict[str, str]]:
        """Format messages for Anthropic."""
        # Anthropic handles system prompts separately
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            # Filter out system messages and tool messages for simplicity
            for msg in conversation_history:
                if msg.get('role') in ['user', 'assistant']:
                    messages.append(msg)
        
        # Add current user input
        if user_input:
            messages.append({"role": "user", "content": user_input})
        
        return messages