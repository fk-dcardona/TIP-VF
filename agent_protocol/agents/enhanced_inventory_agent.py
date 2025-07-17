"""
Enhanced Inventory Agent with Document Intelligence
Extends base InventoryMonitorAgent with document cross-reference capabilities
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import json

from agent_protocol.agents.inventory_agent import InventoryMonitorAgent
from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
from services.enhanced_document_processor import EnhancedDocumentProcessor
from models_enhanced import UnifiedTransaction, DocumentInventoryLink
from models import db, TradeDocument

class DocumentIntelligenceInventoryAgent(InventoryMonitorAgent):
    """Enhanced agent that monitors inventory with document cross-reference"""
    
    def __init__(self, agent_id: str = "enhanced-inventory-agent", agent_type = "INVENTORY_MONITOR", 
                 name: str = "Enhanced Inventory Agent", description: str = "Enhanced agent with document intelligence", 
                 config: Dict[str, Any] = None):
        if config is None:
            config = {}
        super().__init__(agent_id, agent_type, name, description, config)
        self.cross_ref_engine = DocumentEnhancedCrossReferenceEngine()
        self.document_processor = EnhancedDocumentProcessor()
        
    def analyze_inventory_with_documents(self, input_data: Dict) -> Dict:
        """Analyze inventory considering document intelligence"""
        
        org_id = input_data.get('org_id')
        
        # Get enhanced cross-reference analysis
        intelligence = self.cross_ref_engine.process_with_documents(org_id)
        
        # Traditional inventory analysis
        inventory_analysis = self._analyze_inventory_traditional(input_data)
        
        # Enhanced recommendations with document intelligence
        enhanced_recommendations = self._generate_document_aware_recommendations(
            inventory_analysis, intelligence
        )
        
        # Real-time alerts
        real_time_alerts = self._generate_real_time_alerts(intelligence)
        
        # Compromised inventory analysis
        compromised_analysis = self._analyze_compromised_inventory(intelligence)
        
        return {
            **inventory_analysis,
            'document_intelligence': intelligence['document_intelligence'],
            'compromised_inventory': intelligence['inventory_intelligence'],
            'real_cost_analysis': intelligence['cost_intelligence'],
            'timeline_analysis': intelligence['timeline_intelligence'],
            'predictive_intelligence': intelligence['predictive_intelligence'],
            'enhanced_recommendations': enhanced_recommendations,
            'real_time_alerts': real_time_alerts,
            'triangle_4d_score': intelligence['triangle_4d_score'],
            'compromised_analysis': compromised_analysis
        }
    
    def _analyze_inventory_traditional(self, input_data: Dict) -> Dict:
        """Traditional inventory analysis using base agent capabilities"""
        
        # Create a context for the base agent
        from agent_protocol.core.agent_context import AgentContext
        
        context = AgentContext(
            org_id=input_data.get('org_id'),
            input_data=input_data,
            current_state="analyzing_inventory"
        )
        
        # Execute base agent logic
        result = self._execute_core_logic(context)
        
        if result.success:
            return {
                'summary': result.data.get('summary', {}),
                'metrics': result.data.get('metrics', {}),
                'stockout_risks': result.data.get('stockout_risks', []),
                'overstock_items': result.data.get('overstock_items', []),
                'insights': result.data.get('insights', []),
                'actions': [action.__dict__ for action in result.actions],
                'recommendations': [rec.__dict__ for rec in result.recommendations]
            }
        else:
            return {
                'summary': {'message': 'Traditional analysis failed'},
                'metrics': {},
                'stockout_risks': [],
                'overstock_items': [],
                'insights': [],
                'actions': [],
                'recommendations': [],
                'error': result.message
            }
    
    def _generate_document_aware_recommendations(self, inventory_analysis: Dict, 
                                               intelligence: Dict) -> List[Dict]:
        """Generate recommendations that consider document intelligence"""
        
        recommendations = []
        
        # Compromised inventory recommendations
        compromised = intelligence.get('inventory_intelligence', {})
        for opportunity in compromised.get('recovery_opportunities', []):
            recommendations.append({
                'type': 'supplier_recovery',
                'priority': opportunity.get('priority', 'medium'),
                'supplier': opportunity['supplier'],
                'action': f"Contact {opportunity['supplier']} to recover ${opportunity['total_impact']:,.2f}",
                'expected_recovery': opportunity['total_impact'] * 0.6,
                'timeline': '2-4 weeks',
                'confidence': 0.85,
                'impact': 'high' if opportunity.get('high_severity_count', 0) > 0 else 'medium'
            })
        
        # Cost optimization recommendations
        cost_intel = intelligence.get('cost_intelligence', {})
        for opp in cost_intel.get('cost_optimization_opportunities', []):
            recommendations.append({
                'type': 'cost_optimization',
                'priority': opp.get('priority', 'medium'),
                'supplier': opp['supplier'],
                'action': f"Renegotiate pricing with {opp['supplier']}",
                'potential_savings': opp['potential_savings'],
                'timeline': '4-8 weeks',
                'confidence': 0.75,
                'impact': 'medium'
            })
        
        # Document compliance recommendations
        doc_intel = intelligence.get('document_intelligence', {})
        if doc_intel.get('compliance_score', 100) < 90:
            recommendations.append({
                'type': 'document_compliance',
                'priority': 'high',
                'action': 'Improve document compliance processes',
                'details': f"Current compliance score: {doc_intel['compliance_score']:.1f}%",
                'timeline': '1-2 weeks',
                'confidence': 0.9,
                'impact': 'high'
            })
        
        # Timeline optimization recommendations
        timeline_intel = intelligence.get('timeline_intelligence', {})
        if timeline_intel.get('delayed_shipments'):
            recommendations.append({
                'type': 'timeline_optimization',
                'priority': 'medium',
                'action': 'Address delayed shipments',
                'details': f"{len(timeline_intel['delayed_shipments'])} delayed shipments detected",
                'timeline': '2-3 weeks',
                'confidence': 0.8,
                'impact': 'medium'
            })
        
        return recommendations
    
    def _generate_real_time_alerts(self, intelligence: Dict) -> List[Dict]:
        """Generate real-time alerts based on intelligence analysis"""
        
        alerts = []
        
        # Compromised inventory alerts
        compromised = intelligence.get('inventory_intelligence', {})
        if compromised.get('total_compromised_items', 0) > 0:
            alerts.append({
                'type': 'inventory_compromise',
                'severity': 'high',
                'title': 'Inventory Compromise Detected',
                'message': f"{compromised['total_compromised_items']} items compromised with ${compromised['total_financial_impact']:,.2f} impact",
                'timestamp': datetime.utcnow().isoformat(),
                'action_required': 'Immediate review of compromised items'
            })
        
        # Cost variance alerts
        cost_intel = intelligence.get('cost_intelligence', {})
        if abs(cost_intel.get('total_cost_variance', 0)) > 10000:
            alerts.append({
                'type': 'cost_variance',
                'severity': 'medium',
                'title': 'Significant Cost Variance',
                'message': f"Total cost variance: ${cost_intel['total_cost_variance']:,.2f}",
                'timestamp': datetime.utcnow().isoformat(),
                'action_required': 'Review supplier pricing and contracts'
            })
        
        # Document compliance alerts
        doc_intel = intelligence.get('document_intelligence', {})
        if doc_intel.get('compliance_score', 100) < 80:
            alerts.append({
                'type': 'document_compliance',
                'severity': 'medium',
                'title': 'Document Compliance Issues',
                'message': f"Compliance score: {doc_intel['compliance_score']:.1f}%",
                'timestamp': datetime.utcnow().isoformat(),
                'action_required': 'Review document processing and compliance procedures'
            })
        
        # Timeline alerts
        timeline_intel = intelligence.get('timeline_intelligence', {})
        if timeline_intel.get('delayed_shipments'):
            high_severity_delays = [d for d in timeline_intel['delayed_shipments'] if d.get('severity') == 'high']
            if high_severity_delays:
                alerts.append({
                    'type': 'timeline_delay',
                    'severity': 'high',
                    'title': 'Critical Shipment Delays',
                    'message': f"{len(high_severity_delays)} high-severity delays detected",
                    'timestamp': datetime.utcnow().isoformat(),
                    'action_required': 'Immediate supplier communication required'
                })
        
        return alerts
    
    def _analyze_compromised_inventory(self, intelligence: Dict) -> Dict:
        """Detailed analysis of compromised inventory"""
        
        compromised = intelligence.get('inventory_intelligence', {})
        
        analysis = {
            'summary': {
                'total_compromised': compromised.get('total_compromised_items', 0),
                'total_impact': compromised.get('total_financial_impact', 0),
                'recovery_potential': compromised.get('total_financial_impact', 0) * 0.6,
                'risk_level': self._calculate_overall_risk_level(compromised)
            },
            'by_supplier': {},
            'by_category': {},
            'recovery_plan': []
        }
        
        # Analyze by supplier
        for supplier, issues in compromised.get('compromised_by_supplier', {}).items():
            total_impact = sum(issue.get('impact', 0) for issue in issues)
            high_severity = len([i for i in issues if i.get('severity') == 'high'])
            
            analysis['by_supplier'][supplier] = {
                'issue_count': len(issues),
                'total_impact': total_impact,
                'high_severity_count': high_severity,
                'risk_level': 'high' if high_severity > 0 else 'medium',
                'recovery_potential': total_impact * 0.6
            }
        
        # Generate recovery plan
        for supplier, data in analysis['by_supplier'].items():
            if data['risk_level'] == 'high':
                analysis['recovery_plan'].append({
                    'supplier': supplier,
                    'priority': 'immediate',
                    'action': 'Emergency supplier meeting',
                    'timeline': '24-48 hours',
                    'expected_outcome': f"Recover ${data['recovery_potential']:,.2f}"
                })
            elif data['total_impact'] > 5000:
                analysis['recovery_plan'].append({
                    'supplier': supplier,
                    'priority': 'high',
                    'action': 'Supplier negotiation',
                    'timeline': '1-2 weeks',
                    'expected_outcome': f"Recover ${data['recovery_potential']:,.2f}"
                })
        
        return analysis
    
    def _calculate_overall_risk_level(self, compromised_data: Dict) -> str:
        """Calculate overall risk level based on compromised inventory"""
        
        total_impact = compromised_data.get('total_financial_impact', 0)
        high_risk_count = compromised_data.get('risk_distribution', {}).get('high_risk', 0)
        
        if total_impact > 50000 or high_risk_count > 5:
            return 'critical'
        elif total_impact > 20000 or high_risk_count > 2:
            return 'high'
        elif total_impact > 5000:
            return 'medium'
        else:
            return 'low'
    
    async def process_document_and_analyze(self, file_path: str, org_id: str, doc_type: str = 'auto') -> Dict:
        """Process a document and immediately analyze its impact on inventory"""
        
        # Process document with enhanced processor
        doc_result = await self.document_processor.process_and_link_document(file_path, org_id, doc_type)
        
        if not doc_result['success']:
            return {
                'success': False,
                'error': doc_result.get('error', 'Document processing failed'),
                'document_analysis': doc_result
            }
        
        # Analyze inventory with the new document data
        inventory_analysis = self.analyze_inventory_with_documents({'org_id': org_id})
        
        # Combine results
        return {
            'success': True,
            'document_processing': doc_result,
            'inventory_analysis': inventory_analysis,
            'alerts': doc_result.get('alerts', []) + inventory_analysis.get('real_time_alerts', []),
            'recommendations': inventory_analysis.get('enhanced_recommendations', []),
            'compromised_items': doc_result.get('inventory_updates', {}).get('compromised_items', [])
        }
    
    def get_4d_triangle_insights(self, org_id: str) -> Dict:
        """Get 4D triangle intelligence insights"""
        
        intelligence = self.cross_ref_engine.process_with_documents(org_id)
        triangle_score = intelligence.get('triangle_4d_score', {})
        
        insights = {
            'triangle_score': triangle_score,
            'improvement_areas': [],
            'strengths': [],
            'recommendations': []
        }
        
        # Identify improvement areas
        scores = {
            'service': triangle_score.get('service_score', 0),
            'cost': triangle_score.get('cost_score', 0),
            'capital': triangle_score.get('capital_score', 0),
            'document': triangle_score.get('document_score', 0)
        }
        
        min_score = min(scores.values())
        max_score = max(scores.values())
        
        for dimension, score in scores.items():
            if score == min_score:
                insights['improvement_areas'].append({
                    'dimension': dimension,
                    'score': score,
                    'priority': 'high',
                    'action': f"Focus on improving {dimension} intelligence"
                })
            elif score == max_score:
                insights['strengths'].append({
                    'dimension': dimension,
                    'score': score,
                    'note': f"Strong {dimension} performance"
                })
        
        # Generate recommendations
        balance_index = triangle_score.get('balance_index', 0)
        if balance_index < 0.8:
            insights['recommendations'].append({
                'type': 'balance',
                'priority': 'medium',
                'action': 'Improve balance across all dimensions',
                'details': f"Current balance index: {balance_index:.2f}"
            })
        
        return insights 