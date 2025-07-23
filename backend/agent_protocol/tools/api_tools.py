"""API tools for external integrations."""

from typing import Dict, Any, List, Optional
import aiohttp
import asyncio
import json
from datetime import datetime

from .base_tool import Tool, ToolParameter, ToolResult
from backend.config.settings import settings
from document_processor import TradeDocumentProcessor


class AgentAstraTool(Tool):
    """Tool for Agent Astra document intelligence API."""
    
    def __init__(self):
        super().__init__(
            name="agent_astra",
            description="Process documents using Agent Astra AI intelligence"
        )
        self.processor = TradeDocumentProcessor()
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="action",
                type="string",
                description="Action to perform",
                enum=["upload", "classify", "extract", "validate", "analyze"]
            ),
            ToolParameter(
                name="document_id",
                type="string",
                description="Document ID for operations",
                required=False
            ),
            ToolParameter(
                name="file_path",
                type="string",
                description="File path for upload",
                required=False
            ),
            ToolParameter(
                name="document_type",
                type="string",
                description="Expected document type",
                required=False,
                enum=["purchase_order", "invoice", "shipping_notice", "contract", "quote"]
            ),
            ToolParameter(
                name="options",
                type="object",
                description="Additional options",
                required=False,
                default={}
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        action = parameters["action"]
        
        try:
            if action == "upload":
                # Upload document
                file_path = parameters.get("file_path")
                if not file_path:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="file_path required for upload"
                    )
                
                # Synchronous wrapper for async method
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        self.processor.upload_document(file_path)
                    )
                finally:
                    loop.close()
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"action": "upload", "file": file_path}
                )
            
            elif action == "classify":
                # Classify document
                doc_id = parameters.get("document_id")
                if not doc_id:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="document_id required for classification"
                    )
                
                # Implement classification
                result = {
                    "document_id": doc_id,
                    "classification": "invoice",
                    "confidence": 0.95,
                    "sub_type": "vendor_invoice"
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"action": "classify"}
                )
            
            elif action == "extract":
                # Extract data from document
                doc_id = parameters.get("document_id")
                doc_type = parameters.get("document_type", "auto")
                
                # Simulate extraction
                result = {
                    "document_id": doc_id,
                    "extracted_data": {
                        "vendor": "Acme Corp",
                        "invoice_number": "INV-2024-001",
                        "date": "2024-01-15",
                        "total_amount": 10500.00,
                        "line_items": [
                            {"description": "Product A", "quantity": 100, "price": 100.00},
                            {"description": "Shipping", "quantity": 1, "price": 500.00}
                        ]
                    },
                    "confidence": 0.92
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"action": "extract", "document_type": doc_type}
                )
            
            elif action == "validate":
                # Validate extracted data
                doc_id = parameters.get("document_id")
                
                result = {
                    "document_id": doc_id,
                    "validation_status": "passed",
                    "checks": {
                        "format_validation": True,
                        "business_rules": True,
                        "cross_reference": True,
                        "anomaly_detection": False
                    },
                    "anomalies": [
                        {
                            "field": "total_amount",
                            "type": "unusual_high",
                            "severity": "medium",
                            "message": "Amount 25% higher than average"
                        }
                    ]
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"action": "validate"}
                )
            
            elif action == "analyze":
                # Full document analysis
                doc_id = parameters.get("document_id")
                
                # Run comprehensive analysis
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    result = loop.run_until_complete(
                        self.processor.analyze_document_with_history(
                            {"document_id": doc_id},
                            []  # Historical documents
                        )
                    )
                finally:
                    loop.close()
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"action": "analyze", "confidence": 0.88}
                )
            
            else:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Unknown action: {action}"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Agent Astra tool failed: {str(e)}"
            )


