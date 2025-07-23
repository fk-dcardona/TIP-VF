#!/usr/bin/env python3
"""
Agent Registry - Central registry for managing and initializing agents in production.
Handles agent discovery, registration, health monitoring, and lifecycle management.
"""

import os
import sys
import json
import time
import asyncio
import threading
from typing import Dict, List, Optional, Any, Type
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import logging
from concurrent.futures import ThreadPoolExecutor
import signal

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from agent_protocol.agents.base_agent import BaseAgent
from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
from agent_protocol.agents.supplier_agent import SupplierEvaluatorAgent
from agent_protocol.agents.demand_agent import DemandForecasterAgent
from agent_protocol.executors.agent_executor import AgentExecutor
from agent_protocol.monitoring.metrics_collector import get_metrics_collector
from agent_protocol.monitoring.agent_logger import get_agent_logger
from agent_protocol.monitoring.health_checker import HealthChecker
from agent_protocol.security.permissions import get_permission_manager
from agent_protocol.mcp.mcp_server import MCPServer
from backend.config.settings import settings
from backend.models import db, Agent as AgentModel

# Set up logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('agent_registry')


@dataclass
class AgentRegistryConfig:
    """Configuration for agent registry."""
    auto_start_agents: bool = True
    health_check_interval: int = 30
    max_concurrent_agents: int = 100
    agent_timeout: int = 300
    registry_port: int = 5555
    enable_mcp_server: bool = True
    enable_metrics: bool = True
    enable_health_monitoring: bool = True
    cleanup_interval: int = 3600  # 1 hour
    backup_interval: int = 21600  # 6 hours


@dataclass
class RegisteredAgent:
    """Information about a registered agent."""
    agent_id: str
    agent_type: str
    agent_instance: BaseAgent
    organization_id: str
    status: str = "active"
    registered_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_heartbeat: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    execution_count: int = 0
    error_count: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


