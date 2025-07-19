#!/usr/bin/env python3
"""
Enhanced Document Intelligence System Test
Tests the complete unified document intelligence protocol implementation
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.enhanced_document_processor import EnhancedDocumentProcessor
from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
from agent_protocol.agents.enhanced_inventory_agent import DocumentIntelligenceInventoryAgent
try:
    from agent_protocol.core.agent_types import AgentType
    AGENT_TYPE = AgentType.INVENTORY_MONITOR
except ImportError:
    AGENT_TYPE = "INVENTORY_MONITOR"
from models_enhanced import UnifiedTransaction, DocumentInventoryLink
from models import db, TradeDocument

class EnhancedDocumentIntelligenceTester:
    """Test suite for enhanced document intelligence system"""
    
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': [],
            'details': {}
        }
        self.org_id = "test_org_enhanced_001"
        
    async def run_all_tests(self):
        """Run all enhanced document intelligence tests"""
        
        print("🚀 Starting Enhanced Document Intelligence System Tests")
        print("=" * 60)
        
        # Test 1: Enhanced Document Processor
        await self.test_enhanced_document_processor()
        
        # Test 2: Enhanced Cross-Reference Engine
        await self.test_enhanced_cross_reference_engine()
        
        # Test 3: Enhanced Inventory Agent
        await self.test_enhanced_inventory_agent()
        
        # Test 4: 4D Triangle Scoring
        await self.test_4d_triangle_scoring()
        
        # Test 5: End-to-End Integration
        await self.test_end_to_end_integration()
        
        # Print results
        self.print_test_results()
        
    async def test_enhanced_document_processor(self):
        """Test enhanced document processor functionality"""
        
        print("\n📄 Testing Enhanced Document Processor...")
        
        try:
            processor = EnhancedDocumentProcessor()
            
            # Test initialization
            assert processor.cost_variance_threshold == 0.05
            assert processor.quantity_discrepancy_threshold == 0.05
            
            # Test transaction ID generation
            transaction_id = processor._generate_transaction_id('PO')
            assert transaction_id.startswith('PO-')
            assert len(transaction_id) > 10
            
            # Test date parsing
            test_date = processor._parse_date('2024-01-15')
            assert test_date is not None
            assert test_date.year == 2024
            assert test_date.month == 1
            assert test_date.day == 15
            
            # Test invalid date parsing
            invalid_date = processor._parse_date('invalid-date')
            assert invalid_date is None
            
            self.test_results['passed'] += 1
            self.test_results['details']['enhanced_document_processor'] = 'PASSED'
            print("✅ Enhanced Document Processor tests passed")
            
        except Exception as e:
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Enhanced Document Processor: {str(e)}")
            self.test_results['details']['enhanced_document_processor'] = f'FAILED: {str(e)}'
            print(f"❌ Enhanced Document Processor tests failed: {str(e)}")
    
    async def test_enhanced_cross_reference_engine(self):
        """Test enhanced cross-reference engine functionality"""
        
        print("\n🔄 Testing Enhanced Cross-Reference Engine...")
        
        try:
            engine = DocumentEnhancedCrossReferenceEngine()
            
            # Test initialization
            assert engine.risk_thresholds['high_cost_variance'] == 0.20
            assert engine.risk_thresholds['delayed_shipment_days'] == 45
            
            # Test document compliance analysis
            doc_analysis = engine._analyze_document_compliance([])
            assert doc_analysis['total_documents'] == 0
            assert doc_analysis['compliance_score'] == 0
            
            # Test inventory compromise analysis
            compromised_analysis = engine._analyze_inventory_compromise([])
            assert compromised_analysis['total_compromised_items'] == 0
            assert compromised_analysis['total_financial_impact'] == 0
            
            # Test cost analysis
            cost_analysis = engine._analyze_real_costs([])
            assert cost_analysis['total_cost_variance'] == 0
            assert 'cost_distribution' in cost_analysis
            
            # Test timeline analysis
            timeline_analysis = engine._analyze_supply_chain_timeline([])
            assert timeline_analysis['average_po_to_receipt'] == 0
            assert 'timeline_performance' in timeline_analysis
            
            # Test predictive insights
            predictive_analysis = engine._generate_predictive_insights([], [])
            assert 'demand_forecast' in predictive_analysis
            assert 'cost_forecast' in predictive_analysis
            
            # Test 4D triangle scoring
            triangle_score = engine._calculate_4d_triangle_score({
                'document_intelligence': {'compliance_score': 75}
            })
            assert 'overall_4d_score' in triangle_score
            assert 'balance_index' in triangle_score
            
            self.test_results['passed'] += 1
            self.test_results['details']['enhanced_cross_reference_engine'] = 'PASSED'
            print("✅ Enhanced Cross-Reference Engine tests passed")
            
        except Exception as e:
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"Enhanced Cross-Reference Engine: {str(e)}")
            self.test_results['details']['enhanced_cross_reference_engine'] = f'FAILED: {str(e)}'
            print(f"❌ Enhanced Cross-Reference Engine tests failed: {str(e)}")
    
    async def test_enhanced_inventory_agent(self):
        """Test enhanced inventory agent functionality"""
        print("\n🤖 Testing Enhanced Inventory Agent...")
        from main import app
        with app.app_context():
            try:
                agent = DocumentIntelligenceInventoryAgent()
                # Test initialization
                assert hasattr(agent, 'cross_ref_engine')
                assert hasattr(agent, 'document_processor')
                # Test document-aware recommendations
                recommendations = agent._generate_document_aware_recommendations(
                    {}, {'inventory_intelligence': {'recovery_opportunities': []}}
                )
                assert isinstance(recommendations, list)
                # Test real-time alerts
                alerts = agent._generate_real_time_alerts({
                    'inventory_intelligence': {'total_compromised_items': 0}
                })
                assert isinstance(alerts, list)
                # Test compromised inventory analysis
                compromised_analysis = agent._analyze_compromised_inventory({
                    'inventory_intelligence': {'total_compromised_items': 0}
                })
                assert 'summary' in compromised_analysis
                assert 'recovery_plan' in compromised_analysis
                # Test risk level calculation
                risk_level = agent._calculate_overall_risk_level({
                    'total_financial_impact': 0,
                    'risk_distribution': {'high_risk': 0}
                })
                assert risk_level in ['low', 'medium', 'high', 'critical']
                # Test 4D triangle insights
                insights = agent.get_4d_triangle_insights(self.org_id)
                assert 'triangle_score' in insights
                assert 'improvement_areas' in insights
                self.test_results['passed'] += 1
                self.test_results['details']['enhanced_inventory_agent'] = 'PASSED'
                print("✅ Enhanced Inventory Agent tests passed")
            except Exception as e:
                self.test_results['failed'] += 1
                self.test_results['errors'].append(f"Enhanced Inventory Agent: {str(e)}")
                self.test_results['details']['enhanced_inventory_agent'] = f'FAILED: {str(e)}'
                print(f"❌ Enhanced Inventory Agent tests failed: {str(e)}")
    
    async def test_4d_triangle_scoring(self):
        """Test 4D triangle scoring functionality"""
        
        print("\n📊 Testing 4D Triangle Scoring...")
        
        try:
            engine = DocumentEnhancedCrossReferenceEngine()
            
            # Test with balanced scores
            balanced_scores = {
                'document_intelligence': {'compliance_score': 80},
                'traditional_intelligence': {}
            }
            triangle_score = engine._calculate_4d_triangle_score(balanced_scores)
            
            assert triangle_score['service_score'] == 80
            assert triangle_score['cost_score'] == 85
            assert triangle_score['capital_score'] == 75
            assert triangle_score['document_score'] == 80
            assert 'overall_4d_score' in triangle_score
            assert 'balance_index' in triangle_score
            assert 'improvement_priority' in triangle_score
            assert 'strongest_dimension' in triangle_score
            
            # Test balance index calculation
            balance_index = triangle_score['balance_index']
            assert 0 <= balance_index <= 1
            
            # Test improvement priority
            improvement_priority = triangle_score['improvement_priority']
            assert improvement_priority == 75  # Should be the minimum score
            
            self.test_results['passed'] += 1
            self.test_results['details']['4d_triangle_scoring'] = 'PASSED'
            print("✅ 4D Triangle Scoring tests passed")
            
        except Exception as e:
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"4D Triangle Scoring: {str(e)}")
            self.test_results['details']['4d_triangle_scoring'] = f'FAILED: {str(e)}'
            print(f"❌ 4D Triangle Scoring tests failed: {str(e)}")
    
    async def test_end_to_end_integration(self):
        """Test end-to-end integration of enhanced system"""
        print("\n🔗 Testing End-to-End Integration...")
        from main import app
        with app.app_context():
            try:
                # Test complete workflow
                processor = EnhancedDocumentProcessor()
                engine = DocumentEnhancedCrossReferenceEngine()
                agent = DocumentIntelligenceInventoryAgent()
                # Simulate document processing
                mock_extracted_data = {
                    'line_items': [
                        {
                            'item_code': 'TEST-SKU-001',
                            'description': 'Test Product',
                            'quantity': 100,
                            'unit_price': 10.0,
                            'total': 1000.0
                        }
                    ],
                    'confidence': 0.95,
                    'order_date': '2024-01-15',
                    'delivery_date': '2024-02-15',
                    'supplier_name': 'Test Supplier',
                    'currency': 'USD'
                }
            
                # Test unified transaction creation
                transactions = processor._create_unified_transactions(
                    mock_extracted_data, 'purchase_order', self.org_id, 'test-doc-001'
                )
            
                assert len(transactions) == 1
                transaction = transactions[0]
                assert transaction.sku == 'TEST-SKU-001'
                assert transaction.transaction_type == 'PURCHASE'
                assert transaction.committed_quantity == 100
                assert transaction.planned_cost == 1000.0
            
                # Test cross-referencing
                cross_ref_results = processor._cross_reference_with_existing(transactions, self.org_id)
                assert 'cost_variances' in cross_ref_results
                assert 'quantity_discrepancies' in cross_ref_results
            
                # Test inventory status update
                inventory_updates = processor._update_inventory_status(transactions, cross_ref_results, self.org_id)
                assert 'compromised_items' in inventory_updates
            
                # Test alert generation
                alerts = processor._generate_inventory_alerts(inventory_updates)
                assert isinstance(alerts, list)
            
                # Test agent analysis
                agent_analysis = agent.analyze_inventory_with_documents({'org_id': self.org_id})
                assert 'document_intelligence' in agent_analysis
                assert 'compromised_inventory' in agent_analysis
                assert 'triangle_4d_score' in agent_analysis
            
                self.test_results['passed'] += 1
                self.test_results['details']['end_to_end_integration'] = 'PASSED'
                print("✅ End-to-End Integration tests passed")
            except Exception as e:
                self.test_results['failed'] += 1
                self.test_results['errors'].append(f"End-to-End Integration: {str(e)}")
                self.test_results['details']['end_to_end_integration'] = f'FAILED: {str(e)}'
                print(f"❌ End-to-End Integration tests failed: {str(e)}")
    
    def print_test_results(self):
        """Print comprehensive test results"""
        
        print("\n" + "=" * 60)
        print("📋 Enhanced Document Intelligence Test Results")
        print("=" * 60)
        
        total_tests = self.test_results['passed'] + self.test_results['failed']
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {self.test_results['passed']} ✅")
        print(f"Failed: {self.test_results['failed']} ❌")
        
        if total_tests > 0:
            success_rate = (self.test_results['passed'] / total_tests) * 100
            print(f"Success Rate: {success_rate:.1f}%")
        
        print("\n📝 Detailed Results:")
        for test_name, result in self.test_results['details'].items():
            status = "✅ PASSED" if result == 'PASSED' else f"❌ {result}"
            print(f"  {test_name}: {status}")
        
        if self.test_results['errors']:
            print("\n🚨 Errors:")
            for error in self.test_results['errors']:
                print(f"  - {error}")
        
        print("\n" + "=" * 60)
        
        if self.test_results['failed'] == 0:
            print("🎉 All Enhanced Document Intelligence tests passed!")
            print("🚀 System is ready for production deployment!")
        else:
            print("⚠️  Some tests failed. Please review and fix issues before deployment.")
        
        print("=" * 60)

async def main():
    """Main test runner"""
    
    # Create test instance
    tester = EnhancedDocumentIntelligenceTester()
    
    # Run all tests
    await tester.run_all_tests()
    
    # Return exit code
    return 0 if tester.test_results['failed'] == 0 else 1

if __name__ == "__main__":
    # Run tests
    exit_code = asyncio.run(main())
    sys.exit(exit_code) 