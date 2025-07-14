"""Database tools for agent data access."""

from typing import Dict, Any, List, Optional
import json
from datetime import datetime, timedelta

from .base_tool import Tool, ToolParameter, ToolResult
from models import db, Document, SupplyChainTriangle, Agent as AgentModel


class DatabaseQueryTool(Tool):
    """Tool for querying database with SQL-like interface."""
    
    def __init__(self):
        super().__init__(
            name="database_query",
            description="Query the database for supply chain data"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="table",
                type="string",
                description="Table to query (documents, triangles, agents)",
                enum=["documents", "triangles", "agents"]
            ),
            ToolParameter(
                name="filters",
                type="object",
                description="Query filters as key-value pairs",
                required=False,
                default={}
            ),
            ToolParameter(
                name="org_id",
                type="string",
                description="Organization ID for data scoping",
                required=False
            ),
            ToolParameter(
                name="limit",
                type="number",
                description="Maximum number of results",
                required=False,
                default=100
            ),
            ToolParameter(
                name="order_by",
                type="string",
                description="Field to order by",
                required=False
            ),
            ToolParameter(
                name="order_desc",
                type="boolean",
                description="Order descending",
                required=False,
                default=True
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        try:
            table = parameters["table"]
            filters = parameters.get("filters", {})
            org_id = parameters.get("org_id")
            limit = parameters.get("limit", 100)
            order_by = parameters.get("order_by")
            order_desc = parameters.get("order_desc", True)
            
            # Build query based on table
            if table == "documents":
                query = db.session.query(Document)
                if org_id:
                    query = query.filter(Document.org_id == org_id)
                
                # Apply filters
                for field, value in filters.items():
                    if hasattr(Document, field):
                        query = query.filter(getattr(Document, field) == value)
                
                # Order and limit
                if order_by and hasattr(Document, order_by):
                    order_field = getattr(Document, order_by)
                    query = query.order_by(order_field.desc() if order_desc else order_field)
                else:
                    query = query.order_by(Document.created_at.desc())
                
                results = query.limit(limit).all()
                data = [doc.to_dict() for doc in results]
                
            elif table == "triangles":
                query = db.session.query(SupplyChainTriangle)
                if org_id:
                    query = query.filter(SupplyChainTriangle.org_id == org_id)
                
                # Apply filters
                for field, value in filters.items():
                    if hasattr(SupplyChainTriangle, field):
                        query = query.filter(getattr(SupplyChainTriangle, field) == value)
                
                # Order and limit
                if order_by and hasattr(SupplyChainTriangle, order_by):
                    order_field = getattr(SupplyChainTriangle, order_by)
                    query = query.order_by(order_field.desc() if order_desc else order_field)
                else:
                    query = query.order_by(SupplyChainTriangle.created_at.desc())
                
                results = query.limit(limit).all()
                data = [triangle.to_dict() for triangle in results]
                
            elif table == "agents":
                query = db.session.query(AgentModel)
                if org_id:
                    query = query.filter(AgentModel.org_id == org_id)
                
                # Apply filters
                for field, value in filters.items():
                    if hasattr(AgentModel, field):
                        query = query.filter(getattr(AgentModel, field) == value)
                
                # Order and limit
                if order_by and hasattr(AgentModel, order_by):
                    order_field = getattr(AgentModel, order_by)
                    query = query.order_by(order_field.desc() if order_desc else order_field)
                else:
                    query = query.order_by(AgentModel.created_at.desc())
                
                results = query.limit(limit).all()
                data = [agent.to_dict() for agent in results]
            
            else:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Unknown table: {table}"
                )
            
            return ToolResult(
                success=True,
                data=data,
                metadata={
                    "count": len(data),
                    "table": table,
                    "filters": filters
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Database query failed: {str(e)}"
            )


class TriangleAnalyticsTool(Tool):
    """Tool for analyzing supply chain triangle metrics."""
    
    def __init__(self):
        super().__init__(
            name="triangle_analytics",
            description="Analyze supply chain triangle metrics and trends"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="org_id",
                type="string",
                description="Organization ID"
            ),
            ToolParameter(
                name="analysis_type",
                type="string",
                description="Type of analysis to perform",
                enum=["current", "trend", "comparison", "anomaly"]
            ),
            ToolParameter(
                name="time_range",
                type="string",
                description="Time range for analysis",
                required=False,
                default="7d",
                enum=["1d", "7d", "30d", "90d", "1y"]
            ),
            ToolParameter(
                name="metrics",
                type="array",
                description="Specific metrics to analyze",
                required=False,
                default=["service_score", "cost_score", "capital_score", "overall_score"]
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        try:
            org_id = parameters["org_id"]
            analysis_type = parameters["analysis_type"]
            time_range = parameters.get("time_range", "7d")
            metrics = parameters.get("metrics", ["service_score", "cost_score", "capital_score", "overall_score"])
            
            # Parse time range
            time_map = {
                "1d": timedelta(days=1),
                "7d": timedelta(days=7),
                "30d": timedelta(days=30),
                "90d": timedelta(days=90),
                "1y": timedelta(days=365)
            }
            delta = time_map.get(time_range, timedelta(days=7))
            start_date = datetime.utcnow() - delta
            
            # Query triangles
            triangles = db.session.query(SupplyChainTriangle).filter(
                SupplyChainTriangle.org_id == org_id,
                SupplyChainTriangle.created_at >= start_date
            ).order_by(SupplyChainTriangle.created_at).all()
            
            if not triangles:
                return ToolResult(
                    success=True,
                    data={
                        "message": "No data found for the specified time range",
                        "analysis_type": analysis_type,
                        "time_range": time_range
                    }
                )
            
            # Perform analysis based on type
            if analysis_type == "current":
                # Get latest metrics
                latest = triangles[-1]
                data = {
                    "current_metrics": {
                        metric: getattr(latest, metric, None) for metric in metrics
                    },
                    "timestamp": latest.created_at.isoformat(),
                    "health_status": latest.health_status
                }
                
            elif analysis_type == "trend":
                # Calculate trends
                trends = {}
                for metric in metrics:
                    values = [getattr(t, metric, 0) for t in triangles]
                    if len(values) > 1:
                        trend = "improving" if values[-1] > values[0] else "declining"
                        change = ((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0
                    else:
                        trend = "stable"
                        change = 0
                    
                    trends[metric] = {
                        "trend": trend,
                        "change_percentage": round(change, 2),
                        "current": values[-1] if values else 0,
                        "previous": values[0] if values else 0
                    }
                
                data = {
                    "trends": trends,
                    "period": time_range,
                    "data_points": len(triangles)
                }
                
            elif analysis_type == "comparison":
                # Compare metrics
                comparisons = {}
                latest = triangles[-1]
                
                for metric in metrics:
                    value = getattr(latest, metric, 0)
                    if metric == "service_score":
                        benchmark = 0.8
                        status = "excellent" if value >= 0.9 else "good" if value >= 0.8 else "needs_improvement"
                    elif metric == "cost_score":
                        benchmark = 0.7
                        status = "excellent" if value >= 0.8 else "good" if value >= 0.7 else "needs_improvement"
                    elif metric == "capital_score":
                        benchmark = 0.75
                        status = "excellent" if value >= 0.85 else "good" if value >= 0.75 else "needs_improvement"
                    else:
                        benchmark = 0.75
                        status = "excellent" if value >= 0.85 else "good" if value >= 0.75 else "needs_improvement"
                    
                    comparisons[metric] = {
                        "value": value,
                        "benchmark": benchmark,
                        "status": status,
                        "gap": round(value - benchmark, 3)
                    }
                
                data = {"comparisons": comparisons}
                
            elif analysis_type == "anomaly":
                # Detect anomalies
                anomalies = []
                
                for metric in metrics:
                    values = [getattr(t, metric, 0) for t in triangles]
                    if len(values) > 3:
                        mean = sum(values) / len(values)
                        std = (sum((x - mean) ** 2 for x in values) / len(values)) ** 0.5
                        
                        # Check last value for anomaly (2 std devs)
                        if abs(values[-1] - mean) > 2 * std:
                            anomalies.append({
                                "metric": metric,
                                "value": values[-1],
                                "mean": round(mean, 3),
                                "std_dev": round(std, 3),
                                "deviation": round(abs(values[-1] - mean) / std, 2),
                                "severity": "high" if abs(values[-1] - mean) > 3 * std else "medium"
                            })
                
                data = {
                    "anomalies": anomalies,
                    "anomaly_count": len(anomalies),
                    "period": time_range
                }
            
            else:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Unknown analysis type: {analysis_type}"
                )
            
            return ToolResult(
                success=True,
                data=data,
                metadata={
                    "analysis_type": analysis_type,
                    "time_range": time_range,
                    "data_points": len(triangles)
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Triangle analytics failed: {str(e)}"
            )


class DocumentSearchTool(Tool):
    """Tool for searching and analyzing documents."""
    
    def __init__(self):
        super().__init__(
            name="document_search",
            description="Search and analyze supply chain documents"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="org_id",
                type="string",
                description="Organization ID"
            ),
            ToolParameter(
                name="search_query",
                type="string",
                description="Search query for documents",
                required=False
            ),
            ToolParameter(
                name="document_type",
                type="string",
                description="Type of document",
                required=False,
                enum=["purchase_order", "invoice", "shipping", "contract", "report"]
            ),
            ToolParameter(
                name="date_range",
                type="object",
                description="Date range filter",
                required=False,
                properties={
                    "start": ToolParameter("start", "string", "Start date (ISO format)"),
                    "end": ToolParameter("end", "string", "End date (ISO format)")
                }
            ),
            ToolParameter(
                name="status",
                type="string",
                description="Document status filter",
                required=False,
                enum=["pending", "processing", "completed", "failed"]
            ),
            ToolParameter(
                name="include_analytics",
                type="boolean",
                description="Include document analytics",
                required=False,
                default=False
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        try:
            org_id = parameters["org_id"]
            search_query = parameters.get("search_query")
            document_type = parameters.get("document_type")
            date_range = parameters.get("date_range")
            status = parameters.get("status")
            include_analytics = parameters.get("include_analytics", False)
            
            # Build query
            query = db.session.query(Document).filter(Document.org_id == org_id)
            
            # Apply filters
            if document_type:
                query = query.filter(Document.document_type == document_type)
            
            if status:
                query = query.filter(Document.status == status)
            
            if date_range:
                if "start" in date_range:
                    start_date = datetime.fromisoformat(date_range["start"].replace('Z', '+00:00'))
                    query = query.filter(Document.created_at >= start_date)
                if "end" in date_range:
                    end_date = datetime.fromisoformat(date_range["end"].replace('Z', '+00:00'))
                    query = query.filter(Document.created_at <= end_date)
            
            # Text search in filename and extracted data
            if search_query:
                search_pattern = f"%{search_query}%"
                query = query.filter(
                    db.or_(
                        Document.filename.ilike(search_pattern),
                        Document.extracted_data.cast(db.String).ilike(search_pattern)
                    )
                )
            
            # Execute query
            documents = query.order_by(Document.created_at.desc()).limit(50).all()
            
            # Prepare results
            results = []
            for doc in documents:
                doc_data = doc.to_dict()
                
                # Add analytics if requested
                if include_analytics and doc.analytics:
                    doc_data["analytics_summary"] = {
                        "risk_score": doc.analytics.get("risk_score", 0),
                        "confidence": doc.analytics.get("confidence_score", 0),
                        "anomalies": len(doc.analytics.get("anomalies", [])),
                        "key_insights": doc.analytics.get("insights", [])[:3]
                    }
                
                results.append(doc_data)
            
            # Generate summary
            summary = {
                "total_found": len(results),
                "by_type": {},
                "by_status": {}
            }
            
            for doc in results:
                doc_type = doc.get("document_type", "unknown")
                doc_status = doc.get("status", "unknown")
                
                summary["by_type"][doc_type] = summary["by_type"].get(doc_type, 0) + 1
                summary["by_status"][doc_status] = summary["by_status"].get(doc_status, 0) + 1
            
            return ToolResult(
                success=True,
                data={
                    "documents": results,
                    "summary": summary
                },
                metadata={
                    "search_query": search_query,
                    "filters_applied": {
                        "document_type": document_type,
                        "status": status,
                        "date_range": date_range
                    }
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Document search failed: {str(e)}"
            )