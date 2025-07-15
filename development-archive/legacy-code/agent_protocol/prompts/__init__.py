"""System prompts and templates for agents."""

from .prompt_manager import PromptManager
from .prompt_templates import (
    AGENT_SYSTEM_PROMPTS,
    TOOL_USAGE_PROMPT,
    EVIDENCE_COLLECTION_PROMPT,
    ANALYSIS_PROMPT_TEMPLATE
)

__all__ = [
    'PromptManager',
    'AGENT_SYSTEM_PROMPTS',
    'TOOL_USAGE_PROMPT',
    'EVIDENCE_COLLECTION_PROMPT',
    'ANALYSIS_PROMPT_TEMPLATE'
]