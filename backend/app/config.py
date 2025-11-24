"""
Configuration module for SEP-AI application.
Contains all application constants, settings, and configuration values.
"""
import os
from typing import Final
from dotenv import load_dotenv

load_dotenv()


class DatabaseConfig:
    """Database and Supabase configuration."""
    SUPABASE_URL: Final[str] = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: Final[str] = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: Final[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


class AIConfig:
    """AI evaluation configuration."""
    ANTHROPIC_API_KEY: Final[str] = os.getenv("ANTHROPIC_API_KEY", "")
    AI_MODEL: Final[str] = "claude-3-sonnet-20240229"
    AI_MAX_TOKENS: Final[int] = 500
    MAX_FILE_CONTENT_LENGTH: Final[int] = 3000
    MAX_COMBINED_CODE_LENGTH: Final[int] = 15000
    
    # Supported file extensions for evaluation
    SUPPORTED_EXTENSIONS: Final[tuple] = (".py", ".js", ".html", ".css", ".md")


class AppConfig:
    """General application configuration."""
    # Frontend URL for redirects
    FRONTEND_URL: Final[str] = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # File upload settings
    MAX_UPLOAD_SIZE: Final[int] = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: Final[str] = "backend/uploads"
    STORAGE_BUCKET: Final[str] = "submissions"
    
    # CORS settings
    CORS_ORIGINS: Final[list] = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Security
    MIN_PASSWORD_LENGTH: Final[int] = 8
    
    # Pagination
    DEFAULT_PAGE_SIZE: Final[int] = 50
    MAX_PAGE_SIZE: Final[int] = 100


class Messages:
    """User-facing messages and error strings."""
    # Success messages
    SIGNUP_SUCCESS: Final[str] = "Please check your email to confirm your account"
    LOGIN_SUCCESS: Final[str] = "Login successful"
    LOGOUT_SUCCESS: Final[str] = "Successfully logged out"
    UPDATE_SUCCESS: Final[str] = "Successfully updated"
    DELETE_SUCCESS: Final[str] = "Successfully deleted"
    SUBMISSION_SUCCESS: Final[str] = "Assessment submitted successfully"
    
    # Error messages
    UNAUTHORIZED: Final[str] = "Not authorized to perform this action"
    NOT_FOUND: Final[str] = "Resource not found"
    ALREADY_EXISTS: Final[str] = "Resource already exists"
    INVALID_FILE: Final[str] = "Invalid file format"
    EVALUATION_FAILED: Final[str] = "Evaluation failed"
    NETWORK_ERROR: Final[str] = "Network error occurred"
    INVALID_TOKEN: Final[str] = "Invalid or expired token"


class StatusCodes:
    """HTTP status codes used in the application."""
    OK: Final[int] = 200
    CREATED: Final[int] = 201
    BAD_REQUEST: Final[int] = 400
    UNAUTHORIZED: Final[int] = 401
    FORBIDDEN: Final[int] = 403
    NOT_FOUND: Final[int] = 404
    INTERNAL_ERROR: Final[int] = 500


class SubmissionStatus:
    """Submission status constants."""
    NO_SUBMISSION: Final[str] = "no submission"
    PENDING: Final[str] = "pending"
    REVIEWED: Final[str] = "reviewed"
    RELEASED: Final[str] = "released"
    
    @classmethod
    def is_graded(cls, status: str) -> bool:
        """Check if a submission status indicates it has been graded."""
        return status in (cls.REVIEWED, cls.RELEASED)


class UserRole:
    """User role constants."""
    STUDENT: Final[str] = "student"
    PROFESSOR: Final[str] = "professor"
    ADMIN: Final[str] = "admin"
    
    @classmethod
    def all_roles(cls) -> tuple:
        """Get all valid user roles."""
        return (cls.STUDENT, cls.PROFESSOR, cls.ADMIN)


# Create singleton instances for easy import
db_config = DatabaseConfig()
ai_config = AIConfig()
app_config = AppConfig()
messages = Messages()
status_codes = StatusCodes()

