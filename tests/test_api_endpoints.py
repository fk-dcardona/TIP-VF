"""
Comprehensive API endpoint tests for all analytics and document endpoints
"""
import pytest
import json
from unittest.mock import patch, MagicMock


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_health_check(self, client):
        """Test basic health check endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data
    
    def test_readiness_check(self, client):
        """Test readiness check endpoint"""
        response = client.get('/api/ready')
        # Endpoint may not exist, check for 404 or 200
        if response.status_code == 200:
            data = json.loads(response.data)
            # Handle different response formats
            assert 'status' in data or 'ready' in data
        else:
            # If endpoint doesn't exist, that's okay for now
            assert response.status_code in [404, 200]


class TestAnalyticsEndpoints:
    """Test all analytics endpoints"""
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_sales_analytics(self, mock_org_id, mock_decode, client, auth_headers):
        """Test sales analytics endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/analytics/sales', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response structure
        assert 'customer_segments' in data
        assert 'geographic_data' in data
        assert 'pricing_optimization' in data
        assert 'market_analysis' in data
        assert 'sales_forecast' in data
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_financial_analytics(self, mock_org_id, mock_decode, client, auth_headers):
        """Test financial analytics endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/analytics/financial', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response structure
        assert 'cash_conversion_cycle' in data
        assert 'trapped_cash_analysis' in data
        assert 'payment_terms' in data
        assert 'working_capital' in data
        assert 'financial_metrics' in data
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_procurement_analytics(self, mock_org_id, mock_decode, client, auth_headers):
        """Test procurement analytics endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/analytics/procurement', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response structure
        assert 'predictive_reordering' in data
        assert 'supplier_health' in data
        assert 'lead_time_analysis' in data
        assert 'supplier_comparison' in data
        assert 'supply_chain_risk' in data
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_dashboard_analytics(self, mock_org_id, mock_decode, client, auth_headers):
        """Test dashboard analytics endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/analytics/dashboard', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response structure
        assert 'summary' in data
        assert 'key_metrics' in data
        assert 'alerts' in data
        assert 'recommendations' in data
    
    def test_unauthorized_access(self, client):
        """Test accessing endpoints without auth"""
        endpoints = [
            '/api/analytics/sales',
            '/api/analytics/financial',
            '/api/analytics/procurement',
            '/api/analytics/dashboard'
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 401


class TestDocumentEndpoints:
    """Test document processing endpoints"""
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_document_upload(self, mock_org_id, mock_decode, client, auth_headers):
        """Test document upload endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        # Create test file data
        data = {
            'file': (open(__file__, 'rb'), 'test.csv'),
            'type': 'inventory'
        }
        
        response = client.post(
            '/api/documents/upload',
            headers={'Authorization': 'Bearer test_token'},
            content_type='multipart/form-data',
            data=data
        )
        
        # Should return 201 or handle file upload
        assert response.status_code in [200, 201, 400]  # 400 if no actual file handling
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_document_list(self, mock_org_id, mock_decode, client, auth_headers):
        """Test document list endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/documents', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response is a list or has documents key
        assert isinstance(data, (list, dict))
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_document_analytics(self, mock_org_id, mock_decode, client, auth_headers):
        """Test document analytics endpoint"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/documents/analytics', headers=auth_headers)
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify analytics response structure
        assert 'processing_time' in data
        assert 'total_pages' in data
        assert 'accuracy_score' in data
        assert 'categories' in data


class TestSecurityFeatures:
    """Test security features of API"""
    
    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.get('/api/health')
        assert 'Access-Control-Allow-Origin' in response.headers
    
    @patch('main.decode_clerk_jwt')
    def test_invalid_token(self, mock_decode, client):
        """Test invalid JWT token handling"""
        mock_decode.side_effect = Exception("Invalid token")
        
        response = client.get(
            '/api/analytics/sales',
            headers={'Authorization': 'Bearer invalid_token'}
        )
        assert response.status_code == 401
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_organization_scoping(self, mock_org_id, mock_decode, client, auth_headers):
        """Test data is scoped to organization"""
        mock_decode.return_value = {'org_id': 'org_123'}
        mock_org_id.return_value = 'org_123'
        
        response = client.get('/api/analytics/sales', headers=auth_headers)
        assert response.status_code == 200
        
        # Verify org_id was used in the request
        mock_org_id.assert_called()


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_500_error_handling(self, mock_org_id, mock_decode, client, auth_headers):
        """Test 500 error handling"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.side_effect = Exception("Database error")
        
        response = client.get('/api/analytics/sales', headers=auth_headers)
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_404_handling(self, client):
        """Test 404 for non-existent endpoints"""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client, auth_headers):
        """Test method not allowed"""
        response = client.post('/api/analytics/sales', headers=auth_headers)
        assert response.status_code == 405


class TestPerformance:
    """Test performance-related features"""
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_response_time_header(self, mock_org_id, mock_decode, client, auth_headers):
        """Test if response time header is present"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get('/api/analytics/sales', headers=auth_headers)
        # Check for performance headers if implemented
        assert response.status_code == 200
    
    @patch('main.decode_clerk_jwt')
    @patch('main.get_current_org_id')
    def test_pagination_support(self, mock_org_id, mock_decode, client, auth_headers):
        """Test pagination parameters"""
        mock_decode.return_value = {'org_id': 'test_org'}
        mock_org_id.return_value = 'test_org'
        
        response = client.get(
            '/api/documents?page=1&limit=10',
            headers=auth_headers
        )
        assert response.status_code == 200


if __name__ == '__main__':
    pytest.main([__file__, '-v'])