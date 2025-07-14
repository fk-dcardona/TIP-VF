"""Prompt repository for MCP server template management."""

import json
import threading
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from jinja2 import Template, Environment, FileSystemLoader, TemplateError


@dataclass
class PromptArgument:
    """Prompt template argument definition."""
    name: str
    description: str
    type: str = "string"
    required: bool = True
    default: Any = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "required": self.required,
            "default": self.default
        }


@dataclass
class PromptTemplate:
    """Prompt template definition."""
    name: str
    description: str
    template: str
    arguments: List[PromptArgument] = field(default_factory=list)
    version: str = "1.0.0"
    category: str = "general"
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    usage_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "template": self.template,
            "arguments": [arg.to_dict() for arg in self.arguments],
            "version": self.version,
            "category": self.category,
            "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "usage_count": self.usage_count
        }


class PromptRepository:
    """Repository for managing prompt templates."""
    
    def __init__(self, templates_dir: str = "prompts"):
        """Initialize prompt repository."""
        self.templates_dir = Path(templates_dir)
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        
        # Template storage
        self._templates: Dict[str, PromptTemplate] = {}
        self._categories: Dict[str, List[str]] = {}
        self._lock = threading.RLock()
        
        # Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Initialize built-in templates
        self._initialize_builtin_templates()
    
    def _initialize_builtin_templates(self):
        """Initialize built-in prompt templates."""
        builtin_templates = [
            PromptTemplate(
                name="agent_system_prompt",
                description="Base system prompt for supply chain agents",
                template="""You are a {{agent_type}} agent specializing in supply chain management.

Your role: {{role_description}}
Organization: {{org_id}}
User: {{user_id}}

Available tools:
{% for tool in tools %}
- {{tool.name}}: {{tool.description}}
{% endfor %}

Instructions:
1. Analyze the user's request carefully
2. Use available tools to gather evidence
3. Provide data-driven insights and recommendations
4. Always explain your reasoning
5. Be specific and actionable in your recommendations

Context: {{context}}""",
                arguments=[
                    PromptArgument("agent_type", "Type of supply chain agent"),
                    PromptArgument("role_description", "Detailed role description"),
                    PromptArgument("org_id", "Organization identifier"),
                    PromptArgument("user_id", "User identifier"),
                    PromptArgument("tools", "Available tools list", "list"),
                    PromptArgument("context", "Additional context", required=False, default="")
                ],
                category="system",
                tags=["agent", "system", "supply-chain"]
            ),
            
            PromptTemplate(
                name="inventory_analysis",
                description="Prompt for inventory analysis tasks",
                template="""Analyze the inventory data for organization {{org_id}}.

Current inventory status:
{{inventory_data}}

Focus areas:
{% for area in focus_areas %}
- {{area}}
{% endfor %}

Please provide:
1. Current stock level analysis
2. Identified risks (stockouts, overstock)
3. Reorder recommendations
4. Cost optimization opportunities

Use the following tools as needed:
- database_query: Query inventory database
- metrics_calculator: Calculate inventory metrics
- data_analysis: Perform statistical analysis""",
                arguments=[
                    PromptArgument("org_id", "Organization identifier"),
                    PromptArgument("inventory_data", "Current inventory data"),
                    PromptArgument("focus_areas", "Areas to focus analysis on", "list", required=False, default=[])
                ],
                category="inventory",
                tags=["inventory", "analysis", "supply-chain"]
            ),
            
            PromptTemplate(
                name="supplier_evaluation",
                description="Prompt for supplier evaluation and scoring",
                template="""Evaluate supplier performance for {{supplier_name}} (ID: {{supplier_id}}).

Evaluation criteria:
- Quality: {{quality_weight}}% weight
- Delivery: {{delivery_weight}}% weight  
- Cost: {{cost_weight}}% weight
- Compliance: {{compliance_weight}}% weight

{% if historical_data %}
Historical performance data:
{{historical_data}}
{% endif %}

Provide:
1. Overall supplier score (0-100)
2. Performance breakdown by criteria
3. Risk assessment
4. Improvement recommendations
5. Comparison with industry benchmarks

Use tools: database_query, metrics_calculator, document_search""",
                arguments=[
                    PromptArgument("supplier_id", "Supplier identifier"),
                    PromptArgument("supplier_name", "Supplier name"),
                    PromptArgument("quality_weight", "Quality criteria weight", "number", default=25),
                    PromptArgument("delivery_weight", "Delivery criteria weight", "number", default=25),
                    PromptArgument("cost_weight", "Cost criteria weight", "number", default=25),
                    PromptArgument("compliance_weight", "Compliance criteria weight", "number", default=25),
                    PromptArgument("historical_data", "Historical performance data", required=False)
                ],
                category="supplier",
                tags=["supplier", "evaluation", "performance"]
            ),
            
            PromptTemplate(
                name="demand_forecasting",
                description="Prompt for demand forecasting analysis",
                template="""Generate demand forecast for {{product_name}} (ID: {{product_id}}).

Forecast parameters:
- Horizon: {{forecast_horizon}} days
- Confidence level: {{confidence_level}}%
- Method: {{forecast_method}}

{% if seasonal_factors %}
Seasonal factors to consider:
{% for factor in seasonal_factors %}
- {{factor}}
{% endfor %}
{% endif %}

Historical sales data:
{{historical_data}}

Provide:
1. Demand forecast with confidence intervals
2. Trend analysis
3. Seasonality patterns
4. Risk factors and assumptions
5. Inventory planning recommendations

Use tools: data_analysis, metrics_calculator""",
                arguments=[
                    PromptArgument("product_id", "Product identifier"),
                    PromptArgument("product_name", "Product name"),
                    PromptArgument("forecast_horizon", "Forecast horizon in days", "number", default=30),
                    PromptArgument("confidence_level", "Confidence level percentage", "number", default=95),
                    PromptArgument("forecast_method", "Forecasting method", default="auto"),
                    PromptArgument("historical_data", "Historical sales data"),
                    PromptArgument("seasonal_factors", "Seasonal factors to consider", "list", required=False, default=[])
                ],
                category="forecasting",
                tags=["demand", "forecasting", "prediction"]
            )
        ]
        
        # Register built-in templates
        for template in builtin_templates:
            self.register_prompt(template)
    
    def register_prompt(self, prompt: PromptTemplate) -> bool:
        """Register a prompt template."""
        try:
            # Validate template
            if not self._validate_template(prompt):
                return False
            
            with self._lock:
                # Update existing or add new
                if prompt.name in self._templates:
                    existing = self._templates[prompt.name]
                    prompt.created_at = existing.created_at
                    prompt.usage_count = existing.usage_count
                
                prompt.updated_at = datetime.now(timezone.utc)
                self._templates[prompt.name] = prompt
                
                # Update category index
                if prompt.category not in self._categories:
                    self._categories[prompt.category] = []
                if prompt.name not in self._categories[prompt.category]:
                    self._categories[prompt.category].append(prompt.name)
            
            # Save to file
            self._save_template_to_file(prompt)
            return True
            
        except Exception:
            return False
    
    def get_prompt(self, name: str) -> Optional[PromptTemplate]:
        """Get a prompt template by name."""
        with self._lock:
            return self._templates.get(name)
    
    def list_prompts(self, category: str = None) -> List[PromptTemplate]:
        """List available prompt templates."""
        with self._lock:
            prompts = list(self._templates.values())
            
            if category:
                prompts = [p for p in prompts if p.category == category]
            
            return prompts
    
    def render_prompt(self, name: str, arguments: Dict[str, Any]) -> str:
        """Render a prompt template with arguments."""
        with self._lock:
            template = self._templates.get(name)
            if not template:
                raise ValueError(f"Prompt template '{name}' not found")
            
            # Validate required arguments
            required_args = [arg.name for arg in template.arguments if arg.required]
            missing_args = [arg for arg in required_args if arg not in arguments]
            if missing_args:
                raise ValueError(f"Missing required arguments: {missing_args}")
            
            # Add default values for missing optional arguments
            full_args = {}
            for arg in template.arguments:
                if arg.name in arguments:
                    full_args[arg.name] = arguments[arg.name]
                elif not arg.required and arg.default is not None:
                    full_args[arg.name] = arg.default
            
            try:
                # Render template
                jinja_template = Template(template.template)
                rendered = jinja_template.render(**full_args)
                
                # Update usage count
                template.usage_count += 1
                
                return rendered
                
            except TemplateError as e:
                raise ValueError(f"Template rendering error: {str(e)}")
    
    def update_prompt(self, name: str, **updates) -> bool:
        """Update a prompt template."""
        with self._lock:
            if name not in self._templates:
                return False
            
            template = self._templates[name]
            
            # Update allowed fields
            for field, value in updates.items():
                if hasattr(template, field) and field != "name":
                    setattr(template, field, value)
            
            template.updated_at = datetime.now(timezone.utc)
            
            # Save to file
            self._save_template_to_file(template)
            return True
    
    def delete_prompt(self, name: str) -> bool:
        """Delete a prompt template."""
        with self._lock:
            if name not in self._templates:
                return False
            
            template = self._templates[name]
            
            # Remove from category index
            if template.category in self._categories:
                if name in self._categories[template.category]:
                    self._categories[template.category].remove(name)
            
            # Remove template
            del self._templates[name]
            
            # Delete file
            template_file = self.templates_dir / f"{name}.json"
            if template_file.exists():
                template_file.unlink()
            
            return True
    
    def get_prompts_by_category(self, category: str) -> List[PromptTemplate]:
        """Get prompts by category."""
        return self.list_prompts(category=category)
    
    def get_prompts_by_tag(self, tag: str) -> List[PromptTemplate]:
        """Get prompts by tag."""
        with self._lock:
            return [
                template for template in self._templates.values()
                if tag in template.tags
            ]
    
    def search_prompts(self, query: str) -> List[PromptTemplate]:
        """Search prompts by name, description, or tags."""
        query_lower = query.lower()
        
        with self._lock:
            results = []
            for template in self._templates.values():
                if (query_lower in template.name.lower() or
                    query_lower in template.description.lower() or
                    any(query_lower in tag.lower() for tag in template.tags)):
                    results.append(template)
            
            return results
    
    def get_categories(self) -> Dict[str, List[str]]:
        """Get all categories and their prompt names."""
        with self._lock:
            return dict(self._categories)
    
    def get_repository_stats(self) -> Dict[str, Any]:
        """Get repository statistics."""
        with self._lock:
            total_prompts = len(self._templates)
            category_counts = {
                category: len(prompts)
                for category, prompts in self._categories.items()
            }
            
            total_usage = sum(t.usage_count for t in self._templates.values())
            most_used = max(
                self._templates.items(),
                key=lambda x: x[1].usage_count,
                default=(None, None)
            )[0] if self._templates else None
            
            return {
                "total_prompts": total_prompts,
                "categories": category_counts,
                "total_usage": total_usage,
                "most_used_prompt": most_used
            }
    
    def export_prompts(self) -> Dict[str, Any]:
        """Export all prompt templates."""
        with self._lock:
            return {
                "prompts": {
                    name: template.to_dict()
                    for name, template in self._templates.items()
                },
                "categories": dict(self._categories),
                "exported_at": datetime.now(timezone.utc).isoformat()
            }
    
    def import_prompts(self, data: Dict[str, Any]) -> bool:
        """Import prompt templates from exported data."""
        try:
            prompts_data = data.get("prompts", {})
            
            for name, prompt_dict in prompts_data.items():
                # Reconstruct PromptTemplate
                arguments = [
                    PromptArgument(**arg_data)
                    for arg_data in prompt_dict.get("arguments", [])
                ]
                
                template = PromptTemplate(
                    name=prompt_dict["name"],
                    description=prompt_dict["description"],
                    template=prompt_dict["template"],
                    arguments=arguments,
                    version=prompt_dict.get("version", "1.0.0"),
                    category=prompt_dict.get("category", "general"),
                    tags=prompt_dict.get("tags", []),
                    usage_count=prompt_dict.get("usage_count", 0)
                )
                
                self.register_prompt(template)
            
            return True
            
        except Exception:
            return False
    
    def _validate_template(self, template: PromptTemplate) -> bool:
        """Validate prompt template."""
        # Basic validation
        if not template.name or not template.description or not template.template:
            return False
        
        # Try to parse as Jinja2 template
        try:
            Template(template.template)
        except TemplateError:
            return False
        
        # Validate arguments
        for arg in template.arguments:
            if not arg.name or not arg.description:
                return False
        
        return True
    
    def _save_template_to_file(self, template: PromptTemplate):
        """Save template to file."""
        template_file = self.templates_dir / f"{template.name}.json"
        with open(template_file, 'w') as f:
            json.dump(template.to_dict(), f, indent=2)
    
    def _load_templates_from_files(self):
        """Load templates from files."""
        for template_file in self.templates_dir.glob("*.json"):
            try:
                with open(template_file, 'r') as f:
                    data = json.load(f)
                
                # Reconstruct template
                arguments = [
                    PromptArgument(**arg_data)
                    for arg_data in data.get("arguments", [])
                ]
                
                template = PromptTemplate(
                    name=data["name"],
                    description=data["description"],
                    template=data["template"],
                    arguments=arguments,
                    version=data.get("version", "1.0.0"),
                    category=data.get("category", "general"),
                    tags=data.get("tags", []),
                    usage_count=data.get("usage_count", 0)
                )
                
                with self._lock:
                    self._templates[template.name] = template
                    
                    if template.category not in self._categories:
                        self._categories[template.category] = []
                    if template.name not in self._categories[template.category]:
                        self._categories[template.category].append(template.name)
                        
            except Exception:
                continue


# Global prompt repository instance
_prompt_repository = None

def get_prompt_repository() -> PromptRepository:
    """Get global prompt repository instance."""
    global _prompt_repository
    if _prompt_repository is None:
        _prompt_repository = PromptRepository()
    return _prompt_repository