"""Analysis tools for data processing and insights generation."""

from typing import Dict, Any, List, Optional, Union
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from decimal import Decimal
import json

from .base_tool import Tool, ToolParameter, ToolResult
from insights_engine import InsightsEngine, SupplyChainData


class DataAnalysisTool(Tool):
    """Tool for statistical and data analysis."""
    
    def __init__(self):
        super().__init__(
            name="data_analysis",
            description="Perform statistical analysis on supply chain data"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="analysis_type",
                type="string",
                description="Type of analysis to perform",
                enum=["descriptive", "trend", "correlation", "anomaly", "forecast"]
            ),
            ToolParameter(
                name="data",
                type="array",
                description="Data points to analyze"
            ),
            ToolParameter(
                name="options",
                type="object",
                description="Analysis options",
                required=False,
                default={}
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        analysis_type = parameters["analysis_type"]
        data = parameters["data"]
        options = parameters.get("options", {})
        
        try:
            if analysis_type == "descriptive":
                # Basic statistical analysis
                if not data:
                    return ToolResult(success=False, data=None, error="No data provided")
                
                values = [float(d) if isinstance(d, (int, float, str)) else d.get('value', 0) 
                         for d in data]
                
                result = {
                    "count": len(values),
                    "mean": np.mean(values),
                    "median": np.median(values),
                    "std": np.std(values),
                    "min": np.min(values),
                    "max": np.max(values),
                    "q1": np.percentile(values, 25),
                    "q3": np.percentile(values, 75),
                    "iqr": np.percentile(values, 75) - np.percentile(values, 25)
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"analysis_type": "descriptive", "data_points": len(values)}
                )
            
            elif analysis_type == "trend":
                # Trend analysis
                if len(data) < 3:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Trend analysis requires at least 3 data points"
                    )
                
                # Extract time series
                if isinstance(data[0], dict):
                    timestamps = [d.get('timestamp', i) for i, d in enumerate(data)]
                    values = [float(d.get('value', 0)) for d in data]
                else:
                    timestamps = list(range(len(data)))
                    values = [float(d) for d in data]
                
                # Calculate trend
                x = np.array(range(len(values)))
                y = np.array(values)
                
                # Linear regression
                slope, intercept = np.polyfit(x, y, 1)
                
                # Calculate R-squared
                y_pred = slope * x + intercept
                ss_res = np.sum((y - y_pred) ** 2)
                ss_tot = np.sum((y - np.mean(y)) ** 2)
                r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
                
                # Determine trend direction
                if slope > 0.01:
                    trend_direction = "increasing"
                elif slope < -0.01:
                    trend_direction = "decreasing"
                else:
                    trend_direction = "stable"
                
                result = {
                    "trend_direction": trend_direction,
                    "slope": float(slope),
                    "intercept": float(intercept),
                    "r_squared": float(r_squared),
                    "change_rate": float(slope / np.mean(y) * 100) if np.mean(y) != 0 else 0,
                    "projected_next": float(slope * len(values) + intercept)
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"analysis_type": "trend", "data_points": len(values)}
                )
            
            elif analysis_type == "correlation":
                # Correlation analysis between two series
                if not isinstance(data, dict) or 'series1' not in data or 'series2' not in data:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Correlation requires 'series1' and 'series2' in data"
                    )
                
                series1 = np.array([float(v) for v in data['series1']])
                series2 = np.array([float(v) for v in data['series2']])
                
                if len(series1) != len(series2):
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Series must have equal length"
                    )
                
                # Calculate correlations
                pearson_corr = np.corrcoef(series1, series2)[0, 1]
                
                # Determine correlation strength
                abs_corr = abs(pearson_corr)
                if abs_corr > 0.7:
                    strength = "strong"
                elif abs_corr > 0.4:
                    strength = "moderate"
                else:
                    strength = "weak"
                
                direction = "positive" if pearson_corr > 0 else "negative"
                
                result = {
                    "correlation": float(pearson_corr),
                    "strength": strength,
                    "direction": direction,
                    "r_squared": float(pearson_corr ** 2),
                    "interpretation": f"{strength} {direction} correlation"
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={"analysis_type": "correlation"}
                )
            
            elif analysis_type == "anomaly":
                # Anomaly detection using statistical methods
                values = [float(d) if isinstance(d, (int, float, str)) else d.get('value', 0) 
                         for d in data]
                
                if len(values) < 10:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Anomaly detection requires at least 10 data points"
                    )
                
                # Calculate statistics
                mean = np.mean(values)
                std = np.std(values)
                
                # Detect anomalies (values beyond 2 standard deviations)
                anomalies = []
                for i, value in enumerate(values):
                    z_score = (value - mean) / std if std > 0 else 0
                    if abs(z_score) > 2:
                        anomalies.append({
                            "index": i,
                            "value": value,
                            "z_score": float(z_score),
                            "deviation": float(value - mean),
                            "severity": "high" if abs(z_score) > 3 else "medium"
                        })
                
                result = {
                    "anomalies_found": len(anomalies),
                    "anomaly_rate": len(anomalies) / len(values),
                    "anomalies": anomalies,
                    "baseline_mean": float(mean),
                    "baseline_std": float(std),
                    "detection_method": "z-score",
                    "threshold": 2.0
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={
                        "analysis_type": "anomaly",
                        "anomalies_detected": len(anomalies) > 0
                    }
                )
            
            elif analysis_type == "forecast":
                # Simple forecasting using moving average and trend
                values = [float(d) if isinstance(d, (int, float, str)) else d.get('value', 0) 
                         for d in data]
                
                if len(values) < 5:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Forecasting requires at least 5 data points"
                    )
                
                # Calculate moving averages
                ma_3 = np.convolve(values, np.ones(3)/3, mode='valid')
                ma_7 = np.convolve(values, np.ones(min(7, len(values)))
                                  /min(7, len(values)), mode='valid')
                
                # Calculate trend
                x = np.array(range(len(values)))
                slope, intercept = np.polyfit(x, values, 1)
                
                # Forecast next values
                forecast_periods = options.get('periods', 3)
                forecasts = []
                
                for i in range(forecast_periods):
                    # Trend-based forecast
                    trend_forecast = slope * (len(values) + i) + intercept
                    
                    # Moving average based forecast
                    if len(ma_3) > 0:
                        ma_forecast = ma_3[-1]
                    else:
                        ma_forecast = values[-1]
                    
                    # Combined forecast (weighted average)
                    combined = 0.7 * trend_forecast + 0.3 * ma_forecast
                    
                    forecasts.append({
                        "period": i + 1,
                        "forecast": float(combined),
                        "trend_based": float(trend_forecast),
                        "ma_based": float(ma_forecast),
                        "confidence_interval": {
                            "lower": float(combined - 1.96 * np.std(values)),
                            "upper": float(combined + 1.96 * np.std(values))
                        }
                    })
                
                result = {
                    "forecasts": forecasts,
                    "method": "combined (trend + moving average)",
                    "historical_mean": float(np.mean(values)),
                    "historical_std": float(np.std(values)),
                    "trend_slope": float(slope)
                }
                
                return ToolResult(
                    success=True,
                    data=result,
                    metadata={
                        "analysis_type": "forecast",
                        "periods_forecasted": forecast_periods
                    }
                )
            
            else:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Unknown analysis type: {analysis_type}"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Analysis failed: {str(e)}"
            )


