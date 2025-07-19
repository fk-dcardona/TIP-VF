"""Base tool interface for agent capabilities."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import logging
import time


@dataclass
class ToolParameter:
    """Definition of a tool parameter."""
    name: str
    type: str  # "string", "number", "boolean", "object", "array"
    description: str
    required: bool = True
    default: Any = None
    enum: Optional[List[Any]] = None
    properties: Optional[Dict[str, 'ToolParameter']] = None  # For object types


@dataclass
class ToolResult:
    """Result of tool execution."""
    success: bool
    data: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    execution_time_ms: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "success": self.success,
            "data": self.data,
            "error": self.error,
            "metadata": self.metadata,
            "execution_time_ms": self.execution_time_ms
        }


class Tool(ABC):
    """
    Abstract base class for all agent tools.
    Tools provide specific capabilities to agents.
    """
    
    def __init__(self, name: str, description: str):
        """Initialize tool."""
        self.name = name
        self.description = description
        self.logger = logging.getLogger(f"Tool.{name}")
        self.execution_count = 0
        self.total_execution_time = 0
    
    @abstractmethod
    def get_parameters(self) -> List[ToolParameter]:
        """Get the parameters this tool accepts."""
        pass
    
    @abstractmethod
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        """
        Actual implementation of tool execution.
        Must be implemented by subclasses.
        """
        pass
    
    def execute(self, parameters: Dict[str, Any], context: Any = None) -> ToolResult:
        """
        Execute the tool with given parameters.
        
        Args:
            parameters: Tool parameters
            context: Execution context (AgentContext)
            
        Returns:
            ToolResult with execution results
        """
        start_time = time.time()
        
        try:
            # Validate parameters
            validation_result = self.validate_parameters(parameters)
            if not validation_result["valid"]:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Parameter validation failed: {validation_result['errors']}"
                )
            
            # Log execution
            self.logger.debug(f"Executing with parameters: {parameters}")
            
            # Execute tool implementation
            result = self._execute_impl(parameters, context)
            
            # Update metrics
            execution_time = int((time.time() - start_time) * 1000)
            result.execution_time_ms = execution_time
            self.execution_count += 1
            self.total_execution_time += execution_time
            
            # Add evidence to context if available
            if context and hasattr(context, 'add_evidence') and result.success:
                context.add_evidence(
                    source=f"Tool:{self.name}",
                    data=result.data,
                    confidence=result.metadata.get("confidence", 1.0)
                )
            
            self.logger.info(f"Execution completed in {execution_time}ms")
            return result
            
        except Exception as e:
            self.logger.error(f"Tool execution failed: {str(e)}", exc_info=True)
            return ToolResult(
                success=False,
                data=None,
                error=f"Tool execution failed: {str(e)}",
                execution_time_ms=int((time.time() - start_time) * 1000)
            )
    
    def validate_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate tool parameters against schema.
        
        Returns:
            Dict with 'valid' boolean and 'errors' list
        """
        errors = []
        param_definitions = {p.name: p for p in self.get_parameters()}
        
        # Check required parameters
        for param_def in self.get_parameters():
            if param_def.required and param_def.name not in parameters:
                if param_def.default is None:
                    errors.append(f"Required parameter '{param_def.name}' is missing")
                else:
                    # Use default value
                    parameters[param_def.name] = param_def.default
        
        # Validate parameter types and constraints
        for param_name, param_value in parameters.items():
            if param_name not in param_definitions:
                errors.append(f"Unknown parameter '{param_name}'")
                continue
            
            param_def = param_definitions[param_name]
            
            # Type validation
            if not self._validate_type(param_value, param_def.type):
                errors.append(
                    f"Parameter '{param_name}' has invalid type. "
                    f"Expected {param_def.type}, got {type(param_value).__name__}"
                )
            
            # Enum validation
            if param_def.enum and param_value not in param_def.enum:
                errors.append(
                    f"Parameter '{param_name}' must be one of {param_def.enum}"
                )
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _validate_type(self, value: Any, expected_type: str) -> bool:
        """Validate value against expected type."""
        type_map = {
            "string": str,
            "number": (int, float),
            "boolean": bool,
            "object": dict,
            "array": list
        }
        
        if expected_type not in type_map:
            return True  # Unknown type, skip validation
        
        expected_python_type = type_map[expected_type]
        return isinstance(value, expected_python_type)
    
    def get_parameters_schema(self) -> Dict[str, Any]:
        """Get parameters schema in JSON Schema format."""
        properties = {}
        required = []
        
        for param in self.get_parameters():
            param_schema = {
                "type": param.type,
                "description": param.description
            }
            
            if param.enum:
                param_schema["enum"] = param.enum
            
            if param.default is not None:
                param_schema["default"] = param.default
            
            properties[param.name] = param_schema
            
            if param.required and param.default is None:
                required.append(param.name)
        
        return {
            "type": "object",
            "properties": properties,
            "required": required
        }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get tool execution metrics."""
        avg_execution_time = (
            self.total_execution_time / self.execution_count
            if self.execution_count > 0 else 0
        )
        
        return {
            "name": self.name,
            "execution_count": self.execution_count,
            "total_execution_time_ms": self.total_execution_time,
            "avg_execution_time_ms": round(avg_execution_time, 2)
        }