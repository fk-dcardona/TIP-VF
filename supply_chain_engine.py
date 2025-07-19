"""
Supply Chain Intelligence Engine
Core analytics engine for processing inventory vs sales data and generating immediate insights
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import json
from dataclasses import dataclass
from enum import Enum

class AlertLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ProductInsight:
    product_id: str
    product_name: str
    sales_velocity: float
    inventory_turnover: float
    days_of_stock: int
    roi_percentage: float
    alert_level: AlertLevel
    recommendations: List[str]

@dataclass
class InventoryAlert:
    product_id: str
    product_name: str
    current_stock: int
    alert_type: str  # 'stockout', 'low_stock', 'overstock'
    alert_level: AlertLevel
    days_until_stockout: Optional[int]
    recommended_action: str

@dataclass
class FinancialInsight:
    total_inventory_value: float
    cash_tied_in_inventory: float
    monthly_burn_rate: float
    inventory_to_sales_ratio: float
    working_capital_efficiency: float
    recommendations: List[str]

class SupplyChainAnalyticsEngine:
    """
    Core analytics engine that processes CSV data and generates immediate insights
    for the three critical questions: product performance, inventory intelligence, and financial visibility
    """
    
    def __init__(self):
        self.data = {}
        self.insights = {}
        
    def process_inventory_sales_csv(self, csv_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Process inventory vs sales CSV and generate immediate insights
        
        Expected CSV columns (flexible mapping):
        - Product ID/SKU
        - Product Name
        - Current Stock/Inventory
        - Sales (daily/weekly/monthly)
        - Cost per Unit
        - Selling Price
        - Date (optional)
        """
        
        # Normalize column names
        df = self._normalize_columns(csv_data)
        
        # Validate required data
        if not self._validate_data(df):
            raise ValueError("CSV data missing required columns")
        
        # Generate core insights
        product_insights = self._analyze_product_performance(df)
        inventory_alerts = self._generate_inventory_alerts(df)
        financial_insights = self._analyze_financial_metrics(df)
        
        # Create comprehensive insight report
        insights = {
            'summary': self._generate_executive_summary(df, product_insights, inventory_alerts, financial_insights),
            'product_performance': [insight.__dict__ for insight in product_insights],
            'inventory_alerts': [alert.__dict__ for alert in inventory_alerts],
            'financial_insights': financial_insights.__dict__,
            'key_metrics': self._calculate_key_metrics(df),
            'recommendations': self._generate_recommendations(product_insights, inventory_alerts, financial_insights),
            'processed_at': datetime.now().isoformat(),
            'data_quality_score': self._assess_data_quality(df)
        }
        
        return insights
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names to standard format"""
        column_mapping = {
            # Product identification
            'product_id': ['product_id', 'sku', 'item_id', 'product_code', 'id'],
            'product_name': ['product_name', 'name', 'item_name', 'description', 'product'],
            
            # Inventory data
            'current_stock': ['current_stock', 'inventory', 'stock', 'quantity', 'qty', 'on_hand'],
            'cost_per_unit': ['cost_per_unit', 'cost', 'unit_cost', 'cogs', 'purchase_price'],
            'selling_price': ['selling_price', 'price', 'unit_price', 'sale_price', 'retail_price'],
            
            # Sales data
            'sales_quantity': ['sales_quantity', 'sales', 'sold', 'units_sold', 'sales_units'],
            'sales_period': ['sales_period', 'period', 'timeframe', 'days', 'sales_days'],
            
            # Optional fields
            'supplier': ['supplier', 'vendor', 'supplier_name'],
            'category': ['category', 'product_category', 'type'],
            'date': ['date', 'timestamp', 'created_date', 'last_updated']
        }
        
        df_normalized = df.copy()
        
        for standard_name, possible_names in column_mapping.items():
            for col in df.columns:
                if col.lower().strip() in [name.lower() for name in possible_names]:
                    df_normalized = df_normalized.rename(columns={col: standard_name})
                    break
        
        return df_normalized
    
    def _validate_data(self, df: pd.DataFrame) -> bool:
        """Validate that required columns exist"""
        required_columns = ['product_id', 'current_stock']
        
        # Check for at least basic product identification and inventory
        has_product_id = any(col in df.columns for col in ['product_id', 'product_name'])
        has_inventory = 'current_stock' in df.columns
        
        return has_product_id and has_inventory
    
    def _analyze_product_performance(self, df: pd.DataFrame) -> List[ProductInsight]:
        """Analyze product performance and generate insights"""
        insights = []
        
        for _, row in df.iterrows():
            # Calculate metrics
            current_stock = row.get('current_stock', 0)
            sales_quantity = row.get('sales_quantity', 0)
            sales_period = row.get('sales_period', 30)  # Default to 30 days
            cost_per_unit = row.get('cost_per_unit', 0)
            selling_price = row.get('selling_price', 0)
            
            # Sales velocity (units per day)
            sales_velocity = sales_quantity / max(sales_period, 1)
            
            # Inventory turnover (how many times inventory is sold per period)
            inventory_turnover = sales_quantity / max(current_stock, 1) if current_stock > 0 else 0
            
            # Days of stock remaining
            days_of_stock = current_stock / max(sales_velocity, 0.1) if sales_velocity > 0 else 999
            
            # ROI calculation
            profit_per_unit = selling_price - cost_per_unit
            roi_percentage = (profit_per_unit / max(cost_per_unit, 1)) * 100 if cost_per_unit > 0 else 0
            
            # Determine alert level
            alert_level = self._determine_alert_level(days_of_stock, inventory_turnover, sales_velocity)
            
            # Generate recommendations
            recommendations = self._generate_product_recommendations(
                days_of_stock, inventory_turnover, roi_percentage, sales_velocity
            )
            
            insight = ProductInsight(
                product_id=str(row.get('product_id', 'Unknown')),
                product_name=str(row.get('product_name', 'Unknown Product')),
                sales_velocity=round(sales_velocity, 2),
                inventory_turnover=round(inventory_turnover, 2),
                days_of_stock=int(days_of_stock),
                roi_percentage=round(roi_percentage, 2),
                alert_level=alert_level,
                recommendations=recommendations
            )
            
            insights.append(insight)
        
        # Sort by priority (critical alerts first, then by ROI)
        insights.sort(key=lambda x: (x.alert_level.value == 'critical', -x.roi_percentage), reverse=True)
        
        return insights
    
    def _generate_inventory_alerts(self, df: pd.DataFrame) -> List[InventoryAlert]:
        """Generate inventory alerts for stockouts, low stock, and overstock"""
        alerts = []
        
        for _, row in df.iterrows():
            current_stock = row.get('current_stock', 0)
            sales_quantity = row.get('sales_quantity', 0)
            sales_period = row.get('sales_period', 30)
            
            sales_velocity = sales_quantity / max(sales_period, 1)
            days_until_stockout = current_stock / max(sales_velocity, 0.1) if sales_velocity > 0 else 999
            
            # Determine alert type and level
            if days_until_stockout <= 0:
                alert_type = 'stockout'
                alert_level = AlertLevel.CRITICAL
                recommended_action = 'URGENT: Reorder immediately or remove from sales channels'
            elif days_until_stockout <= 7:
                alert_type = 'low_stock'
                alert_level = AlertLevel.HIGH
                recommended_action = 'Reorder within 2-3 days to avoid stockout'
            elif days_until_stockout <= 14:
                alert_type = 'low_stock'
                alert_level = AlertLevel.MEDIUM
                recommended_action = 'Plan reorder within next week'
            elif days_until_stockout > 90 and current_stock > 0:
                alert_type = 'overstock'
                alert_level = AlertLevel.LOW
                recommended_action = 'Consider promotional pricing or reduced ordering'
            else:
                continue  # No alert needed
            
            alert = InventoryAlert(
                product_id=str(row.get('product_id', 'Unknown')),
                product_name=str(row.get('product_name', 'Unknown Product')),
                current_stock=int(current_stock),
                alert_type=alert_type,
                alert_level=alert_level,
                days_until_stockout=int(days_until_stockout) if days_until_stockout < 999 else None,
                recommended_action=recommended_action
            )
            
            alerts.append(alert)
        
        # Sort by alert level (critical first)
        alert_priority = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        alerts.sort(key=lambda x: alert_priority.get(x.alert_level.value, 4))
        
        return alerts
    
    def _analyze_financial_metrics(self, df: pd.DataFrame) -> FinancialInsight:
        """Analyze financial implications of inventory and sales"""
        
        # Calculate total inventory value
        df['inventory_value'] = df.get('current_stock', 0) * df.get('cost_per_unit', 0)
        total_inventory_value = df['inventory_value'].sum()
        
        # Calculate monthly sales value
        monthly_sales_value = 0
        for _, row in df.iterrows():
            sales_quantity = row.get('sales_quantity', 0)
            sales_period = row.get('sales_period', 30)
            selling_price = row.get('selling_price', 0)
            
            # Normalize to monthly sales
            monthly_sales = (sales_quantity / max(sales_period, 1)) * 30
            monthly_sales_value += monthly_sales * selling_price
        
        # Calculate burn rate (how much inventory value is consumed monthly)
        monthly_burn_rate = 0
        for _, row in df.iterrows():
            sales_quantity = row.get('sales_quantity', 0)
            sales_period = row.get('sales_period', 30)
            cost_per_unit = row.get('cost_per_unit', 0)
            
            monthly_sales = (sales_quantity / max(sales_period, 1)) * 30
            monthly_burn_rate += monthly_sales * cost_per_unit
        
        # Calculate ratios
        inventory_to_sales_ratio = total_inventory_value / max(monthly_sales_value, 1)
        working_capital_efficiency = monthly_sales_value / max(total_inventory_value, 1)
        
        # Generate recommendations
        recommendations = []
        if inventory_to_sales_ratio > 3:
            recommendations.append("High inventory-to-sales ratio suggests overstock. Consider reducing orders.")
        if working_capital_efficiency < 0.5:
            recommendations.append("Low working capital efficiency. Focus on faster-moving products.")
        if monthly_burn_rate > total_inventory_value:
            recommendations.append("Inventory burn rate exceeds stock value. Increase reorder frequency.")
        
        return FinancialInsight(
            total_inventory_value=round(total_inventory_value, 2),
            cash_tied_in_inventory=round(total_inventory_value, 2),
            monthly_burn_rate=round(monthly_burn_rate, 2),
            inventory_to_sales_ratio=round(inventory_to_sales_ratio, 2),
            working_capital_efficiency=round(working_capital_efficiency, 2),
            recommendations=recommendations
        )
    
    def _calculate_key_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate key performance metrics"""
        
        total_products = len(df)
        total_stock_units = df.get('current_stock', 0).sum()
        
        # Calculate average metrics
        avg_days_of_stock = 0
        avg_turnover = 0
        products_with_sales = 0
        
        for _, row in df.iterrows():
            sales_quantity = row.get('sales_quantity', 0)
            if sales_quantity > 0:
                products_with_sales += 1
                sales_period = row.get('sales_period', 30)
                current_stock = row.get('current_stock', 0)
                
                sales_velocity = sales_quantity / max(sales_period, 1)
                days_of_stock = current_stock / max(sales_velocity, 0.1)
                turnover = sales_quantity / max(current_stock, 1)
                
                avg_days_of_stock += days_of_stock
                avg_turnover += turnover
        
        if products_with_sales > 0:
            avg_days_of_stock /= products_with_sales
            avg_turnover /= products_with_sales
        
        # Count alerts
        stockout_count = len([1 for _, row in df.iterrows() 
                             if row.get('current_stock', 0) <= 0])
        
        low_stock_count = 0
        for _, row in df.iterrows():
            current_stock = row.get('current_stock', 0)
            sales_quantity = row.get('sales_quantity', 0)
            sales_period = row.get('sales_period', 30)
            
            if current_stock > 0 and sales_quantity > 0:
                sales_velocity = sales_quantity / max(sales_period, 1)
                days_until_stockout = current_stock / max(sales_velocity, 0.1)
                if days_until_stockout <= 14:
                    low_stock_count += 1
        
        return {
            'total_products': total_products,
            'total_stock_units': int(total_stock_units),
            'products_with_sales_data': products_with_sales,
            'average_days_of_stock': round(avg_days_of_stock, 1),
            'average_inventory_turnover': round(avg_turnover, 2),
            'stockout_alerts': stockout_count,
            'low_stock_alerts': low_stock_count,
            'data_completeness_percentage': round((products_with_sales / max(total_products, 1)) * 100, 1)
        }
    
    def _generate_executive_summary(self, df: pd.DataFrame, product_insights: List[ProductInsight], 
                                  inventory_alerts: List[InventoryAlert], financial_insights: FinancialInsight) -> Dict[str, Any]:
        """Generate executive summary with key insights"""
        
        # Top performing products
        top_performers = sorted(product_insights, key=lambda x: x.roi_percentage, reverse=True)[:3]
        
        # Critical issues
        critical_alerts = [alert for alert in inventory_alerts if alert.alert_level == AlertLevel.CRITICAL]
        
        # Financial summary
        total_value = financial_insights.total_inventory_value
        efficiency = financial_insights.working_capital_efficiency
        
        return {
            'total_inventory_value': total_value,
            'working_capital_efficiency': efficiency,
            'top_performing_products': [
                {'name': p.product_name, 'roi': p.roi_percentage} for p in top_performers
            ],
            'critical_alerts_count': len(critical_alerts),
            'immediate_actions_required': len([a for a in inventory_alerts if a.alert_level in [AlertLevel.CRITICAL, AlertLevel.HIGH]]),
            'overall_health_score': self._calculate_health_score(product_insights, inventory_alerts, financial_insights),
            'key_insight': self._generate_key_insight(product_insights, inventory_alerts, financial_insights)
        }
    
    def _determine_alert_level(self, days_of_stock: float, inventory_turnover: float, sales_velocity: float) -> AlertLevel:
        """Determine alert level based on multiple factors"""
        
        if days_of_stock <= 0 or (days_of_stock <= 3 and sales_velocity > 0):
            return AlertLevel.CRITICAL
        elif days_of_stock <= 7:
            return AlertLevel.HIGH
        elif days_of_stock <= 14 or inventory_turnover < 0.1:
            return AlertLevel.MEDIUM
        else:
            return AlertLevel.LOW
    
    def _generate_product_recommendations(self, days_of_stock: float, inventory_turnover: float, 
                                        roi_percentage: float, sales_velocity: float) -> List[str]:
        """Generate specific recommendations for each product"""
        recommendations = []
        
        if days_of_stock <= 7:
            recommendations.append("URGENT: Reorder immediately to avoid stockout")
        elif days_of_stock <= 14:
            recommendations.append("Plan reorder within next week")
        
        if inventory_turnover > 2:
            recommendations.append("High turnover product - consider increasing stock levels")
        elif inventory_turnover < 0.5:
            recommendations.append("Slow-moving inventory - consider promotional pricing")
        
        if roi_percentage > 50:
            recommendations.append("High-margin product - prioritize availability")
        elif roi_percentage < 10:
            recommendations.append("Low-margin product - review pricing or costs")
        
        if sales_velocity > 5:
            recommendations.append("Fast-moving product - ensure adequate safety stock")
        
        return recommendations
    
    def _generate_recommendations(self, product_insights: List[ProductInsight], 
                                inventory_alerts: List[InventoryAlert], 
                                financial_insights: FinancialInsight) -> List[str]:
        """Generate overall recommendations"""
        recommendations = []
        
        # Critical actions
        critical_alerts = [a for a in inventory_alerts if a.alert_level == AlertLevel.CRITICAL]
        if critical_alerts:
            recommendations.append(f"IMMEDIATE ACTION: {len(critical_alerts)} products are out of stock")
        
        # High-value opportunities
        high_roi_products = [p for p in product_insights if p.roi_percentage > 30]
        if high_roi_products:
            recommendations.append(f"Focus on {len(high_roi_products)} high-ROI products for growth")
        
        # Financial optimization
        if financial_insights.working_capital_efficiency < 0.5:
            recommendations.append("Improve working capital efficiency by focusing on faster-moving inventory")
        
        # Inventory optimization
        overstock_alerts = [a for a in inventory_alerts if a.alert_type == 'overstock']
        if overstock_alerts:
            recommendations.append(f"Consider promotional pricing for {len(overstock_alerts)} overstocked items")
        
        return recommendations
    
    def _calculate_health_score(self, product_insights: List[ProductInsight], 
                              inventory_alerts: List[InventoryAlert], 
                              financial_insights: FinancialInsight) -> int:
        """Calculate overall supply chain health score (0-100)"""
        
        score = 100
        
        # Deduct for critical issues
        critical_alerts = [a for a in inventory_alerts if a.alert_level == AlertLevel.CRITICAL]
        score -= len(critical_alerts) * 20
        
        # Deduct for high alerts
        high_alerts = [a for a in inventory_alerts if a.alert_level == AlertLevel.HIGH]
        score -= len(high_alerts) * 10
        
        # Deduct for poor financial efficiency
        if financial_insights.working_capital_efficiency < 0.3:
            score -= 15
        elif financial_insights.working_capital_efficiency < 0.5:
            score -= 10
        
        # Deduct for poor inventory turnover
        avg_turnover = sum(p.inventory_turnover for p in product_insights) / max(len(product_insights), 1)
        if avg_turnover < 0.5:
            score -= 15
        
        return max(0, min(100, score))
    
    def _generate_key_insight(self, product_insights: List[ProductInsight], 
                            inventory_alerts: List[InventoryAlert], 
                            financial_insights: FinancialInsight) -> str:
        """Generate the most important insight for immediate action"""
        
        critical_alerts = [a for a in inventory_alerts if a.alert_level == AlertLevel.CRITICAL]
        if critical_alerts:
            return f"CRITICAL: {len(critical_alerts)} products are out of stock and need immediate reordering"
        
        high_alerts = [a for a in inventory_alerts if a.alert_level == AlertLevel.HIGH]
        if high_alerts:
            return f"HIGH PRIORITY: {len(high_alerts)} products will stock out within 7 days"
        
        # Find highest ROI opportunity
        if product_insights:
            top_product = max(product_insights, key=lambda x: x.roi_percentage)
            if top_product.roi_percentage > 30:
                return f"OPPORTUNITY: {top_product.product_name} has {top_product.roi_percentage}% ROI - ensure adequate stock"
        
        if financial_insights.working_capital_efficiency < 0.5:
            return "Focus on faster-moving inventory to improve working capital efficiency"
        
        return "Inventory levels appear stable with no immediate actions required"
    
    def _assess_data_quality(self, df: pd.DataFrame) -> float:
        """Assess the quality of the uploaded data"""
        
        total_fields = len(df.columns) * len(df)
        missing_fields = df.isnull().sum().sum()
        
        # Check for key field completeness
        key_fields = ['product_id', 'current_stock', 'sales_quantity']
        key_completeness = 0
        
        for field in key_fields:
            if field in df.columns:
                key_completeness += (1 - df[field].isnull().sum() / len(df)) / len(key_fields)
        
        # Overall completeness
        overall_completeness = 1 - (missing_fields / total_fields)
        
        # Weighted score (key fields are more important)
        quality_score = (key_completeness * 0.7) + (overall_completeness * 0.3)
        
        return round(quality_score * 100, 1)

