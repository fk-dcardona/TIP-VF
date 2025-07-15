"""
Agent Protocol - AI Agent Implementation Framework
=================================================

This module provides the core infrastructure for implementing AI agents
in the Supply Chain B2B SaaS platform.

Architecture:
- core/: Base agent classes and interfaces
- tools/: Agent tools and capabilities
- agents/: Concrete agent implementations
- prompts/: System prompts and templates
- executors/: Execution and lifecycle management
- utils/: Helper functions and utilities
"""

from .core.base_agent import BaseAgent
from .executors.agent_executor import AgentExecutor
from .tools.base_tool import Tool

__all__ = ['BaseAgent', 'AgentExecutor', 'Tool']
__version__ = '0.1.0'