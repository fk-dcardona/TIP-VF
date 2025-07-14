"""MCP Server implementation for agent tool and resource management."""

import json
import asyncio
import logging
from typing import Dict, Any, List, Optional, Union, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
import threading

from .tool_registry import get_tool_registry
from .resource_manager import get_resource_manager
from .prompt_repository import get_prompt_repository
from ..monitoring.agent_logger import get_agent_logger
from ..monitoring.metrics_collector import get_metrics_collector


@dataclass
class MCPCapability:
    """MCP server capability definition."""
    name: str
    version: str
    description: str
    enabled: bool = True
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class MCPRequest:
    """MCP request structure."""
    method: str
    params: Dict[str, Any]
    id: Optional[str] = None
    jsonrpc: str = "2.0"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class MCPResponse:
    """MCP response structure."""
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[str] = None
    jsonrpc: str = "2.0"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


class MCPServer:
    """Model Context Protocol server for agent tools and resources."""
    
    def __init__(self, name: str = "supply-chain-mcp", version: str = "1.0.0"):
        """Initialize MCP server."""
        self.name = name
        self.version = version
        self.logger = get_agent_logger()
        self.metrics = get_metrics_collector()
        
        # Core components
        self.tool_registry = get_tool_registry()
        self.resource_manager = get_resource_manager()
        self.prompt_repository = get_prompt_repository()
        
        # Server state
        self._running = False
        self._clients: Dict[str, Dict[str, Any]] = {}
        self._handlers: Dict[str, Callable] = {}
        self._capabilities: List[MCPCapability] = []
        
        # Thread safety
        self._lock = threading.RLock()
        
        # Initialize server
        self._initialize_capabilities()
        self._register_handlers()
        
        self.logger.log_custom_event(
            "mcp_server_init",
            f"MCP Server '{self.name}' v{self.version} initialized",
            {"capabilities": len(self._capabilities)}
        )
    
    def _initialize_capabilities(self):
        """Initialize server capabilities."""
        capabilities = [
            MCPCapability(
                name="tools",
                version="1.0.0",
                description="Dynamic tool registration and execution",
                metadata={
                    "supported_types": ["database", "api", "analysis", "document"],
                    "max_tools": 100
                }
            ),
            MCPCapability(
                name="resources",
                version="1.0.0", 
                description="Resource management and access control",
                metadata={
                    "supported_schemes": ["file", "http", "database"],
                    "caching": True
                }
            ),
            MCPCapability(
                name="prompts",
                version="1.0.0",
                description="Dynamic prompt templates and management",
                metadata={
                    "template_engine": "jinja2",
                    "versioning": True
                }
            ),
            MCPCapability(
                name="logging",
                version="1.0.0",
                description="Execution logging and monitoring",
                metadata={
                    "structured_logging": True,
                    "real_time": True
                }
            ),
            MCPCapability(
                name="sampling",
                version="1.0.0",
                description="Agent execution sampling and optimization",
                metadata={
                    "cost_optimization": True,
                    "performance_tracking": True
                }
            )
        ]
        
        with self._lock:
            self._capabilities = capabilities
    
    def _register_handlers(self):
        """Register MCP method handlers."""
        handlers = {
            # Core MCP methods
            "initialize": self._handle_initialize,
            "tools/list": self._handle_tools_list,
            "tools/call": self._handle_tools_call,
            "resources/list": self._handle_resources_list,
            "resources/read": self._handle_resources_read,
            "prompts/list": self._handle_prompts_list,
            "prompts/get": self._handle_prompts_get,
            
            # Extended methods
            "logging/stream": self._handle_logging_stream,
            "sampling/configure": self._handle_sampling_configure,
            "sampling/results": self._handle_sampling_results,
            
            # Admin methods
            "server/capabilities": self._handle_server_capabilities,
            "server/status": self._handle_server_status,
            "server/metrics": self._handle_server_metrics,
        }
        
        with self._lock:
            self._handlers = handlers
    
    async def handle_request(self, request_data: Dict[str, Any], client_id: str = None) -> MCPResponse:
        """Handle incoming MCP request."""
        try:
            request = MCPRequest(**request_data)
            
            # Log request
            self.logger.log_custom_event(
                "mcp_request",
                f"MCP request: {request.method}",
                {
                    "client_id": client_id,
                    "method": request.method,
                    "params": request.params
                }
            )
            
            # Find handler
            handler = self._handlers.get(request.method)
            if not handler:
                return MCPResponse(
                    error={
                        "code": -32601,
                        "message": f"Method not found: {request.method}"
                    },
                    id=request.id
                )
            
            # Execute handler
            result = await handler(request.params, client_id)
            
            # Record metrics
            self.metrics.record_metric(
                "mcp_server", "mcp_request", 1, "count",
                {"method": request.method, "success": "true"}
            )
            
            return MCPResponse(result=result, id=request.id)
            
        except Exception as e:
            self.logger.log_custom_event(
                "mcp_error",
                f"MCP request failed: {str(e)}",
                {
                    "client_id": client_id,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            
            # Record error metrics
            self.metrics.record_metric(
                "mcp_server", "mcp_request", 1, "count",
                {"method": request_data.get("method", "unknown"), "success": "false"}
            )
            
            return MCPResponse(
                error={
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                },
                id=request_data.get("id")
            )
    
    async def _handle_initialize(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle client initialization."""
        client_info = {
            "client_id": client_id or f"client_{int(datetime.now().timestamp())}",
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "protocol_version": params.get("protocolVersion", "2024-11-05"),
            "client_info": params.get("clientInfo", {}),
            "capabilities": params.get("capabilities", {})
        }
        
        with self._lock:
            self._clients[client_info["client_id"]] = client_info
        
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {"listChanged": True},
                "resources": {"subscribe": True, "listChanged": True},
                "prompts": {"listChanged": True},
                "logging": {"level": "info"},
                "sampling": {}
            },
            "serverInfo": {
                "name": self.name,
                "version": self.version,
                "description": "Supply Chain Agent Protocol MCP Server"
            }
        }
    
    async def _handle_tools_list(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle tools list request."""
        tools = self.tool_registry.list_tools()
        
        return {
            "tools": [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            param.name: {
                                "type": param.type_hint,
                                "description": param.description,
                                "required": param.required
                            }
                            for param in tool.get_parameters()
                        }
                    }
                }
                for tool in tools
            ]
        }
    
    async def _handle_tools_call(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle tool call request."""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if not tool_name:
            raise ValueError("Tool name is required")
        
        # Get tool from registry
        tool = self.tool_registry.get_tool(tool_name)
        if not tool:
            raise ValueError(f"Tool '{tool_name}' not found")
        
        # Execute tool
        result = tool.execute(arguments)
        
        # Log tool execution
        self.logger.log_tool_call(tool_name, arguments, result)
        
        return {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(result.to_dict() if hasattr(result, 'to_dict') else result)
                }
            ]
        }
    
    async def _handle_resources_list(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle resources list request."""
        resources = self.resource_manager.list_resources()
        
        return {
            "resources": [
                {
                    "uri": resource.uri,
                    "name": resource.name,
                    "description": resource.description,
                    "mimeType": resource.mime_type
                }
                for resource in resources
            ]
        }
    
    async def _handle_resources_read(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle resource read request."""
        uri = params.get("uri")
        if not uri:
            raise ValueError("Resource URI is required")
        
        content = await self.resource_manager.read_resource(uri)
        
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": content
                }
            ]
        }
    
    async def _handle_prompts_list(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle prompts list request."""
        prompts = self.prompt_repository.list_prompts()
        
        return {
            "prompts": [
                {
                    "name": prompt.name,
                    "description": prompt.description,
                    "arguments": [
                        {
                            "name": arg.name,
                            "description": arg.description,
                            "required": arg.required
                        }
                        for arg in prompt.arguments
                    ]
                }
                for prompt in prompts
            ]
        }
    
    async def _handle_prompts_get(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle prompt get request."""
        name = params.get("name")
        arguments = params.get("arguments", {})
        
        if not name:
            raise ValueError("Prompt name is required")
        
        rendered_prompt = self.prompt_repository.render_prompt(name, arguments)
        
        return {
            "description": f"Rendered prompt: {name}",
            "messages": [
                {
                    "role": "user",
                    "content": {
                        "type": "text",
                        "text": rendered_prompt
                    }
                }
            ]
        }
    
    async def _handle_logging_stream(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle logging stream request."""
        level = params.get("level", "info")
        count = params.get("count", 50)
        
        logs = self.logger.get_recent_logs(count)
        
        return {
            "logs": [
                {
                    "timestamp": log.timestamp,
                    "level": log.level,
                    "message": log.message,
                    "agent_id": log.agent_id,
                    "event_type": log.event_type
                }
                for log in logs
                if log.level.lower() in ["error", "warning", "info"] if level == "info" else log.level.lower() == level.lower()
            ]
        }
    
    async def _handle_sampling_configure(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle sampling configuration."""
        config = params.get("config", {})
        
        # Store sampling configuration
        sampling_config = {
            "enabled": config.get("enabled", True),
            "rate": config.get("rate", 0.1),
            "max_tokens": config.get("max_tokens", 1000),
            "optimization_target": config.get("optimization_target", "cost"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in resource manager
        await self.resource_manager.store_resource(
            "sampling://config",
            json.dumps(sampling_config),
            "application/json"
        )
        
        return {
            "config": sampling_config,
            "status": "configured"
        }
    
    async def _handle_sampling_results(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle sampling results request."""
        agent_id = params.get("agent_id")
        hours = params.get("hours", 24)
        
        # Get system metrics
        system_metrics = self.metrics.get_system_metrics()
        
        # Get agent-specific metrics if requested
        if agent_id:
            agent_metrics = self.metrics.get_agent_metrics(agent_id)
            results = {
                "agent_id": agent_id,
                "metrics": agent_metrics.to_dict() if agent_metrics else None
            }
        else:
            results = {
                "system_metrics": system_metrics,
                "agent_count": system_metrics.get("total_agents", 0)
            }
        
        return {
            "results": results,
            "time_range_hours": hours
        }
    
    async def _handle_server_capabilities(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle server capabilities request."""
        with self._lock:
            return {
                "capabilities": [cap.to_dict() for cap in self._capabilities]
            }
    
    async def _handle_server_status(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle server status request."""
        with self._lock:
            return {
                "name": self.name,
                "version": self.version,
                "running": self._running,
                "clients_connected": len(self._clients),
                "uptime": "active",
                "tools_registered": len(self.tool_registry.list_tools()),
                "resources_available": len(self.resource_manager.list_resources()),
                "prompts_available": len(self.prompt_repository.list_prompts())
            }
    
    async def _handle_server_metrics(self, params: Dict[str, Any], client_id: str) -> Dict[str, Any]:
        """Handle server metrics request."""
        return {
            "system_metrics": self.metrics.get_system_metrics(),
            "tool_usage": {
                "total_tools": len(self.tool_registry.list_tools()),
                "active_tools": len([t for t in self.tool_registry.list_tools() if t.is_enabled()])
            },
            "resource_usage": {
                "total_resources": len(self.resource_manager.list_resources()),
                "cache_hits": 0,  # Would be tracked in real implementation
                "cache_misses": 0
            }
        }
    
    def start(self, host: str = "localhost", port: int = 8765):
        """Start the MCP server."""
        with self._lock:
            if self._running:
                self.logger.log_custom_event(
                    "mcp_server_start_error",
                    "MCP Server is already running",
                    {"host": host, "port": port}
                )
                return
            
            self._running = True
        
        self.logger.log_custom_event(
            "mcp_server_start",
            f"MCP Server starting on {host}:{port}",
            {
                "host": host,
                "port": port,
                "capabilities": len(self._capabilities)
            }
        )
        
        # In a real implementation, this would start a WebSocket or HTTP server
        # For now, we'll just mark as running
        print(f"MCP Server '{self.name}' v{self.version} started on {host}:{port}")
        print(f"Capabilities: {[cap.name for cap in self._capabilities]}")
    
    def stop(self):
        """Stop the MCP server."""
        with self._lock:
            if not self._running:
                return
            
            self._running = False
            self._clients.clear()
        
        self.logger.log_custom_event(
            "mcp_server_stop",
            "MCP Server stopped",
            {"clients_disconnected": len(self._clients)}
        )
        
        print(f"MCP Server '{self.name}' stopped")
    
    def register_tool(self, tool):
        """Register a tool with the MCP server."""
        self.tool_registry.register_tool(tool)
        
        self.logger.log_custom_event(
            "mcp_tool_registered",
            f"Tool '{tool.name}' registered with MCP server",
            {"tool_name": tool.name, "tool_type": type(tool).__name__}
        )
    
    def register_resource(self, uri: str, content: str, mime_type: str = "application/json"):
        """Register a resource with the MCP server."""
        asyncio.create_task(
            self.resource_manager.store_resource(uri, content, mime_type)
        )
        
        self.logger.log_custom_event(
            "mcp_resource_registered",
            f"Resource registered: {uri}",
            {"uri": uri, "mime_type": mime_type}
        )
    
    def register_prompt(self, prompt):
        """Register a prompt template with the MCP server.""" 
        self.prompt_repository.register_prompt(prompt)
        
        self.logger.log_custom_event(
            "mcp_prompt_registered",
            f"Prompt '{prompt.name}' registered with MCP server",
            {"prompt_name": prompt.name}
        )
    
    def get_client_info(self, client_id: str) -> Optional[Dict[str, Any]]:
        """Get client information."""
        with self._lock:
            return self._clients.get(client_id)
    
    def list_clients(self) -> List[Dict[str, Any]]:
        """List all connected clients."""
        with self._lock:
            return list(self._clients.values())


# Global MCP server instance
_mcp_server = None

def get_mcp_server() -> MCPServer:
    """Get global MCP server instance."""
    global _mcp_server
    if _mcp_server is None:
        _mcp_server = MCPServer()
    return _mcp_server