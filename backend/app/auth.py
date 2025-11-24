"""
Authentication module for SEP-AI application.
Handles user authentication and authorization.
"""
from typing import Optional
from fastapi import Depends
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from gotrue.types import User

from .database import supabase
from .exceptions import AuthenticationError
from .logger import get_logger

logger = get_logger(__name__)
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials containing the JWT token
        
    Returns:
        Authenticated user object
        
    Raises:
        AuthenticationError: If token is invalid or user cannot be authenticated
    """
    token = credentials.credentials
    
    if not token:
        logger.warning("Authentication attempt with empty token")
        raise AuthenticationError("Token is required")
    
    try:
        response = supabase.auth.get_user(token)
        
        if not response or not response.user:
            logger.warning(f"Invalid token provided")
            raise AuthenticationError("Invalid or expired token")
        
        logger.debug(f"User authenticated: {response.user.id}")
        return response.user
        
    except AuthenticationError:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise AuthenticationError(f"Authentication failed: {str(e)}")


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Dependency to optionally get the current user (for endpoints that work with or without auth).
    
    Args:
        credentials: Optional HTTP Bearer credentials
        
    Returns:
        User object if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except AuthenticationError:
        return None
