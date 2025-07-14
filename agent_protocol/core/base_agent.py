"""Base agent abstract class with evidence-based approach."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Type
import logging
from datetime import datetime
import time

from .agent_types import AgentType, AgentStatus, AgentCapability
from .agent_context import AgentContext
from .agent_result import AgentResult
from ..tools.base_tool import Tool
from ..monitoring.agent_logger import get_agent_logger
from ..monitoring.metrics_collector import get_metrics_collector
from ..monitoring.execution_monitor import get_execution_monitor


class BaseAgent(ABC):
    """
    Abstract base class for all agents in the system.
    Implements SuperClaude evidence-based methodology.
    """
    
    def __init__(self, agent_id: str, agent_type: AgentType, 
                 name: str, description: str, config: Dict[str, Any]):
        """Initialize base agent."""
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.name = name
        self.description = description
        self.config = config
        
        # Agent state
        self.status = AgentStatus.IDLE
        self.context: Optional[AgentContext] = None
        
        # Tools registry
        self._tools: Dict[str, Tool] = {}
        self._tool_descriptions: List[Dict[str, Any]] = []
        
        # Performance tracking
        self.total_executions = 0
        self.successful_executions = 0
        self.failed_executions = 0
        
        # Logging and monitoring
        self.logger = logging.getLogger(f"Agent.{self.name}")
        self.agent_logger = get_agent_logger()
        self.metrics_collector = get_metrics_collector()
        self.execution_monitor = get_execution_monitor()
        
        # Initialize agent-specific tools
        self._initialize_tools()
    
    @abstractmethod
    def _initialize_tools(self):
        """Initialize agent-specific tools. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """Get the system prompt for this agent. Must be implemented by subclasses."""
        pass
    
    @abstractmethod
    def _execute_core_logic(self, context: AgentContext) -> AgentResult:
        """Execute the core agent logic. Must be implemented by subclasses."""
        pass
    
    def register_tool(self, tool: Tool):
        """Register a tool for the agent to use."""
        self._tools[tool.name] = tool
        self._tool_descriptions.append({
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.get_parameters_schema()
        })
        self.logger.info(f"Registered tool: {tool.name}")
    
    def get_tools(self) -> Dict[str, Tool]:
        """Get all registered tools."""
        return self._tools
    
    def get_tool_descriptions(self) -> List[Dict[str, Any]]:
        """Get tool descriptions for LLM context."""
        return self._tool_descriptions
    
    def has_capability(self, capability: AgentCapability) -> bool:
        """Check if agent has a specific capability."""
        from .agent_types import AGENT_CAPABILITIES
        agent_capabilities = AGENT_CAPABILITIES.get(self.agent_type, [])
        return capability in agent_capabilities
    
    def execute(self, input_data: Dict[str, Any], 
                org_id: Optional[str] = None,
                user_id: Optional[str] = None) -> AgentResult:
        """
        Execute the agent with evidence-based approach.
        
        Args:
            input_data: Input data for the agent
            org_id: Organization ID for scoping
            user_id: User ID for attribution
            
        Returns:
            AgentResult with evidence and reasoning
        """
        start_time = time.time()
        execution_id = f"exec_{self.agent_id}_{int(time.time() * 1000)}"
        
        # Create execution context
        self.context = AgentContext(
            agent_id=self.agent_id,
            agent_type=self.agent_type.value,
            org_id=org_id,
            user_id=user_id,
            input_data=input_data,
            execution_id=execution_id
        )
        
        # Start monitoring
        execution_state = self.execution_monitor.start_execution(
            execution_id, self.agent_id, self.agent_type, 
            {"input_data": input_data}
        )
        
        try:
            # Use logging context
            with self.agent_logger.execution_context(
                self.agent_id, self.agent_type, execution_id, user_id, org_id
            ):
                # Update status
                self._update_status(AgentStatus.INITIALIZING)
                self.context.add_reasoning_step(f"Initializing {self.name} agent")
                
                # Validate input
                if not self._validate_input(input_data):
                    raise ValueError("Invalid input data")
                
                # Pre-execution hook
                self._pre_execute()
                
                # Execute core logic
                self._update_status(AgentStatus.RUNNING)
                self.context.add_reasoning_step("Executing core agent logic")
                
                result = self._execute_core_logic(self.context)
                
                # Post-execution hook
                self._post_execute(result)
                
                # Update execution metrics
                execution_time = int((time.time() - start_time) * 1000)
                result.execution_time_ms = execution_time
                result.execution_id = execution_id
                result.agent_id = self.agent_id
                result.tokens_used = self.context.tokens_used
                result.tools_called = [tool["tool"] for tool in self.context.tools_used]
                
                # Copy evidence and reasoning from context
                result.evidence = self.context.evidence
                result.reasoning = self.context.reasoning_steps
                
                # Update success metrics
                self.total_executions += 1
                if result.success:
                    self.successful_executions += 1
                    self._update_status(AgentStatus.COMPLETED)
                else:
                    self.failed_executions += 1
                    self._update_status(AgentStatus.FAILED)
                
                # Complete context
                self.context.completed_at = datetime.utcnow()
                self.context.execution_time_ms = execution_time
                self.context.output_data = result.data
                
                # Record metrics
                self.metrics_collector.record_execution_end(
                    self.agent_id, self.agent_type, execution_id, 
                    result.success, execution_time, result.confidence
                )
                
                # End execution monitoring
                self.execution_monitor.end_execution(execution_id, result.success, result.tokens_used)
                
                self.logger.info(f"Agent execution completed in {execution_time}ms")
                return result
            
        except Exception as e:
            execution_time = int((time.time() - start_time) * 1000)
            
            self.logger.error(f"Agent execution failed: {str(e)}", exc_info=True)
            
            # Update failure metrics
            self.total_executions += 1
            self.failed_executions += 1
            self._update_status(AgentStatus.FAILED)
            
            # Record failed execution metrics
            self.metrics_collector.record_execution_end(
                self.agent_id, self.agent_type, execution_id, 
                False, execution_time
            )
            
            # End execution monitoring with failure
            self.execution_monitor.end_execution(execution_id, False)
            
            # Create error result
            result = AgentResult(
                success=False,
                message=f"Agent execution failed: {str(e)}",
                execution_id=execution_id,
                agent_id=self.agent_id,
                execution_time_ms=execution_time
            )
            result.set_error(type(e).__name__, str(e))
            
            # Add error to context
            if self.context:
                self.context.add_error(type(e).__name__, str(e))
                self.context.completed_at = datetime.utcnow()
            
            return result
    
    def _validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data. Can be overridden by subclasses."""
        if not isinstance(input_data, dict):
            self.context.add_error("ValidationError", "Input must be a dictionary")
            return False
        return True
    
    def _pre_execute(self):
        """Pre-execution hook. Can be overridden by subclasses."""
        self.context.add_reasoning_step("Performing pre-execution checks")
    
    def _post_execute(self, result: AgentResult):
        """Post-execution hook. Can be overridden by subclasses."""
        self.context.add_reasoning_step("Performing post-execution cleanup")
    
    def _update_status(self, status: AgentStatus):
        """Update agent status."""
        old_status = self.status
        self.status = status
        if self.context:
            self.context.update_state(status.value, {
                "previous_status": old_status.value
            })
        self.logger.debug(f"Status updated: {old_status.value} -> {status.value}")
    
    def call_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Any:
        """
        Call a registered tool with parameters.
        
        Args:
            tool_name: Name of the tool to call
            parameters: Parameters for the tool
            
        Returns:
            Tool execution result
        """
        if tool_name not in self._tools:
            raise ValueError(f"Tool '{tool_name}' not found")
        
        tool = self._tools[tool_name]
        
        # Check capability
        if not self._check_tool_capability(tool):
            raise PermissionError(f"Agent lacks capability to use tool '{tool_name}'")
        
        # Update status
        self._update_status(AgentStatus.EXECUTING_TOOL)
        
        # Execute tool
        start_time = time.time()
        try:
            result = tool.execute(parameters, self.context)
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log successful tool call
            self.agent_logger.log_tool_call(tool_name, parameters, result)
            
            # Record metrics
            self.metrics_collector.record_tool_call(
                self.agent_id, self.agent_type, tool_name, True, duration_ms
            )
            
            # Update execution monitor
            if hasattr(self.context, 'execution_id'):
                self.execution_monitor.record_tool_call(
                    self.context.execution_id, tool_name, True
                )
            
            # Track tool usage
            if self.context:
                self.context.track_tool_usage(tool_name, parameters, result, duration_ms)
            
            self.logger.debug(f"Tool '{tool_name}' executed in {duration_ms}ms")
            return result
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Log failed tool call
            self.agent_logger.log_tool_call(tool_name, parameters, error=e)
            
            # Record metrics
            self.metrics_collector.record_tool_call(
                self.agent_id, self.agent_type, tool_name, False, duration_ms
            )
            
            # Update execution monitor
            if hasattr(self.context, 'execution_id'):
                self.execution_monitor.record_tool_call(
                    self.context.execution_id, tool_name, False
                )
            
            # Track failed tool usage
            if self.context:
                self.context.add_error(f"ToolError:{tool_name}", str(e))
            
            self.logger.error(f"Tool '{tool_name}' execution failed: {str(e)}")
            raise
            
        finally:
            self._update_status(AgentStatus.RUNNING)
    
    def _check_tool_capability(self, tool: Tool) -> bool:
        """Check if agent has capability to use a tool."""
        # This can be extended with more sophisticated capability checking
        return True
    
    def get_execution_summary(self) -> Dict[str, Any]:
        """Get summary of agent executions."""
        success_rate = (self.successful_executions / self.total_executions * 100 
                       if self.total_executions > 0 else 0)
        
        return {
            "agent_id": self.agent_id,
            "agent_type": self.agent_type.value,
            "name": self.name,
            "status": self.status.value,
            "total_executions": self.total_executions,
            "successful_executions": self.successful_executions,
            "failed_executions": self.failed_executions,
            "success_rate": round(success_rate, 2),
            "registered_tools": list(self._tools.keys())
        }