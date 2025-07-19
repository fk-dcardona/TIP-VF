import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

class Settings:
    """Centralized configuration management for the backend services"""
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL', 
        f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db'))}"
    )
    
    # For local testing, force SQLite if Supabase is not accessible
    if 'supabase' in DATABASE_URL and not os.getenv('FORCE_SUPABASE', 'false').lower() == 'true':
        DATABASE_URL = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db'))}"
    
    # Security Configuration
    SECRET_KEY: str = os.getenv('SECRET_KEY', '')
    
    # CORS Configuration
    CORS_ORIGINS: list = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://your-production-domain.com').split(',')
    
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
    
    # Agent Astra API Configuration
    AGENT_ASTRA_API_KEY: str = os.getenv('AGENT_ASTRA_API_KEY', '')
    AGENT_ASTRA_BASE_URL: str = os.getenv('AGENT_ASTRA_BASE_URL', 'https://api.agentastra.ai/v2')
    
    # LLM Provider API Keys
    OPENAI_API_KEY: str = os.getenv('OPENAI_API_KEY', '')
    ANTHROPIC_API_KEY: str = os.getenv('ANTHROPIC_API_KEY', '')
    GOOGLE_API_KEY: str = os.getenv('GOOGLE_API_KEY', '')
    
    # LLM Configuration
    LLM_DEFAULT_PROVIDER: str = os.getenv('LLM_DEFAULT_PROVIDER', 'anthropic')
    LLM_FALLBACK_ENABLED: bool = os.getenv('LLM_FALLBACK_ENABLED', 'true').lower() == 'true'
    LLM_CACHE_ENABLED: bool = os.getenv('LLM_CACHE_ENABLED', 'true').lower() == 'true'
    LLM_CACHE_TTL: int = int(os.getenv('LLM_CACHE_TTL', '3600'))  # 1 hour default
    
    # Cost Management
    LLM_COST_TRACKING_ENABLED: bool = os.getenv('LLM_COST_TRACKING_ENABLED', 'true').lower() == 'true'
    LLM_DAILY_COST_LIMIT: float = float(os.getenv('LLM_DAILY_COST_LIMIT', '100.0'))
    LLM_MONTHLY_COST_LIMIT: float = float(os.getenv('LLM_MONTHLY_COST_LIMIT', '2000.0'))
    
    # Performance Settings
    LLM_REQUEST_TIMEOUT: int = int(os.getenv('LLM_REQUEST_TIMEOUT', '60'))  # seconds
    LLM_MAX_RETRIES: int = int(os.getenv('LLM_MAX_RETRIES', '3'))
    LLM_RETRY_DELAY: int = int(os.getenv('LLM_RETRY_DELAY', '1'))  # seconds
    
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