class AgentRegistry:
    """Central registry for managing agent instances in production."""
    
    def __init__(self, config: Optional[AgentRegistryConfig] = None):
        """Initialize agent registry."""
        self.config = config or AgentRegistryConfig()
        self.agents: Dict[str, RegisteredAgent] = {}
        self.agent_types: Dict[str, Type[BaseAgent]] = {}
        self.executor = AgentExecutor()
        self.metrics_collector = get_metrics_collector()
        self.agent_logger = get_agent_logger()
        self.permission_manager = get_permission_manager()
        self.health_checker = HealthChecker()
        self.mcp_server = None
        
        # Threading and async
        self.thread_pool = ThreadPoolExecutor(max_workers=self.config.max_concurrent_agents)
        self.shutdown_event = threading.Event()
        self.health_monitor_thread = None
        self.cleanup_thread = None
        self.backup_thread = None
        
        # Registry state
        self.started_at = datetime.now(timezone.utc)
        self.is_running = False
        self.startup_complete = False
        
        # Initialize registry
        self._initialize_registry()
    
    def _initialize_registry(self):
        """Initialize the agent registry."""
        logger.info("Initializing Agent Registry")
        
        # Register built-in agent types
        self._register_builtin_agent_types()
        
        # Initialize MCP server if enabled
        if self.config.enable_mcp_server:
            self._initialize_mcp_server()
        
        # Set up signal handlers for graceful shutdown
        self._setup_signal_handlers()
        
        logger.info("Agent Registry initialized successfully")
    
    def _register_builtin_agent_types(self):
        """Register built-in agent types."""
        self.agent_types = {
            'inventory': InventoryMonitorAgent,
            'supplier': SupplierEvaluatorAgent,
            'demand': DemandForecasterAgent
        }
        
        logger.info(f"Registered {len(self.agent_types)} built-in agent types")
    
    def _initialize_mcp_server(self):
        """Initialize MCP server."""
        try:
            self.mcp_server = MCPServer(port=self.config.registry_port)
            logger.info(f"MCP server initialized on port {self.config.registry_port}")
        except Exception as e:
            logger.error(f"Failed to initialize MCP server: {e}")
            self.mcp_server = None
    
    def _setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown."""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating graceful shutdown")
            self.shutdown()
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def register_agent_type(self, agent_type: str, agent_class: Type[BaseAgent]):
        """Register a new agent type."""
        if not issubclass(agent_class, BaseAgent):
            raise ValueError(f"Agent class must inherit from BaseAgent")
        
        self.agent_types[agent_type] = agent_class
        logger.info(f"Registered agent type: {agent_type}")
    
    def create_agent(self, agent_id: str, agent_type: str, organization_id: str, 
                    config: Dict[str, Any]) -> RegisteredAgent:
        """Create and register a new agent instance."""
        if agent_type not in self.agent_types:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        if agent_id in self.agents:
            raise ValueError(f"Agent {agent_id} already exists")
        
        # Create agent instance
        agent_class = self.agent_types[agent_type]
        agent_instance = agent_class(agent_id, config)
        
        # Register with executor
        self.executor.register_agent(agent_instance)
        
        # Create registry entry
        registered_agent = RegisteredAgent(
            agent_id=agent_id,
            agent_type=agent_type,
            agent_instance=agent_instance,
            organization_id=organization_id,
            metadata={
                'config': config,
                'created_by': 'agent_registry',
                'auto_started': self.config.auto_start_agents
            }
        )
        
        self.agents[agent_id] = registered_agent
        
        # Log registration
        self.agent_logger.log_custom_event(
            "agent_registered",
            f"Agent {agent_id} registered in registry",
            {
                "agent_id": agent_id,
                "agent_type": agent_type,
                "organization_id": organization_id,
                "auto_started": self.config.auto_start_agents
            }
        )
        
        logger.info(f"Agent {agent_id} ({agent_type}) registered successfully")
        return registered_agent
    
    def remove_agent(self, agent_id: str) -> bool:
        """Remove an agent from the registry."""
        if agent_id not in self.agents:
            return False
        
        registered_agent = self.agents[agent_id]
        
        # Unregister from executor
        self.executor.unregister_agent(agent_id)
        
        # Remove from registry
        del self.agents[agent_id]
        
        # Log removal
        self.agent_logger.log_custom_event(
            "agent_unregistered",
            f"Agent {agent_id} removed from registry",
            {
                "agent_id": agent_id,
                "agent_type": registered_agent.agent_type,
                "organization_id": registered_agent.organization_id,
                "execution_count": registered_agent.execution_count
            }
        )
        
        logger.info(f"Agent {agent_id} removed from registry")
        return True
    
    def get_agent(self, agent_id: str) -> Optional[RegisteredAgent]:
        """Get registered agent by ID."""
        return self.agents.get(agent_id)
    
    def list_agents(self, organization_id: Optional[str] = None, 
                   agent_type: Optional[str] = None) -> List[RegisteredAgent]:
        """List registered agents with optional filtering."""
        agents = list(self.agents.values())
        
        if organization_id:
            agents = [a for a in agents if a.organization_id == organization_id]
        
        if agent_type:
            agents = [a for a in agents if a.agent_type == agent_type]
        
        return agents
    
    def get_agent_health(self, agent_id: str) -> Dict[str, Any]:
        """Get health status of a specific agent."""
        if agent_id not in self.agents:
            return {"status": "not_found", "healthy": False}
        
        registered_agent = self.agents[agent_id]
        
        # Check if agent is responsive
        try:
            agent_status = registered_agent.agent_instance.status
            is_healthy = agent_status.value in ["idle", "running"]
            
            # Get recent metrics
            metrics = self.metrics_collector.get_agent_metrics(agent_id)
            
            return {
                "status": agent_status.value,
                "healthy": is_healthy,
                "last_heartbeat": registered_agent.last_heartbeat.isoformat(),
                "execution_count": registered_agent.execution_count,
                "error_count": registered_agent.error_count,
                "metrics": metrics.to_dict() if metrics else None
            }
        except Exception as e:
            logger.error(f"Error checking health for agent {agent_id}: {e}")
            return {"status": "error", "healthy": False, "error": str(e)}
    
    def get_registry_health(self) -> Dict[str, Any]:
        """Get overall registry health status."""
        total_agents = len(self.agents)
        healthy_agents = 0
        unhealthy_agents = 0
        
        for agent_id in self.agents:
            health = self.get_agent_health(agent_id)
            if health["healthy"]:
                healthy_agents += 1
            else:
                unhealthy_agents += 1
        
        # Get system health
        system_health = self.health_checker.get_system_health()
        
        return {
            "registry_status": "healthy" if self.is_running else "unhealthy",
            "startup_complete": self.startup_complete,
            "started_at": self.started_at.isoformat(),
            "uptime_seconds": (datetime.now(timezone.utc) - self.started_at).total_seconds(),
            "agents": {
                "total": total_agents,
                "healthy": healthy_agents,
                "unhealthy": unhealthy_agents,
                "types": list(self.agent_types.keys())
            },
            "components": {
                "executor": self.executor is not None,
                "metrics_collector": self.metrics_collector is not None,
                "mcp_server": self.mcp_server is not None,
                "health_checker": self.health_checker is not None
            },
            "system_health": system_health
        }
    
    def load_agents_from_database(self):
        """Load agents from database and register them."""
        logger.info("Loading agents from database")
        
        try:
            # Import Flask app context
            from main import app
            
            with app.app_context():
                # Query all active agents
                agents = AgentModel.query.filter_by(status='active').all()
                
                loaded_count = 0
                for agent_model in agents:
                    try:
                        # Parse config
                        config = json.loads(agent_model.config) if agent_model.config else {}
                        
                        # Create agent instance
                        self.create_agent(
                            agent_id=agent_model.id,
                            agent_type=agent_model.type,
                            organization_id=agent_model.organization_id,
                            config=config
                        )
                        
                        loaded_count += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to load agent {agent_model.id}: {e}")
                
                logger.info(f"Loaded {loaded_count} agents from database")
                
        except Exception as e:
            logger.error(f"Failed to load agents from database: {e}")
    
    def _health_monitor_loop(self):
        """Health monitoring loop."""
        logger.info("Starting health monitoring loop")
        
        while not self.shutdown_event.is_set():
            try:
                # Update agent heartbeats
                current_time = datetime.now(timezone.utc)
                
                for agent_id, registered_agent in self.agents.items():
                    try:
                        # Check if agent is responsive
                        agent_status = registered_agent.agent_instance.status
                        
                        # Update heartbeat
                        registered_agent.last_heartbeat = current_time
                        
                        # Check for stuck agents
                        time_since_heartbeat = (current_time - registered_agent.last_heartbeat).total_seconds()
                        if time_since_heartbeat > self.config.agent_timeout:
                            logger.warning(f"Agent {agent_id} appears to be stuck (no heartbeat for {time_since_heartbeat}s)")
                            
                    except Exception as e:
                        logger.error(f"Error monitoring agent {agent_id}: {e}")
                        registered_agent.error_count += 1
                
                # Sleep until next check
                self.shutdown_event.wait(self.config.health_check_interval)
                
            except Exception as e:
                logger.error(f"Error in health monitoring loop: {e}")
                self.shutdown_event.wait(self.config.health_check_interval)
        
        logger.info("Health monitoring loop stopped")
    
    def _cleanup_loop(self):
        """Cleanup loop for expired resources."""
        logger.info("Starting cleanup loop")
        
        while not self.shutdown_event.is_set():
            try:
                # Clean up expired security contexts
                cleaned_contexts = self.permission_manager.cleanup_expired_contexts()
                if cleaned_contexts > 0:
                    logger.info(f"Cleaned up {cleaned_contexts} expired security contexts")
                
                # Clean up old metrics
                if self.config.enable_metrics:
                    # This would be implemented in metrics collector
                    pass
                
                # Sleep until next cleanup
                self.shutdown_event.wait(self.config.cleanup_interval)
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                self.shutdown_event.wait(self.config.cleanup_interval)
        
        logger.info("Cleanup loop stopped")
    
    def start(self):
        """Start the agent registry."""
        if self.is_running:
            logger.warning("Agent registry is already running")
            return
        
        logger.info("Starting Agent Registry")
        self.is_running = True
        
        # Load agents from database
        self.load_agents_from_database()
        
        # Start health monitoring
        if self.config.enable_health_monitoring:
            self.health_monitor_thread = threading.Thread(
                target=self._health_monitor_loop,
                daemon=True
            )
            self.health_monitor_thread.start()
        
        # Start cleanup loop
        self.cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True
        )
        self.cleanup_thread.start()
        
        # Start MCP server
        if self.mcp_server:
            try:
                # Start MCP server in separate thread
                mcp_thread = threading.Thread(
                    target=self.mcp_server.start,
                    daemon=True
                )
                mcp_thread.start()
                logger.info("MCP server started")
            except Exception as e:
                logger.error(f"Failed to start MCP server: {e}")
        
        self.startup_complete = True
        logger.info("Agent Registry started successfully")
    
    def shutdown(self):
        """Shutdown the agent registry gracefully."""
        if not self.is_running:
            logger.warning("Agent registry is not running")
            return
        
        logger.info("Shutting down Agent Registry")
        self.is_running = False
        
        # Signal shutdown to all threads
        self.shutdown_event.set()
        
        # Stop all agents
        for agent_id in list(self.agents.keys()):
            try:
                self.remove_agent(agent_id)
            except Exception as e:
                logger.error(f"Error removing agent {agent_id}: {e}")
        
        # Shutdown MCP server
        if self.mcp_server:
            try:
                self.mcp_server.stop()
                logger.info("MCP server stopped")
            except Exception as e:
                logger.error(f"Error stopping MCP server: {e}")
        
        # Wait for threads to complete
        if self.health_monitor_thread and self.health_monitor_thread.is_alive():
            self.health_monitor_thread.join(timeout=5)
        
        if self.cleanup_thread and self.cleanup_thread.is_alive():
            self.cleanup_thread.join(timeout=5)
        
        # Shutdown thread pool
        self.thread_pool.shutdown(wait=True)
        
        logger.info("Agent Registry shutdown complete")
    
    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        return {
            "agents": {
                "total": len(self.agents),
                "by_type": {
                    agent_type: len([a for a in self.agents.values() if a.agent_type == agent_type])
                    for agent_type in self.agent_types.keys()
                },
                "by_organization": {
                    org_id: len([a for a in self.agents.values() if a.organization_id == org_id])
                    for org_id in set(a.organization_id for a in self.agents.values())
                }
            },
            "registry": {
                "started_at": self.started_at.isoformat(),
                "uptime_seconds": (datetime.now(timezone.utc) - self.started_at).total_seconds(),
                "is_running": self.is_running,
                "startup_complete": self.startup_complete
            },
            "config": {
                "auto_start_agents": self.config.auto_start_agents,
                "max_concurrent_agents": self.config.max_concurrent_agents,
                "health_check_interval": self.config.health_check_interval,
                "agent_timeout": self.config.agent_timeout
            }
        }


# Global registry instance
_agent_registry = None

def get_agent_registry() -> AgentRegistry:
    """Get global agent registry instance."""
    global _agent_registry
    if _agent_registry is None:
        _agent_registry = AgentRegistry()
    return _agent_registry


def main():
    """Main function for running registry as standalone service."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Agent Registry Service')
    parser.add_argument('--port', type=int, default=5555, help='MCP server port')
    parser.add_argument('--config', help='Config file path')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    
    args = parser.parse_args()
    
    # Create configuration
    config = AgentRegistryConfig(
        registry_port=args.port,
        enable_mcp_server=True,
        enable_metrics=True,
        enable_health_monitoring=True
    )
    
    # Create and start registry
    registry = AgentRegistry(config)
    
    try:
        registry.start()
        
        if args.daemon:
            # Run as daemon
            while registry.is_running:
                time.sleep(1)
        else:
            # Interactive mode
            print("Agent Registry started. Press Ctrl+C to stop.")
            print(f"Registry stats: {registry.get_registry_stats()}")
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down...")
    
    finally:
        registry.shutdown()


if __name__ == '__main__':
    main()