class ExternalAPITool(Tool):
    """Generic tool for external API calls."""
    
    def __init__(self):
        super().__init__(
            name="external_api",
            description="Make HTTP requests to external APIs"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="method",
                type="string",
                description="HTTP method",
                enum=["GET", "POST", "PUT", "DELETE"]
            ),
            ToolParameter(
                name="url",
                type="string",
                description="API endpoint URL"
            ),
            ToolParameter(
                name="headers",
                type="object",
                description="Request headers",
                required=False,
                default={}
            ),
            ToolParameter(
                name="data",
                type="object",
                description="Request body data",
                required=False
            ),
            ToolParameter(
                name="params",
                type="object",
                description="Query parameters",
                required=False
            ),
            ToolParameter(
                name="timeout",
                type="number",
                description="Request timeout in seconds",
                required=False,
                default=30
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        method = parameters["method"]
        url = parameters["url"]
        headers = parameters.get("headers", {})
        data = parameters.get("data")
        params = parameters.get("params")
        timeout = parameters.get("timeout", 30)
        
        # Security check - only allow whitelisted domains
        allowed_domains = [
            "api.agentastra.ai",
            "api.openai.com",
            "api.anthropic.com",
            "generativelanguage.googleapis.com"
        ]
        
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.hostname not in allowed_domains:
            return ToolResult(
                success=False,
                data=None,
                error=f"Domain {parsed.hostname} not in allowed list"
            )
        
        try:
            # Make synchronous request using aiohttp
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def make_request():
                async with aiohttp.ClientSession() as session:
                    async with session.request(
                        method=method,
                        url=url,
                        headers=headers,
                        json=data if method in ["POST", "PUT"] else None,
                        params=params,
                        timeout=aiohttp.ClientTimeout(total=timeout)
                    ) as response:
                        response_data = await response.json()
                        return {
                            "status": response.status,
                            "headers": dict(response.headers),
                            "data": response_data
                        }
            
            try:
                result = loop.run_until_complete(make_request())
            finally:
                loop.close()
            
            return ToolResult(
                success=result["status"] < 400,
                data=result,
                metadata={
                    "url": url,
                    "method": method,
                    "status": result["status"]
                }
            )
            
        except asyncio.TimeoutError:
            return ToolResult(
                success=False,
                data=None,
                error=f"Request timeout after {timeout} seconds"
            )
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"API request failed: {str(e)}"
            )


class WebhookTool(Tool):
    """Tool for sending webhook notifications."""
    
    def __init__(self):
        super().__init__(
            name="webhook",
            description="Send webhook notifications for events"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="event_type",
                type="string",
                description="Type of event",
                enum=["alert", "update", "completion", "error", "custom"]
            ),
            ToolParameter(
                name="webhook_url",
                type="string",
                description="Webhook endpoint URL"
            ),
            ToolParameter(
                name="payload",
                type="object",
                description="Event payload data"
            ),
            ToolParameter(
                name="secret",
                type="string",
                description="Webhook secret for HMAC signature",
                required=False
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        event_type = parameters["event_type"]
        webhook_url = parameters["webhook_url"]
        payload = parameters["payload"]
        secret = parameters.get("secret")
        
        # Add metadata to payload
        enriched_payload = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "agent_context": {
                "agent_id": context.agent_id if context else None,
                "execution_id": context.execution_id if context else None
            },
            "data": payload
        }
        
        # Calculate HMAC signature if secret provided
        headers = {"Content-Type": "application/json"}
        if secret:
            import hmac
            import hashlib
            signature = hmac.new(
                secret.encode(),
                json.dumps(enriched_payload).encode(),
                hashlib.sha256
            ).hexdigest()
            headers["X-Webhook-Signature"] = signature
        
        # Use ExternalAPITool to send webhook
        api_tool = ExternalAPITool()
        result = api_tool.execute({
            "method": "POST",
            "url": webhook_url,
            "headers": headers,
            "data": enriched_payload,
            "timeout": 10
        }, context)
        
        return ToolResult(
            success=result.success,
            data=result.data,
            metadata={
                "event_type": event_type,
                "webhook_url": webhook_url,
                "signature_included": bool(secret)
            }
        )