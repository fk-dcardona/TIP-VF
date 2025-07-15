"""
AI-Powered Insights and Recommendations Engine
Generates intelligent, contextual recommendations for supply chain optimization
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import json

class SupplyChainInsightsEngine:
    """
    Advanced AI engine that generates contextual insights and recommendations
    based on supply chain data patterns and business rules
    """
    
    def __init__(self):
        self.business_rules = self._load_business_rules()
        self.insight_templates = self._load_insight_templates()
        
    def _load_business_rules(self) -> Dict:
        """Load business rules for different scenarios"""
        return {
            'stockout_threshold': 7,  # days
            'overstock_threshold': 90,  # days
            'high_roi_threshold': 30,  # percentage
            'low_turnover_threshold': 2,  # times per year
            'critical_velocity_threshold': 0.1,  # units per day
            'optimal_turnover_range': (4, 12),  # times per year
            'cash_efficiency_threshold': 0.6,  # ratio
            'warehouse_capacity_threshold': 85,  # percentage
        }
    
    def _load_insight_templates(self) -> Dict:
        """Load templates for generating insights"""
        return {
            'stockout_risk': {
                'critical': "🚨 URGENT: {product_name} will be out of stock in {days} days. Order {suggested_qty} units immediately.",
                'high': "⚠️ HIGH PRIORITY: {product_name} has only {days} days of stock left. Plan reorder of {suggested_qty} units.",
                'medium': "📋 MEDIUM: {product_name} needs reordering in {days} days. Suggested quantity: {suggested_qty} units."
            },
            'overstock': {
                'high': "📈 OVERSTOCK: {product_name} has {days} days of stock. Consider reducing orders or promotional pricing.",
                'medium': "📊 SLOW MOVER: {product_name} is moving slowly. Monitor sales velocity and adjust procurement."
            },
            'roi_optimization': {
                'high': "💎 HIGH VALUE: {product_name} has {roi}% ROI. Prioritize sales and ensure adequate stock.",
                'low': "📉 LOW MARGIN: {product_name} has only {roi}% ROI. Review pricing or supplier costs."
            },
            'cash_flow': {
                'tied_up': "💰 CASH OPTIMIZATION: ${amount} is tied up in slow-moving inventory. Consider liquidation strategies.",
                'efficient': "✅ EFFICIENT: Working capital is being used effectively with {efficiency}% efficiency."
            },
            'supplier_performance': {
                'excellent': "🏆 EXCELLENT: Supplier {supplier} has {performance}% on-time delivery. Maintain relationship.",
                'poor': "⚠️ POOR: Supplier {supplier} has {performance}% on-time delivery. Consider alternatives."
            }
        }
    
    def generate_comprehensive_insights(self, analytics_data: Dict) -> Dict:
        """
        Generate comprehensive insights across all business functions
        """
        insights = {
            'executive_insights': self._generate_executive_insights(analytics_data),
            'sales_insights': self._generate_sales_insights(analytics_data),
            'procurement_insights': self._generate_procurement_insights(analytics_data),
            'finance_insights': self._generate_finance_insights(analytics_data),
            'logistics_insights': self._generate_logistics_insights(analytics_data),
            'cross_functional_insights': self._generate_cross_functional_insights(analytics_data),
            'predictive_insights': self._generate_predictive_insights(analytics_data),
            'action_items': self._generate_action_items(analytics_data)
        }
        
        return insights
    
    def _generate_executive_insights(self, data: Dict) -> List[Dict]:
        """Generate insights for executive decision making"""
        insights = []
        
        # Overall health assessment
        health_score = data.get('summary', {}).get('overall_health_score', 0)
        if health_score < 60:
            insights.append({
                'type': 'strategic_alert',
                'priority': 'high',
                'title': 'Supply Chain Health Needs Attention',
                'description': f'Overall health score is {health_score}/100. Focus on inventory optimization and supplier performance.',
                'impact': 'business_continuity',
                'recommended_action': 'Review top 3 critical issues and assign ownership for resolution'
            })
        
        # Cash flow optimization
        financial_insights = data.get('financial_insights', {})
        total_value = financial_insights.get('total_inventory_value', 0)
        efficiency = financial_insights.get('working_capital_efficiency', 0)
        
        if efficiency < self.business_rules['cash_efficiency_threshold']:
            insights.append({
                'type': 'financial_optimization',
                'priority': 'medium',
                'title': 'Working Capital Optimization Opportunity',
                'description': f'${total_value:,.0f} in inventory with {efficiency:.1%} efficiency. Potential for improvement.',
                'impact': 'cash_flow',
                'recommended_action': 'Focus on reducing slow-moving inventory and improving turnover rates'
            })
        
        # Strategic product insights
        product_performance = data.get('product_performance', [])
        if product_performance:
            top_performers = sorted(product_performance, key=lambda x: x.get('roi_percentage', 0), reverse=True)[:3]
            insights.append({
                'type': 'strategic_opportunity',
                'priority': 'medium',
                'title': 'Top Revenue Opportunities',
                'description': f'Top 3 products generate {sum(p.get("roi_percentage", 0) for p in top_performers)/3:.1f}% average ROI',
                'impact': 'revenue_growth',
                'recommended_action': 'Ensure adequate inventory and sales focus on high-ROI products',
                'details': [p.get('product_name', 'Unknown') for p in top_performers]
            })
        
        return insights
    
    def _generate_sales_insights(self, data: Dict) -> List[Dict]:
        """Generate insights for sales team optimization"""
        insights = []
        
        product_performance = data.get('product_performance', [])
        inventory_alerts = data.get('inventory_alerts', [])
        
        # High-margin products with good availability
        high_margin_available = [
            p for p in product_performance 
            if p.get('roi_percentage', 0) > self.business_rules['high_roi_threshold'] 
            and p.get('days_of_stock', 0) > 14
        ]
        
        if high_margin_available:
            insights.append({
                'type': 'sales_opportunity',
                'priority': 'high',
                'title': 'High-Margin Products Ready to Sell',
                'description': f'{len(high_margin_available)} high-margin products have good inventory levels',
                'impact': 'revenue_optimization',
                'recommended_action': 'Focus sales efforts on these products for maximum profitability',
                'products': [p.get('product_name', 'Unknown') for p in high_margin_available[:5]]
            })
        
        # Products with limited stock that need sales push
        limited_stock = [
            p for p in product_performance 
            if 7 < p.get('days_of_stock', 0) <= 21
        ]
        
        if limited_stock:
            insights.append({
                'type': 'urgency_alert',
                'priority': 'medium',
                'title': 'Limited Stock Items Need Sales Push',
                'description': f'{len(limited_stock)} products have 1-3 weeks of stock remaining',
                'impact': 'inventory_optimization',
                'recommended_action': 'Prioritize these products to avoid overstock situations',
                'products': [p.get('product_name', 'Unknown') for p in limited_stock[:5]]
            })
        
        # Products to avoid promising
        out_of_stock = [
            alert for alert in inventory_alerts 
            if alert.get('alert_type') == 'stockout'
        ]
        
        if out_of_stock:
            insights.append({
                'type': 'availability_alert',
                'priority': 'critical',
                'title': 'Products Unavailable for Sale',
                'description': f'{len(out_of_stock)} products are out of stock and cannot be promised',
                'impact': 'customer_satisfaction',
                'recommended_action': 'Update sales team and customers about availability',
                'products': [alert.get('product_name', 'Unknown') for alert in out_of_stock[:5]]
            })
        
        return insights
    
    def _generate_procurement_insights(self, data: Dict) -> List[Dict]:
        """Generate insights for procurement optimization"""
        insights = []
        
        product_performance = data.get('product_performance', [])
        
        # Urgent reorders needed
        urgent_reorders = [
            p for p in product_performance 
            if p.get('days_of_stock', 0) <= self.business_rules['stockout_threshold']
        ]
        
        if urgent_reorders:
            total_value = sum(p.get('sales_velocity', 0) * 30 * 10 for p in urgent_reorders)  # Estimated value
            insights.append({
                'type': 'urgent_procurement',
                'priority': 'critical',
                'title': 'Urgent Reorders Required',
                'description': f'{len(urgent_reorders)} products need immediate reordering (≤{self.business_rules["stockout_threshold"]} days stock)',
                'impact': 'stockout_prevention',
                'recommended_action': f'Process purchase orders immediately. Estimated value: ${total_value:,.0f}',
                'products': [p.get('product_name', 'Unknown') for p in urgent_reorders[:5]]
            })
        
        # Overstock situations
        overstock_items = [
            p for p in product_performance 
            if p.get('days_of_stock', 0) > self.business_rules['overstock_threshold']
        ]
        
        if overstock_items:
            insights.append({
                'type': 'overstock_alert',
                'priority': 'medium',
                'title': 'Overstock Items Detected',
                'description': f'{len(overstock_items)} products have >90 days of stock',
                'impact': 'cash_flow_optimization',
                'recommended_action': 'Reduce or pause orders for these items until stock normalizes',
                'products': [p.get('product_name', 'Unknown') for p in overstock_items[:5]]
            })
        
        # Bulk order opportunities
        medium_reorders = [
            p for p in product_performance 
            if 7 < p.get('days_of_stock', 0) <= 30
        ]
        
        if len(medium_reorders) >= 3:
            insights.append({
                'type': 'cost_optimization',
                'priority': 'medium',
                'title': 'Bulk Order Opportunity',
                'description': f'{len(medium_reorders)} products need reordering within 30 days',
                'impact': 'cost_savings',
                'recommended_action': 'Combine orders for better pricing and reduced shipping costs',
                'products': [p.get('product_name', 'Unknown') for p in medium_reorders[:5]]
            })
        
        return insights
    
    def _generate_finance_insights(self, data: Dict) -> List[Dict]:
        """Generate insights for financial optimization"""
        insights = []
        
        financial_insights = data.get('financial_insights', {})
        product_performance = data.get('product_performance', [])
        
        # Cash tied up in slow movers
        slow_movers = [
            p for p in product_performance 
            if p.get('inventory_turnover', 0) < self.business_rules['low_turnover_threshold']
        ]
        
        if slow_movers:
            tied_up_cash = sum(p.get('current_stock', 0) * 10 for p in slow_movers)  # Estimated
            insights.append({
                'type': 'cash_optimization',
                'priority': 'high',
                'title': 'Cash Tied Up in Slow-Moving Inventory',
                'description': f'${tied_up_cash:,.0f} estimated cash in {len(slow_movers)} slow-moving products',
                'impact': 'working_capital',
                'recommended_action': 'Consider liquidation, promotions, or supplier return agreements',
                'products': [p.get('product_name', 'Unknown') for p in slow_movers[:5]]
            })
        
        # Working capital efficiency
        efficiency = financial_insights.get('working_capital_efficiency', 0)
        if efficiency < 0.5:
            insights.append({
                'type': 'efficiency_alert',
                'priority': 'medium',
                'title': 'Working Capital Efficiency Below Target',
                'description': f'Current efficiency: {efficiency:.1%}. Target: >60%',
                'impact': 'financial_performance',
                'recommended_action': 'Focus on improving inventory turnover and reducing slow-moving stock'
            })
        
        # High-value inventory concentration
        high_value_products = sorted(product_performance, 
                                   key=lambda x: x.get('current_stock', 0) * 10, 
                                   reverse=True)[:5]
        
        if high_value_products:
            total_high_value = sum(p.get('current_stock', 0) * 10 for p in high_value_products)
            total_inventory = financial_insights.get('total_inventory_value', 1)
            concentration = total_high_value / total_inventory if total_inventory > 0 else 0
            
            if concentration > 0.5:
                insights.append({
                    'type': 'risk_assessment',
                    'priority': 'medium',
                    'title': 'High Inventory Concentration Risk',
                    'description': f'Top 5 products represent {concentration:.1%} of inventory value',
                    'impact': 'risk_management',
                    'recommended_action': 'Monitor these products closely and consider diversification',
                    'products': [p.get('product_name', 'Unknown') for p in high_value_products]
                })
        
        return insights
    
    def _generate_logistics_insights(self, data: Dict) -> List[Dict]:
        """Generate insights for logistics optimization"""
        insights = []
        
        product_performance = data.get('product_performance', [])
        
        # Fast-moving products for prime locations
        fast_movers = [
            p for p in product_performance 
            if p.get('sales_velocity', 0) > 2
        ]
        
        if fast_movers:
            insights.append({
                'type': 'warehouse_optimization',
                'priority': 'medium',
                'title': 'Optimize Warehouse Layout for Fast Movers',
                'description': f'{len(fast_movers)} products have high velocity (>2 units/day)',
                'impact': 'operational_efficiency',
                'recommended_action': 'Place these products in easily accessible locations (A-Zone)',
                'products': [p.get('product_name', 'Unknown') for p in fast_movers[:5]]
            })
        
        # Slow movers for back storage
        slow_movers = [
            p for p in product_performance 
            if p.get('sales_velocity', 0) < 0.5
        ]
        
        if slow_movers:
            insights.append({
                'type': 'storage_optimization',
                'priority': 'low',
                'title': 'Move Slow Movers to Back Storage',
                'description': f'{len(slow_movers)} products have low velocity (<0.5 units/day)',
                'impact': 'space_optimization',
                'recommended_action': 'Relocate to C-Zone to free up prime picking locations',
                'products': [p.get('product_name', 'Unknown') for p in slow_movers[:5]]
            })
        
        # Turnover efficiency
        low_turnover = [
            p for p in product_performance 
            if p.get('inventory_turnover', 0) < 2
        ]
        
        if low_turnover:
            insights.append({
                'type': 'efficiency_alert',
                'priority': 'medium',
                'title': 'Low Inventory Turnover Detected',
                'description': f'{len(low_turnover)} products have <2x annual turnover',
                'impact': 'storage_cost',
                'recommended_action': 'Review storage costs vs. sales performance for these items',
                'products': [p.get('product_name', 'Unknown') for p in low_turnover[:5]]
            })
        
        return insights
    
    def _generate_cross_functional_insights(self, data: Dict) -> List[Dict]:
        """Generate insights that require cross-functional collaboration"""
        insights = []
        
        product_performance = data.get('product_performance', [])
        
        # Products that need coordinated action
        coordinated_action_needed = [
            p for p in product_performance 
            if (p.get('days_of_stock', 0) <= 14 and 
                p.get('roi_percentage', 0) > 25 and 
                p.get('sales_velocity', 0) > 1)
        ]
        
        if coordinated_action_needed:
            insights.append({
                'type': 'cross_functional',
                'priority': 'high',
                'title': 'High-Value Products Need Coordinated Action',
                'description': f'{len(coordinated_action_needed)} profitable, fast-moving products are running low',
                'impact': 'revenue_protection',
                'recommended_action': 'Sales should push these products while Procurement expedites reorders',
                'stakeholders': ['Sales', 'Procurement', 'Finance'],
                'products': [p.get('product_name', 'Unknown') for p in coordinated_action_needed]
            })
        
        return insights
    
    def _generate_predictive_insights(self, data: Dict) -> List[Dict]:
        """Generate predictive insights based on trends"""
        insights = []
        
        product_performance = data.get('product_performance', [])
        
        # Predict stockouts in next 30 days
        future_stockouts = []
        for product in product_performance:
            days_of_stock = product.get('days_of_stock', 0)
            if 0 < days_of_stock <= 30:
                future_stockouts.append({
                    'product_name': product.get('product_name', 'Unknown'),
                    'days_until_stockout': days_of_stock,
                    'sales_velocity': product.get('sales_velocity', 0)
                })
        
        if future_stockouts:
            insights.append({
                'type': 'predictive_alert',
                'priority': 'medium',
                'title': '30-Day Stockout Forecast',
                'description': f'{len(future_stockouts)} products predicted to stock out within 30 days',
                'impact': 'proactive_planning',
                'recommended_action': 'Plan procurement and sales strategies accordingly',
                'forecast_data': future_stockouts[:5]
            })
        
        return insights
    
    def _generate_action_items(self, data: Dict) -> List[Dict]:
        """Generate specific, actionable items with priorities and deadlines"""
        action_items = []
        
        product_performance = data.get('product_performance', [])
        inventory_alerts = data.get('inventory_alerts', [])
        
        # Critical stockout prevention
        critical_alerts = [alert for alert in inventory_alerts if alert.get('alert_level') == 'critical']
        for alert in critical_alerts[:3]:  # Top 3 critical
            action_items.append({
                'id': f"critical_{alert.get('product_id', 'unknown')}",
                'title': f"Emergency reorder: {alert.get('product_name', 'Unknown')}",
                'description': f"Product will be out of stock in {alert.get('days_until_stockout', 0)} days",
                'priority': 'critical',
                'deadline': (datetime.now() + timedelta(days=1)).isoformat(),
                'assigned_to': 'Procurement',
                'estimated_effort': '2 hours',
                'impact': 'Prevent stockout and customer dissatisfaction'
            })
        
        # High-ROI product optimization
        high_roi_products = [p for p in product_performance if p.get('roi_percentage', 0) > 40]
        if high_roi_products:
            action_items.append({
                'id': 'optimize_high_roi',
                'title': f"Optimize inventory for {len(high_roi_products)} high-ROI products",
                'description': "Ensure adequate stock levels for most profitable products",
                'priority': 'high',
                'deadline': (datetime.now() + timedelta(days=7)).isoformat(),
                'assigned_to': 'Sales & Procurement',
                'estimated_effort': '4 hours',
                'impact': 'Maximize revenue from best-performing products'
            })
        
        # Cash flow optimization
        slow_movers = [p for p in product_performance if p.get('inventory_turnover', 0) < 1]
        if len(slow_movers) > 5:
            action_items.append({
                'id': 'cash_flow_optimization',
                'title': f"Address {len(slow_movers)} slow-moving products",
                'description': "Review pricing, promotions, or liquidation strategies",
                'priority': 'medium',
                'deadline': (datetime.now() + timedelta(days=14)).isoformat(),
                'assigned_to': 'Finance & Sales',
                'estimated_effort': '6 hours',
                'impact': 'Free up working capital and improve cash flow'
            })
        
        return action_items
    
    def generate_role_specific_recommendations(self, role: str, data: Dict) -> List[str]:
        """Generate specific recommendations for each business role"""
        
        recommendations = {
            'general_manager': self._get_executive_recommendations(data),
            'sales': self._get_sales_recommendations(data),
            'procurement': self._get_procurement_recommendations(data),
            'finance': self._get_finance_recommendations(data),
            'logistics': self._get_logistics_recommendations(data)
        }
        
        return recommendations.get(role, [])
    
    def _get_executive_recommendations(self, data: Dict) -> List[str]:
        """Executive-level strategic recommendations"""
        recommendations = []
        
        health_score = data.get('summary', {}).get('overall_health_score', 0)
        if health_score < 70:
            recommendations.append("Implement weekly supply chain review meetings to address health score below 70%")
        
        critical_alerts = len([alert for alert in data.get('inventory_alerts', []) if alert.get('alert_level') == 'critical'])
        if critical_alerts > 0:
            recommendations.append(f"Address {critical_alerts} critical inventory alerts to prevent business disruption")
        
        efficiency = data.get('financial_insights', {}).get('working_capital_efficiency', 0)
        if efficiency < 0.6:
            recommendations.append("Focus on working capital optimization - current efficiency below 60% target")
        
        return recommendations
    
    def _get_sales_recommendations(self, data: Dict) -> List[str]:
        """Sales-specific actionable recommendations"""
        recommendations = []
        
        product_performance = data.get('product_performance', [])
        
        # High-margin products
        high_margin = [p for p in product_performance if p.get('roi_percentage', 0) > 30]
        if high_margin:
            recommendations.append(f"Prioritize selling {len(high_margin)} high-margin products (>30% ROI) for maximum profitability")
        
        # Limited stock items
        limited_stock = [p for p in product_performance if 7 < p.get('days_of_stock', 0) <= 21]
        if limited_stock:
            recommendations.append(f"Push sales for {len(limited_stock)} products with 1-3 weeks stock to optimize inventory")
        
        # Out of stock warnings
        out_of_stock = [p for p in product_performance if p.get('days_of_stock', 0) <= 0]
        if out_of_stock:
            recommendations.append(f"Update customers about {len(out_of_stock)} out-of-stock products and suggest alternatives")
        
        return recommendations
    
    def _get_procurement_recommendations(self, data: Dict) -> List[str]:
        """Procurement-specific actionable recommendations"""
        recommendations = []
        
        product_performance = data.get('product_performance', [])
        
        # Urgent reorders
        urgent = [p for p in product_performance if p.get('days_of_stock', 0) <= 7]
        if urgent:
            recommendations.append(f"Process emergency purchase orders for {len(urgent)} products with ≤7 days stock")
        
        # Bulk order opportunities
        medium_reorders = [p for p in product_performance if 7 < p.get('days_of_stock', 0) <= 30]
        if len(medium_reorders) >= 3:
            recommendations.append(f"Combine {len(medium_reorders)} upcoming reorders for better pricing and shipping efficiency")
        
        # Overstock situations
        overstock = [p for p in product_performance if p.get('days_of_stock', 0) > 90]
        if overstock:
            recommendations.append(f"Pause or reduce orders for {len(overstock)} overstocked products (>90 days supply)")
        
        return recommendations
    
    def _get_finance_recommendations(self, data: Dict) -> List[str]:
        """Finance-specific actionable recommendations"""
        recommendations = []
        
        product_performance = data.get('product_performance', [])
        financial_insights = data.get('financial_insights', {})
        
        # Cash optimization
        slow_movers = [p for p in product_performance if p.get('inventory_turnover', 0) < 2]
        if slow_movers:
            tied_up_cash = len(slow_movers) * 2000  # Estimated
            recommendations.append(f"Consider liquidating {len(slow_movers)} slow-moving products to free up ~${tied_up_cash:,}")
        
        # Working capital efficiency
        efficiency = financial_insights.get('working_capital_efficiency', 0)
        if efficiency < 0.6:
            recommendations.append("Target 4x+ inventory turnover to improve working capital efficiency above 60%")
        
        # Payment optimization
        burn_rate = financial_insights.get('monthly_burn_rate', 0)
        if burn_rate > 0:
            recommendations.append(f"Monitor monthly burn rate of ${burn_rate:,.0f} and optimize payment timing")
        
        return recommendations
    
    def _get_logistics_recommendations(self, data: Dict) -> List[str]:
        """Logistics-specific actionable recommendations"""
        recommendations = []
        
        product_performance = data.get('product_performance', [])
        
        # Warehouse optimization
        fast_movers = [p for p in product_performance if p.get('sales_velocity', 0) > 2]
        if fast_movers:
            recommendations.append(f"Move {len(fast_movers)} fast-moving products to prime picking locations (A-Zone)")
        
        slow_movers = [p for p in product_performance if p.get('sales_velocity', 0) < 0.5]
        if slow_movers:
            recommendations.append(f"Relocate {len(slow_movers)} slow-moving products to back storage (C-Zone)")
        
        # Efficiency improvements
        low_turnover = [p for p in product_performance if p.get('inventory_turnover', 0) < 2]
        if low_turnover:
            recommendations.append(f"Review storage costs for {len(low_turnover)} low-turnover products")
        
        return recommendations

