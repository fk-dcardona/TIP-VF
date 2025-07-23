import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from flask import Flask, send_from_directory
from flask_cors import CORS
from models import db

# Import configuration and utilities
from backend.config.settings import settings
from backend.utils.logger import get_logger
from backend.utils.error_handler import register_error_handlers

# Import simplified blueprints for testing
from backend.routes.upload_routes import upload_bp
from backend.services.health_check import health_bp

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = settings.SECRET_KEY
app.config['UPLOAD_FOLDER'] = settings.UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB

# Database configuration - Use SQLite for local testing
database_url = 'sqlite:///./app.db'
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
CORS(app, origins=["*"])

# Register error handlers
register_error_handlers(app)

# Register blueprints
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(health_bp, url_prefix='/api')

# Create tables
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"⚠️  Database setup warning: {e}")

# Root route
@app.route('/')
def home():
    return jsonify({
        "message": "Supply Chain Backend API - CSV Analytics Integration Test",
        "status": "running",
        "version": "1.0.0-csv-test",
        "endpoints": [
            "/api/health",
            "/api/csv/validate",
            "/api/csv/process", 
            "/api/csv/analytics/<org_id>"
        ]
    })

# Static file serving for frontend
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    from flask import jsonify
    
    logger = get_logger(__name__)
    logger.info("Starting Supply Chain Backend API - CSV Integration Test")
    
    # Run development server
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5001)),
        debug=True
    )