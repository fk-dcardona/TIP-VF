"""Prompt management system for dynamic prompt generation."""

from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from .prompt_templates import (
    BASE_AGENT_PROMPT,
    AGENT_SYSTEM_PROMPTS,
    TOOL_USAGE_PROMPT,
    EVIDENCE_COLLECTION_PROMPT,
    ANALYSIS_PROMPT_TEMPLATE
)


class PromptManager:
    """Manages system prompts for agents with dynamic generation."""
    
    def __init__(self):
        """Initialize prompt manager."""
        self.base_prompt = BASE_AGENT_PROMPT
        self.agent_prompts = AGENT_SYSTEM_PROMPTS
        self.custom_prompts: Dict[str, str] = {}
    
    def get_system_prompt(self, agent_type: str, agent_name: str,
                         tools: List[Dict[str, Any]], 
                         context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a complete system prompt for an agent.
        
        Args:
            agent_type: Type of agent
            agent_name: Name of the agent
            tools: List of available tools
            context: Additional context (org_id, user_id, etc.)
            
        Returns:
            Complete system prompt
        """
        # Get agent-specific prompt
        agent_prompt = self.agent_prompts.get(agent_type, "")
        
        # Format tool descriptions
        tool_descriptions = self._format_tool_descriptions(tools)
        
        # Prepare context
        ctx = context or {}
        ctx.setdefault("org_id", "Not specified")
        ctx.setdefault("user_id", "Not specified")
        ctx.setdefault("timestamp", datetime.utcnow().isoformat())
        
        # Build complete prompt
        sections = []
        
        # Add base prompt with context
        base = self.base_prompt.format(
            domain=self._get_agent_domain(agent_type),
            tools=tool_descriptions,
            **ctx
        )
        sections.append(base)
        
        # Add agent-specific instructions
        if agent_prompt:
            sections.append(agent_prompt)
        
        # Add evidence collection framework
        sections.append(EVIDENCE_COLLECTION_PROMPT)
        
        # Add tool usage guidelines
        tool_usage = TOOL_USAGE_PROMPT.format(
            tool_descriptions=tool_descriptions
        )
        sections.append(tool_usage)
        
        # Add any custom instructions
        if agent_type in self.custom_prompts:
            sections.append(self.custom_prompts[agent_type])
        
        # Join sections
        full_prompt = "\n\n---\n\n".join(sections)
        
        # Add final instructions
        full_prompt += "\n\nRemember to:\n"
        full_prompt += "1. Think step by step\n"
        full_prompt += "2. Use tools to gather evidence\n"
        full_prompt += "3. Document your reasoning\n"
        full_prompt += "4. Provide confidence scores\n"
        full_prompt += "5. Make actionable recommendations\n"
        
        return full_prompt
    
    def get_analysis_prompt(self, analysis_type: str, 
                           objective: str,
                           data_requirements: List[str],
                           analysis_steps: List[str]) -> str:
        """
        Generate an analysis-specific prompt.
        
        Args:
            analysis_type: Type of analysis
            objective: Analysis objective
            data_requirements: Required data points
            analysis_steps: Steps to perform
            
        Returns:
            Analysis prompt
        """
        return ANALYSIS_PROMPT_TEMPLATE.format(
            analysis_type=analysis_type,
            objective=objective,
            data_requirements="\n   - ".join(data_requirements),
            analysis_steps="\n   - ".join(analysis_steps)
        )
    
    def add_custom_prompt(self, agent_type: str, prompt: str):
        """Add a custom prompt for an agent type."""
        self.custom_prompts[agent_type] = prompt
    
    def _format_tool_descriptions(self, tools: List[Dict[str, Any]]) -> str:
        """Format tool descriptions for inclusion in prompt."""
        if not tools:
            return "No tools available."
        
        descriptions = []
        for tool in tools:
            desc = f"- {tool['name']}: {tool['description']}"
            if 'parameters' in tool:
                params = tool['parameters'].get('properties', {})
                if params:
                    param_list = [f"{k} ({v.get('type', 'any')})" 
                                 for k, v in params.items()]
                    desc += f"\n  Parameters: {', '.join(param_list)}"
            descriptions.append(desc)
        
        return "\n".join(descriptions)
    
    def _get_agent_domain(self, agent_type: str) -> str:
        """Get the domain expertise for an agent type."""
        domain_map = {
            "inventory_monitor": "inventory management and optimization",
            "supplier_evaluator": "supplier performance and risk assessment",
            "demand_forecaster": "demand prediction and planning",
            "document_analyzer": "document processing and data extraction",
            "risk_assessor": "risk identification and mitigation",
            "optimization_agent": "supply chain optimization and efficiency"
        }
        return domain_map.get(agent_type, "supply chain management")
    
    def get_role_specific_context(self, role: str) -> Dict[str, Any]:
        """Get role-specific context for prompt enhancement."""
        role_contexts = {
            "finance": {
                "focus_areas": ["cost optimization", "working capital", "financial risk"],
                "key_metrics": ["DSO", "DPO", "cash conversion cycle", "cost per unit"],
                "priorities": ["cost reduction", "cash flow optimization", "risk mitigation"]
            },
            "operations": {
                "focus_areas": ["efficiency", "quality", "delivery performance"],
                "key_metrics": ["OTD", "throughput", "cycle time", "defect rate"],
                "priorities": ["operational excellence", "continuous improvement", "reliability"]
            },
            "procurement": {
                "focus_areas": ["supplier management", "cost savings", "strategic sourcing"],
                "key_metrics": ["savings %", "supplier performance", "contract compliance"],
                "priorities": ["cost reduction", "supplier relationships", "risk management"]
            },
            "sales": {
                "focus_areas": ["customer satisfaction", "revenue growth", "market share"],
                "key_metrics": ["order fulfillment", "customer complaints", "revenue"],
                "priorities": ["customer service", "growth", "competitive advantage"]
            }
        }
        return role_contexts.get(role, {})
    
    def enhance_prompt_with_examples(self, base_prompt: str, 
                                    examples: List[Dict[str, Any]]) -> str:
        """Enhance a prompt with few-shot examples."""
        if not examples:
            return base_prompt
        
        example_section = "\n\nExamples:\n"
        for i, example in enumerate(examples, 1):
            example_section += f"\nExample {i}:\n"
            example_section += f"Input: {example.get('input', 'N/A')}\n"
            example_section += f"Analysis: {example.get('analysis', 'N/A')}\n"
            example_section += f"Output: {example.get('output', 'N/A')}\n"
        
        return base_prompt + example_section