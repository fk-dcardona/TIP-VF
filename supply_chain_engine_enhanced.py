"""
Enhanced Supply Chain Analytics Engine with Triangle Framework
Based on Finkargo Analytics MVP
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json

class SupplyChainAnalyticsEngine:
    """Enhanced analytics engine with Supply Chain Triangle framework"""
    
    def __init__(self):
        self.config = {
            'lead_time_days': 7,
            'safety_stock_days': 3,
            'holding_cost_rate': 0.25,  # 25% annual
            'stockout_cost_multiple': 3,  # 3x margin
            'target_service_level': 0.95,
            'industry_type': 'retail'  # retail, manufacturing, distribution
        }
        
        # Industry benchmarks for normalization
        self.industry_benchmarks = {
            'retail': {
                'inventory_turns': 8,
                'receivables_days': 30,
                'payables_days': 45,
                'cash_cycle_days': 15,
                'gross_margin': 0.35
            },
            'manufacturing': {
                'inventory_turns': 6,
                'receivables_days': 45,
                'payables_days': 60,
                'cash_cycle_days': 30,
                'gross_margin': 0.28
            },
            'distribution': {
                'inventory_turns': 12,
                'receivables_days': 25,
                'payables_days': 50,
                'cash_cycle_days': 5,
                'gross_margin': 0.20
            }
        }
    
    def calculate_triangle_scores(self, data: pd.DataFrame, financial_data: Dict) -> Dict:
        """Calculate the Supply Chain Triangle scores"""
        
        # Service Score Components
        service_metrics = self._calculate_service_metrics(data)
        service_score = self._normalize_service_score(service_metrics)
        
        # Cost Score Components
        cost_metrics = self._calculate_cost_metrics(data, financial_data)
        cost_score = self._normalize_cost_score(cost_metrics)
        
        # Capital Score Components
        capital_metrics = self._calculate_capital_metrics(data, financial_data)
        capital_score = self._normalize_capital_score(capital_metrics)
        
        # Overall Score (Harmonic Mean)
        overall_score = self._calculate_harmonic_mean([service_score, cost_score, capital_score])
        
        return {
            'service_score': round(service_score, 2),
            'cost_score': round(cost_score, 2),
            'capital_score': round(capital_score, 2),
            'overall_score': round(overall_score, 2),
            'metrics': {
                'service': service_metrics,
                'cost': cost_metrics,
                'capital': capital_metrics
            },
            'recommendations': self._generate_recommendations(
                service_score, cost_score, capital_score, service_metrics, cost_metrics, capital_metrics
            )
        }
    
    def _calculate_service_metrics(self, data: pd.DataFrame) -> Dict:
        """Calculate service-related metrics"""
        total_demand = data['sales_quantity'].sum() if 'sales_quantity' in data else 0
        fulfilled_demand = data[data['fulfilled'] == True]['sales_quantity'].sum() if 'fulfilled' in data else total_demand
        stockout_events = len(data[data['current_stock'] == 0]) if 'current_stock' in data else 0
        
        fill_rate = (fulfilled_demand / total_demand * 100) if total_demand > 0 else 0
        stockout_risk = (stockout_events / len(data) * 100) if len(data) > 0 else 0
        
        # Calculate on-time delivery (placeholder - needs supplier data)
        on_time_delivery = 95.0  # Default value
        
        # Customer satisfaction (composite score)
        customer_satisfaction = min(100, fill_rate * 0.6 + (100 - stockout_risk) * 0.4)
        
        return {
            'fill_rate': round(fill_rate, 2),
            'stockout_risk': round(stockout_risk, 2),
            'on_time_delivery': round(on_time_delivery, 2),
            'customer_satisfaction': round(customer_satisfaction, 2)
        }
    
    def _calculate_cost_metrics(self, data: pd.DataFrame, financial_data: Dict) -> Dict:
        """Calculate cost-related metrics"""
        if 'selling_price' in data.columns and 'unit_cost' in data.columns:
            data['margin'] = (data['selling_price'] - data['unit_cost']) / data['selling_price']
            gross_margin = data['margin'].mean() * 100 if len(data) > 0 else 0
        else:
            gross_margin = 30.0  # Default value
        
        # Calculate margin trend (simplified - in production would use historical data)
        margin_trend = self._calculate_margin_trend(data, financial_data)
        
        # Cost optimization potential
        cost_optimization_potential = self._calculate_cost_optimization_potential(data)
        
        # Price variance
        if 'unit_cost' in data.columns:
            price_variance = data['unit_cost'].std() / data['unit_cost'].mean() * 100 if data['unit_cost'].mean() > 0 else 0
        else:
            price_variance = 5.0
        
        return {
            'gross_margin': round(gross_margin, 2),
            'margin_trend': round(margin_trend, 2),
            'cost_optimization_potential': round(cost_optimization_potential, 2),
            'price_variance': round(price_variance, 2)
        }
    
    def _calculate_capital_metrics(self, data: pd.DataFrame, financial_data: Dict) -> Dict:
        """Calculate capital-related metrics"""
        # Inventory turnover
        if 'current_stock' in data.columns and 'sales_velocity' in data.columns:
            avg_inventory = data['current_stock'].mean()
            annual_sales = data['sales_velocity'].sum() * 365
            inventory_turnover = annual_sales / avg_inventory if avg_inventory > 0 else 0
        else:
            inventory_turnover = 6.0  # Default value
        
        # Working capital ratio
        working_capital_ratio = financial_data.get('working_capital_ratio', 1.5)
        
        # Cash conversion cycle
        dio = financial_data.get('days_inventory_outstanding', 60)
        dso = financial_data.get('days_sales_outstanding', 45)
        dpo = financial_data.get('days_payable_outstanding', 30)
        cash_conversion_cycle = dio + dso - dpo
        
        # Return on capital employed
        roce = financial_data.get('return_on_capital_employed', 15.0)
        
        return {
            'inventory_turnover': round(inventory_turnover, 2),
            'working_capital_ratio': round(working_capital_ratio, 2),
            'cash_conversion_cycle': round(cash_conversion_cycle, 0),
            'return_on_capital_employed': round(roce, 2)
        }
    
    def _normalize_service_score(self, metrics: Dict) -> float:
        """Normalize service metrics to 0-100 scale"""
        return min(100, max(0,
            metrics['fill_rate'] * 0.3 +
            (100 - metrics['stockout_risk']) * 0.3 +
            metrics['on_time_delivery'] * 0.2 +
            metrics['customer_satisfaction'] * 0.2
        ))
    
    def _normalize_cost_score(self, metrics: Dict) -> float:
        """Normalize cost metrics to 0-100 scale"""
        return min(100, max(0,
            min(metrics['gross_margin'] * 2, 100) * 0.4 +
            (50 + metrics['margin_trend'] * 10) * 0.2 +
            metrics['cost_optimization_potential'] * 0.2 +
            (100 - metrics['price_variance'] * 2) * 0.2
        ))
    
    def _normalize_capital_score(self, metrics: Dict) -> float:
        """Normalize capital metrics to 0-100 scale"""
        turnover_score = min(metrics['inventory_turnover'] * 10, 100)
        working_capital_score = min(metrics['working_capital_ratio'] * 50, 100)
        ccc_score = max(0, 100 - metrics['cash_conversion_cycle'])
        roce_score = min(metrics['return_on_capital_employed'] * 5, 100)
        
        return min(100, max(0,
            turnover_score * 0.3 +
            working_capital_score * 0.2 +
            ccc_score * 0.3 +
            roce_score * 0.2
        ))
    
    def _calculate_harmonic_mean(self, values: List[float]) -> float:
        """Calculate harmonic mean of values"""
        if not values or any(v == 0 for v in values):
            return 0
        return len(values) / sum(1/v for v in values)
    
    def _calculate_margin_trend(self, data: pd.DataFrame, financial_data: Dict) -> float:
        """Calculate margin trend (simplified)"""
        # In production, this would analyze historical margin data
        # For now, return a slight positive trend
        return 0.5
    
    def _calculate_cost_optimization_potential(self, data: pd.DataFrame) -> float:
        """Calculate potential for cost optimization"""
        potential_score = 0
        
        # Check for excess inventory
        if 'days_of_stock' in data.columns:
            excess_items = len(data[data['days_of_stock'] > 90])
            potential_score += (excess_items / len(data) * 30) if len(data) > 0 else 0
        
        # Check for slow-moving items
        if 'inventory_turnover' in data.columns:
            slow_movers = len(data[data['inventory_turnover'] < 4])
            potential_score += (slow_movers / len(data) * 30) if len(data) > 0 else 0
        
        # Check for price variance opportunities
        if 'unit_cost' in data.columns:
            high_cost_variance = len(data[data['unit_cost'] > data['unit_cost'].mean() * 1.2])
            potential_score += (high_cost_variance / len(data) * 40) if len(data) > 0 else 0
        
        return min(100, potential_score)
    
    def calculate_product_analytics(self, data: pd.DataFrame) -> pd.DataFrame:
        """Calculate all product-level analytics"""
        analytics = data.copy()
        
        # Ensure required columns exist
        if 'current_stock' not in analytics.columns:
            analytics['current_stock'] = 100  # Default stock level
        
        if 'unit_cost' not in analytics.columns:
            analytics['unit_cost'] = 10.0  # Default cost
        
        if 'selling_price' not in analytics.columns:
            analytics['selling_price'] = analytics['unit_cost'] * 1.3  # 30% markup
        
        # Sales velocity (units per day)
        if 'sales_quantity' in analytics.columns:
            analytics['sales_velocity'] = analytics['sales_quantity'] / 30  # Assume 30-day period
        else:
            analytics['sales_velocity'] = analytics['current_stock'] / 30  # Estimate from stock
        
        # Days of supply
        analytics['days_of_supply'] = np.where(
            analytics['sales_velocity'] > 0,
            analytics['current_stock'] / analytics['sales_velocity'],
            999
        ).astype(int)
        
        # Inventory turnover (annualized)
        analytics['inventory_turnover'] = np.where(
            analytics['current_stock'] > 0,
            (analytics['sales_velocity'] * 365) / analytics['current_stock'],
            0
        )
        
        # Financial metrics
        analytics['gross_margin'] = (analytics['selling_price'] - analytics['unit_cost']) / analytics['selling_price']
        analytics['roi_percentage'] = ((analytics['selling_price'] - analytics['unit_cost']) / analytics['unit_cost'] * 100)
        
        # Stock status
        analytics['stock_status'] = analytics.apply(self._categorize_stock_status, axis=1)
        
        # Reorder point
        analytics['reorder_point'] = analytics['sales_velocity'] * (self.config['lead_time_days'] + self.config['safety_stock_days'])
        
        # Lead time (default if not provided)
        if 'lead_time_days' not in analytics.columns:
            analytics['lead_time_days'] = self.config['lead_time_days']
        
        # Safety stock days
        if 'safety_stock_days' not in analytics.columns:
            analytics['safety_stock_days'] = self.config['safety_stock_days']
        
        return analytics
    
    def _categorize_stock_status(self, row):
        """Categorize stock status based on days of supply"""
        if row['current_stock'] == 0:
            return 'stockout'
        elif row['days_of_supply'] <= 7:
            return 'low_stock'
        elif row['days_of_supply'] > 90:
            return 'excess'
        else:
            return 'healthy'
    
    def generate_alerts(self, analytics: pd.DataFrame, alert_rules: List[Dict]) -> List[Dict]:
        """Generate alerts based on analytics and rules"""
        alerts = []
        
        for _, product in analytics.iterrows():
            # Stock level alerts
            if product['stock_status'] == 'stockout':
                alerts.append({
                    'type': 'stockout',
                    'severity': 'critical',
                    'sku': product.get('sku', product.get('product_id', 'Unknown')),
                    'message': f"Product {product.get('sku', product.get('product_id', 'Unknown'))} is out of stock",
                    'metric_value': 0,
                    'action_required': 'Immediate reorder required'
                })
            elif product['stock_status'] == 'low_stock':
                alerts.append({
                    'type': 'low_stock',
                    'severity': 'high',
                    'sku': product.get('sku', product.get('product_id', 'Unknown')),
                    'message': f"Product {product.get('sku', product.get('product_id', 'Unknown'))} has only {product['days_of_supply']:.0f} days of supply",
                    'metric_value': product['days_of_supply'],
                    'action_required': 'Reorder recommended'
                })
            elif product['stock_status'] == 'excess':
                alerts.append({
                    'type': 'excess_stock',
                    'severity': 'medium',
                    'sku': product.get('sku', product.get('product_id', 'Unknown')),
                    'message': f"Product {product.get('sku', product.get('product_id', 'Unknown'))} has {product['days_of_supply']:.0f} days of supply (excess)",
                    'metric_value': product['days_of_supply'],
                    'action_required': 'Consider promotion or reduce future orders'
                })
            
            # Financial alerts
            if 'roi_percentage' in product and product['roi_percentage'] < 10:
                alerts.append({
                    'type': 'low_margin',
                    'severity': 'medium',
                    'sku': product.get('sku', product.get('product_id', 'Unknown')),
                    'message': f"Product {product.get('sku', product.get('product_id', 'Unknown'))} has low ROI of {product['roi_percentage']:.1f}%",
                    'metric_value': product['roi_percentage'],
                    'action_required': 'Review pricing strategy'
                })
            
            # Turnover alerts
            if product['inventory_turnover'] < 4:
                alerts.append({
                    'type': 'slow_moving',
                    'severity': 'low',
                    'sku': product.get('sku', product.get('product_id', 'Unknown')),
                    'message': f"Product {product.get('sku', product.get('product_id', 'Unknown'))} has low turnover of {product['inventory_turnover']:.1f}x",
                    'metric_value': product['inventory_turnover'],
                    'action_required': 'Consider discontinuation or promotion'
                })
        
        return alerts
    
    def _generate_recommendations(self, service_score: float, cost_score: float, capital_score: float,
                                 service_metrics: Dict, cost_metrics: Dict, capital_metrics: Dict) -> List[str]:
        """Generate actionable recommendations based on scores"""
        recommendations = []
        
        # Find the weakest dimension
        scores = {'service': service_score, 'cost': cost_score, 'capital': capital_score}
        weakest = min(scores, key=scores.get)
        
        # General recommendation
        if scores[weakest] < 60:
            recommendations.append(f"Focus on improving {weakest.upper()} dimension (currently {scores[weakest]})")
        
        # Service recommendations
        if service_score < 70:
            if service_metrics['fill_rate'] < 90:
                recommendations.append("Increase safety stock for high-demand items to improve fill rate")
            if service_metrics['stockout_risk'] > 10:
                recommendations.append("Implement better demand forecasting to reduce stockout risk")
        
        # Cost recommendations
        if cost_score < 70:
            if cost_metrics['gross_margin'] < 25:
                recommendations.append("Review pricing strategy or negotiate better supplier terms")
            if cost_metrics['cost_optimization_potential'] > 30:
                recommendations.append("Reduce excess inventory and discontinue slow-moving items")
        
        # Capital recommendations
        if capital_score < 70:
            if capital_metrics['inventory_turnover'] < 6:
                recommendations.append("Improve inventory turnover through better demand planning")
            if capital_metrics['cash_conversion_cycle'] > 45:
                recommendations.append("Negotiate better payment terms or reduce inventory levels")
        
        # Balance recommendation
        if abs(service_score - cost_score) > 20 or abs(service_score - capital_score) > 20 or abs(cost_score - capital_score) > 20:
            recommendations.append("Work on balancing all three dimensions for optimal performance")
        
        return recommendations[:5]  # Return top 5 recommendations
    
    def calculate_supplier_performance(self, supplier_data: pd.DataFrame) -> pd.DataFrame:
        """Calculate supplier performance metrics"""
        performance = supplier_data.copy()
        
        # Calculate delivery score (0-100)
        if 'on_time_deliveries' in performance.columns and 'total_deliveries' in performance.columns:
            performance['delivery_score'] = (performance['on_time_deliveries'] / performance['total_deliveries'] * 100)
        else:
            performance['delivery_score'] = 95.0  # Default
        
        # Calculate quality score (0-100)
        if 'defect_rate' in performance.columns:
            performance['quality_score'] = (1 - performance['defect_rate']) * 100
        else:
            performance['quality_score'] = 98.0  # Default
        
        # Calculate cost score (0-100)
        if 'price_variance' in performance.columns:
            performance['cost_score'] = np.maximum(0, 100 - (performance['price_variance'] * 10))
        else:
            performance['cost_score'] = 90.0  # Default
        
        # Calculate responsiveness score (0-100)
        if 'average_response_hours' in performance.columns:
            performance['responsiveness_score'] = np.maximum(0, 100 - (performance['average_response_hours'] / 24 * 10))
        else:
            performance['responsiveness_score'] = 85.0  # Default
        
        # Overall score (weighted average)
        performance['overall_score'] = (
            performance['delivery_score'] * 0.35 +
            performance['quality_score'] * 0.30 +
            performance['cost_score'] * 0.20 +
            performance['responsiveness_score'] * 0.15
        )
        
        return performance
    
    def predict_demand(self, historical_data: pd.DataFrame, periods: int = 30) -> pd.DataFrame:
        """Simple demand forecasting"""
        # Group by SKU and calculate moving averages
        forecast = []
        
        for sku in historical_data['sku'].unique():
            sku_data = historical_data[historical_data['sku'] == sku].sort_values('date')
            
            # Simple moving average
            if len(sku_data) >= 7:
                recent_demand = sku_data['sales_quantity'].tail(7).mean()
            else:
                recent_demand = sku_data['sales_quantity'].mean()
            
            # Add seasonality factor (simplified)
            seasonality_factor = 1.0  # In production, calculate from historical patterns
            
            forecast.append({
                'sku': sku,
                'predicted_daily_demand': recent_demand * seasonality_factor,
                'confidence_interval_lower': recent_demand * 0.8,
                'confidence_interval_upper': recent_demand * 1.2,
                'periods': periods
            })
        
        return pd.DataFrame(forecast)
    
    def optimize_reorder_points(self, analytics: pd.DataFrame, service_level: float = 0.95) -> pd.DataFrame:
        """Optimize reorder points based on service level targets"""
        optimized = analytics.copy()
        
        # Calculate safety stock based on demand variability
        if 'demand_std' in optimized.columns:
            # z-score for service level (95% = 1.65)
            z_score = 1.65 if service_level == 0.95 else 2.33  # 99% service level
            optimized['safety_stock'] = z_score * optimized['demand_std'] * np.sqrt(optimized['lead_time_days'])
        else:
            # Simple safety stock calculation
            optimized['safety_stock'] = optimized['sales_velocity'] * self.config['safety_stock_days']
        
        # Optimized reorder point
        optimized['optimal_reorder_point'] = (
            optimized['sales_velocity'] * optimized['lead_time_days'] + 
            optimized['safety_stock']
        )
        
        # Economic order quantity (EOQ) - simplified
        if 'ordering_cost' in optimized.columns and 'holding_cost_rate' in optimized.columns:
            optimized['eoq'] = np.sqrt(
                (2 * optimized['sales_velocity'] * 365 * optimized['ordering_cost']) /
                (optimized['unit_cost'] * optimized['holding_cost_rate'])
            )
        else:
            # Simple EOQ based on defaults
            optimized['eoq'] = np.sqrt(
                (2 * optimized['sales_velocity'] * 365 * 50) /  # $50 ordering cost
                (optimized['unit_cost'] * self.config['holding_cost_rate'])
            )
        
        return optimized