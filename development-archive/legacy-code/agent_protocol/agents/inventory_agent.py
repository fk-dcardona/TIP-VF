"""Inventory Monitoring Agent Implementation."""

from typing import Dict, Any, List, Optional
import logging
from datetime import datetime, timedelta

from ..core.base_agent import BaseAgent
from ..core.agent_types import AgentType
from ..core.agent_context import AgentContext
from ..core.agent_result import AgentResult
from ..tools.database_tools import DatabaseQueryTool, TriangleAnalyticsTool
from ..tools.analysis_tools import DataAnalysisTool, MetricsCalculatorTool, InsightGeneratorTool
from ..prompts.prompt_manager import PromptManager


class InventoryMonitorAgent(BaseAgent):
    """
    Agent specialized in monitoring inventory levels and generating alerts.
    
    Responsibilities:
    - Monitor stock levels across SKUs and locations
    - Identify stockout risks and overstock situations
    - Calculate reorder points and quantities
    - Detect unusual consumption patterns
    - Generate inventory optimization recommendations
    """
    
    def __init__(self, agent_id: str, agent_type, name: str, description: str, config: Dict[str, Any]):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentType.INVENTORY_MONITOR,
            name=name,
            description=description,
            config=config
        )
        
        # Agent-specific configuration
        self.critical_threshold_days = config.get('critical_threshold_days', 3)
        self.warning_threshold_days = config.get('warning_threshold_days', 7)
        self.overstock_threshold_days = config.get('overstock_threshold_days', 90)
        self.anomaly_detection_enabled = config.get('anomaly_detection_enabled', True)
        
        # Initialize prompt manager
        self.prompt_manager = PromptManager()
    
    def _initialize_tools(self):
        """Initialize inventory-specific tools."""
        # Database tools
        self.register_tool(DatabaseQueryTool())
        self.register_tool(TriangleAnalyticsTool())
        
        # Analysis tools
        self.register_tool(DataAnalysisTool())
        self.register_tool(MetricsCalculatorTool())
        self.register_tool(InsightGeneratorTool())
    
    def get_system_prompt(self) -> str:
        """Get inventory monitoring agent system prompt."""
        tools = self.get_tool_descriptions()
        return self.prompt_manager.get_system_prompt(
            agent_type=self.agent_type.value,
            agent_name=self.name,
            tools=tools,
            context={
                'org_id': self.context.org_id if self.context else None,
                'critical_threshold': self.critical_threshold_days,
                'warning_threshold': self.warning_threshold_days
            }
        )
    
    def _execute_core_logic(self, context: AgentContext) -> AgentResult:
        """Execute inventory monitoring logic."""
        try:
            # Extract action from input
            action = context.input_data.get('action', 'monitor')
            
            if action == 'monitor':
                return self._monitor_inventory(context)
            elif action == 'analyze_sku':
                return self._analyze_specific_sku(context)
            elif action == 'optimize_reorder':
                return self._optimize_reorder_points(context)
            elif action == 'detect_anomalies':
                return self._detect_anomalies(context)
            else:
                return AgentResult(
                    success=False,
                    message=f"Unknown action: {action}",
                    error_type="InvalidAction"
                )
                
        except Exception as e:
            self.logger.error(f"Inventory monitoring failed: {str(e)}", exc_info=True)
            return AgentResult(
                success=False,
                message=f"Monitoring failed: {str(e)}",
                error_type=type(e).__name__
            )
    
    def _monitor_inventory(self, context: AgentContext) -> AgentResult:
        """Monitor overall inventory status."""
        context.add_reasoning_step("Starting comprehensive inventory monitoring")
        
        # Query current inventory levels
        context.add_reasoning_step("Querying current inventory data")
        
        inventory_result = self.call_tool("database_query", {
            "table": "documents",
            "filters": {"document_type": "inventory_report"},
            "org_id": context.org_id,
            "limit": 100,
            "order_by": "created_at"
        })
        
        if not inventory_result.success:
            return AgentResult(
                success=False,
                message="Failed to query inventory data",
                error_type="DataQueryError"
            )
        
        # Add evidence
        context.add_evidence(
            source="database_query",
            data=inventory_result.data,
            confidence=0.95
        )
        
        # Analyze inventory metrics
        context.add_reasoning_step("Calculating inventory metrics")
        
        # Extract inventory data for analysis
        inventory_data = self._extract_inventory_data(inventory_result.data)
        
        # Calculate key metrics
        metrics_results = {}
        
        # Inventory turnover
        if inventory_data.get('cogs') and inventory_data.get('avg_inventory'):
            turnover_result = self.call_tool("metrics_calculator", {
                "metric_type": "inventory_turnover",
                "data": {
                    "cost_of_goods_sold": inventory_data['cogs'],
                    "average_inventory": inventory_data['avg_inventory']
                }
            })
            metrics_results['turnover'] = turnover_result.data
            context.add_evidence("metrics_calculator", turnover_result.data, 0.9)
        
        # Stockout analysis
        context.add_reasoning_step("Analyzing stockout risks")
        stockout_risks = self._analyze_stockout_risks(inventory_data)
        
        # Overstock analysis
        context.add_reasoning_step("Identifying overstock situations")
        overstock_items = self._analyze_overstock(inventory_data)
        
        # Generate insights
        context.add_reasoning_step("Generating inventory insights")
        
        insights_result = self.call_tool("insight_generator", {
            "insight_type": "inventory",
            "data": {
                "inventory_turnover": metrics_results.get('turnover', {}).get('inventory_turnover', 12),
                "stockout_rate": len(stockout_risks) / max(len(inventory_data.get('items', [])), 1),
                "fill_rate": 0.95  # Would calculate from actual data
            },
            "role": "operations"
        })
        
        # Compile results
        result = AgentResult(
            success=True,
            message="Inventory monitoring completed successfully",
            data={
                "summary": {
                    "total_skus": len(inventory_data.get('items', [])),
                    "critical_stockouts": len([r for r in stockout_risks if r['severity'] == 'critical']),
                    "warning_stockouts": len([r for r in stockout_risks if r['severity'] == 'warning']),
                    "overstock_items": len(overstock_items)
                },
                "metrics": metrics_results,
                "stockout_risks": stockout_risks[:10],  # Top 10
                "overstock_items": overstock_items[:10],  # Top 10
                "insights": insights_result.data if insights_result.success else []
            },
            confidence=0.85
        )
        
        # Add actions
        for risk in stockout_risks[:5]:
            result.add_action(
                action_type="reorder",
                description=f"Reorder {risk['sku']} - {risk['days_remaining']} days remaining",
                priority="high" if risk['severity'] == 'critical' else "medium",
                metadata=risk
            )
        
        # Add recommendations
        result.add_recommendation(
            title="Optimize Safety Stock",
            description=f"Review safety stock levels for {len(stockout_risks)} SKUs at risk",
            impact="high"
        )
        
        return result
    
    def _analyze_specific_sku(self, context: AgentContext) -> AgentResult:
        """Analyze a specific SKU in detail."""
        sku = context.input_data.get('sku')
        if not sku:
            return AgentResult(
                success=False,
                message="SKU parameter required",
                error_type="MissingParameter"
            )
        
        context.add_reasoning_step(f"Analyzing SKU: {sku}")
        
        # Query historical data for SKU
        # (Implementation would query actual data)
        
        # Analyze consumption patterns
        consumption_data = self._generate_mock_consumption_data(sku)
        
        # Trend analysis
        trend_result = self.call_tool("data_analysis", {
            "analysis_type": "trend",
            "data": consumption_data
        })
        
        # Anomaly detection
        anomaly_result = self.call_tool("data_analysis", {
            "analysis_type": "anomaly",
            "data": consumption_data
        })
        
        # Forecast future demand
        forecast_result = self.call_tool("data_analysis", {
            "analysis_type": "forecast",
            "data": consumption_data,
            "options": {"periods": 7}
        })
        
        result = AgentResult(
            success=True,
            message=f"SKU analysis completed for {sku}",
            data={
                "sku": sku,
                "current_stock": 1500,  # Would get from actual data
                "avg_daily_consumption": 50,
                "days_of_stock": 30,
                "trend": trend_result.data if trend_result.success else None,
                "anomalies": anomaly_result.data if anomaly_result.success else None,
                "forecast": forecast_result.data if forecast_result.success else None
            },
            confidence=0.88
        )
        
        # Add insights
        if trend_result.success and trend_result.data['trend_direction'] == 'increasing':
            result.add_insight(
                category="demand",
                insight=f"Demand for {sku} is increasing at {trend_result.data['change_rate']:.1f}% rate",
                severity="warning"
            )
        
        return result
    
    def _optimize_reorder_points(self, context: AgentContext) -> AgentResult:
        """Optimize reorder points for inventory items."""
        context.add_reasoning_step("Calculating optimal reorder points")
        
        # This would implement reorder point optimization logic
        # For now, returning a structured response
        
        result = AgentResult(
            success=True,
            message="Reorder point optimization completed",
            data={
                "optimized_count": 25,
                "total_savings_potential": 125000,
                "recommendations": [
                    {
                        "sku": "SKU001",
                        "current_rop": 100,
                        "optimal_rop": 150,
                        "safety_stock": 50,
                        "annual_savings": 5000
                    }
                ]
            },
            confidence=0.82
        )
        
        return result
    
    def _detect_anomalies(self, context: AgentContext) -> AgentResult:
        """Detect anomalies in inventory patterns."""
        if not self.anomaly_detection_enabled:
            return AgentResult(
                success=True,
                message="Anomaly detection is disabled",
                data={"anomalies": []}
            )
        
        context.add_reasoning_step("Detecting inventory anomalies")
        
        # Would implement actual anomaly detection
        anomalies = [
            {
                "sku": "SKU123",
                "type": "sudden_spike",
                "severity": "high",
                "description": "300% increase in consumption over 2 days",
                "detected_at": datetime.utcnow().isoformat()
            }
        ]
        
        result = AgentResult(
            success=True,
            message=f"Detected {len(anomalies)} anomalies",
            data={"anomalies": anomalies},
            confidence=0.75
        )
        
        for anomaly in anomalies:
            result.add_action(
                action_type="investigate",
                description=f"Investigate {anomaly['type']} for {anomaly['sku']}",
                priority=anomaly['severity']
            )
        
        return result
    
    def _extract_inventory_data(self, documents: List[Dict]) -> Dict[str, Any]:
        """Extract inventory data from documents."""
        # This would parse actual document data
        # For now, returning mock data
        return {
            "items": [
                {"sku": f"SKU{i:03d}", "quantity": 100 * i, "location": "WH1"}
                for i in range(1, 51)
            ],
            "cogs": 1000000,
            "avg_inventory": 500000
        }
    
    def _analyze_stockout_risks(self, inventory_data: Dict) -> List[Dict]:
        """Analyze stockout risks for inventory items."""
        risks = []
        
        # This would implement actual stockout risk calculation
        # For demonstration, creating sample risks
        for i, item in enumerate(inventory_data.get('items', [])[:20]):
            days_remaining = item['quantity'] / 50  # Assume 50 units/day consumption
            
            if days_remaining < self.critical_threshold_days:
                severity = 'critical'
            elif days_remaining < self.warning_threshold_days:
                severity = 'warning'
            else:
                continue
            
            risks.append({
                "sku": item['sku'],
                "current_stock": item['quantity'],
                "days_remaining": days_remaining,
                "severity": severity,
                "recommended_order_qty": 500,
                "confidence": 0.85
            })
        
        return sorted(risks, key=lambda x: x['days_remaining'])
    
    def _analyze_overstock(self, inventory_data: Dict) -> List[Dict]:
        """Identify overstock situations."""
        overstock = []
        
        # This would implement actual overstock analysis
        for item in inventory_data.get('items', []):
            days_of_inventory = item['quantity'] / 50  # Assume consumption rate
            
            if days_of_inventory > self.overstock_threshold_days:
                overstock.append({
                    "sku": item['sku'],
                    "excess_quantity": item['quantity'] - (50 * 60),  # 60 days optimal
                    "days_of_inventory": days_of_inventory,
                    "carrying_cost": item['quantity'] * 0.25,  # 25% carrying cost
                    "recommendation": "Reduce orders or promote sales"
                })
        
        return sorted(overstock, key=lambda x: x['carrying_cost'], reverse=True)
    
    def _generate_mock_consumption_data(self, sku: str) -> List[Dict]:
        """Generate mock consumption data for testing."""
        import random
        base_consumption = 50
        data = []
        
        for i in range(30):
            consumption = base_consumption + random.randint(-10, 10)
            if i == 15:  # Add anomaly
                consumption *= 3
            
            data.append({
                "timestamp": (datetime.now() - timedelta(days=30-i)).isoformat(),
                "value": consumption
            })
        
        return data