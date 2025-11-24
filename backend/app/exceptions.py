"""
Custom exception classes for SEP-AI application.
Provides specific exceptions for different error scenarios.
"""
from typing import Any, Optional
from fastapi import HTTPException, status


class SEPAIException(HTTPException):
    """Base exception class for all SEP-AI custom exceptions."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class AuthenticationError(SEPAIException):
    """Raised when authentication fails."""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail
        )


class AuthorizationError(SEPAIException):
    """Raised when user doesn't have permission for an action."""
    
    def __init__(self, detail: str = "Not authorized to perform this action"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


class ResourceNotFoundError(SEPAIException):
    """Raised when a requested resource doesn't exist."""
    
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found"
        )


class ResourceAlreadyExistsError(SEPAIException):
    """Raised when trying to create a resource that already exists."""
    
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{resource} already exists"
        )


class ValidationError(SEPAIException):
    """Raised when input validation fails."""
    
    def __init__(self, detail: str = "Validation error"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class FileProcessingError(SEPAIException):
    """Raised when file processing fails."""
    
    def __init__(self, detail: str = "File processing failed"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class DatabaseError(SEPAIException):
    """Raised when database operations fail."""
    
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )


class AIEvaluationError(SEPAIException):
    """Raised when AI evaluation fails."""
    
    def __init__(self, detail: str = "AI evaluation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )


class ConfigurationError(SEPAIException):
    """Raised when there's a configuration issue."""
    
    def __init__(self, detail: str = "Configuration error"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail
        )

