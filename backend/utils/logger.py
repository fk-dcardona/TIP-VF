import logging
import sys
from typing import Optional
from config.settings import settings

class Logger:
    """Centralized logging utility for the application"""
    
    _loggers = {}
    
    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """Get or create a logger instance"""
        if name not in cls._loggers:
            cls._loggers[name] = cls._create_logger(name)
        return cls._loggers[name]
    
    @classmethod
    def _create_logger(cls, name: str) -> logging.Logger:
        """Create a new logger instance with proper configuration"""
        logger = logging.getLogger(name)
        
        # Set log level
        logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
        
        # Avoid duplicate handlers
        if logger.handlers:
            return logger
        
        # Create console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
        
        # Create formatter
        formatter = logging.Formatter(settings.LOG_FORMAT)
        console_handler.setFormatter(formatter)
        
        # Add handler to logger
        logger.addHandler(console_handler)
        
        return logger

# Convenience function for getting application logger
def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get application logger"""
    if name is None:
        name = 'supply_chain_app'
    return Logger.get_logger(name)

