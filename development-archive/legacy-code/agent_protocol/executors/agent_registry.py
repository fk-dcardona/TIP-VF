"""Agent registry for managing agent instances."""

from typing import Dict, Optional, Type, List
import logging
from datetime import datetime

from ..core.base_agent import BaseAgent
from ..core.agent_types import AgentType


class AgentRegistry:
    """Registry for managing agent instances and their lifecycle."""
    
    def __init__(self):
        """Initialize agent registry."""
        self._agents: Dict[str, BaseAgent] = {}
        self._agent_classes: Dict[AgentType, Type[BaseAgent]] = {}
        self._agent_metadata: Dict[str, Dict] = {}
        self.logger = logging.getLogger("AgentRegistry")
    
    def register_agent_class(self, agent_type: AgentType, agent_class: Type[BaseAgent]):
        """Register an agent class for a specific type."""
        if not issubclass(agent_class, BaseAgent):
            raise ValueError(f"{agent_class} must be a subclass of BaseAgent")
        
        self._agent_classes[agent_type] = agent_class
        self.logger.info(f"Registered agent class {agent_class.__name__} for type {agent_type.value}")
    
    def create_agent(self, agent_id: str, agent_type: AgentType, 
                     name: str, description: str, config: Dict) -> BaseAgent:
        """Create and register a new agent instance."""
        if agent_id in self._agents:
            raise ValueError(f"Agent with ID {agent_id} already exists")
        
        if agent_type not in self._agent_classes:
            raise ValueError(f"No agent class registered for type {agent_type.value}")
        
        # Create agent instance
        agent_class = self._agent_classes[agent_type]
        agent = agent_class(agent_id, agent_type, name, description, config)
        
        # Register agent
        self._agents[agent_id] = agent
        self._agent_metadata[agent_id] = {
            "created_at": datetime.utcnow(),
            "type": agent_type.value,
            "name": name,
            "description": description,
            "config": config
        }
        
        self.logger.info(f"Created and registered agent: {agent_id} ({name})")
        return agent
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID."""
        return self._agents.get(agent_id)
    
    def list_agents(self, agent_type: Optional[AgentType] = None) -> List[Dict]:
        """List all registered agents."""
        agents = []
        for agent_id, agent in self._agents.items():
            if agent_type and agent.agent_type != agent_type:
                continue
            
            metadata = self._agent_metadata.get(agent_id, {})
            agents.append({
                "agent_id": agent_id,
                "type": agent.agent_type.value,
                "name": agent.name,
                "description": agent.description,
                "status": agent.status.value,
                "created_at": metadata.get("created_at"),
                "execution_summary": agent.get_execution_summary()
            })
        
        return agents
    
    def remove_agent(self, agent_id: str) -> bool:
        """Remove an agent from the registry."""
        if agent_id in self._agents:
            del self._agents[agent_id]
            del self._agent_metadata[agent_id]
            self.logger.info(f"Removed agent: {agent_id}")
            return True
        return False
    
    def get_available_agent_types(self) -> List[str]:
        """Get list of available agent types."""
        return [agent_type.value for agent_type in self._agent_classes.keys()]
    
    def clear_registry(self):
        """Clear all agents from the registry."""
        self._agents.clear()
        self._agent_metadata.clear()
        self.logger.info("Cleared agent registry")