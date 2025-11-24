"""
Logging configuration for SEP-AI application.
Provides structured logging throughout the application.
"""
import logging
import sys
from typing import Optional


class Logger:
    """Centralized logger for the application."""
    
    _loggers: dict[str, logging.Logger] = {}
    
    @classmethod
    def get_logger(cls, name: str, level: int = logging.INFO) -> logging.Logger:
        """
        Get or create a logger with the specified name.
        
        Args:
            name: Name of the logger (typically __name__ of the module)
            level: Logging level (default: INFO)
            
        Returns:
            Configured logger instance
        """
        if name in cls._loggers:
            return cls._loggers[name]
        
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # Avoid duplicate handlers
        if not logger.handlers:
            # Console handler
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(level)
            
            # Formatter
            formatter = logging.Formatter(
                fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        cls._loggers[name] = logger
        return logger


def get_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Convenience function to get a logger.
    
    Args:
        name: Name of the logger (typically __name__ of the module)
        level: Logging level (default: INFO)
        
    Returns:
        Configured logger instance
    """
    return Logger.get_logger(name, level)

