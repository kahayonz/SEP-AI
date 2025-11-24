"""
User service for SEP-AI application.
Handles user-related business logic.
"""
from typing import Optional, Dict, Any
from gotrue.types import User

from ..database import admin_client, supabase
from ..exceptions import (
    ResourceNotFoundError,
    DatabaseError,
    AuthenticationError,
    ValidationError
)
from ..config import UserRole, messages
from ..logger import get_logger

logger = get_logger(__name__)


class UserService:
    """Service class for user operations."""
    
    @staticmethod
    async def get_user_role(auth_id: str) -> str:
        """
        Get user role from database.
        
        Args:
            auth_id: User's authentication ID
            
        Returns:
            User role string
            
        Raises:
            ResourceNotFoundError: If user not found
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("users")\
                .select("role")\
                .eq("auth_id", auth_id)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                logger.warning(f"User role not found for auth_id: {auth_id}")
                raise ResourceNotFoundError("User")
            
            role = response.data[0]["role"]
            logger.debug(f"Retrieved role '{role}' for user {auth_id}")
            return role
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting user role: {str(e)}")
            raise DatabaseError(f"Failed to retrieve user role: {str(e)}")
    
    @staticmethod
    async def get_user_data(auth_id: str) -> Dict[str, Any]:
        """
        Get complete user data from database.
        
        Args:
            auth_id: User's authentication ID
            
        Returns:
            Dictionary containing user data
            
        Raises:
            ResourceNotFoundError: If user not found
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("users")\
                .select("*")\
                .eq("auth_id", auth_id)\
                .execute()
            
            if not response.data or len(response.data) == 0:
                logger.warning(f"User data not found for auth_id: {auth_id}")
                raise ResourceNotFoundError("User data")
            
            user_data = response.data[0]
            logger.debug(f"Retrieved data for user {auth_id}")
            return user_data
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting user data: {str(e)}")
            raise DatabaseError(f"Failed to retrieve user data: {str(e)}")
    
    @staticmethod
    async def create_user(
        auth_id: str,
        email: str,
        first_name: str,
        last_name: str,
        role: str,
        university: str
    ) -> Dict[str, Any]:
        """
        Create a new user record in the database.
        
        Args:
            auth_id: User's authentication ID
            email: User's email
            first_name: User's first name
            last_name: User's last name
            role: User's role
            university: User's university
            
        Returns:
            Created user data
            
        Raises:
            ValidationError: If role is invalid
            DatabaseError: If database operation fails
        """
        # Validate role
        if role not in UserRole.all_roles():
            raise ValidationError(f"Invalid role: {role}")
        
        try:
            response = admin_client.table("users").insert({
                "auth_id": auth_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "university": university
            }).execute()
            
            logger.info(f"Created user record for {email} with role {role}")
            return response.data[0] if response.data else {}
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise DatabaseError(f"Failed to create user: {str(e)}")
    
    @staticmethod
    async def update_user(
        auth_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        university: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user information.
        
        Args:
            auth_id: User's authentication ID
            first_name: New first name (optional)
            last_name: New last name (optional)
            university: New university (optional)
            
        Returns:
            Updated user data
            
        Raises:
            ResourceNotFoundError: If user not found
            DatabaseError: If database operation fails
        """
        update_data = {}
        if first_name is not None:
            update_data["first_name"] = first_name
        if last_name is not None:
            update_data["last_name"] = last_name
        if university is not None:
            update_data["university"] = university
        
        if not update_data:
            raise ValidationError("No fields to update")
        
        try:
            response = admin_client.table("users")\
                .update(update_data)\
                .eq("auth_id", auth_id)\
                .execute()
            
            if not response.data:
                raise ResourceNotFoundError("User")
            
            logger.info(f"Updated user {auth_id}")
            return response.data[0]
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            raise DatabaseError(f"Failed to update user: {str(e)}")
    
    @staticmethod
    async def search_students(query: str) -> list[Dict[str, Any]]:
        """
        Search for students by name.
        
        Args:
            query: Search query string
            
        Returns:
            List of matching student records
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("users")\
                .select("auth_id, first_name, last_name, email")\
                .eq("role", UserRole.STUDENT)\
                .ilike("first_name", f"%{query}%")\
                .execute()
            
            logger.debug(f"Found {len(response.data)} students matching '{query}'")
            return response.data
            
        except Exception as e:
            logger.error(f"Error searching students: {str(e)}")
            raise DatabaseError(f"Failed to search students: {str(e)}")
    
    @staticmethod
    async def get_all_students() -> list[Dict[str, Any]]:
        """
        Get all students from the database.
        
        Returns:
            List of all student records
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("users")\
                .select("auth_id, first_name, last_name, email")\
                .eq("role", UserRole.STUDENT)\
                .execute()
            
            logger.debug(f"Retrieved {len(response.data)} students")
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting all students: {str(e)}")
            raise DatabaseError(f"Failed to retrieve students: {str(e)}")

