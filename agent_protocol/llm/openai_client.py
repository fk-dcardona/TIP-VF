"""OpenAI LLM client implementation."""

import json
import time
import logging
from typing import Dict, Any, List, Optional

import openai
from openai import OpenAI

from .llm_client import LLMClient, LLMResponse


class OpenAIClient(LLMClient):
    """OpenAI GPT client implementation."""
    
    def __init__(self, api_key: str, config: Dict[str, Any]):
        """Initialize OpenAI client."""
        super().__init__(api_key, config)
        
        self.client = OpenAI(api_key=api_key)
        self.default_model = config.get('model', 'gpt-4-turbo-preview')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 1000)
        self.top_p = config.get('top_p', 1.0)
        
        self.logger.info(f"OpenAI client initialized with model: {self.default_model}")
    
    @property
    def provider_name(self) -> str:
        """Get provider name."""
        return "openai"
    
    def complete(self, messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
        """Generate completion from messages."""
        start_time = time.time()
        
        try:
            # Prepare parameters
            params = {
                'model': kwargs.get('model', self.default_model),
                'messages': messages,
                'temperature': kwargs.get('temperature', self.temperature),
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'top_p': kwargs.get('top_p', self.top_p),
            }
            
            # Optional parameters
            if 'seed' in kwargs:
                params['seed'] = kwargs['seed']
            if 'frequency_penalty' in kwargs:
                params['frequency_penalty'] = kwargs['frequency_penalty']
            if 'presence_penalty' in kwargs:
                params['presence_penalty'] = kwargs['presence_penalty']
            
            # Make API call
            response = self.client.chat.completions.create(**params)
            
            # Extract response data
            message = response.choices[0].message
            content = message.content or ""
            finish_reason = response.choices[0].finish_reason
            
            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Create standardized response
            llm_response = LLMResponse(
                content=content,
                model=response.model,
                provider=self.provider_name,
                usage={
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                finish_reason=finish_reason,
                latency_ms=latency_ms,
                metadata={
                    'system_fingerprint': getattr(response, 'system_fingerprint', None),
                    'created': response.created
                }
            )
            
            # Track metrics
            self.track_metrics(llm_response, success=True)
            
            return llm_response
            
        except openai.RateLimitError as e:
            self.logger.warning(f"OpenAI rate limit hit: {str(e)}")
            self.handle_rate_limit(e.retry_after if hasattr(e, 'retry_after') else None)
            raise
            
        except openai.APIError as e:
            self.logger.error(f"OpenAI API error: {str(e)}")
            self.track_metrics(None, success=False)
            raise
            
        except Exception as e:
            self.logger.error(f"OpenAI completion failed: {str(e)}")
            self.track_metrics(None, success=False)
            raise
    
    def complete_with_tools(self, messages: List[Dict[str, str]], 
                           tools: List[Dict[str, Any]], **kwargs) -> LLMResponse:
        """Generate completion with tool/function calling."""
        start_time = time.time()
        
        try:
            # Prepare parameters
            params = {
                'model': kwargs.get('model', self.default_model),
                'messages': messages,
                'tools': tools,
                'tool_choice': kwargs.get('tool_choice', 'auto'),
                'temperature': kwargs.get('temperature', self.temperature),
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'top_p': kwargs.get('top_p', self.top_p),
            }
            
            # Make API call
            response = self.client.chat.completions.create(**params)
            
            # Extract response data
            message = response.choices[0].message
            content = message.content or ""
            finish_reason = response.choices[0].finish_reason
            
            # Handle tool calls
            tool_calls = []
            if hasattr(message, 'tool_calls') and message.tool_calls:
                for tool_call in message.tool_calls:
                    tool_calls.append({
                        'id': tool_call.id,
                        'type': tool_call.type,
                        'function': {
                            'name': tool_call.function.name,
                            'arguments': tool_call.function.arguments
                        }
                    })
                
                # Add tool calls to content as structured data
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
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                finish_reason=finish_reason,
                latency_ms=latency_ms,
                metadata={
                    'system_fingerprint': getattr(response, 'system_fingerprint', None),
                    'created': response.created,
                    'tool_calls': tool_calls
                }
            )
            
            # Track metrics
            self.track_metrics(llm_response, success=True)
            
            return llm_response
            
        except openai.RateLimitError as e:
            self.logger.warning(f"OpenAI rate limit hit: {str(e)}")
            self.handle_rate_limit(e.retry_after if hasattr(e, 'retry_after') else None)
            raise
            
        except openai.APIError as e:
            self.logger.error(f"OpenAI API error: {str(e)}")
            self.track_metrics(None, success=False)
            raise
            
        except Exception as e:
            self.logger.error(f"OpenAI completion with tools failed: {str(e)}")
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
        """Format messages for OpenAI."""
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            # Filter out any tool-related messages for simplicity
            for msg in conversation_history:
                if msg.get('role') in ['user', 'assistant']:
                    messages.append(msg)
        
        # Add current user input
        if user_input:
            messages.append({"role": "user", "content": user_input})
        
        return messages