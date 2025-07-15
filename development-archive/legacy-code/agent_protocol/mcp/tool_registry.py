"""Tool registry for MCP server dynamic tool management."""

import threading
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from datetime import datetime, timezone
import json

from ..tools.base_tool import Tool


@dataclass
class ToolMetadata:
    """Enhanced tool metadata for MCP registration."""
    name: str
    description: str
    category: str
    version: str = "1.0.0"
    enabled: bool = True
    registered_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_used: Optional[datetime] = None
    usage_count: int = 0
    tags: Set[str] = field(default_factory=set)
    dependencies: List[str] = field(default_factory=list)
    capabilities: Set[str] = field(default_factory=set)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "version": self.version,
            "enabled": self.enabled,
            "registered_at": self.registered_at.isoformat(),
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "usage_count": self.usage_count,
            "tags": list(self.tags),
            "dependencies": self.dependencies,
            "capabilities": list(self.capabilities)
        }


class ToolRegistry:
    """Dynamic tool registry for MCP server."""
    
    def __init__(self):
        """Initialize tool registry."""
        self._tools: Dict[str, Tool] = {}
        self._metadata: Dict[str, ToolMetadata] = {}
        self._categories: Dict[str, Set[str]] = {}
        self._lock = threading.RLock()
        
        # Tool discovery and validation
        self._validators: Dict[str, callable] = {}
        self._initializers: Dict[str, callable] = {}
        
        # Initialize built-in tool categories
        self._initialize_categories()
    
    def _initialize_categories(self):
        """Initialize standard tool categories."""
        categories = {
            "database": "Database query and management tools",
            "api": "External API integration tools", 
            "analysis": "Data analysis and computation tools",
            "document": "Document processing and intelligence tools",
            "monitoring": "System monitoring and health check tools",
            "utility": "General utility and helper tools"
        }
        
        with self._lock:
            for category, description in categories.items():
                self._categories[category] = set()
    
    def register_tool(self, tool: Tool, category: str = "utility", 
                     tags: Set[str] = None, capabilities: Set[str] = None) -> bool:
        """Register a tool with the registry."""
        if not isinstance(tool, Tool):
            raise TypeError("Tool must inherit from base Tool class")
        
        # Validate tool
        if not self._validate_tool(tool):
            return False
        
        # Create metadata
        metadata = ToolMetadata(
            name=tool.name,
            description=tool.description,
            category=category,
            tags=tags or set(),
            capabilities=capabilities or set()
        )
        
        with self._lock:
            # Check for conflicts
            if tool.name in self._tools:
                existing_metadata = self._metadata[tool.name]
                if existing_metadata.version != metadata.version:
                    # Version conflict - could implement version resolution here
                    pass
            
            # Register tool
            self._tools[tool.name] = tool
            self._metadata[tool.name] = metadata
            
            # Update category index
            if category not in self._categories:
                self._categories[category] = set()
            self._categories[category].add(tool.name)
            
            # Initialize tool if needed
            self._initialize_tool(tool)
        
        return True
    
    def unregister_tool(self, tool_name: str) -> bool:
        """Unregister a tool from the registry."""
        with self._lock:
            if tool_name not in self._tools:
                return False
            
            # Get metadata for cleanup
            metadata = self._metadata[tool_name]
            
            # Remove from category index
            if metadata.category in self._categories:
                self._categories[metadata.category].discard(tool_name)
            
            # Remove tool and metadata
            del self._tools[tool_name]
            del self._metadata[tool_name]
        
        return True
    
    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """Get a tool by name."""
        with self._lock:
            return self._tools.get(tool_name)
    
    def list_tools(self, category: str = None, enabled_only: bool = True) -> List[Tool]:
        """List available tools."""
        with self._lock:
            tools = []
            
            for name, tool in self._tools.items():
                metadata = self._metadata[name]
                
                # Filter by enabled status
                if enabled_only and not metadata.enabled:
                    continue
                
                # Filter by category
                if category and metadata.category != category:
                    continue
                
                tools.append(tool)
            
            return tools
    
    def get_tool_metadata(self, tool_name: str) -> Optional[ToolMetadata]:
        """Get tool metadata."""
        with self._lock:
            return self._metadata.get(tool_name)
    
    def update_tool_metadata(self, tool_name: str, **updates) -> bool:
        """Update tool metadata."""
        with self._lock:
            if tool_name not in self._metadata:
                return False
            
            metadata = self._metadata[tool_name]
            
            # Update allowed fields
            for field, value in updates.items():
                if hasattr(metadata, field):
                    setattr(metadata, field, value)
            
            return True
    
    def enable_tool(self, tool_name: str) -> bool:
        """Enable a tool."""
        return self.update_tool_metadata(tool_name, enabled=True)
    
    def disable_tool(self, tool_name: str) -> bool:
        """Disable a tool."""
        return self.update_tool_metadata(tool_name, enabled=False)
    
    def record_tool_usage(self, tool_name: str):
        """Record tool usage for analytics."""
        with self._lock:
            if tool_name in self._metadata:
                metadata = self._metadata[tool_name]
                metadata.usage_count += 1
                metadata.last_used = datetime.now(timezone.utc)
    
    def get_tools_by_category(self, category: str) -> List[Tool]:
        """Get all tools in a specific category."""
        return self.list_tools(category=category)
    
    def get_tools_by_tag(self, tag: str) -> List[Tool]:
        """Get all tools with a specific tag."""
        with self._lock:
            tools = []
            for name, metadata in self._metadata.items():
                if tag in metadata.tags and metadata.enabled:
                    tools.append(self._tools[name])
            return tools
    
    def get_tools_by_capability(self, capability: str) -> List[Tool]:
        """Get all tools with a specific capability."""
        with self._lock:
            tools = []
            for name, metadata in self._metadata.items():
                if capability in metadata.capabilities and metadata.enabled:
                    tools.append(self._tools[name])
            return tools
    
    def search_tools(self, query: str) -> List[Tool]:
        """Search tools by name or description."""
        query_lower = query.lower()
        
        with self._lock:
            tools = []
            for name, tool in self._tools.items():
                metadata = self._metadata[name]
                
                if not metadata.enabled:
                    continue
                
                # Search in name, description, and tags
                if (query_lower in tool.name.lower() or
                    query_lower in tool.description.lower() or
                    any(query_lower in tag.lower() for tag in metadata.tags)):
                    tools.append(tool)
            
            return tools
    
    def get_categories(self) -> Dict[str, List[str]]:
        """Get all categories and their tools."""
        with self._lock:
            return {
                category: list(tool_names)
                for category, tool_names in self._categories.items()
            }
    
    def get_tool_dependencies(self, tool_name: str) -> List[str]:
        """Get tool dependencies."""
        with self._lock:
            metadata = self._metadata.get(tool_name)
            return metadata.dependencies if metadata else []
    
    def validate_dependencies(self, tool_name: str) -> bool:
        """Validate that all tool dependencies are available."""
        dependencies = self.get_tool_dependencies(tool_name)
        
        with self._lock:
            for dep in dependencies:
                if dep not in self._tools or not self._metadata[dep].enabled:
                    return False
            return True
    
    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        with self._lock:
            total_tools = len(self._tools)
            enabled_tools = sum(1 for m in self._metadata.values() if m.enabled)
            
            category_counts = {
                category: len(tools) 
                for category, tools in self._categories.items()
            }
            
            usage_stats = {
                "total_usage": sum(m.usage_count for m in self._metadata.values()),
                "most_used": max(
                    self._metadata.items(),
                    key=lambda x: x[1].usage_count,
                    default=(None, None)
                )[0] if self._metadata else None
            }
            
            return {
                "total_tools": total_tools,
                "enabled_tools": enabled_tools,
                "disabled_tools": total_tools - enabled_tools,
                "categories": category_counts,
                "usage_stats": usage_stats
            }
    
    def export_registry(self) -> Dict[str, Any]:
        """Export registry configuration."""
        with self._lock:
            return {
                "tools": {
                    name: {
                        "metadata": metadata.to_dict(),
                        "tool_class": type(tool).__name__
                    }
                    for name, tool in self._tools.items()
                    for metadata in [self._metadata[name]]
                },
                "categories": dict(self._categories),
                "exported_at": datetime.now(timezone.utc).isoformat()
            }
    
    def _validate_tool(self, tool: Tool) -> bool:
        """Validate tool before registration."""
        # Basic validation
        if not tool.name or not tool.description:
            return False
        
        # Check for required methods
        if not hasattr(tool, 'execute'):
            return False
        
        # Custom validation if available
        validator = self._validators.get(type(tool).__name__)
        if validator:
            return validator(tool)
        
        return True
    
    def _initialize_tool(self, tool: Tool):
        """Initialize tool after registration."""
        initializer = self._initializers.get(type(tool).__name__)
        if initializer:
            initializer(tool)
    
    def register_validator(self, tool_class_name: str, validator: callable):
        """Register a custom tool validator."""
        self._validators[tool_class_name] = validator
    
    def register_initializer(self, tool_class_name: str, initializer: callable):
        """Register a custom tool initializer."""
        self._initializers[tool_class_name] = initializer


# Global tool registry instance
_tool_registry = None

def get_tool_registry() -> ToolRegistry:
    """Get global tool registry instance."""
    global _tool_registry
    if _tool_registry is None:
        _tool_registry = ToolRegistry()
    return _tool_registry