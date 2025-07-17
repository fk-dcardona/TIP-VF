import os
import sys

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from flask import Flask, send_from_directory
from flask_cors import CORS
from models import (
    db, Organization, Upload, ProcessedData, Agent,
    TriangleScore, ProductAnalytics, SupplierPerformance,
    FinancialMetrics, AlertRule, AlertInstance,
    TradeDocument, DocumentAnalytics, ShipmentTracking
)

# Import configuration and utilities
from config.settings import settings
from utils.logger import get_logger
from utils.error_handler import register_error_handlers

# Import blueprints
from routes.upload_routes import upload_bp
from routes.analytics import analytics_bp
from services.health_check import health_bp

# Initialize logger
logger = get_logger('main')

# Initialize Flask app
app = Flask(__name__, static_folder='static', static_url_path='/static')

# Configure app
app.config['SECRET_KEY'] = settings.SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = settings.DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = settings.MAX_FILE_SIZE

# Initialize extensions
CORS(app, origins=settings.CORS_ORIGINS)
db.init_app(app)

# Register error handlers
register_error_handlers(app)

from routes.insights import insights_bp
from routes.documents import documents_bp
from routes.agent_routes import agent_routes
from routes.agent_api import agent_api

# Register blueprints
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(insights_bp)
app.register_blueprint(documents_bp)
app.register_blueprint(health_bp, url_prefix='/api')
app.register_blueprint(agent_routes)
app.register_blueprint(agent_api, url_prefix='/api')

# Create database tables
with app.app_context():
    db.create_all()
    logger.info("Database tables created successfully")

@app.route('/')
def index():
    """Root endpoint"""
    return {
        'service': 'Supply Chain Backend',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'health': '/api/health',
            'upload': '/api/upload',
            'analytics': '/api/analytics',
            'documentation': '/api/docs'
        }
    }

@app.route('/api/docs')
def api_docs():
    """API documentation endpoint"""
    return {
        'title': 'Supply Chain Intelligence API',
        'version': '1.0.0',
        'description': 'Backend API for supply chain data processing and analytics',
        'endpoints': {
            'POST /api/upload': 'Upload CSV files for processing',
            'GET /api/uploads/<user_id>': 'Get user uploads',
            'GET /api/analysis/<upload_id>': 'Get analysis for specific upload',
            'GET /api/template/<data_type>': 'Download CSV templates',
            'GET /api/dashboard/<user_id>': 'Get dashboard analytics',
            'GET /api/health': 'Health check endpoint',
            'GET /api/ready': 'Readiness check',
            'GET /api/live': 'Liveness check'
        }
    }

if __name__ == '__main__':
    logger.info(f"Starting Supply Chain Backend on {settings.HOST}:{settings.PORT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Upload folder: {settings.UPLOAD_FOLDER}")
    
    app.run(
        host=settings.HOST,
        port=settings.PORT,
        debug=settings.DEBUG
    )

