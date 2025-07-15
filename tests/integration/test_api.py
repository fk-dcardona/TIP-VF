"""Basic API integration tests"""
import subprocess
import time
import requests
import pytest

@pytest.fixture(scope="module")
def api_server():
    """Start API server for testing"""
    proc = subprocess.Popen(["python", "main.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(3)  # Wait for server to start
    yield
    proc.terminate()
    proc.wait()

def test_health_endpoint(api_server):
    """Test health endpoint"""
    response = requests.get("http://localhost:5000/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
