"""Main agent executor for running agents with lifecycle management."""

import asyncio
import threading
import time
import logging
from typing import Dict, Any, Optional, List, Callable
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from datetime import datetime
import traceback

from ..core.base_agent import BaseAgent
from ..core.agent_result import AgentResult
from ..core.agent_types import AgentStatus
from .agent_registry import AgentRegistry
from .execution_manager import ExecutionManager


class AgentExecutor:
    """
    Main executor for running agents with proper lifecycle management.
    Supports both synchronous and asynchronous execution.
    """
    
    def __init__(self, max_workers: int = 5, default_timeout: int = 300):
        """
        Initialize agent executor.
        
        Args:
            max_workers: Maximum number of concurrent agent executions
            default_timeout: Default timeout in seconds for agent execution
        """
        self.max_workers = max_workers
        self.default_timeout = default_timeout
        
        # Core components
        self.registry = AgentRegistry()
        self.execution_manager = ExecutionManager()
        
        # Thread pool for concurrent execution
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        
        # Hooks for extensibility
        self._pre_execution_hooks: List[Callable] = []
        self._post_execution_hooks: List[Callable] = []
        
        # Logging
        self.logger = logging.getLogger("AgentExecutor")
        
        # Shutdown flag
        self._shutdown = False
    
    def register_agent_class(self, agent_type, agent_class):
        """Register an agent class with the executor."""
        self.registry.register_agent_class(agent_type, agent_class)
    
    def create_agent(self, agent_id: str, agent_type, name: str, 
                     description: str, config: Dict) -> BaseAgent:
        """Create and register a new agent."""
        return self.registry.create_agent(agent_id, agent_type, name, description, config)
    
    def execute_agent(self, agent_id: str, input_data: Dict[str, Any],
                     org_id: Optional[str] = None, user_id: Optional[str] = None,
                     timeout: Optional[int] = None) -> AgentResult:
        """
        Execute an agent synchronously.
        
        Args:
            agent_id: ID of the agent to execute
            input_data: Input data for the agent
            org_id: Organization ID for scoping
            user_id: User ID for attribution
            timeout: Execution timeout in seconds
            
        Returns:
            AgentResult with execution results
        """
        agent = self.registry.get_agent(agent_id)
        if not agent:
            return AgentResult(
                success=False,
                message=f"Agent {agent_id} not found",
                error_type="AgentNotFound"
            )
        
        # Start execution tracking
        execution_id = agent.context.execution_id if agent.context else None
        if not execution_id:
            from ..core.agent_context import AgentContext
            temp_context = AgentContext()
            execution_id = temp_context.execution_id
        
        self.execution_manager.start_execution(
            execution_id, agent_id, agent.agent_type.value, input_data
        )
        
        try:
            # Run pre-execution hooks
            for hook in self._pre_execution_hooks:
                hook(agent, input_data)
            
            # Execute with timeout
            timeout = timeout or self.default_timeout
            future = self.executor.submit(
                agent.execute, input_data, org_id, user_id
            )
            
            # Wait for completion with timeout
            result = future.result(timeout=timeout)
            
            # Run post-execution hooks
            for hook in self._post_execution_hooks:
                hook(agent, result)
            
            # Complete execution tracking
            self.execution_manager.complete_execution(
                execution_id, result, agent.context
            )
            
            return result
            
        except TimeoutError:
            self.logger.error(f"Agent {agent_id} execution timed out after {timeout}s")
            
            # Cancel the execution
            self.execution_manager.cancel_execution(
                execution_id, f"Timeout after {timeout} seconds"
            )
            
            return AgentResult(
                success=False,
                message=f"Agent execution timed out after {timeout} seconds",
                error_type="TimeoutError",
                execution_id=execution_id,
                agent_id=agent_id
            )
            
        except Exception as e:
            self.logger.error(f"Agent {agent_id} execution failed: {str(e)}", exc_info=True)
            
            # Create error result
            result = AgentResult(
                success=False,
                message=f"Agent execution failed: {str(e)}",
                error_type=type(e).__name__,
                execution_id=execution_id,
                agent_id=agent_id
            )
            result.set_error(type(e).__name__, str(e), {
                "traceback": traceback.format_exc()
            })
            
            # Complete execution tracking
            self.execution_manager.complete_execution(execution_id, result)
            
            return result
    
    async def execute_agent_async(self, agent_id: str, input_data: Dict[str, Any],
                                 org_id: Optional[str] = None, user_id: Optional[str] = None,
                                 timeout: Optional[int] = None) -> AgentResult:
        """
        Execute an agent asynchronously.
        
        Args:
            agent_id: ID of the agent to execute
            input_data: Input data for the agent
            org_id: Organization ID for scoping
            user_id: User ID for attribution
            timeout: Execution timeout in seconds
            
        Returns:
            AgentResult with execution results
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.execute_agent,
            agent_id, input_data, org_id, user_id, timeout
        )
    
    def execute_batch(self, executions: List[Dict[str, Any]], 
                     max_concurrent: Optional[int] = None) -> List[AgentResult]:
        """
        Execute multiple agents in batch.
        
        Args:
            executions: List of execution specifications
            max_concurrent: Maximum concurrent executions (defaults to max_workers)
            
        Returns:
            List of AgentResults in the same order as input
        """
        max_concurrent = max_concurrent or self.max_workers
        results = []
        
        # Use semaphore to limit concurrency
        semaphore = threading.Semaphore(max_concurrent)
        
        def execute_with_semaphore(execution_spec):
            with semaphore:
                return self.execute_agent(**execution_spec)
        
        # Submit all executions
        futures = []
        for execution_spec in executions:
            future = self.executor.submit(execute_with_semaphore, execution_spec)
            futures.append(future)
        
        # Collect results
        for future in futures:
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                # Create error result for failed submission
                results.append(AgentResult(
                    success=False,
                    message=f"Batch execution failed: {str(e)}",
                    error_type=type(e).__name__
                ))
        
        return results
    
    def add_pre_execution_hook(self, hook: Callable):
        """Add a pre-execution hook."""
        self._pre_execution_hooks.append(hook)
    
    def add_post_execution_hook(self, hook: Callable):
        """Add a post-execution hook."""
        self._post_execution_hooks.append(hook)
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID."""
        return self.registry.get_agent(agent_id)
    
    def list_agents(self, agent_type=None) -> List[Dict]:
        """List all registered agents."""
        return self.registry.list_agents(agent_type)
    
    def get_active_executions(self, agent_id: Optional[str] = None) -> List[Dict]:
        """Get active executions."""
        return self.execution_manager.get_active_executions(agent_id)
    
    def get_execution_history(self, agent_id: Optional[str] = None, 
                             limit: int = 100) -> List[Dict]:
        """Get execution history."""
        return self.execution_manager.get_execution_history(agent_id, limit)
    
    def get_metrics(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """Get execution metrics."""
        return self.execution_manager.get_metrics(agent_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get overall executor statistics."""
        return {
            "executor": {
                "max_workers": self.max_workers,
                "default_timeout": self.default_timeout,
                "active_threads": self.executor._threads.__len__() if hasattr(self.executor, '_threads') else 0,
                "shutdown": self._shutdown
            },
            "registry": {
                "registered_agents": len(self.registry._agents),
                "agent_types": self.registry.get_available_agent_types()
            },
            "executions": self.execution_manager.get_execution_stats()
        }
    
    def shutdown(self, wait: bool = True):
        """Shutdown the executor."""
        self.logger.info("Shutting down agent executor")
        self._shutdown = True
        self.executor.shutdown(wait=wait)
        self.logger.info("Agent executor shutdown complete")


# Global executor instance
_global_executor = None


def get_global_executor() -> AgentExecutor:
    """Get or create the global agent executor instance."""
    global _global_executor
    if _global_executor is None:
        _global_executor = AgentExecutor()
    return _global_executor