class MetricsCalculatorTool(Tool):
    """Tool for calculating supply chain KPIs and metrics."""
    
    def __init__(self):
        super().__init__(
            name="metrics_calculator",
            description="Calculate supply chain KPIs and performance metrics"
        )
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="metric_type",
                type="string",
                description="Type of metric to calculate",
                enum=[
                    "inventory_turnover", "stockout_rate", "fill_rate",
                    "order_cycle_time", "perfect_order_rate", "carrying_cost",
                    "dso", "dpo", "cash_conversion_cycle", "forecast_accuracy"
                ]
            ),
            ToolParameter(
                name="data",
                type="object",
                description="Data required for metric calculation"
            ),
            ToolParameter(
                name="period",
                type="string",
                description="Time period for calculation",
                required=False,
                default="monthly"
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        metric_type = parameters["metric_type"]
        data = parameters["data"]
        period = parameters.get("period", "monthly")
        
        try:
            if metric_type == "inventory_turnover":
                # Inventory Turnover = COGS / Average Inventory
                cogs = data.get("cost_of_goods_sold", 0)
                avg_inventory = data.get("average_inventory", 0)
                
                if avg_inventory == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Average inventory cannot be zero"
                    )
                
                turnover = cogs / avg_inventory
                days_inventory = 365 / turnover if turnover > 0 else float('inf')
                
                result = {
                    "inventory_turnover": round(turnover, 2),
                    "days_inventory_outstanding": round(days_inventory, 1),
                    "performance": "good" if turnover > 12 else "needs_improvement",
                    "benchmark": 12,  # Industry benchmark
                    "interpretation": f"Inventory turns {turnover:.1f} times per year"
                }
                
            elif metric_type == "stockout_rate":
                # Stockout Rate = Stockout Occurrences / Total Order Requests
                stockouts = data.get("stockout_occurrences", 0)
                total_orders = data.get("total_order_requests", 0)
                
                if total_orders == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Total orders cannot be zero"
                    )
                
                rate = (stockouts / total_orders) * 100
                
                result = {
                    "stockout_rate": round(rate, 2),
                    "stockout_occurrences": stockouts,
                    "total_orders": total_orders,
                    "performance": "excellent" if rate < 2 else "good" if rate < 5 else "poor",
                    "target": 2.0,
                    "cost_impact": round(stockouts * data.get("avg_order_value", 1000) * 0.1, 2)
                }
                
            elif metric_type == "fill_rate":
                # Fill Rate = Units Shipped / Units Ordered
                units_shipped = data.get("units_shipped", 0)
                units_ordered = data.get("units_ordered", 0)
                
                if units_ordered == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Units ordered cannot be zero"
                    )
                
                rate = (units_shipped / units_ordered) * 100
                
                result = {
                    "fill_rate": round(rate, 2),
                    "units_shipped": units_shipped,
                    "units_ordered": units_ordered,
                    "units_short": units_ordered - units_shipped,
                    "performance": "excellent" if rate > 98 else "good" if rate > 95 else "needs_improvement",
                    "target": 98.0
                }
                
            elif metric_type == "order_cycle_time":
                # Order Cycle Time = Average(Order Delivery Date - Order Date)
                cycle_times = data.get("cycle_times", [])
                
                if not cycle_times:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="No cycle time data provided"
                    )
                
                avg_cycle = np.mean(cycle_times)
                
                result = {
                    "average_cycle_time": round(avg_cycle, 1),
                    "min_cycle_time": round(min(cycle_times), 1),
                    "max_cycle_time": round(max(cycle_times), 1),
                    "std_deviation": round(np.std(cycle_times), 1),
                    "performance": "excellent" if avg_cycle < 2 else "good" if avg_cycle < 5 else "needs_improvement",
                    "unit": "days"
                }
                
            elif metric_type == "perfect_order_rate":
                # Perfect Order = On Time * In Full * Damage Free * Documentation Accurate
                on_time_rate = data.get("on_time_rate", 1.0)
                in_full_rate = data.get("in_full_rate", 1.0)
                damage_free_rate = data.get("damage_free_rate", 1.0)
                doc_accurate_rate = data.get("documentation_accurate_rate", 1.0)
                
                perfect_rate = on_time_rate * in_full_rate * damage_free_rate * doc_accurate_rate * 100
                
                result = {
                    "perfect_order_rate": round(perfect_rate, 2),
                    "components": {
                        "on_time": round(on_time_rate * 100, 2),
                        "in_full": round(in_full_rate * 100, 2),
                        "damage_free": round(damage_free_rate * 100, 2),
                        "documentation_accurate": round(doc_accurate_rate * 100, 2)
                    },
                    "performance": "excellent" if perfect_rate > 95 else "good" if perfect_rate > 90 else "needs_improvement",
                    "target": 95.0
                }
                
            elif metric_type == "carrying_cost":
                # Carrying Cost = (Storage + Capital + Service + Risk) / Inventory Value
                inventory_value = data.get("inventory_value", 0)
                storage_cost = data.get("storage_cost", 0)
                capital_cost = data.get("capital_cost", inventory_value * 0.1)  # 10% default
                service_cost = data.get("service_cost", 0)
                risk_cost = data.get("risk_cost", inventory_value * 0.02)  # 2% default
                
                if inventory_value == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Inventory value cannot be zero"
                    )
                
                total_carrying_cost = storage_cost + capital_cost + service_cost + risk_cost
                carrying_rate = (total_carrying_cost / inventory_value) * 100
                
                result = {
                    "carrying_cost_rate": round(carrying_rate, 2),
                    "total_carrying_cost": round(total_carrying_cost, 2),
                    "breakdown": {
                        "storage": round(storage_cost, 2),
                        "capital": round(capital_cost, 2),
                        "service": round(service_cost, 2),
                        "risk": round(risk_cost, 2)
                    },
                    "performance": "excellent" if carrying_rate < 15 else "good" if carrying_rate < 25 else "high",
                    "benchmark": 20.0
                }
                
            elif metric_type == "dso":
                # Days Sales Outstanding = (Accounts Receivable / Revenue) * Days
                accounts_receivable = data.get("accounts_receivable", 0)
                revenue = data.get("revenue", 0)
                days = data.get("days", 30)
                
                if revenue == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Revenue cannot be zero"
                    )
                
                dso = (accounts_receivable / revenue) * days
                
                result = {
                    "days_sales_outstanding": round(dso, 1),
                    "accounts_receivable": accounts_receivable,
                    "revenue": revenue,
                    "performance": "excellent" if dso < 30 else "good" if dso < 45 else "needs_improvement",
                    "target": 30
                }
                
            elif metric_type == "dpo":
                # Days Payable Outstanding = (Accounts Payable / COGS) * Days
                accounts_payable = data.get("accounts_payable", 0)
                cogs = data.get("cost_of_goods_sold", 0)
                days = data.get("days", 30)
                
                if cogs == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="COGS cannot be zero"
                    )
                
                dpo = (accounts_payable / cogs) * days
                
                result = {
                    "days_payable_outstanding": round(dpo, 1),
                    "accounts_payable": accounts_payable,
                    "cogs": cogs,
                    "performance": "optimal" if 45 <= dpo <= 60 else "good" if 30 <= dpo <= 75 else "review_needed",
                    "target_range": [45, 60]
                }
                
            elif metric_type == "cash_conversion_cycle":
                # CCC = DIO + DSO - DPO
                dio = data.get("days_inventory_outstanding", 0)
                dso = data.get("days_sales_outstanding", 0)
                dpo = data.get("days_payable_outstanding", 0)
                
                ccc = dio + dso - dpo
                
                result = {
                    "cash_conversion_cycle": round(ccc, 1),
                    "components": {
                        "days_inventory_outstanding": dio,
                        "days_sales_outstanding": dso,
                        "days_payable_outstanding": dpo
                    },
                    "performance": "excellent" if ccc < 30 else "good" if ccc < 60 else "needs_improvement",
                    "interpretation": f"Cash tied up for {ccc:.0f} days",
                    "improvement_potential": round(ccc * data.get("daily_revenue", 10000), 2)
                }
                
            elif metric_type == "forecast_accuracy":
                # MAPE = Mean Absolute Percentage Error
                actual = data.get("actual_values", [])
                forecast = data.get("forecast_values", [])
                
                if len(actual) != len(forecast) or len(actual) == 0:
                    return ToolResult(
                        success=False,
                        data=None,
                        error="Actual and forecast arrays must have same non-zero length"
                    )
                
                errors = []
                for a, f in zip(actual, forecast):
                    if a != 0:
                        error = abs((a - f) / a) * 100
                        errors.append(error)
                
                mape = np.mean(errors) if errors else 0
                accuracy = 100 - mape
                
                result = {
                    "forecast_accuracy": round(accuracy, 2),
                    "mape": round(mape, 2),
                    "mad": round(np.mean([abs(a - f) for a, f in zip(actual, forecast)]), 2),
                    "bias": round(np.mean([f - a for a, f in zip(actual, forecast)]), 2),
                    "performance": "excellent" if accuracy > 95 else "good" if accuracy > 85 else "needs_improvement",
                    "samples": len(actual)
                }
                
            else:
                return ToolResult(
                    success=False,
                    data=None,
                    error=f"Unknown metric type: {metric_type}"
                )
            
            return ToolResult(
                success=True,
                data=result,
                metadata={
                    "metric_type": metric_type,
                    "period": period,
                    "calculated_at": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Metric calculation failed: {str(e)}"
            )


class InsightGeneratorTool(Tool):
    """Tool for generating supply chain insights and recommendations."""
    
    def __init__(self):
        super().__init__(
            name="insight_generator",
            description="Generate actionable insights from supply chain data"
        )
        self.insights_engine = InsightsEngine()
    
    def get_parameters(self) -> List[ToolParameter]:
        return [
            ToolParameter(
                name="insight_type",
                type="string",
                description="Type of insight to generate",
                enum=["inventory", "supplier", "demand", "financial", "operational", "strategic"]
            ),
            ToolParameter(
                name="data",
                type="object",
                description="Supply chain data for analysis"
            ),
            ToolParameter(
                name="role",
                type="string",
                description="Target role for insights",
                required=False,
                enum=["executive", "operations", "finance", "procurement", "sales"]
            ),
            ToolParameter(
                name="focus_areas",
                type="array",
                description="Specific areas to focus on",
                required=False
            )
        ]
    
    def _execute_impl(self, parameters: Dict[str, Any], context: Any) -> ToolResult:
        insight_type = parameters["insight_type"]
        data = parameters["data"]
        role = parameters.get("role", "operations")
        focus_areas = parameters.get("focus_areas", [])
        
        try:
            # Convert data to SupplyChainData format if needed
            if not isinstance(data, SupplyChainData):
                sc_data = SupplyChainData(
                    fill_rate=data.get("fill_rate", 0.95),
                    stockout_rate=data.get("stockout_rate", 0.05),
                    inventory_turnover=data.get("inventory_turnover", 12),
                    gross_margin=data.get("gross_margin", 0.35),
                    operating_margin=data.get("operating_margin", 0.15),
                    cash_conversion_cycle=data.get("cash_conversion_cycle", 45),
                    perfect_order_rate=data.get("perfect_order_rate", 0.92),
                    forecast_accuracy=data.get("forecast_accuracy", 0.85),
                    supplier_defect_rate=data.get("supplier_defect_rate", 0.02),
                    on_time_delivery=data.get("on_time_delivery", 0.94)
                )
            else:
                sc_data = data
            
            # Generate role-specific insights
            insights = self.insights_engine.generate_role_specific_insights(sc_data, role)
            
            # Filter by insight type
            filtered_insights = []
            
            for insight in insights:
                # Check if insight matches requested type
                if insight_type == "inventory" and "inventory" in insight["title"].lower():
                    filtered_insights.append(insight)
                elif insight_type == "supplier" and "supplier" in insight["title"].lower():
                    filtered_insights.append(insight)
                elif insight_type == "demand" and ("demand" in insight["title"].lower() or 
                                                  "forecast" in insight["title"].lower()):
                    filtered_insights.append(insight)
                elif insight_type == "financial" and ("cost" in insight["title"].lower() or 
                                                     "margin" in insight["title"].lower() or
                                                     "cash" in insight["title"].lower()):
                    filtered_insights.append(insight)
                elif insight_type == "operational" and ("efficiency" in insight["category"] or
                                                       "operational" in insight["category"]):
                    filtered_insights.append(insight)
                elif insight_type == "strategic":
                    if insight["priority"] == "high" and insight["category"] == "strategic":
                        filtered_insights.append(insight)
            
            # If no filtered insights, provide general insights
            if not filtered_insights:
                filtered_insights = insights[:3]  # Top 3 insights
            
            # Add evidence and confidence
            for insight in filtered_insights:
                # Add evidence based on data
                evidence = []
                
                if "inventory" in insight["title"].lower():
                    evidence.append({
                        "metric": "inventory_turnover",
                        "value": sc_data.inventory_turnover,
                        "benchmark": 12,
                        "status": "good" if sc_data.inventory_turnover > 12 else "needs_improvement"
                    })
                
                if "supplier" in insight["title"].lower():
                    evidence.append({
                        "metric": "supplier_defect_rate",
                        "value": sc_data.supplier_defect_rate,
                        "benchmark": 0.02,
                        "status": "good" if sc_data.supplier_defect_rate < 0.02 else "needs_improvement"
                    })
                
                insight["evidence"] = evidence
                insight["confidence"] = 0.85 if len(evidence) > 0 else 0.7
            
            result = {
                "insights": filtered_insights,
                "summary": {
                    "total_insights": len(filtered_insights),
                    "high_priority": len([i for i in filtered_insights if i["priority"] == "high"]),
                    "categories": list(set(i["category"] for i in filtered_insights))
                },
                "recommendations": self._generate_recommendations(filtered_insights, sc_data)
            }
            
            return ToolResult(
                success=True,
                data=result,
                metadata={
                    "insight_type": insight_type,
                    "role": role,
                    "insights_generated": len(filtered_insights)
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                data=None,
                error=f"Insight generation failed: {str(e)}"
            )
    
    def _generate_recommendations(self, insights: List[Dict], data: SupplyChainData) -> List[Dict]:
        """Generate actionable recommendations based on insights."""
        recommendations = []
        
        for insight in insights:
            if insight["priority"] == "high":
                rec = {
                    "title": f"Action: {insight['title']}",
                    "description": insight["recommendation"],
                    "impact": insight.get("impact", "medium"),
                    "effort": "medium",  # Would need more analysis
                    "timeline": "30-60 days",
                    "roi_potential": self._estimate_roi(insight, data)
                }
                recommendations.append(rec)
        
        return recommendations[:5]  # Top 5 recommendations
    
    def _estimate_roi(self, insight: Dict, data: SupplyChainData) -> str:
        """Estimate ROI potential for a recommendation."""
        # Simplified ROI estimation
        if "inventory" in insight["title"].lower():
            return "15-25% reduction in carrying costs"
        elif "supplier" in insight["title"].lower():
            return "10-20% improvement in quality costs"
        elif "forecast" in insight["title"].lower():
            return "20-30% reduction in stockouts"
        else:
            return "10-15% operational improvement"