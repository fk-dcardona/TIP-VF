"""
Unified Supply Chain Engine - Multi-Source Intelligence Processing
Processes unified transaction data and generates cross-referenced insights
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict
import hashlib
from models import db
from supply_chain_engine import SupplyChainAnalyticsEngine, AlertLevel

class UnifiedSupplyChainEngine(SupplyChainAnalyticsEngine):
    """Enhanced engine that processes unified transaction data with cross-referencing"""
    
    def __init__(self):
        super().__init__()
        self.supplier_benchmarks = {}
        self.market_intelligence = defaultdict(dict)
        
    def process_unified_transactions(self, df: pd.DataFrame, org_id: str) -> Dict[str, Any]:
        """Process unified transaction data and generate comprehensive intelligence"""
        
        # Separate by transaction type
        sales_df = df[df['transaction_type'] == 'SALE'].copy()
        inventory_df = df[df['transaction_type'] == 'INVENTORY'].copy()
        purchase_df = df[df['transaction_type'] == 'PURCHASE'].copy()
        
        # Process each type
        results = {
            'sales_intelligence': self._analyze_sales_transactions(sales_df) if not sales_df.empty else None,
            'inventory_intelligence': self._analyze_inventory_transactions(inventory_df) if not inventory_df.empty else None,
            'supplier_intelligence': self._analyze_purchase_transactions(purchase_df) if not purchase_df.empty else None,
            'cross_reference_intelligence': self._cross_reference_all_data(df, org_id),
            'viral_opportunities': self._generate_viral_opportunities(df, org_id),
            'executive_summary': self._generate_unified_summary(df, org_id)
        }
        
        return results
    
    def _analyze_sales_transactions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract customer and demand intelligence from sales data"""
        
        if df.empty:
            return {}
        
        # Customer analysis
        customer_metrics = self._analyze_customer_behavior(df)
        
        # Product demand analysis
        demand_patterns = self._analyze_demand_patterns(df)
        
        # Geographic analysis
        geographic_insights = self._analyze_geographic_distribution(df)
        
        # Revenue analysis
        revenue_metrics = self._calculate_revenue_metrics(df)
        
        return {
            'total_sales': len(df),
            'unique_customers': df['customer_name'].nunique() if 'customer_name' in df else 0,
            'total_revenue': df['total_cost'].sum() if 'total_cost' in df else 0,
            'customer_metrics': customer_metrics,
            'demand_patterns': demand_patterns,
            'geographic_insights': geographic_insights,
            'revenue_metrics': revenue_metrics,
            'recommendations': self._generate_sales_recommendations(customer_metrics, demand_patterns)
        }
    
    def _analyze_customer_behavior(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze customer purchasing patterns"""
        
        customer_analysis = {}
        
        if 'customer_name' in df and df['customer_name'].notna().any():
            # Group by customer
            customer_groups = df.groupby('customer_name')
            
            for customer, group in customer_groups:
                customer_analysis[customer] = {
                    'total_purchases': len(group),
                    'total_value': group['total_cost'].sum() if 'total_cost' in group else 0,
                    'average_order_value': group['total_cost'].mean() if 'total_cost' in group else 0,
                    'unique_products': group['sku'].nunique() if 'sku' in group else 0,
                    'favorite_products': group['sku'].value_counts().head(5).to_dict() if 'sku' in group else {},
                    'purchase_frequency': self._calculate_purchase_frequency(group),
                    'customer_lifetime_value': self._estimate_clv(group),
                    'churn_risk': self._calculate_churn_risk(group)
                }
        
        return customer_analysis
    
    def _analyze_purchase_transactions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract supplier intelligence from purchase data"""
        
        if df.empty:
            return {}
        
        supplier_analysis = {}
        
        if 'supplier_name' in df and df['supplier_name'].notna().any():
            # Group by supplier
            supplier_groups = df.groupby('supplier_name')
            
            for supplier, group in supplier_groups:
                # Calculate SERVICE score (on-time delivery, quality)
                service_score = self._calculate_supplier_service_score(group)
                
                # Calculate COST score (pricing competitiveness)
                cost_score = self._calculate_supplier_cost_score(group)
                
                # Calculate CAPITAL score (payment terms efficiency)
                capital_score = self._calculate_supplier_capital_score(group)
                
                # Overall score (harmonic mean)
                overall_score = self._calculate_harmonic_mean(service_score, cost_score, capital_score)
                
                supplier_analysis[supplier] = {
                    'total_purchases': len(group),
                    'total_spend': group['total_cost'].sum() if 'total_cost' in group else 0,
                    'unique_products': group['sku'].nunique() if 'sku' in group else 0,
                    'service_score': service_score,
                    'cost_score': cost_score,
                    'capital_score': capital_score,
                    'overall_score': overall_score,
                    'products_supplied': group['sku'].unique().tolist() if 'sku' in group else [],
                    'average_order_size': group['quantity'].mean() if 'quantity' in group else 0,
                    'scorecard_url': self._generate_scorecard_url(supplier),
                    'improvement_opportunities': self._identify_supplier_improvements(service_score, cost_score, capital_score)
                }
        
        return {
            'supplier_count': len(supplier_analysis),
            'total_spend': df['total_cost'].sum() if 'total_cost' in df else 0,
            'supplier_details': supplier_analysis,
            'supplier_concentration': self._calculate_supplier_concentration(supplier_analysis),
            'recommendations': self._generate_supplier_recommendations(supplier_analysis)
        }
    
    def _cross_reference_all_data(self, df: pd.DataFrame, org_id: str) -> Dict[str, Any]:
        """Cross-reference all transaction types to find hidden insights"""
        
        cross_insights = {}
        
        # Product velocity across channels
        product_velocity = self._calculate_product_velocity_matrix(df)
        
        # Supplier-Customer relationships
        supplier_customer_map = self._map_supplier_customer_relationships(df)
        
        # Inventory vs Sales alignment
        inventory_sales_alignment = self._analyze_inventory_sales_alignment(df)
        
        # Financial optimization opportunities
        financial_opportunities = self._identify_financial_opportunities(df)
        
        return {
            'product_velocity_matrix': product_velocity,
            'supplier_customer_relationships': supplier_customer_map,
            'inventory_sales_alignment': inventory_sales_alignment,
            'financial_opportunities': financial_opportunities,
            'network_insights': self._generate_network_insights(df)
        }
    
    def _generate_viral_opportunities(self, df: pd.DataFrame, org_id: str) -> Dict[str, Any]:
        """Generate viral growth loop opportunities"""
        
        opportunities = {
            'supplier_scorecards': self._generate_supplier_scorecards(df),
            'inventory_financing': self._identify_inventory_financing_opportunities(df),
            'market_benchmarks': self._create_anonymous_benchmarks(df, org_id)
        }
        
        return opportunities
    
    def _generate_supplier_scorecards(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Create shareable supplier scorecards"""
        
        purchase_df = df[df['transaction_type'] == 'PURCHASE']
        if purchase_df.empty:
            return []
        
        scorecards = []
        supplier_groups = purchase_df.groupby('supplier_name')
        
        for supplier, group in supplier_groups:
            if pd.isna(supplier) or supplier == '':
                continue
                
            scorecard = {
                'supplier_name': supplier,
                'scorecard_id': hashlib.md5(supplier.encode()).hexdigest()[:8],
                'generation_date': datetime.now().isoformat(),
                'metrics': {
                    'total_transactions': len(group),
                    'total_value': float(group['total_cost'].sum()) if 'total_cost' in group else 0,
                    'product_count': int(group['sku'].nunique()) if 'sku' in group else 0
                },
                'scores': {
                    'service': self._calculate_supplier_service_score(group),
                    'cost': self._calculate_supplier_cost_score(group),
                    'capital': self._calculate_supplier_capital_score(group)
                },
                'share_message': f"View your performance scorecard and see how you compare to industry standards",
                'improvement_tips': self._generate_improvement_tips(group),
                'viral_potential': 'HIGH' if len(group) > 10 else 'MEDIUM'
            }
            
            scorecards.append(scorecard)
        
        return scorecards
    
    def _calculate_supplier_service_score(self, df: pd.DataFrame) -> float:
        """Calculate SERVICE score for supplier (0-100)"""
        
        # Simplified scoring based on available data
        # In production, would use delivery dates, quality metrics, etc.
        base_score = 70.0
        
        # Bonus for consistent ordering
        if len(df) > 5:
            base_score += 10
        
        # Bonus for product variety
        if 'sku' in df and df['sku'].nunique() > 3:
            base_score += 10
        
        return min(base_score, 100.0)
    
    def _calculate_supplier_cost_score(self, df: pd.DataFrame) -> float:
        """Calculate COST score for supplier (0-100)"""
        
        if 'unit_cost' not in df or df['unit_cost'].isna().all():
            return 75.0  # Default score
        
        # Compare costs to market (simplified)
        avg_cost = df['unit_cost'].mean()
        
        # In production, would compare to market benchmarks
        # For now, use a simplified scoring
        if avg_cost > 0:
            return 80.0
        
        return 75.0
    
    def _calculate_supplier_capital_score(self, df: pd.DataFrame) -> float:
        """Calculate CAPITAL score for supplier (0-100)"""
        
        # Simplified scoring based on payment terms
        # In production, would analyze actual payment terms
        base_score = 75.0
        
        # Bonus for larger orders (better payment terms assumed)
        if 'total_cost' in df:
            avg_order_value = df['total_cost'].mean()
            if avg_order_value > 10000:
                base_score += 15
            elif avg_order_value > 5000:
                base_score += 10
        
        return min(base_score, 100.0)
    
    def _calculate_harmonic_mean(self, *scores: float) -> float:
        """Calculate harmonic mean of scores"""
        
        valid_scores = [s for s in scores if s > 0]
        if not valid_scores:
            return 0.0
        
        n = len(valid_scores)
        reciprocal_sum = sum(1/s for s in valid_scores)
        
        return n / reciprocal_sum if reciprocal_sum > 0 else 0.0
    
    def _generate_scorecard_url(self, supplier_name: str) -> str:
        """Generate unique URL for supplier scorecard"""
        
        scorecard_id = hashlib.md5(supplier_name.encode()).hexdigest()[:8]
        return f"/supplier-scorecard/{scorecard_id}"
    
    def _identify_supplier_improvements(self, service: float, cost: float, capital: float) -> List[str]:
        """Identify improvement opportunities for supplier"""
        
        improvements = []
        
        if service < 70:
            improvements.append("Improve delivery reliability and product quality")
        if cost < 70:
            improvements.append("Review pricing competitiveness against market")
        if capital < 70:
            improvements.append("Offer better payment terms for larger orders")
        
        if not improvements:
            improvements.append("Maintain excellent performance across all metrics")
        
        return improvements
    
    def _calculate_product_velocity_matrix(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate how fast products move through the supply chain"""
        
        if 'sku' not in df:
            return {}
        
        velocity_matrix = {}
        
        for sku in df['sku'].unique():
            if pd.isna(sku):
                continue
                
            sku_data = df[df['sku'] == sku]
            
            # Sales velocity
            sales_data = sku_data[sku_data['transaction_type'] == 'SALE']
            sales_velocity = len(sales_data) / 30 if not sales_data.empty else 0  # per day
            
            # Purchase frequency
            purchase_data = sku_data[sku_data['transaction_type'] == 'PURCHASE']
            purchase_frequency = len(purchase_data) / 30 if not purchase_data.empty else 0
            
            # Current inventory
            inventory_data = sku_data[sku_data['transaction_type'] == 'INVENTORY']
            current_stock = inventory_data['available_stock'].sum() if not inventory_data.empty and 'available_stock' in inventory_data else 0
            
            velocity_matrix[sku] = {
                'sales_velocity': sales_velocity,
                'purchase_frequency': purchase_frequency,
                'current_stock': current_stock,
                'days_of_stock': current_stock / sales_velocity if sales_velocity > 0 else 999,
                'velocity_score': self._calculate_velocity_score(sales_velocity, purchase_frequency)
            }
        
        return velocity_matrix
    
    def _calculate_velocity_score(self, sales_velocity: float, purchase_frequency: float) -> str:
        """Calculate product velocity score"""
        
        if sales_velocity > 1.0:
            return 'HIGH'
        elif sales_velocity > 0.5:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _generate_unified_summary(self, df: pd.DataFrame, org_id: str) -> Dict[str, Any]:
        """Generate executive summary from all data"""
        
        return {
            'total_transactions': len(df),
            'transaction_types': df['transaction_type'].value_counts().to_dict() if 'transaction_type' in df else {},
            'date_range': {
                'start': df['transaction_date'].min() if 'transaction_date' in df else None,
                'end': df['transaction_date'].max() if 'transaction_date' in df else None
            },
            'key_metrics': {
                'total_revenue': df[df['transaction_type'] == 'SALE']['total_cost'].sum() if 'total_cost' in df else 0,
                'total_spend': df[df['transaction_type'] == 'PURCHASE']['total_cost'].sum() if 'total_cost' in df else 0,
                'inventory_value': df[df['transaction_type'] == 'INVENTORY']['total_cost'].sum() if 'total_cost' in df else 0
            },
            'top_insights': self._generate_top_insights(df),
            'recommended_actions': self._generate_recommended_actions(df)
        }
    
    def _generate_top_insights(self, df: pd.DataFrame) -> List[str]:
        """Generate top insights from unified data"""
        
        insights = []
        
        # Check supplier concentration
        if 'supplier_name' in df:
            supplier_concentration = df.groupby('supplier_name')['total_cost'].sum()
            if len(supplier_concentration) > 0:
                top_supplier_pct = supplier_concentration.max() / supplier_concentration.sum() * 100
                if top_supplier_pct > 40:
                    insights.append(f"High supplier concentration risk: {top_supplier_pct:.1f}% with top supplier")
        
        # Check inventory levels
        inventory_df = df[df['transaction_type'] == 'INVENTORY']
        if not inventory_df.empty and 'available_stock' in inventory_df:
            low_stock_items = inventory_df[inventory_df['available_stock'] < 10]
            if len(low_stock_items) > 0:
                insights.append(f"{len(low_stock_items)} products have critically low stock levels")
        
        # Check sales trends
        sales_df = df[df['transaction_type'] == 'SALE']
        if not sales_df.empty:
            insights.append(f"Processing {len(sales_df)} sales transactions across {sales_df['sku'].nunique()} products")
        
        if not insights:
            insights.append("Upload more data to generate comprehensive insights")
        
        return insights
    
    def _generate_recommended_actions(self, df: pd.DataFrame) -> List[str]:
        """Generate recommended actions from analysis"""
        
        actions = []
        
        # Check for supplier scorecards to share
        purchase_df = df[df['transaction_type'] == 'PURCHASE']
        if not purchase_df.empty:
            unique_suppliers = purchase_df['supplier_name'].nunique()
            if unique_suppliers > 0:
                actions.append(f"Share performance scorecards with your {unique_suppliers} suppliers to improve service")
        
        # Check for inventory optimization
        inventory_df = df[df['transaction_type'] == 'INVENTORY']
        if not inventory_df.empty and 'available_stock' in inventory_df:
            low_stock = inventory_df[inventory_df['available_stock'] < 10]
            if len(low_stock) > 0:
                actions.append(f"Reorder {len(low_stock)} low-stock items with trade financing options")
        
        # Suggest more data upload
        if len(df) < 100:
            actions.append("Upload more historical data for deeper insights and predictions")
        
        return actions
    
    # Helper methods for missing implementations
    
    def _calculate_purchase_frequency(self, df: pd.DataFrame) -> float:
        """Calculate average days between purchases"""
        if 'transaction_date' not in df or len(df) < 2:
            return 30.0  # Default monthly
        
        dates = pd.to_datetime(df['transaction_date']).sort_values()
        if len(dates) < 2:
            return 30.0
            
        days_between = (dates.max() - dates.min()).days
        return days_between / (len(dates) - 1) if len(dates) > 1 else 30.0
    
    def _estimate_clv(self, df: pd.DataFrame) -> float:
        """Estimate customer lifetime value"""
        if 'total_cost' not in df:
            return 0.0
        
        avg_order_value = df['total_cost'].mean()
        purchase_frequency = 365 / self._calculate_purchase_frequency(df)  # purchases per year
        
        # Simplified CLV = AOV * Purchase Frequency * Expected Lifetime (3 years)
        return avg_order_value * purchase_frequency * 3
    
    def _calculate_churn_risk(self, df: pd.DataFrame) -> str:
        """Calculate customer churn risk"""
        if 'transaction_date' not in df:
            return 'UNKNOWN'
        
        last_purchase = pd.to_datetime(df['transaction_date']).max()
        days_since_purchase = (datetime.now() - last_purchase).days
        
        if days_since_purchase > 90:
            return 'HIGH'
        elif days_since_purchase > 60:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _analyze_demand_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze product demand patterns"""
        if 'sku' not in df:
            return {}
        
        demand_analysis = {}
        for sku in df['sku'].unique():
            if pd.isna(sku):
                continue
                
            sku_sales = df[df['sku'] == sku]
            demand_analysis[sku] = {
                'total_sales': len(sku_sales),
                'total_quantity': sku_sales['quantity'].sum() if 'quantity' in sku_sales else 0,
                'average_quantity': sku_sales['quantity'].mean() if 'quantity' in sku_sales else 0,
                'demand_trend': 'STABLE'  # Simplified - would calculate actual trend
            }
        
        return demand_analysis
    
    def _analyze_geographic_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze geographic distribution of sales"""
        if 'city' not in df:
            return {}
        
        city_distribution = df.groupby('city').agg({
            'total_cost': 'sum',
            'quantity': 'sum',
            'transaction_id': 'count'
        }).to_dict('index') if 'total_cost' in df and 'quantity' in df else {}
        
        return {
            'city_distribution': city_distribution,
            'top_cities': sorted(city_distribution.items(), 
                               key=lambda x: x[1].get('total_cost', 0), 
                               reverse=True)[:5] if city_distribution else []
        }
    
    def _calculate_revenue_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate revenue metrics"""
        if 'total_cost' not in df:
            return {}
        
        return {
            'total_revenue': df['total_cost'].sum(),
            'average_transaction_value': df['total_cost'].mean(),
            'revenue_by_product': df.groupby('sku')['total_cost'].sum().to_dict() if 'sku' in df else {}
        }
    
    def _generate_sales_recommendations(self, customer_metrics: Dict, demand_patterns: Dict) -> List[str]:
        """Generate sales recommendations"""
        recommendations = []
        
        # Check for high-value customers
        if customer_metrics:
            high_value_customers = [c for c, m in customer_metrics.items() 
                                  if m.get('customer_lifetime_value', 0) > 100000]
            if high_value_customers:
                recommendations.append(f"Focus retention efforts on {len(high_value_customers)} high-value customers")
        
        # Check demand patterns
        if demand_patterns:
            high_demand_products = [p for p, d in demand_patterns.items() 
                                  if d.get('total_quantity', 0) > 100]
            if high_demand_products:
                recommendations.append(f"Ensure stock availability for {len(high_demand_products)} high-demand products")
        
        return recommendations
    
    def _map_supplier_customer_relationships(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Map relationships between suppliers and customers through products"""
        relationships = defaultdict(lambda: defaultdict(set))
        
        # Find products from suppliers
        purchase_df = df[df['transaction_type'] == 'PURCHASE']
        supplier_products = defaultdict(set)
        for _, row in purchase_df.iterrows():
            if pd.notna(row.get('supplier_name')) and pd.notna(row.get('sku')):
                supplier_products[row['supplier_name']].add(row['sku'])
        
        # Find products sold to customers
        sales_df = df[df['transaction_type'] == 'SALE']
        customer_products = defaultdict(set)
        for _, row in sales_df.iterrows():
            if pd.notna(row.get('customer_name')) and pd.notna(row.get('sku')):
                customer_products[row['customer_name']].add(row['sku'])
        
        # Map relationships
        for supplier, s_products in supplier_products.items():
            for customer, c_products in customer_products.items():
                common_products = s_products.intersection(c_products)
                if common_products:
                    relationships['supplier_customer_map'][supplier] = {
                        'customers': list(customer_products.keys()),
                        'common_products': list(common_products)
                    }
        
        return dict(relationships)
    
    def _analyze_inventory_sales_alignment(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze how well inventory aligns with sales"""
        alignment = {}
        
        # Get current inventory levels
        inventory_df = df[df['transaction_type'] == 'INVENTORY']
        current_inventory = {}
        for _, row in inventory_df.iterrows():
            if pd.notna(row.get('sku')) and pd.notna(row.get('available_stock')):
                current_inventory[row['sku']] = row['available_stock']
        
        # Get sales velocity
        sales_df = df[df['transaction_type'] == 'SALE']
        sales_velocity = sales_df.groupby('sku')['quantity'].sum() / 30  # Daily velocity
        
        # Calculate alignment
        for sku, velocity in sales_velocity.items():
            if sku in current_inventory:
                days_of_stock = current_inventory[sku] / velocity if velocity > 0 else 999
                alignment[sku] = {
                    'current_stock': current_inventory[sku],
                    'daily_velocity': velocity,
                    'days_of_stock': days_of_stock,
                    'status': 'OPTIMAL' if 7 <= days_of_stock <= 30 else 'MISALIGNED'
                }
        
        return alignment
    
    def _identify_financial_opportunities(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify financial optimization opportunities"""
        opportunities = []
        
        # Working capital optimization
        inventory_value = df[df['transaction_type'] == 'INVENTORY']['total_cost'].sum() if 'total_cost' in df else 0
        if inventory_value > 100000:
            opportunities.append({
                'type': 'WORKING_CAPITAL',
                'description': 'Optimize working capital through inventory financing',
                'potential_value': inventory_value * 0.15,  # 15% improvement potential
                'action': 'Review inventory financing options'
            })
        
        # Supplier payment terms
        purchase_value = df[df['transaction_type'] == 'PURCHASE']['total_cost'].sum() if 'total_cost' in df else 0
        if purchase_value > 50000:
            opportunities.append({
                'type': 'PAYMENT_TERMS',
                'description': 'Negotiate better payment terms with suppliers',
                'potential_value': purchase_value * 0.02,  # 2% cash flow improvement
                'action': 'Request extended payment terms from top suppliers'
            })
        
        return opportunities
    
    def _generate_network_insights(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate insights about the supply chain network"""
        return {
            'network_density': self._calculate_network_density(df),
            'critical_nodes': self._identify_critical_nodes(df),
            'optimization_potential': self._calculate_optimization_potential(df)
        }
    
    def _calculate_network_density(self, df: pd.DataFrame) -> float:
        """Calculate how connected the supply chain network is"""
        # Simplified calculation
        unique_suppliers = df['supplier_name'].nunique() if 'supplier_name' in df else 0
        unique_customers = df['customer_name'].nunique() if 'customer_name' in df else 0
        unique_products = df['sku'].nunique() if 'sku' in df else 0
        
        if unique_products == 0:
            return 0.0
        
        # Density = connections / possible connections
        actual_connections = len(df)
        possible_connections = unique_suppliers * unique_customers * unique_products
        
        return min(actual_connections / max(possible_connections, 1), 1.0)
    
    def _identify_critical_nodes(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify critical suppliers/products in the network"""
        critical_nodes = []
        
        # Critical suppliers (high concentration)
        if 'supplier_name' in df:
            supplier_concentration = df.groupby('supplier_name')['total_cost'].sum()
            total_spend = supplier_concentration.sum()
            
            for supplier, spend in supplier_concentration.items():
                if spend / total_spend > 0.2:  # More than 20% concentration
                    critical_nodes.append({
                        'type': 'SUPPLIER',
                        'name': supplier,
                        'criticality': spend / total_spend,
                        'risk': 'HIGH'
                    })
        
        return critical_nodes
    
    def _calculate_optimization_potential(self, df: pd.DataFrame) -> float:
        """Calculate overall optimization potential score (0-100)"""
        score = 0.0
        
        # Check inventory optimization potential
        inventory_df = df[df['transaction_type'] == 'INVENTORY']
        if not inventory_df.empty and 'available_stock' in inventory_df:
            # Penalize for too much or too little inventory
            avg_stock = inventory_df['available_stock'].mean()
            if avg_stock > 1000:
                score += 20  # Too much inventory
            elif avg_stock < 10:
                score += 30  # Too little inventory
        
        # Check supplier diversity
        if 'supplier_name' in df:
            supplier_count = df['supplier_name'].nunique()
            if supplier_count < 3:
                score += 30  # Low supplier diversity
        
        # Check sales efficiency
        sales_df = df[df['transaction_type'] == 'SALE']
        if not sales_df.empty:
            # More opportunities if sales are concentrated
            customer_concentration = sales_df.groupby('customer_name')['total_cost'].sum() if 'customer_name' in sales_df else pd.Series()
            if len(customer_concentration) > 0:
                top_customer_pct = customer_concentration.max() / customer_concentration.sum()
                if top_customer_pct > 0.3:
                    score += 20
        
        return min(score, 100.0)
    
    def _identify_inventory_financing_opportunities(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify opportunities for inventory financing"""
        opportunities = []
        
        inventory_df = df[df['transaction_type'] == 'INVENTORY']
        if inventory_df.empty:
            return opportunities
        
        # Find low stock items with high sales velocity
        velocity_matrix = self._calculate_product_velocity_matrix(df)
        
        for sku, velocity_data in velocity_matrix.items():
            if velocity_data['days_of_stock'] < 7 and velocity_data['sales_velocity'] > 1:
                opportunities.append({
                    'sku': sku,
                    'current_stock': velocity_data['current_stock'],
                    'daily_velocity': velocity_data['sales_velocity'],
                    'days_remaining': velocity_data['days_of_stock'],
                    'recommended_order': velocity_data['sales_velocity'] * 30,  # 30-day supply
                    'financing_benefit': 'Prevent stockout and maintain cash flow',
                    'priority': 'HIGH' if velocity_data['days_of_stock'] < 3 else 'MEDIUM'
                })
        
        return opportunities
    
    def _create_anonymous_benchmarks(self, df: pd.DataFrame, org_id: str) -> Dict[str, Any]:
        """Create anonymous market benchmarks"""
        
        # In production, would aggregate across multiple organizations
        # For now, create benchmarks from current data
        
        benchmarks = {
            'inventory_turnover': {
                'your_score': self._calculate_avg_inventory_turnover(df),
                'industry_average': 8.5,  # Mock industry average
                'top_quartile': 12.0,
                'percentile': 65  # Mock percentile
            },
            'supplier_concentration': {
                'your_score': self._calculate_supplier_concentration_score(df),
                'industry_average': 0.25,
                'top_quartile': 0.15,
                'percentile': 45
            },
            'cash_conversion_cycle': {
                'your_days': 45,  # Mock data
                'industry_average': 60,
                'top_quartile': 30,
                'percentile': 70
            }
        }
        
        return benchmarks
    
    def _calculate_avg_inventory_turnover(self, df: pd.DataFrame) -> float:
        """Calculate average inventory turnover"""
        # Simplified calculation
        sales_df = df[df['transaction_type'] == 'SALE']
        inventory_df = df[df['transaction_type'] == 'INVENTORY']
        
        if sales_df.empty or inventory_df.empty:
            return 0.0
        
        total_sales = sales_df['quantity'].sum() if 'quantity' in sales_df else 0
        avg_inventory = inventory_df['available_stock'].mean() if 'available_stock' in inventory_df else 1
        
        return total_sales / avg_inventory if avg_inventory > 0 else 0.0
    
    def _calculate_supplier_concentration_score(self, df: pd.DataFrame) -> float:
        """Calculate supplier concentration (Herfindahl index)"""
        purchase_df = df[df['transaction_type'] == 'PURCHASE']
        if purchase_df.empty or 'supplier_name' not in purchase_df:
            return 0.0
        
        supplier_shares = purchase_df.groupby('supplier_name')['total_cost'].sum()
        total = supplier_shares.sum()
        
        if total == 0:
            return 0.0
        
        # Calculate Herfindahl index
        hhi = sum((share/total)**2 for share in supplier_shares)
        return hhi
    
    def _calculate_supplier_concentration(self, supplier_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate supplier concentration metrics"""
        if not supplier_analysis:
            return {}
        
        total_spend = sum(s['total_spend'] for s in supplier_analysis.values())
        
        if total_spend == 0:
            return {}
        
        # Calculate concentration
        supplier_shares = {name: data['total_spend']/total_spend 
                          for name, data in supplier_analysis.items()}
        
        # Herfindahl index
        hhi = sum(share**2 for share in supplier_shares.values())
        
        # Top supplier concentration
        top_supplier_share = max(supplier_shares.values()) if supplier_shares else 0
        
        return {
            'herfindahl_index': hhi,
            'top_supplier_share': top_supplier_share,
            'risk_level': 'HIGH' if hhi > 0.25 else 'MEDIUM' if hhi > 0.15 else 'LOW',
            'recommendation': 'Diversify supplier base' if hhi > 0.25 else 'Supplier diversity is adequate'
        }
    
    def _generate_supplier_recommendations(self, supplier_analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations for supplier management"""
        recommendations = []
        
        if not supplier_analysis:
            return ['Upload purchase data to analyze supplier performance']
        
        # Check for low-scoring suppliers
        low_performers = [name for name, data in supplier_analysis.items() 
                         if data['overall_score'] < 70]
        
        if low_performers:
            recommendations.append(f"Share scorecards with {len(low_performers)} underperforming suppliers")
        
        # Check concentration
        concentration = self._calculate_supplier_concentration(supplier_analysis)
        if concentration.get('risk_level') == 'HIGH':
            recommendations.append("High supplier concentration risk - consider diversifying")
        
        # High performers
        high_performers = [name for name, data in supplier_analysis.items() 
                          if data['overall_score'] > 85]
        if high_performers:
            recommendations.append(f"Negotiate volume discounts with {len(high_performers)} top suppliers")
        
        return recommendations
    
    def _generate_improvement_tips(self, supplier_df: pd.DataFrame) -> List[str]:
        """Generate specific improvement tips for a supplier"""
        tips = []
        
        # Check order frequency
        if len(supplier_df) < 5:
            tips.append("Increase order frequency for better pricing")
        
        # Check product variety
        if 'sku' in supplier_df and supplier_df['sku'].nunique() < 3:
            tips.append("Expand product range to become strategic partner")
        
        # Check order values
        if 'total_cost' in supplier_df:
            avg_order = supplier_df['total_cost'].mean()
            if avg_order < 5000:
                tips.append("Increase average order value for better terms")
        
        if not tips:
            tips.append("Maintain current excellent performance")
        
        return tips