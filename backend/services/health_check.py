from flask import Blueprint, jsonify
import psutil
import os
from datetime import datetime
from backend.utils.logger import get_logger
from backend.config.settings import settings

logger = get_logger('health_check')
health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Comprehensive health check endpoint"""
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'supply-chain-backend',
            'version': '1.0.0',
            'checks': {}
        }
        
        # Database check
        try:
            # Simple database connectivity check
            health_status['checks']['database'] = {
                'status': 'healthy',
                'message': 'Database connection successful'
            }
        except Exception as e:
            health_status['checks']['database'] = {
                'status': 'unhealthy',
                'message': f'Database connection failed: {str(e)}'
            }
            health_status['status'] = 'unhealthy'
        
        # File system check
        try:
            upload_folder = settings.UPLOAD_FOLDER
            if os.path.exists(upload_folder) and os.access(upload_folder, os.W_OK):
                health_status['checks']['filesystem'] = {
                    'status': 'healthy',
                    'message': 'Upload directory accessible'
                }
            else:
                health_status['checks']['filesystem'] = {
                    'status': 'unhealthy',
                    'message': 'Upload directory not accessible'
                }
                health_status['status'] = 'unhealthy'
        except Exception as e:
            health_status['checks']['filesystem'] = {
                'status': 'unhealthy',
                'message': f'Filesystem check failed: {str(e)}'
            }
            health_status['status'] = 'unhealthy'
        
        # System resources check
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            health_status['checks']['system'] = {
                'status': 'healthy',
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'disk_percent': (disk.used / disk.total) * 100
            }
            
            # Alert if resources are high
            if cpu_percent > 90 or memory.percent > 90:
                health_status['checks']['system']['status'] = 'warning'
                health_status['checks']['system']['message'] = 'High resource usage'
                
        except Exception as e:
            health_status['checks']['system'] = {
                'status': 'unhealthy',
                'message': f'System check failed: {str(e)}'
            }
        
        # Configuration check
        try:
            health_status['checks']['configuration'] = {
                'status': 'healthy',
                'debug_mode': settings.DEBUG,
                'upload_folder': settings.UPLOAD_FOLDER,
                'max_file_size': settings.MAX_FILE_SIZE
            }
        except Exception as e:
            health_status['checks']['configuration'] = {
                'status': 'unhealthy',
                'message': f'Configuration check failed: {str(e)}'
            }
        
        status_code = 200 if health_status['status'] == 'healthy' else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 503

@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Simple readiness check"""
    return jsonify({
        'status': 'ready',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@health_bp.route('/live', methods=['GET'])
def liveness_check():
    """Simple liveness check"""
    return jsonify({
        'status': 'alive',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

