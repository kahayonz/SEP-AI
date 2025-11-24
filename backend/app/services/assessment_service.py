"""
Assessment service for SEP-AI application.
Handles assessment-related business logic.
"""
from typing import Dict, Any, List, Optional

from ..database import admin_client
from ..exceptions import (
    ResourceNotFoundError,
    DatabaseError,
    AuthorizationError
)
from ..logger import get_logger
from ..utils import generate_uuid

logger = get_logger(__name__)


class AssessmentService:
    """Service class for assessment operations."""
    
    @staticmethod
    async def create_assessment(
        class_id: str,
        professor_id: str,
        title: str,
        instructions: str,
        deadline: str
    ) -> Dict[str, Any]:
        """
        Create a new assessment.
        
        Args:
            class_id: ID of the class
            professor_id: ID of the professor creating the assessment
            title: Assessment title
            instructions: Assessment instructions
            deadline: Assessment deadline
            
        Returns:
            Created assessment data
            
        Raises:
            AuthorizationError: If professor doesn't own the class
            DatabaseError: If database operation fails
        """
        # Verify professor owns the class
        try:
            class_check = admin_client.table("classes")\
                .select("id")\
                .eq("id", class_id)\
                .eq("professor_id", professor_id)\
                .execute()
            
            if not class_check.data:
                logger.warning(f"Professor {professor_id} attempted to create assessment for class {class_id}")
                raise AuthorizationError("Not authorized to create assessments for this class")
            
            assessment_id = generate_uuid()
            response = admin_client.table("assessments").insert({
                "id": assessment_id,
                "class_id": class_id,
                "title": title,
                "instructions": instructions,
                "deadline": deadline
            }).execute()
            
            logger.info(f"Created assessment {assessment_id} for class {class_id}")
            return response.data[0] if response.data else {}
            
        except AuthorizationError:
            raise
        except Exception as e:
            logger.error(f"Error creating assessment: {str(e)}")
            raise DatabaseError(f"Failed to create assessment: {str(e)}")
    
    @staticmethod
    async def get_assessment(assessment_id: str) -> Dict[str, Any]:
        """
        Get assessment details.
        
        Args:
            assessment_id: Assessment ID
            
        Returns:
            Assessment data
            
        Raises:
            ResourceNotFoundError: If assessment not found
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("assessments")\
                .select("*")\
                .eq("id", assessment_id)\
                .execute()
            
            if not response.data:
                raise ResourceNotFoundError("Assessment")
            
            return response.data[0]
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting assessment: {str(e)}")
            raise DatabaseError(f"Failed to retrieve assessment: {str(e)}")
    
    @staticmethod
    async def get_professor_assessments(professor_id: str) -> List[Dict[str, Any]]:
        """
        Get all assessments for a professor.
        
        Args:
            professor_id: Professor's ID
            
        Returns:
            List of assessment data
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("assessments")\
                .select("*, classes!inner(name, professor_id)")\
                .eq("classes.professor_id", professor_id)\
                .execute()
            
            logger.debug(f"Retrieved {len(response.data)} assessments for professor {professor_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting professor assessments: {str(e)}")
            raise DatabaseError(f"Failed to retrieve assessments: {str(e)}")
    
    @staticmethod
    async def update_assessment(
        assessment_id: str,
        professor_id: str,
        title: Optional[str] = None,
        instructions: Optional[str] = None,
        deadline: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update an assessment.
        
        Args:
            assessment_id: Assessment ID
            professor_id: Professor's ID (for authorization)
            title: New title (optional)
            instructions: New instructions (optional)
            deadline: New deadline (optional)
            
        Returns:
            Updated assessment data
            
        Raises:
            AuthorizationError: If professor doesn't own the assessment
            DatabaseError: If database operation fails
        """
        # Verify ownership
        try:
            ownership_check = admin_client.table("assessments")\
                .select("class_id, classes!inner(professor_id)")\
                .eq("id", assessment_id)\
                .eq("classes.professor_id", professor_id)\
                .execute()
            
            if not ownership_check.data:
                raise AuthorizationError("Not authorized to update this assessment")
            
            # Build update data
            update_data = {}
            if title is not None:
                update_data["title"] = title
            if instructions is not None:
                update_data["instructions"] = instructions
            if deadline is not None:
                update_data["deadline"] = deadline
            
            if not update_data:
                raise DatabaseError("No valid fields provided for update")
            
            response = admin_client.table("assessments")\
                .update(update_data)\
                .eq("id", assessment_id)\
                .execute()
            
            logger.info(f"Updated assessment {assessment_id}")
            return response.data[0] if response.data else {}
            
        except AuthorizationError:
            raise
        except Exception as e:
            logger.error(f"Error updating assessment: {str(e)}")
            raise DatabaseError(f"Failed to update assessment: {str(e)}")
    
    @staticmethod
    async def delete_assessment(assessment_id: str, professor_id: str) -> None:
        """
        Delete an assessment and its submissions.
        
        Args:
            assessment_id: Assessment ID
            professor_id: Professor's ID (for authorization)
            
        Raises:
            AuthorizationError: If professor doesn't own the assessment
            DatabaseError: If database operation fails
        """
        try:
            # Verify ownership
            ownership_check = admin_client.table("assessments")\
                .select("class_id, classes!inner(professor_id)")\
                .eq("id", assessment_id)\
                .eq("classes.professor_id", professor_id)\
                .execute()
            
            if not ownership_check.data:
                raise AuthorizationError("Not authorized to delete this assessment")
            
            # Delete submissions first (foreign key constraint)
            admin_client.table("submissions")\
                .delete()\
                .eq("assessment_id", assessment_id)\
                .execute()
            
            # Delete assessment
            admin_client.table("assessments")\
                .delete()\
                .eq("id", assessment_id)\
                .execute()
            
            logger.info(f"Deleted assessment {assessment_id} and its submissions")
            
        except AuthorizationError:
            raise
        except Exception as e:
            logger.error(f"Error deleting assessment: {str(e)}")
            raise DatabaseError(f"Failed to delete assessment: {str(e)}")
    
    @staticmethod
    async def verify_professor_owns_assessment(
        assessment_id: str,
        professor_id: str
    ) -> bool:
        """
        Verify that a professor owns an assessment.
        
        Args:
            assessment_id: Assessment ID
            professor_id: Professor's ID
            
        Returns:
            True if professor owns the assessment
        """
        try:
            response = admin_client.table("assessments")\
                .select("class_id, classes!inner(professor_id)")\
                .eq("id", assessment_id)\
                .eq("classes.professor_id", professor_id)\
                .execute()
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error verifying assessment ownership: {str(e)}")
            return False

