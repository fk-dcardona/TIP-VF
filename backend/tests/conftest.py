"""
Pytest configuration file
"""
import pytest
import sys
import os
import tempfile

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set test environment variables before importing app
os.environ['TESTING'] = 'true'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

@pytest.fixture(scope='session')
def app():
    """Create and configure a test app instance"""
    from main import app as flask_app
    
    # Configure app for testing
    flask_app.config['TESTING'] = True
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    flask_app.config['WTF_CSRF_ENABLED'] = False
    
    return flask_app


@pytest.fixture(scope='session')
def _db(app):
    """Create a test database"""
    from main import db
    
    with app.app_context():
        db.create_all()
        yield db
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test runner"""
    return app.test_cli_runner()


@pytest.fixture
def auth_headers():
    """Mock authentication headers"""
    return {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
    }