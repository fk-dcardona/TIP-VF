"""
Document Intelligence Agent for Unified Document Intelligence Protocol
Integrates enhanced cross-reference engine with document processing capabilities
"""

from typing import Dict, Any, List, Optional
import json
import logging
from datetime import datetime

from .base_llm_agent import BaseLLMAgent
from ..core.agent_result import AgentResult
from ..core.agent_context import AgentContext
from ..core.agent_types import AgentType
from backend.services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
from models_enhanced import UnifiedTransaction, DocumentInventoryLink
from models import TradeDocument


class DocumentIntelligenceAgent(BaseLLMAgent):
    """Agent for unified document intelligence and cross-reference analysis."""
    
    def __init__(self, agent_id: str, agent_type: AgentType, name: str, description: str, config: Dict[str, Any]):
        """Initialize document intelligence agent."""
        # Set default config if not provided
        if not config:
            config = {
                'max_conversation_length': 15,
                'analysis_depth': 'comprehensive',
                'enable_predictive_insights': True,
                'enable_risk_assessment': True,
                'enable_cost_optimization': True
            }
        
        super().__init__(agent_id, agent_type, name, description, config)
        
        # Initialize enhanced cross-reference engine
        self.enhanced_engine = DocumentEnhancedCrossReferenceEngine()
        
        # Document intelligence capabilities
        self.capabilities = {
            'document_processing': True,
            'cross_reference_analysis': True,
            'compliance_monitoring': True,
            'risk_assessment': True,
            'cost_optimization': True,
            'predictive_insights': True,
            '4d_triangle_scoring': True
        }
        
        self.logger = logging.getLogger(__name__)
    
    def _initialize_tools(self):
        """Initialize agent-specific tools for document intelligence."""
        # Document intelligence tools will be registered here
        # For now, we'll use the enhanced engine as the main tool
        pass
    
    def get_system_prompt(self) -> str:
        """Get the system prompt for document intelligence agent."""
        return """You are a Document Intelligence Agent specializing in unified document intelligence protocol analysis.

Your capabilities include:
- Document processing and compliance monitoring
- Cross-reference analysis with enhanced 4D intelligence
- Risk assessment and pattern identification
- Cost optimization and predictive insights
- 4D triangle scoring (SERVICE, COST, CAPITAL, DOCUMENTS)

When analyzing documents and data:
1. Perform comprehensive 4D analysis using the enhanced cross-reference engine
2. Identify compliance issues and provide specific recommendations
3. Assess risk patterns and generate optimization opportunities
4. Calculate confidence scores based on data quality
5. Provide actionable insights with clear next steps

Always maintain high accuracy and provide evidence-based recommendations."""
    
    def _execute_core_logic(self, context: AgentContext) -> AgentResult:
        """Execute document intelligence analysis."""
        try:
            org_id = context.org_id
            if not org_id:
                return AgentResult(
                    success=False,
                    message="Organization ID is required for document intelligence analysis",
                    error_type="MissingParameter"
                )
            
            # Add reasoning steps
            context.add_reasoning_step("Initializing document intelligence analysis")
            context.add_reasoning_step(f"Processing data for organization: {org_id}")
            
            # Perform comprehensive analysis
            analysis_result = self._perform_comprehensive_analysis(org_id, context)
            
            # Generate insights and recommendations
            insights = self._generate_insights(analysis_result, context)
            
            # Calculate confidence based on data quality
            confidence = self._calculate_analysis_confidence(analysis_result)
            
            context.add_reasoning_step("Document intelligence analysis completed successfully")
            
            return AgentResult(
                success=True,
                message="Document intelligence analysis completed",
                data={
                    'analysis': analysis_result,
                    'insights': insights,
                    'capabilities_used': self.capabilities,
                    'analysis_timestamp': datetime.utcnow().isoformat(),
                    'org_id': org_id
                },
                confidence=confidence
            )
            
        except Exception as e:
            self.logger.error(f"Document intelligence analysis failed: {str(e)}", exc_info=True)
            return AgentResult(
                success=False,
                message=f"Document intelligence analysis failed: {str(e)}",
                error_type=type(e).__name__
            )
    
    def _perform_comprehensive_analysis(self, org_id: str, context: AgentContext) -> Dict[str, Any]:
        """Perform comprehensive document intelligence analysis."""
        
        context.add_reasoning_step("Starting comprehensive 4D analysis")
        
        # Get analysis from enhanced engine
        analysis = self.enhanced_engine.process_with_documents(org_id)
        
        # Add additional document-specific analysis
        analysis['document_intelligence_enhanced'] = self._enhance_document_analysis(org_id)
        
        # Add metadata
        analysis['metadata'] = {
            'analysis_type': 'comprehensive_4d',
            'timestamp': datetime.utcnow().isoformat(),
            'org_id': org_id,
            'engine_version': 'enhanced_v2.0'
        }
        
        context.add_reasoning_step("Comprehensive analysis completed")
        
        return analysis
    
    def _enhance_document_analysis(self, org_id: str) -> Dict[str, Any]:
        """Enhance document analysis with additional intelligence."""
        
        enhanced_analysis = {
            'document_processing_metrics': {},
            'compliance_trends': {},
            'risk_patterns': {},
            'optimization_opportunities': [],
            'predictive_indicators': {}
        }
        
        # Get document statistics
        documents = TradeDocument.query.filter_by(org_id=org_id).all()
        
        if documents:
            # Document processing metrics
            total_docs = len(documents)
            processed_docs = len([d for d in documents if d.processing_status == 'completed'])
            high_confidence_docs = len([d for d in documents if d.confidence_score and d.confidence_score > 0.8])
            
            enhanced_analysis['document_processing_metrics'] = {
                'total_documents': total_docs,
                'processed_documents': processed_docs,
                'processing_rate': (processed_docs / total_docs * 100) if total_docs > 0 else 0,
                'high_confidence_rate': (high_confidence_docs / total_docs * 100) if total_docs > 0 else 0,
                'average_confidence_score': sum(d.confidence_score or 0 for d in documents) / total_docs if total_docs > 0 else 0
            }
            
            # Compliance trends
            compliant_docs = len([d for d in documents if d.compliance_status == 'compliant'])
            enhanced_analysis['compliance_trends'] = {
                'compliance_rate': (compliant_docs / total_docs * 100) if total_docs > 0 else 0,
                'non_compliant_count': total_docs - compliant_docs,
                'compliance_issues': self._identify_compliance_issues(documents)
            }
            
            # Risk patterns
            enhanced_analysis['risk_patterns'] = self._identify_risk_patterns(documents)
            
            # Optimization opportunities
            enhanced_analysis['optimization_opportunities'] = self._identify_optimization_opportunities(documents)
            
            # Predictive indicators
            enhanced_analysis['predictive_indicators'] = self._generate_predictive_indicators(documents)
        
        return enhanced_analysis
    
    def _identify_compliance_issues(self, documents: List[TradeDocument]) -> List[Dict[str, Any]]:
        """Identify specific compliance issues in documents."""
        issues = []
        
        for doc in documents:
            if doc.compliance_status != 'compliant':
                issue = {
                    'document_id': doc.id,
                    'document_type': doc.document_type,
                    'issue_type': doc.compliance_status,
                    'severity': 'high' if doc.confidence_score and doc.confidence_score < 0.5 else 'medium',
                    'upload_date': doc.upload_date.isoformat() if doc.upload_date else None,
                    'recommended_action': self._get_compliance_recommendation(doc)
                }
                issues.append(issue)
        
        return issues
    
    def _get_compliance_recommendation(self, doc: TradeDocument) -> str:
        """Get specific recommendation for compliance issue."""
        if doc.compliance_status == 'missing_fields':
            return "Review and complete missing required fields"
        elif doc.compliance_status == 'invalid_format':
            return "Reformat document according to standard template"
        elif doc.compliance_status == 'expired':
            return "Obtain updated document with valid expiration date"
        elif doc.compliance_status == 'incomplete':
            return "Complete all required sections of the document"
        else:
            return "Review document for compliance requirements"
    
    def _identify_risk_patterns(self, documents: List[TradeDocument]) -> Dict[str, Any]:
        """Identify risk patterns across documents."""
        patterns = {
            'high_risk_document_types': {},
            'confidence_trends': {},
            'processing_anomalies': [],
            'risk_distribution': {'low': 0, 'medium': 0, 'high': 0}
        }
        
        # Analyze by document type
        doc_types = {}
        for doc in documents:
            if doc.document_type not in doc_types:
                doc_types[doc.document_type] = []
            doc_types[doc.document_type].append(doc)
        
        for doc_type, docs in doc_types.items():
            avg_confidence = sum(d.confidence_score or 0 for d in docs) / len(docs)
            compliance_rate = len([d for d in docs if d.compliance_status == 'compliant']) / len(docs)
            
            risk_score = (1 - avg_confidence) * 0.6 + (1 - compliance_rate) * 0.4
            
            if risk_score > 0.7:
                patterns['high_risk_document_types'][doc_type] = {
                    'risk_score': risk_score,
                    'document_count': len(docs),
                    'avg_confidence': avg_confidence,
                    'compliance_rate': compliance_rate
                }
        
        # Risk distribution
        for doc in documents:
            if doc.confidence_score:
                if doc.confidence_score < 0.5:
                    patterns['risk_distribution']['high'] += 1
                elif doc.confidence_score < 0.8:
                    patterns['risk_distribution']['medium'] += 1
                else:
                    patterns['risk_distribution']['low'] += 1
        
        return patterns
    
    def _identify_optimization_opportunities(self, documents: List[TradeDocument]) -> List[Dict[str, Any]]:
        """Identify optimization opportunities in document processing."""
        opportunities = []
        
        # Low confidence documents
        low_confidence_docs = [d for d in documents if d.confidence_score and d.confidence_score < 0.7]
        if low_confidence_docs:
            opportunities.append({
                'type': 'confidence_improvement',
                'priority': 'high',
                'description': f"Improve extraction confidence for {len(low_confidence_docs)} documents",
                'potential_impact': 'Reduce manual review by 60%',
                'recommended_action': 'Review and enhance extraction templates'
            })
        
        # Non-compliant documents
        non_compliant_docs = [d for d in documents if d.compliance_status != 'compliant']
        if non_compliant_docs:
            opportunities.append({
                'type': 'compliance_improvement',
                'priority': 'high',
                'description': f"Address compliance issues for {len(non_compliant_docs)} documents",
                'potential_impact': 'Reduce compliance risk by 80%',
                'recommended_action': 'Implement automated compliance validation'
            })
        
        # Processing efficiency
        if len(documents) > 10:
            opportunities.append({
                'type': 'processing_efficiency',
                'priority': 'medium',
                'description': 'Optimize document processing workflow',
                'potential_impact': 'Reduce processing time by 30%',
                'recommended_action': 'Implement batch processing and parallel extraction'
            })
        
        return opportunities
    
    def _generate_predictive_indicators(self, documents: List[TradeDocument]) -> Dict[str, Any]:
        """Generate predictive indicators based on document patterns."""
        indicators = {
            'processing_quality_trend': 'stable',
            'compliance_risk_trend': 'stable',
            'volume_predictions': {},
            'risk_forecast': {}
        }
        
        if len(documents) < 5:
            return indicators
        
        # Analyze trends over time
        recent_docs = sorted(documents, key=lambda x: x.upload_date or datetime.min)[-10:]
        older_docs = sorted(documents, key=lambda x: x.upload_date or datetime.min)[:10]
        
        if recent_docs and older_docs:
            recent_avg_confidence = sum(d.confidence_score or 0 for d in recent_docs) / len(recent_docs)
            older_avg_confidence = sum(d.confidence_score or 0 for d in older_docs) / len(older_docs)
            
            if recent_avg_confidence > older_avg_confidence + 0.1:
                indicators['processing_quality_trend'] = 'improving'
            elif recent_avg_confidence < older_avg_confidence - 0.1:
                indicators['processing_quality_trend'] = 'declining'
        
        # Volume predictions
        if len(documents) >= 20:
            monthly_volume = len([d for d in documents if d.upload_date and 
                                (datetime.utcnow() - d.upload_date).days <= 30])
            indicators['volume_predictions'] = {
                'current_monthly_volume': monthly_volume,
                'projected_next_month': int(monthly_volume * 1.1),  # 10% growth assumption
                'seasonal_factors': 'normal'
            }
        
        return indicators
    
    def _generate_insights(self, analysis_result: Dict[str, Any], context: AgentContext) -> Dict[str, Any]:
        """Generate actionable insights from analysis."""
        
        insights = {
            'key_findings': [],
            'recommendations': [],
            'risk_alerts': [],
            'optimization_opportunities': [],
            'predictive_insights': []
        }
        
        # Extract key findings
        if 'document_intelligence' in analysis_result:
            doc_intel = analysis_result['document_intelligence']
            if doc_intel.get('compliance_score', 0) < 90:
                insights['key_findings'].append({
                    'type': 'compliance_issue',
                    'severity': 'high',
                    'description': f"Compliance score is {doc_intel.get('compliance_score', 0):.1f}% - below target threshold",
                    'impact': 'Potential regulatory and operational risks'
                })
        
        # Generate recommendations
        if 'document_intelligence_enhanced' in analysis_result:
            enhanced = analysis_result['document_intelligence_enhanced']
            
            # Processing quality recommendations
            if enhanced.get('document_processing_metrics', {}).get('processing_rate', 0) < 95:
                insights['recommendations'].append({
                    'category': 'processing_efficiency',
                    'priority': 'high',
                    'action': 'Implement automated document validation',
                    'expected_impact': 'Increase processing rate to 98%'
                })
            
            # Risk alerts
            for opportunity in enhanced.get('optimization_opportunities', []):
                if opportunity.get('priority') == 'high':
                    insights['risk_alerts'].append({
                        'type': opportunity.get('type'),
                        'description': opportunity.get('description'),
                        'urgency': 'immediate_action_required'
                    })
        
        # 4D Triangle Score insights
        if 'triangle_4d_score' in analysis_result:
            triangle_score = analysis_result['triangle_4d_score']
            insights['predictive_insights'].append({
                'type': '4d_triangle_analysis',
                'score': triangle_score.get('overall_score', 0),
                'interpretation': self._interpret_triangle_score(triangle_score),
                'trend': 'stable'
            })
        
        context.add_reasoning_step(f"Generated {len(insights['key_findings'])} key findings and {len(insights['recommendations'])} recommendations")
        
        return insights
    
    def _interpret_triangle_score(self, triangle_score: Dict[str, Any]) -> str:
        """Interpret the 4D triangle score."""
        overall_score = triangle_score.get('overall_score', 0)
        
        if overall_score >= 85:
            return "Excellent 4D balance - all dimensions optimized"
        elif overall_score >= 70:
            return "Good 4D balance - minor optimizations possible"
        elif overall_score >= 50:
            return "Moderate 4D balance - significant improvements needed"
        else:
            return "Poor 4D balance - critical attention required"
    
    def _calculate_analysis_confidence(self, analysis_result: Dict[str, Any]) -> float:
        """Calculate confidence score for the analysis."""
        confidence_factors = []
        
        # Document processing quality
        if 'document_intelligence_enhanced' in analysis_result:
            enhanced = analysis_result['document_intelligence_enhanced']
            processing_metrics = enhanced.get('document_processing_metrics', {})
            
            if processing_metrics.get('total_documents', 0) > 0:
                processing_rate = processing_metrics.get('processing_rate', 0)
                confidence_rate = processing_metrics.get('high_confidence_rate', 0)
                
                confidence_factors.append(min(processing_rate / 100, 1.0))
                confidence_factors.append(min(confidence_rate / 100, 1.0))
        
        # Data completeness
        if 'traditional_intelligence' in analysis_result:
            confidence_factors.append(0.8)  # Traditional analysis available
        
        if 'document_intelligence' in analysis_result:
            confidence_factors.append(0.9)  # Document intelligence available
        
        # 4D Triangle Score
        if 'triangle_4d_score' in analysis_result:
            triangle_score = analysis_result['triangle_4d_score'].get('overall_score', 0)
            confidence_factors.append(min(triangle_score / 100, 1.0))
        
        # Calculate average confidence
        if confidence_factors:
            return sum(confidence_factors) / len(confidence_factors)
        else:
            return 0.5  # Default confidence
    
    def get_tool_descriptions(self) -> List[Dict[str, Any]]:
        """Get descriptions of available tools."""
        return [
            {
                'name': 'analyze_documents',
                'description': 'Perform comprehensive document intelligence analysis',
                'parameters': {
                    'org_id': {'type': 'string', 'description': 'Organization ID'},
                    'analysis_type': {'type': 'string', 'description': 'Type of analysis to perform'}
                }
            },
            {
                'name': 'get_compliance_report',
                'description': 'Generate compliance report for documents',
                'parameters': {
                    'org_id': {'type': 'string', 'description': 'Organization ID'},
                    'date_range': {'type': 'string', 'description': 'Date range for analysis'}
                }
            },
            {
                'name': 'identify_risks',
                'description': 'Identify risk patterns in document processing',
                'parameters': {
                    'org_id': {'type': 'string', 'description': 'Organization ID'},
                    'risk_type': {'type': 'string', 'description': 'Type of risk to analyze'}
                }
            }
        ] 