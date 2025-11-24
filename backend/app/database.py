"""
Database connection module for SEP-AI application.
Manages Supabase client instances for standard and admin operations.
"""
from supabase import create_client, Client
from .config import db_config
from .exceptions import ConfigurationError
from .logger import get_logger

logger = get_logger(__name__)


def _validate_config() -> None:
    """Validate required database configuration."""
    if not db_config.SUPABASE_URL:
        raise ConfigurationError("SUPABASE_URL environment variable is not set")
    if not db_config.SUPABASE_ANON_KEY:
        raise ConfigurationError("SUPABASE_ANON_KEY environment variable is not set")
    if not db_config.SUPABASE_SERVICE_ROLE_KEY:
        raise ConfigurationError("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")


def _create_clients() -> tuple[Client, Client]:
    """
    Create Supabase client instances.
    
    Returns:
        Tuple of (standard client, admin client)
    """
    try:
        _validate_config()
        
        standard_client = create_client(
            db_config.SUPABASE_URL,
            db_config.SUPABASE_ANON_KEY
        )
        
        admin_client = create_client(
            db_config.SUPABASE_URL,
            db_config.SUPABASE_SERVICE_ROLE_KEY
        )
        
        logger.info("Database clients initialized successfully")
        return standard_client, admin_client
        
    except Exception as e:
        logger.error(f"Failed to initialize database clients: {e}")
        raise ConfigurationError(f"Database initialization failed: {str(e)}")


# Initialize clients
supabase: Client
admin_client: Client

try:
    supabase, admin_client = _create_clients()
except Exception as e:
    logger.critical(f"Critical error initializing database: {e}")
    raise
