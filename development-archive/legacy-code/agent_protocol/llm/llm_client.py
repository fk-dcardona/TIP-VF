"""Unified LLM client interface."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union
import time
import logging
from datetime import datetime


@dataclass
class LLMResponse:
    """Standardized LLM response."""
    content: str
    model: str
    provider: str
    usage: Dict[str, int] = field(default_factory=dict)  # tokens used
    finish_reason: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    latency_ms: int = 0
    
    @property
    def total_tokens(self) -> int:
        """Get total tokens used."""
        return self.usage.get('total_tokens', 0)
    
    @property
    def prompt_tokens(self) -> int:
        """Get prompt tokens used."""
        return self.usage.get('prompt_tokens', 0)
    
    @property
    def completion_tokens(self) -> int:
        """Get completion tokens used."""
        return self.usage.get('completion_tokens', 0)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'content': self.content,
            'model': self.model,
            'provider': self.provider,
            'usage': self.usage,
            'finish_reason': self.finish_reason,
            'metadata': self.metadata,
            'latency_ms': self.latency_ms
        }


class LLMClient(ABC):
    """Abstract base class for LLM providers."""
    
    def __init__(self, api_key: str, config: Dict[str, Any]):
        """Initialize LLM client."""
        self.api_key = api_key
        self.config = config
        self.logger = logging.getLogger(f"LLM.{self.__class__.__name__}")
        
        # Metrics
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.total_tokens = 0
        self.total_latency = 0
    
    @abstractmethod
    def complete(self, messages: List[Dict[str, str]], **kwargs) -> LLMResponse:
        """Generate completion from messages."""
        pass
    
    @abstractmethod
    def complete_with_tools(self, messages: List[Dict[str, str]], 
                           tools: List[Dict[str, Any]], **kwargs) -> LLMResponse:
        """Generate completion with tool/function calling."""
        pass
    
    def format_messages(self, system_prompt: str, user_input: str,
                       conversation_history: Optional[List[Dict[str, str]]] = None) -> List[Dict[str, str]]:
        """Format messages for the LLM."""
        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append({"role": "user", "content": user_input})
        return messages
    
    def track_metrics(self, response: LLMResponse, success: bool = True):
        """Track usage metrics."""
        self.total_requests += 1
        
        if success:
            self.successful_requests += 1
            self.total_tokens += response.total_tokens
            self.total_latency += response.latency_ms
        else:
            self.failed_requests += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get client metrics."""
        avg_latency = (
            self.total_latency / self.successful_requests 
            if self.successful_requests > 0 else 0
        )
        
        success_rate = (
            self.successful_requests / self.total_requests * 100
            if self.total_requests > 0 else 0
        )
        
        return {
            'provider': self.__class__.__name__,
            'total_requests': self.total_requests,
            'successful_requests': self.successful_requests,
            'failed_requests': self.failed_requests,
            'success_rate': round(success_rate, 2),
            'total_tokens': self.total_tokens,
            'avg_latency_ms': round(avg_latency, 2)
        }
    
    def extract_tool_calls(self, response_content: str) -> List[Dict[str, Any]]:
        """Extract tool calls from response. Override in subclasses if needed."""
        # Default implementation - can be overridden
        return []
    
    def handle_rate_limit(self, retry_after: Optional[int] = None):
        """Handle rate limiting."""
        wait_time = retry_after or self.config.get('retry_delay', 1)
        self.logger.warning(f"Rate limited. Waiting {wait_time} seconds...")
        time.sleep(wait_time)
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get provider name."""
        pass