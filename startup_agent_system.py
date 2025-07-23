#!/usr/bin/env python3
"""
Agent System Startup Script
Initializes and starts the complete agent system for production deployment.
"""

import os
import sys
import time
import logging
import argparse
from typing import Dict, Any, Optional
from datetime import datetime

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from agent_registry import AgentRegistry, AgentRegistryConfig
from migrations.run_migrations import MigrationRunner
from backend.config.settings import settings

# Set up logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('agent_system_startup')


class AgentSystemStartup:
    """Handles complete agent system startup process."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize startup manager."""
        self.config = config or {}
        self.registry = None
        self.startup_time = None
        self.components_started = []
        self.startup_errors = []
        
    def check_environment(self) -> bool:
        """Check if environment is properly configured."""
        logger.info("Checking environment configuration...")
        
        required_vars = [
            'DATABASE_URL',
            'SECRET_KEY',
            'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(settings, var, None):
                missing_vars.append(var)
        
        if missing_vars:
            logger.error(f"Missing required environment variables: {missing_vars}")
            return False
        
        logger.info("Environment configuration check passed")
        return True
    
    def run_database_migrations(self) -> bool:
        """Run database migrations."""
        logger.info("Running database migrations...")
        
        try:
            migration_runner = MigrationRunner()
            migration_runner.run_migrations()
            logger.info("Database migrations completed successfully")
            return True
        except Exception as e:
            logger.error(f"Database migration failed: {e}")
            self.startup_errors.append(f"Database migration failed: {e}")
            return False
    
    def initialize_agent_registry(self) -> bool:
        """Initialize agent registry."""
        logger.info("Initializing agent registry...")
        
        try:
            # Create registry configuration
            registry_config = AgentRegistryConfig(
                auto_start_agents=self.config.get('auto_start_agents', True),
                health_check_interval=self.config.get('health_check_interval', 30),
                max_concurrent_agents=self.config.get('max_concurrent_agents', 100),
                agent_timeout=self.config.get('agent_timeout', 300),
                registry_port=self.config.get('registry_port', 5555),
                enable_mcp_server=self.config.get('enable_mcp_server', True),
                enable_metrics=self.config.get('enable_metrics', True),
                enable_health_monitoring=self.config.get('enable_health_monitoring', True)
            )
            
            # Create registry instance
            self.registry = AgentRegistry(registry_config)
            
            logger.info("Agent registry initialized successfully")
            self.components_started.append("agent_registry")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize agent registry: {e}")
            self.startup_errors.append(f"Agent registry initialization failed: {e}")
            return False
    
    def start_agent_registry(self) -> bool:
        """Start agent registry."""
        logger.info("Starting agent registry...")
        
        try:
            if not self.registry:
                logger.error("Agent registry not initialized")
                return False
            
            self.registry.start()
            
            # Wait for startup to complete
            max_wait = 30  # 30 seconds
            wait_time = 0
            
            while not self.registry.startup_complete and wait_time < max_wait:
                time.sleep(1)
                wait_time += 1
            
            if not self.registry.startup_complete:
                logger.error("Agent registry startup timeout")
                return False
            
            logger.info("Agent registry started successfully")
            self.components_started.append("agent_registry_started")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start agent registry: {e}")
            self.startup_errors.append(f"Agent registry startup failed: {e}")
            return False
    
    def verify_system_health(self) -> bool:
        """Verify system health after startup."""
        logger.info("Verifying system health...")
        
        try:
            if not self.registry:
                logger.error("Agent registry not available for health check")
                return False
            
            # Get registry health
            health_status = self.registry.get_registry_health()
            
            # Check critical components
            if not health_status['startup_complete']:
                logger.error("Registry startup not complete")
                return False
            
            if health_status['registry_status'] != 'healthy':
                logger.error(f"Registry status: {health_status['registry_status']}")
                return False
            
            # Check system components
            components = health_status['components']
            failed_components = [name for name, status in components.items() if not status]
            
            if failed_components:
                logger.error(f"Failed components: {failed_components}")
                return False
            
            logger.info("System health verification passed")
            logger.info(f"Registry stats: {self.registry.get_registry_stats()}")
            
            return True
            
        except Exception as e:
            logger.error(f"Health verification failed: {e}")
            self.startup_errors.append(f"Health verification failed: {e}")
            return False
    
    def create_startup_report(self) -> Dict[str, Any]:
        """Create startup report."""
        end_time = datetime.now()
        startup_duration = (end_time - self.startup_time).total_seconds()
        
        report = {
            'startup_time': self.startup_time.isoformat(),
            'end_time': end_time.isoformat(),
            'duration_seconds': startup_duration,
            'success': len(self.startup_errors) == 0,
            'components_started': self.components_started,
            'errors': self.startup_errors,
            'environment': {
                'database_url': settings.DATABASE_URL,
                'host': settings.HOST,
                'port': settings.PORT,
                'debug': settings.DEBUG
            }
        }
        
        # Add registry stats if available
        if self.registry:
            report['registry_stats'] = self.registry.get_registry_stats()
            report['registry_health'] = self.registry.get_registry_health()
        
        return report
    
    def start_system(self) -> bool:
        """Start the complete agent system."""
        self.startup_time = datetime.now()
        logger.info("Starting Agent System...")
        logger.info(f"Startup time: {self.startup_time.isoformat()}")
        
        # Step 1: Check environment
        if not self.check_environment():
            logger.error("Environment check failed")
            return False
        
        # Step 2: Run database migrations
        if not self.run_database_migrations():
            logger.error("Database migrations failed")
            return False
        
        # Step 3: Initialize agent registry
        if not self.initialize_agent_registry():
            logger.error("Agent registry initialization failed")
            return False
        
        # Step 4: Start agent registry
        if not self.start_agent_registry():
            logger.error("Agent registry startup failed")
            return False
        
        # Step 5: Verify system health
        if not self.verify_system_health():
            logger.error("System health verification failed")
            return False
        
        # Create startup report
        report = self.create_startup_report()
        
        if report['success']:
            logger.info("Agent System started successfully!")
            logger.info(f"Startup duration: {report['duration_seconds']:.2f} seconds")
            logger.info(f"Components started: {', '.join(report['components_started'])}")
            
            # Log registry information
            if self.registry:
                registry_health = self.registry.get_registry_health()
                logger.info(f"Total agents loaded: {registry_health['agents']['total']}")
                logger.info(f"Healthy agents: {registry_health['agents']['healthy']}")
                logger.info(f"Agent types available: {', '.join(registry_health['agents']['types'])}")
            
            return True
        else:
            logger.error("Agent System startup failed!")
            logger.error(f"Errors: {', '.join(report['errors'])}")
            return False
    
    def shutdown_system(self):
        """Shutdown the agent system."""
        logger.info("Shutting down Agent System...")
        
        if self.registry:
            self.registry.shutdown()
        
        logger.info("Agent System shutdown complete")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Agent System Startup')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    parser.add_argument('--skip-migrations', action='store_true', help='Skip database migrations')
    parser.add_argument('--registry-port', type=int, default=5555, help='Registry MCP port')
    parser.add_argument('--max-agents', type=int, default=100, help='Maximum concurrent agents')
    parser.add_argument('--health-interval', type=int, default=30, help='Health check interval')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    
    args = parser.parse_args()
    
    # Create configuration
    config = {
        'auto_start_agents': True,
        'health_check_interval': args.health_interval,
        'max_concurrent_agents': args.max_agents,
        'registry_port': args.registry_port,
        'enable_mcp_server': True,
        'enable_metrics': True,
        'enable_health_monitoring': True,
        'skip_migrations': args.skip_migrations
    }
    
    # Load config file if provided
    if args.config and os.path.exists(args.config):
        import json
        with open(args.config, 'r') as f:
            file_config = json.load(f)
            config.update(file_config)
    
    # Create startup manager
    startup_manager = AgentSystemStartup(config)
    
    if args.dry_run:
        print("DRY RUN: Would perform the following startup steps:")
        print("1. Check environment configuration")
        print("2. Run database migrations" if not args.skip_migrations else "2. Skip database migrations")
        print("3. Initialize agent registry")
        print("4. Start agent registry")
        print("5. Verify system health")
        print(f"Configuration: {config}")
        return
    
    try:
        # Start the system
        success = startup_manager.start_system()
        
        if not success:
            logger.error("System startup failed")
            sys.exit(1)
        
        if args.daemon:
            # Run as daemon
            print("Agent System started successfully. Running as daemon...")
            print("Press Ctrl+C to stop.")
            
            try:
                while startup_manager.registry.is_running:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down...")
        else:
            # Interactive mode
            print("Agent System started successfully!")
            print("System Status:")
            print("=" * 50)
            
            if startup_manager.registry:
                health = startup_manager.registry.get_registry_health()
                print(f"Registry Status: {health['registry_status']}")
                print(f"Total Agents: {health['agents']['total']}")
                print(f"Healthy Agents: {health['agents']['healthy']}")
                print(f"Uptime: {health['uptime_seconds']:.2f} seconds")
                print(f"Components: {', '.join([k for k, v in health['components'].items() if v])}")
            
            print("=" * 50)
            print("Press Ctrl+C to stop the system.")
            
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down...")
    
    finally:
        startup_manager.shutdown_system()


if __name__ == '__main__':
    main()