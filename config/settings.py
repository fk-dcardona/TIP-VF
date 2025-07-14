import os
from typing import Optional

class Settings:
    """Centralized configuration management for the backend services"""
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL', 
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db'))}"
    )
    
    # Security Configuration
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS Configuration
    CORS_ORIGINS: list = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')
    
    # File Upload Configuration
    UPLOAD_FOLDER: str = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')
    MAX_FILE_SIZE: int = int(os.getenv('MAX_FILE_SIZE', '52428800'))  # 50MB default
    ALLOWED_EXTENSIONS: set = set(os.getenv('ALLOWED_EXTENSIONS', 'csv,xlsx,xls').split(','))
    
    # Service Configuration
    HOST: str = os.getenv('HOST', '0.0.0.0')
    PORT: int = int(os.getenv('PORT', '5000'))
    DEBUG: bool = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT: str = os.getenv(
        'LOG_FORMAT', 
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Analytics Configuration
    ANALYTICS_CACHE_TTL: int = int(os.getenv('ANALYTICS_CACHE_TTL', '300'))  # 5 minutes
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration settings"""
        required_settings = ['SECRET_KEY']
        
        for setting in required_settings:
            if not getattr(cls, setting):
                raise ValueError(f"Required setting {setting} is not configured")
        
        # Ensure upload folder exists
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        
        return True

# Global settings instance
settings = Settings()

# Validate settings on import
settings.validate()

