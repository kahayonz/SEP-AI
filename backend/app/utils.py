"""
Utility functions for SEP-AI application.
Contains helper functions used across the application.
"""
import re
import uuid
from typing import Optional
from datetime import datetime


def generate_uuid() -> str:
    """
    Generate a UUID string.
    
    Returns:
        UUID string
    """
    return str(uuid.uuid4())


def generate_numeric_id(min_value: int = 1000000000, max_value: int = 9999999999) -> int:
    """
    Generate a random numeric ID (for legacy compatibility).
    Note: This is less secure than UUIDs and should be replaced with UUIDs when possible.
    
    Args:
        min_value: Minimum value for the ID
        max_value: Maximum value for the ID
        
    Returns:
        Random integer ID
    """
    import random
    return random.randint(min_value, max_value)


def extract_score_from_text(text: str, default: int = 0) -> int:
    """
    Extract a numeric score (0-100) from text using regex.
    
    Args:
        text: Text containing a score
        default: Default value if no score found
        
    Returns:
        Extracted score (0-100)
    """
    match = re.search(r"(\b\d{1,3}\b)", text)
    if match:
        score = int(match.group(1))
        return min(100, max(0, score))
    return default


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """
    Format a datetime as a string.
    
    Args:
        dt: Datetime to format (uses current time if None)
        
    Returns:
        Formatted timestamp string
    """
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%Y%m%d_%H%M%S")


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing potentially dangerous characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove path separators and other dangerous characters
    filename = re.sub(r'[/\\]', '_', filename)
    filename = re.sub(r'[^\w\s\-.]', '', filename)
    return filename.strip()

