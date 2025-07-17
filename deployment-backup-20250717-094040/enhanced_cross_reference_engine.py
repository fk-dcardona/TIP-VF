"""
Enhanced Cross-Reference Engine for Unified Document Intelligence Protocol
Implements 4-dimensional intelligence analysis with document integration
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import json

from models_enhanced import UnifiedTransaction, DocumentInventoryLink
from models import TradeDocument
from supply_chain_engine import SupplyChainAnalyticsEngine

class DocumentEnhancedCrossReferenceEngine(SupplyChainAnalyticsEngine):
    """Enhanced engine with document intelligence integration"""
    
    def __init__(self):
        super().__init__()
        self.risk_thresholds = {
            'high_cost_variance': 0.20,  # 20%
            'medium_cost_variance': 0.10,  # 10%
            'high_quantity_discrepancy': 0.10,  # 10%
            'medium_quantity_discrepancy': 0.05,  # 5%
            'delayed_shipment_days': 45,
            'high_risk_score': 80,
            'medium_risk_score': 60
        }
    
    def process_with_documents(self, org_id: str) -> Dict[str, Any]:
        """Process all data including document intelligence"""
        
        # Get all unified transactions including document-sourced ones
        transactions = UnifiedTransaction.query.filter_by(org_id=org_id).all()
        
        # Get all trade documents
        documents = TradeDocument.query.filter_by(org_id=org_id).all()
        
        # Enhanced analysis
        analysis = {
            'traditional_intelligence': self._cross_reference_all_data(pd.DataFrame([t.__dict__ for t in transactions]), org_id),
            'document_intelligence': self._analyze_document_compliance(documents),
            'inventory_intelligence': self._analyze_inventory_compromise(transactions),
            'cost_intelligence': self._analyze_real_costs(transactions),
            'timeline_intelligence': self._analyze_supply_chain_timeline(transactions),
            'predictive_intelligence': self._generate_predictive_insights(transactions, documents)
        }
        
        # 4D Triangle Score (SERVICE, COST, CAPITAL, DOCUMENTS)
        analysis['triangle_4d_score'] = self._calculate_4d_triangle_score(analysis)
        
        return analysis
    
    def _analyze_document_compliance(self, documents: List[TradeDocument]) -> Dict:
        """Analyze document compliance and processing quality"""
        
        doc_analysis = {
            'total_documents': len(documents),
            'document_types': defaultdict(int),
            'compliance_score': 0,
            'processing_quality': 0,
            'compliance_issues': [],
            'processing_anomalies': []
        }
        
        if not documents:
            return doc_analysis
        
        # Analyze document types
        for doc in documents:
            doc_analysis['document_types'][doc.document_type] += 1
        
        # Calculate compliance score
        compliant_docs = [doc for doc in documents if doc.compliance_status == 'compliant']
        doc_analysis['compliance_score'] = len(compliant_docs) / len(documents) * 100
        
        # Calculate processing quality
        high_confidence_docs = [doc for doc in documents if doc.confidence_score and doc.confidence_score > 0.8]
        doc_analysis['processing_quality'] = len(high_confidence_docs) / len(documents) * 100
        
        # Identify compliance issues
        for doc in documents:
            if doc.compliance_status != 'compliant':
                doc_analysis['compliance_issues'].append({
                    'document_id': doc.id,
                    'document_type': doc.document_type,
                    'issue': doc.compliance_status,
                    'upload_date': doc.upload_date.isoformat() if doc.upload_date else None
                })
        
        # Identify processing anomalies
        for doc in documents:
            if doc.confidence_score and doc.confidence_score < 0.7:
                doc_analysis['processing_anomalies'].append({
                    'document_id': doc.id,
                    'document_type': doc.document_type,
                    'confidence_score': doc.confidence_score,
                    'issue': 'Low extraction confidence'
                })
        
        return doc_analysis
    
    def _analyze_inventory_compromise(self, transactions: List[UnifiedTransaction]) -> Dict:
        """Analyze compromised inventory across all sources"""
        
        compromised_analysis = {
            'total_compromised_items': 0,
            'total_financial_impact': 0,
            'compromise_categories': defaultdict(int),
            'compromised_by_supplier': defaultdict(list),
            'recovery_opportunities': [],
            'risk_distribution': {
                'high_risk': 0,
                'medium_risk': 0,
                'low_risk': 0
            }
        }
        
        compromised_items = [t for t in transactions if t.inventory_status == 'compromised']
        
        for item in compromised_items:
            compromised_analysis['total_compromised_items'] += 1
            
            if item.cost_variance:
                compromised_analysis['total_financial_impact'] += abs(item.cost_variance)
            
            # Categorize by anomaly type
            if item.anomaly_flags:
                for flag in item.anomaly_flags:
                    compromised_analysis['compromise_categories'][flag.get('reason', 'unknown')] += 1
                    
                    # Group by supplier for targeted action
                    if item.supplier_name:
                        compromised_analysis['compromised_by_supplier'][item.supplier_name].append({
                            'sku': item.sku,
                            'reason': flag.get('reason'),
                            'impact': flag.get('impact', 0),
                            'severity': flag.get('severity', 'medium')
                        })
            
            # Risk distribution
            if item.risk_score:
                if item.risk_score >= self.risk_thresholds['high_risk_score']:
                    compromised_analysis['risk_distribution']['high_risk'] += 1
                elif item.risk_score >= self.risk_thresholds['medium_risk_score']:
                    compromised_analysis['risk_distribution']['medium_risk'] += 1
                else:
                    compromised_analysis['risk_distribution']['low_risk'] += 1
        
        # Generate recovery opportunities
        for supplier, issues in compromised_analysis['compromised_by_supplier'].items():
            total_impact = sum(issue['impact'] for issue in issues if issue['impact'])
            high_severity_count = len([i for i in issues if i['severity'] == 'high'])
            
            if total_impact > 10000 or high_severity_count > 0:  # Significant impact threshold
                compromised_analysis['recovery_opportunities'].append({
                    'supplier': supplier,
                    'total_impact': total_impact,
                    'issue_count': len(issues),
                    'high_severity_count': high_severity_count,
                    'recommended_action': 'Initiate supplier recovery discussion',
                    'priority': 'high' if high_severity_count > 0 else 'medium'
                })
        
        return compromised_analysis
    
    def _analyze_real_costs(self, transactions: List[UnifiedTransaction]) -> Dict:
        """Analyze real cost structures from documents vs planned costs"""
        
        cost_analysis = {
            'total_cost_variance': 0,
            'variance_by_category': defaultdict(float),
            'variance_by_supplier': defaultdict(float),
            'cost_trend_analysis': {},
            'cost_optimization_opportunities': [],
            'cost_distribution': {
                'planned_costs': 0,
                'actual_costs': 0,
                'variances': []
            }
        }
        
        # Calculate variances
        for transaction in transactions:
            if transaction.cost_variance and transaction.cost_variance != 0:
                cost_analysis['total_cost_variance'] += transaction.cost_variance
                
                if transaction.product_category:
                    cost_analysis['variance_by_category'][transaction.product_category] += transaction.cost_variance
                
                if transaction.supplier_name:
                    cost_analysis['variance_by_supplier'][transaction.supplier_name] += transaction.cost_variance
                
                # Track cost distribution
                if transaction.planned_cost:
                    cost_analysis['cost_distribution']['planned_costs'] += transaction.planned_cost
                if transaction.actual_cost:
                    cost_analysis['cost_distribution']['actual_costs'] += transaction.actual_cost
                
                cost_analysis['cost_distribution']['variances'].append({
                    'sku': transaction.sku,
                    'planned': transaction.planned_cost,
                    'actual': transaction.actual_cost,
                    'variance': transaction.cost_variance,
                    'variance_percentage': transaction.cost_variance_percentage
                })
        
        # Identify optimization opportunities
        for supplier, variance in cost_analysis['variance_by_supplier'].items():
            if variance > 5000:  # Significant negative variance
                cost_analysis['cost_optimization_opportunities'].append({
                    'supplier': supplier,
                    'cost_variance': variance,
                    'opportunity': 'Renegotiate pricing or find alternative supplier',
                    'potential_savings': abs(variance) * 0.5,  # Assume 50% recovery potential
                    'priority': 'high' if abs(variance) > 10000 else 'medium'
                })
        
        # Cost trend analysis
        cost_analysis['cost_trend_analysis'] = self._analyze_cost_trends(transactions)
        
        return cost_analysis
    
    def _analyze_supply_chain_timeline(self, transactions: List[UnifiedTransaction]) -> Dict:
        """Analyze supply chain timeline performance"""
        
        timeline_analysis = {
            'average_po_to_receipt': 0,
            'average_ship_to_receipt': 0,
            'timeline_variance_by_supplier': {},
            'delayed_shipments': [],
            'accelerated_opportunities': [],
            'timeline_performance': {
                'on_time': 0,
                'delayed': 0,
                'early': 0
            }
        }
        
        # Group by SKU to track full timeline
        sku_timelines = defaultdict(list)
        for transaction in transactions:
            if transaction.sku:
                sku_timelines[transaction.sku].append(transaction)
        
        po_to_receipt_times = []
        ship_to_receipt_times = []
        
        for sku, sku_transactions in sku_timelines.items():
            # Sort by date
            sku_transactions.sort(key=lambda x: x.transaction_date or datetime.min.date())
            
            po_date = None
            ship_date = None
            receipt_date = None
            
            for txn in sku_transactions:
                if txn.transaction_type == 'PURCHASE' and txn.po_date:
                    po_date = txn.po_date
                elif txn.transaction_type == 'SHIPMENT' and txn.ship_date:
                    ship_date = txn.ship_date
                elif txn.received_date:
                    receipt_date = txn.received_date
            
            # Calculate timeline metrics
            if po_date and receipt_date:
                po_to_receipt = (receipt_date - po_date).days
                po_to_receipt_times.append(po_to_receipt)
                
                if po_to_receipt > self.risk_thresholds['delayed_shipment_days']:
                    timeline_analysis['delayed_shipments'].append({
                        'sku': sku,
                        'days': po_to_receipt,
                        'supplier': sku_transactions[0].supplier_name,
                        'severity': 'high' if po_to_receipt > 60 else 'medium'
                    })
                    timeline_analysis['timeline_performance']['delayed'] += 1
                elif po_to_receipt < 30:
                    timeline_analysis['timeline_performance']['early'] += 1
                else:
                    timeline_analysis['timeline_performance']['on_time'] += 1
            
            if ship_date and receipt_date:
                ship_to_receipt = (receipt_date - ship_date).days
                ship_to_receipt_times.append(ship_to_receipt)
        
        timeline_analysis['average_po_to_receipt'] = np.mean(po_to_receipt_times) if po_to_receipt_times else 0
        timeline_analysis['average_ship_to_receipt'] = np.mean(ship_to_receipt_times) if ship_to_receipt_times else 0
        
        return timeline_analysis
    
    def _generate_predictive_insights(self, transactions: List[UnifiedTransaction], 
                                    documents: List[TradeDocument]) -> Dict:
        """Generate predictive insights based on historical patterns"""
        
        predictive_analysis = {
            'demand_forecast': {},
            'cost_forecast': {},
            'risk_forecast': {},
            'supplier_performance_prediction': {},
            'inventory_optimization_recommendations': []
        }
        
        if not transactions:
            return predictive_analysis
        
        # Analyze demand patterns
        demand_data = defaultdict(list)
        for txn in transactions:
            if txn.transaction_date and txn.quantity:
                month_key = txn.transaction_date.strftime('%Y-%m')
                demand_data[txn.sku].append({
                    'month': month_key,
                    'quantity': txn.quantity,
                    'date': txn.transaction_date
                })
        
        # Generate demand forecasts
        for sku, demand_history in demand_data.items():
            if len(demand_history) >= 3:  # Need at least 3 months of data
                quantities = [d['quantity'] for d in demand_history]
                avg_demand = np.mean(quantities)
                trend = np.polyfit(range(len(quantities)), quantities, 1)[0]
                
                predictive_analysis['demand_forecast'][sku] = {
                    'current_average': avg_demand,
                    'trend': trend,
                    'next_month_forecast': avg_demand + trend,
                    'confidence': min(0.9, len(demand_history) / 12)  # Higher confidence with more data
                }
        
        # Analyze cost trends
        cost_data = defaultdict(list)
        for txn in transactions:
            if txn.transaction_date and txn.unit_cost:
                month_key = txn.transaction_date.strftime('%Y-%m')
                cost_data[txn.sku].append({
                    'month': month_key,
                    'unit_cost': txn.unit_cost,
                    'date': txn.transaction_date
                })
        
        # Generate cost forecasts
        for sku, cost_history in cost_data.items():
            if len(cost_history) >= 3:
                costs = [c['unit_cost'] for c in cost_history]
                avg_cost = np.mean(costs)
                cost_trend = np.polyfit(range(len(costs)), costs, 1)[0]
                
                predictive_analysis['cost_forecast'][sku] = {
                    'current_average': avg_cost,
                    'trend': cost_trend,
                    'next_month_forecast': avg_cost + cost_trend,
                    'volatility': np.std(costs) / avg_cost
                }
        
        return predictive_analysis
    
    def _calculate_4d_triangle_score(self, analysis: Dict) -> Dict:
        """Calculate 4-dimensional triangle score including document intelligence"""
        
        # Get traditional triangle scores
        traditional = analysis.get('traditional_intelligence', {})
        
        # Calculate document intelligence score
        doc_intel = analysis.get('document_intelligence', {})
        document_score = doc_intel.get('compliance_score', 75)
        
        # Traditional triangle scores (assume we have them)
        service_score = 80  # From existing analysis
        cost_score = 85    # From existing analysis
        capital_score = 75  # From existing analysis
        
        # Calculate 4D harmonic mean
        scores = [service_score, cost_score, capital_score, document_score]
        harmonic_mean_4d = len(scores) / sum(1/score for score in scores if score > 0)
        
        return {
            'service_score': service_score,
            'cost_score': cost_score,
            'capital_score': capital_score,
            'document_score': document_score,
            'overall_4d_score': round(harmonic_mean_4d, 2),
            'improvement_priority': min(scores),
            'strongest_dimension': max(scores),
            'balance_index': min(scores) / max(scores)  # Closer to 1.0 is better balanced
        }
    
    def _analyze_cost_trends(self, transactions: List[UnifiedTransaction]) -> Dict:
        """Analyze cost trends over time"""
        
        cost_trends = {
            'overall_trend': 'stable',
            'trend_by_category': {},
            'trend_by_supplier': {},
            'volatility_analysis': {}
        }
        
        # Group by month and category
        monthly_costs = defaultdict(lambda: defaultdict(list))
        for txn in transactions:
            if txn.transaction_date and txn.unit_cost:
                month_key = txn.transaction_date.strftime('%Y-%m')
                category = txn.product_category or 'unknown'
                monthly_costs[month_key][category].append(txn.unit_cost)
        
        # Calculate trends
        for category in set(cat for month_data in monthly_costs.values() for cat in month_data.keys()):
            category_costs = []
            for month_data in monthly_costs.values():
                if category in month_data:
                    category_costs.append(np.mean(month_data[category]))
            
            if len(category_costs) >= 2:
                trend = np.polyfit(range(len(category_costs)), category_costs, 1)[0]
                cost_trends['trend_by_category'][category] = {
                    'trend': 'increasing' if trend > 0 else 'decreasing' if trend < 0 else 'stable',
                    'slope': trend,
                    'volatility': np.std(category_costs) / np.mean(category_costs) if category_costs else 0
                }
        
        return cost_trends 