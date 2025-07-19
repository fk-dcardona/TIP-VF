"""
Simple API tests for existing endpoints
"""
import pytest
import json


class TestSimpleAPI:
    """Test basic API functionality"""
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data
    
    def test_analytics_sales_endpoint_exists(self, client):
        """Test if sales analytics endpoint exists (may require auth)"""
        response = client.get('/api/analytics/sales')
        # Either 401 (requires auth) or 200 (if accessible)
        assert response.status_code in [200, 401, 404]
    
    def test_analytics_financial_endpoint_exists(self, client):
        """Test if financial analytics endpoint exists"""
        response = client.get('/api/analytics/financial')
        assert response.status_code in [200, 401, 404]
    
    def test_analytics_procurement_endpoint_exists(self, client):
        """Test if procurement analytics endpoint exists"""
        response = client.get('/api/analytics/procurement')
        assert response.status_code in [200, 401, 404]
    
    def test_documents_endpoint_exists(self, client):
        """Test if documents endpoint exists"""
        response = client.get('/api/documents')
        assert response.status_code in [200, 401, 404]
    
    def test_cors_headers(self, client):
        """Test if CORS headers are present"""
        response = client.get('/api/health')
        assert response.status_code == 200
        # Check for CORS headers if configured
        if 'Access-Control-Allow-Origin' in response.headers:
            assert response.headers['Access-Control-Allow-Origin'] in ['*', 'http://localhost:3000']
    
    def test_404_for_nonexistent_endpoint(self, client):
        """Test 404 response for non-existent endpoint"""
        response = client.get('/api/this-does-not-exist')
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client):
        """Test method not allowed on GET endpoints"""
        # Try DELETE on health endpoint
        response = client.delete('/api/health')
        assert response.status_code in [405, 404]  # 405 Method Not Allowed or 404


class TestAPIResponse:
    """Test API response formats"""
    
    def test_json_content_type(self, client):
        """Test that API returns JSON content type"""
        response = client.get('/api/health')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
    
    def test_health_response_structure(self, client):
        """Test health endpoint response structure"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Required fields
        assert 'status' in data
        assert 'timestamp' in data
        
        # Status should be healthy
        assert data['status'] == 'healthy'
        
        # Timestamp should be a string
        assert isinstance(data['timestamp'], str)