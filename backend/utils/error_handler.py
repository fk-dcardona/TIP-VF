from flask import jsonify, request
from werkzeug.exceptions import HTTPException
import traceback
from utils.logger import get_logger

logger = get_logger('error_handler')

class APIError(Exception):
    """Custom API error class"""
    
    def __init__(self, message: str, status_code: int = 400, payload: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload

def register_error_handlers(app):
    """Register error handlers with the Flask app"""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle custom API errors"""
        logger.error(f"API Error: {error.message}")
        response = {
            'error': error.message,
            'status_code': error.status_code
        }
        if error.payload:
            response.update(error.payload)
        return jsonify(response), error.status_code
    
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        """Handle HTTP errors"""
        logger.error(f"HTTP Error {error.code}: {error.description}")
        return jsonify({
            'error': error.description,
            'status_code': error.code
        }), error.code
    
    @app.errorhandler(Exception)
    def handle_generic_error(error):
        """Handle unexpected errors"""
        logger.error(f"Unexpected error: {str(error)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Don't expose internal errors in production
        if app.debug:
            return jsonify({
                'error': str(error),
                'traceback': traceback.format_exc(),
                'status_code': 500
            }), 500
        else:
            return jsonify({
                'error': 'Internal server error',
                'status_code': 500
            }), 500
    
    @app.before_request
    def log_request():
        """Log incoming requests"""
        logger.info(f"{request.method} {request.path} - {request.remote_addr}")
    
    @app.after_request
    def log_response(response):
        """Log outgoing responses"""
        logger.info(f"Response: {response.status_code}")
        return response

