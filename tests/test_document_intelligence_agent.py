"""
Test suite for Document Intelligence Agent
Validates core functionality, API integration, and error handling
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from typing import Dict, Any

from agent_protocol.agents.document_intelligence_agent import DocumentIntelligenceAgent
from agent_protocol.core.agent_types import AgentType
from agent_protocol.core.agent_context import AgentContext
from agent_protocol.core.agent_result import AgentResult
from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
from models import TradeDocument
from models_enhanced import UnifiedTransaction


class TestDocumentIntelligenceAgent:
    """Test cases for DocumentIntelligenceAgent."""
    
    @pytest.fixture
    def agent(self):
        """Create a test agent instance."""
        from agent_protocol.core.agent_types import AgentType
        return DocumentIntelligenceAgent(
            agent_id="test_doc_intel_agent",
            agent_type=AgentType.DOCUMENT_INTELLIGENCE,
            name="Test Document Intelligence Agent",
            description="Test agent for document intelligence",
            config={
                'analysis_depth': 'comprehensive',
                'enable_predictive_insights': True
            }
        )
    
    @pytest.fixture
    def mock_context(self):
        """Create a mock agent context."""
        context = Mock(spec=AgentContext)
        context.org_id = "test_org_123"
        context.user_id = "test_user_456"
        context.input_data = {"query": "analyze documents"}
        context.conversation_history = []
        context.reasoning_steps = []
        context.tokens_used = 0
        context.add_reasoning_step = Mock()
        return context
    
    @pytest.fixture
    def mock_documents(self):
        """Create mock trade documents."""
        docs = []
        for i in range(5):
            doc = Mock()
            doc.id = f"doc_{i}"
            doc.processing_status = 'completed' if i < 3 else 'pending'
            doc.confidence_score = 0.85 if i < 3 else 0.6
            doc.compliance_status = 'compliant' if i < 4 else 'non_compliant'
            doc.document_type = 'invoice' if i % 2 == 0 else 'purchase_order'
            doc.document_date = datetime(2024, 1, 1 + i)
            doc.upload_date = datetime(2024, 1, 1 + i)  # Make it sortable
            docs.append(doc)
        return docs
    
    @pytest.fixture
    def mock_transactions(self):
        """Create mock unified transactions."""
        transactions = []
        for i in range(3):
            transaction = Mock()
            transaction.id = f"trans_{i}"
            transaction.org_id = "test_org_123"
            transaction.transaction_date = datetime(2024, 1, 1 + i)
            transaction.amount = 1000.0 + (i * 100)
            transaction.status = "completed"
            transactions.append(transaction)
        return transactions
    
    def test_agent_initialization(self, agent):
        """Test agent initialization and configuration."""
        assert agent.agent_id == "test_doc_intel_agent"
        assert agent.name == "Test Document Intelligence Agent"
        assert agent.agent_type == AgentType.DOCUMENT_INTELLIGENCE
        assert agent.enhanced_engine is not None
        assert isinstance(agent.enhanced_engine, DocumentEnhancedCrossReferenceEngine)
        
        # Check capabilities
        expected_capabilities = {
            'document_processing': True,
            'cross_reference_analysis': True,
            'compliance_monitoring': True,
            'risk_assessment': True,
            'cost_optimization': True,
            'predictive_insights': True,
            '4d_triangle_scoring': True
        }
        assert agent.capabilities == expected_capabilities
    
    def test_agent_without_org_id(self, agent, mock_context):
        """Test agent execution without organization ID."""
        mock_context.org_id = None
        
        result = agent._execute_core_logic(mock_context)
        
        assert result.success is False
        assert "Organization ID is required" in result.message
        assert result.error_type == "MissingParameter"
    
    @patch('agent_protocol.agents.document_intelligence_agent.TradeDocument')
    @patch('agent_protocol.agents.document_intelligence_agent.DocumentEnhancedCrossReferenceEngine')
    def test_comprehensive_analysis_success(self, mock_engine_class, mock_doc_model,
                                          agent, mock_context, mock_documents, mock_transactions):
        """Test successful comprehensive analysis execution."""
        # Mock the enhanced engine
        mock_engine = Mock()
        mock_engine.process_with_documents.return_value = {
            'traditional_intelligence': {'score': 85},
            'document_intelligence': {'compliance_score': 80},
            'inventory_intelligence': {'compromised_count': 1},
            'cost_intelligence': {'total_variance': 50},
            'timeline_intelligence': {'avg_delivery_time': 15},
            'predictive_intelligence': {'risk_trend': 'stable'},
            'triangle_4d_score': {'overall_score': 78}
        }
        mock_engine_class.return_value = mock_engine
        
        # Replace the agent's enhanced engine with our mock
        agent.enhanced_engine = mock_engine

        # Mock document query
        mock_doc_model.query.filter_by.return_value.all.return_value = mock_documents

        result = agent._execute_core_logic(mock_context)

        # Verify success
        assert result.success is True
        assert "Document intelligence analysis completed" in result.message
        assert result.confidence > 0
        
        # Verify analysis data structure
        data = result.data
        assert 'analysis' in data
        assert 'insights' in data
        assert 'capabilities_used' in data
        assert 'analysis_timestamp' in data
        assert data['org_id'] == "test_org_123"
        
        # Verify enhanced engine was called
        mock_engine.process_with_documents.assert_called_once_with("test_org_123")
        
        # Verify reasoning steps were added
        assert mock_context.add_reasoning_step.call_count >= 3
    
    @patch('agent_protocol.agents.document_intelligence_agent.TradeDocument')
    def test_enhance_document_analysis(self, mock_doc_model, agent, mock_documents):
        """Test document analysis enhancement."""
        mock_doc_model.query.filter_by.return_value.all.return_value = mock_documents
        
        enhanced_analysis = agent._enhance_document_analysis("test_org_123")
        
        # Verify structure
        assert 'document_processing_metrics' in enhanced_analysis
        assert 'compliance_trends' in enhanced_analysis
        assert 'risk_patterns' in enhanced_analysis
        assert 'optimization_opportunities' in enhanced_analysis
        assert 'predictive_indicators' in enhanced_analysis
        
        # Verify metrics calculation
        metrics = enhanced_analysis['document_processing_metrics']
        assert metrics['total_documents'] == 5
        assert metrics['processed_documents'] == 3  # Only 3 docs are marked as completed
        
        # Verify compliance trends
        compliance = enhanced_analysis['compliance_trends']
        assert compliance['compliance_rate'] == 80.0  # 4 out of 5 docs are compliant
        assert compliance['non_compliant_count'] == 1
    
    def test_identify_compliance_issues(self, agent, mock_documents):
        """Test compliance issue identification."""
        issues = agent._identify_compliance_issues(mock_documents)

        assert len(issues) == 1  # Only one document has compliance issues

        issue = issues[0]
        assert issue['document_id'] == 'doc_4'  # The last document is non_compliant
        assert issue['issue_type'] == 'non_compliant'
        assert 'recommended_action' in issue
    
    def test_get_compliance_recommendation(self, agent):
        """Test compliance recommendation generation."""
        # Test different compliance statuses
        test_cases = [
            ('missing_fields', 'Review and complete missing required fields'),
            ('invalid_format', 'Reformat document according to standard template'),
            ('expired', 'Obtain updated document with valid expiration date'),
            ('incomplete', 'Complete all required sections of the document'),
            ('unknown_status', 'Review document for compliance requirements')
        ]
        
        for status, expected in test_cases:
            # Create a simple mock object instead of using SQLAlchemy model
            doc = Mock()
            doc.compliance_status = status
            
            recommendation = agent._get_compliance_recommendation(doc)
            assert recommendation == expected
    
    def test_identify_risk_patterns(self, agent, mock_documents):
        """Test risk pattern identification."""
        patterns = agent._identify_risk_patterns(mock_documents)
        
        assert 'high_risk_document_types' in patterns
        assert 'confidence_trends' in patterns
        assert 'processing_anomalies' in patterns
        assert 'risk_distribution' in patterns
        
        # Verify risk distribution
        distribution = patterns['risk_distribution']
        assert distribution['low'] == 3  # 3 docs with confidence > 0.8
        assert distribution['medium'] == 2  # 2 docs with confidence <= 0.8
    
    def test_identify_optimization_opportunities(self, agent, mock_documents):
        """Test optimization opportunity identification."""
        opportunities = agent._identify_optimization_opportunities(mock_documents)
        
        assert len(opportunities) >= 1  # At least one opportunity should be found
        
        # Check for confidence improvement opportunity
        confidence_opp = next((opp for opp in opportunities if opp['type'] == 'confidence_improvement'), None)
        if confidence_opp:
            assert confidence_opp['priority'] == 'high'
            assert 'Improve extraction confidence' in confidence_opp['description']
    
    def test_generate_predictive_indicators(self, agent, mock_documents):
        """Test predictive indicator generation."""
        indicators = agent._generate_predictive_indicators(mock_documents)
        
        assert 'processing_quality_trend' in indicators
        assert 'compliance_risk_trend' in indicators
        assert 'volume_predictions' in indicators
        assert 'risk_forecast' in indicators
        
        # Verify trend values
        assert indicators['processing_quality_trend'] in ['stable', 'improving', 'declining']
        assert indicators['compliance_risk_trend'] in ['stable', 'improving', 'declining']
    
    def test_generate_insights(self, agent, mock_context):
        """Test insight generation from analysis results."""
        analysis_result = {
            'document_intelligence': {'compliance_score': 75},
            'document_intelligence_enhanced': {
                'document_processing_metrics': {'processing_rate': 90},
                'optimization_opportunities': [
                    {
                        'type': 'confidence_improvement',
                        'priority': 'high',
                        'description': 'Improve extraction confidence'
                    }
                ]
            },
            'triangle_4d_score': {'overall_score': 72}
        }
        
        insights = agent._generate_insights(analysis_result, mock_context)
        
        assert 'key_findings' in insights
        assert 'recommendations' in insights
        assert 'risk_alerts' in insights
        assert 'optimization_opportunities' in insights
        assert 'predictive_insights' in insights
        
        # Verify key findings
        findings = insights['key_findings']
        assert len(findings) >= 1
        compliance_finding = next((f for f in findings if f['type'] == 'compliance_issue'), None)
        if compliance_finding:
            assert compliance_finding['severity'] == 'high'
            assert '75.0%' in compliance_finding['description']
    
    def test_interpret_triangle_score(self, agent):
        """Test 4D triangle score interpretation."""
        test_cases = [
            (90, "Excellent 4D balance - all dimensions optimized"),
            (75, "Good 4D balance - minor optimizations possible"),
            (60, "Moderate 4D balance - significant improvements needed"),
            (30, "Poor 4D balance - critical attention required")
        ]
        
        for score, expected in test_cases:
            triangle_score = {'overall_score': score}
            interpretation = agent._interpret_triangle_score(triangle_score)
            assert interpretation == expected
    
    def test_calculate_analysis_confidence(self, agent):
        """Test confidence calculation."""
        # Test with comprehensive data
        analysis_result = {
            'document_intelligence_enhanced': {
                'document_processing_metrics': {
                    'processing_rate': 95,
                    'high_confidence_rate': 90
                }
            },
            'traditional_intelligence': {'score': 85},
            'document_intelligence': {'compliance_score': 80},
            'triangle_4d_score': {'overall_score': 78}
        }
        
        confidence = agent._calculate_analysis_confidence(analysis_result)
        assert 0.7 <= confidence <= 1.0  # Should be reasonably high with good data
        
        # Test with minimal data
        minimal_result = {}
        confidence_minimal = agent._calculate_analysis_confidence(minimal_result)
        assert confidence_minimal == 0.5  # Default confidence
    
    def test_get_tool_descriptions(self, agent):
        """Test tool description generation."""
        tools = agent.get_tool_descriptions()
        
        assert len(tools) >= 3
        
        # Check for expected tools
        tool_names = [tool['name'] for tool in tools]
        assert 'analyze_documents' in tool_names
        assert 'get_compliance_report' in tool_names
        assert 'identify_risks' in tool_names
        
        # Verify tool structure
        for tool in tools:
            assert 'name' in tool
            assert 'description' in tool
            assert 'parameters' in tool
    
    @patch('agent_protocol.agents.document_intelligence_agent.DocumentEnhancedCrossReferenceEngine')
    def test_agent_execution_exception_handling(self, mock_engine_class, agent, mock_context):
        """Test exception handling during agent execution."""
        # Mock engine to raise exception
        mock_engine = Mock()
        mock_engine.process_with_documents.side_effect = Exception("Database connection failed")
        mock_engine_class.return_value = mock_engine
        
        result = agent._execute_core_logic(mock_context)
        
        assert result.success is False
        assert "Document intelligence analysis failed" in result.message
        assert result.error_type == "RuntimeError"


class TestDocumentIntelligenceAgentIntegration:
    """Integration tests for DocumentIntelligenceAgent with API."""
    
    @pytest.fixture
    def app(self):
        """Create test Flask app with in-memory database."""
        from flask import Flask
        from routes.agent_api import agent_api
        from models import db
        
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(app)
        
        with app.app_context():
            db.create_all()
        
        app.register_blueprint(agent_api)
        return app
    
    @pytest.fixture
    def client(self, app):
        """Create test client."""
        return app.test_client()
    
    def test_create_document_intelligence_agent_api(self, client):
        """Test creating document intelligence agent via API."""
        headers = {
            'Content-Type': 'application/json',
            'X-User-Id': 'test_user',
            'X-Organization-Id': 'test_org'
        }
        
        data = {
            'name': 'Test Document Intelligence Agent',
            'type': 'document_intelligence',
            'description': 'Test agent for document intelligence analysis',
            'config': {
                'analysis_depth': 'comprehensive',
                'enable_predictive_insights': True
            }
        }
        
        response = client.post('/agents', json=data, headers=headers)
        
        assert response.status_code == 201
        response_data = json.loads(response.data)
        assert response_data['success'] is True
        assert response_data['agent']['type'] == 'document_intelligence'
        assert response_data['agent']['name'] == 'Test Document Intelligence Agent'
    
    def test_create_invalid_agent_type_api(self, client):
        """Test API rejection of invalid agent type."""
        headers = {
            'Content-Type': 'application/json',
            'X-User-Id': 'test_user',
            'X-Organization-Id': 'test_org'
        }
        
        data = {
            'name': 'Invalid Agent',
            'type': 'invalid_type',
            'description': 'This should fail'
        }
        
        response = client.post('/agents', json=data, headers=headers)
        
        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert 'Invalid agent type' in response_data['error']
    
    def test_missing_required_fields_api(self, client):
        """Test API validation of required fields."""
        headers = {
            'Content-Type': 'application/json',
            'X-User-Id': 'test_user',
            'X-Organization-Id': 'test_org'
        }
        
        data = {
            'name': 'Incomplete Agent'
            # Missing type and description
        }
        
        response = client.post('/agents', json=data, headers=headers)
        
        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert 'Missing required field' in response_data['error']


if __name__ == '__main__':
    pytest.main([__file__, '-v']) 