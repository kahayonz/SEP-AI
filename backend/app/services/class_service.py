"""
Class service for SEP-AI application.
Handles class-related business logic.
"""
from typing import Dict, Any, List

from ..database import admin_client
from ..exceptions import (
    ResourceNotFoundError,
    DatabaseError,
    AuthorizationError,
    ResourceAlreadyExistsError
)
from ..logger import get_logger
from ..utils import generate_uuid, generate_numeric_id
from ..config import SubmissionStatus

logger = get_logger(__name__)


class ClassService:
    """Service class for class operations."""
    
    @staticmethod
    async def create_class(
        professor_id: str,
        name: str,
        description: str = None
    ) -> Dict[str, Any]:
        """
        Create a new class.
        
        Args:
            professor_id: Professor's ID
            name: Class name
            description: Class description (optional)
            
        Returns:
            Created class data
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            class_id = generate_uuid()
            response = admin_client.table("classes").insert({
                "id": class_id,
                "professor_id": professor_id,
                "name": name,
                "description": description
            }).execute()
            
            logger.info(f"Created class {class_id} for professor {professor_id}")
            return response.data[0] if response.data else {}
            
        except Exception as e:
            logger.error(f"Error creating class: {str(e)}")
            raise DatabaseError(f"Failed to create class: {str(e)}")
    
    @staticmethod
    async def get_professor_classes(professor_id: str) -> List[Dict[str, Any]]:
        """
        Get all classes for a professor.
        
        Args:
            professor_id: Professor's ID
            
        Returns:
            List of class data
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("classes")\
                .select("*")\
                .eq("professor_id", professor_id)\
                .execute()
            
            logger.debug(f"Retrieved {len(response.data)} classes for professor {professor_id}")
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting professor classes: {str(e)}")
            raise DatabaseError(f"Failed to retrieve classes: {str(e)}")
    
    @staticmethod
    async def delete_class(class_id: str, professor_id: str) -> None:
        """
        Delete a class and all associated data (cascade).
        
        Args:
            class_id: Class ID
            professor_id: Professor's ID (for authorization)
            
        Raises:
            AuthorizationError: If professor doesn't own the class
            DatabaseError: If database operation fails
        """
        try:
            # Verify ownership
            class_check = admin_client.table("classes")\
                .select("id")\
                .eq("id", class_id)\
                .eq("professor_id", professor_id)\
                .execute()
            
            if not class_check.data:
                raise AuthorizationError("Not authorized to delete this class")
            
            # Get all assessments for this class
            assessments_response = admin_client.table("assessments")\
                .select("id")\
                .eq("class_id", class_id)\
                .execute()
            
            # Delete submissions and assessments
            for assessment in assessments_response.data:
                assessment_id = assessment["id"]
                admin_client.table("submissions")\
                    .delete()\
                    .eq("assessment_id", assessment_id)\
                    .execute()
                admin_client.table("assessments")\
                    .delete()\
                    .eq("id", assessment_id)\
                    .execute()
            
            # Delete class_students
            admin_client.table("class_students")\
                .delete()\
                .eq("class_id", class_id)\
                .execute()
            
            # Delete the class
            admin_client.table("classes")\
                .delete()\
                .eq("id", class_id)\
                .execute()
            
            logger.info(f"Deleted class {class_id} and all associated data")
            
        except AuthorizationError:
            raise
        except Exception as e:
            logger.error(f"Error deleting class: {str(e)}")
            raise DatabaseError(f"Failed to delete class: {str(e)}")
    
    @staticmethod
    async def get_class_students(class_id: str, professor_id: str) -> List[Dict[str, Any]]:
        """
        Get all students enrolled in a class.
        
        Args:
            class_id: Class ID
            professor_id: Professor's ID (for authorization)
            
        Returns:
            List of student data
            
        Raises:
            AuthorizationError: If professor doesn't own the class
            DatabaseError: If database operation fails
        """
        try:
            # Verify ownership
            class_check = admin_client.table("classes")\
                .select("id")\
                .eq("id", class_id)\
                .eq("professor_id", professor_id)\
                .execute()
            
            if not class_check.data:
                raise AuthorizationError("Not authorized to view this class")
            
            # Get students
            response = admin_client.table("class_students")\
                .select("users!inner(auth_id, first_name, last_name, email)")\
                .eq("class_id", class_id)\
                .execute()
            
            students = [
                {
                    "id": item["users"]["auth_id"],
                    "first_name": item["users"]["first_name"],
                    "last_name": item["users"]["last_name"],
                    "email": item["users"]["email"]
                }
                for item in response.data
            ]
            
            logger.debug(f"Retrieved {len(students)} students for class {class_id}")
            return students
            
        except AuthorizationError:
            raise
        except Exception as e:
            logger.error(f"Error getting class students: {str(e)}")
            raise DatabaseError(f"Failed to retrieve students: {str(e)}")
    
    @staticmethod
    async def add_student_to_class(
        class_id: str,
        student_id: str,
        professor_id: str
    ) -> None:
        """
        Add a student to a class and create placeholder submissions.
        
        Args:
            class_id: Class ID
            student_id: Student's ID
            professor_id: Professor's ID (for authorization)
            
        Raises:
            AuthorizationError: If professor doesn't own the class
            ResourceNotFoundError: If student not found
            ResourceAlreadyExistsError: If student already in class
            DatabaseError: If database operation fails
        """
        try:
            # Verify ownership
            class_check = admin_client.table("classes")\
                .select("id")\
                .eq("id", class_id)\
                .eq("professor_id", professor_id)\
                .execute()
            
            if not class_check.data:
                raise AuthorizationError("Not authorized to modify this class")
            
            # Check if student exists
            student_check = admin_client.table("users")\
                .select("id")\
                .eq("auth_id", student_id)\
                .eq("role", "student")\
                .execute()
            
            if not student_check.data:
                raise ResourceNotFoundError("Student")
            
            # Check if already enrolled
            existing = admin_client.table("class_students")\
                .select("id")\
                .eq("class_id", class_id)\
                .eq("student_id", student_id)\
                .execute()
            
            if existing.data:
                raise ResourceAlreadyExistsError("Student already in class")
            
            # Add student to class
            admin_client.table("class_students").insert({
                "id": generate_uuid(),
                "class_id": class_id,
                "student_id": student_id
            }).execute()
            
            # Get all assessments for this class
            assessments_response = admin_client.table("assessments")\
                .select("id")\
                .eq("class_id", class_id)\
                .execute()
            
            # Create placeholder submission records
            for assessment in assessments_response.data:
                assessment_id = assessment["id"]
                
                # Check if submission already exists
                existing_submission = admin_client.table("submissions")\
                    .select("id")\
                    .eq("assessment_id", assessment_id)\
                    .eq("student_id", student_id)\
                    .execute()
                
                if not existing_submission.data:
                    submission_id = generate_numeric_id()
                    admin_client.table("submissions").insert({
                        "id": submission_id,
                        "assessment_id": assessment_id,
                        "student_id": student_id,
                        "ai_feedback": None,
                        "ai_score": None,
                        "professor_feedback": None,
                        "final_score": None,
                        "zip_path": None,
                        "status": SubmissionStatus.NO_SUBMISSION,
                        "created_at": None
                    }).execute()
            
            logger.info(f"Added student {student_id} to class {class_id}")
            
        except (AuthorizationError, ResourceNotFoundError, ResourceAlreadyExistsError):
            raise
        except Exception as e:
            logger.error(f"Error adding student to class: {str(e)}")
            raise DatabaseError(f"Failed to add student to class: {str(e)}")
    
    @staticmethod
    async def remove_student_from_class(
        class_id: str,
        student_id: str,
        professor_id: str
    ) -> None:
        """
        Remove a student from a class.
        
        Args:
            class_id: Class ID
            student_id: Student's ID
            professor_id: Professor's ID (for authorization)
            
        Raises:
            AuthorizationError: If professor doesn't own the class
            DatabaseError: If database operation fails
        """
        try:
            # Verify ownership
            class_check = admin_client.table("classes")\
                .select("id")\
                .eq("id", class_id)\
                .eq("professor_id", professor_id)\
                .execute()
            
            if not class_check.data:
                raise AuthorizationError("Not authorized to modify this class")
            
            # Remove student from class
            admin_client.table("class_students")\
                .delete()\
                .eq("class_id", class_id)\
                .eq("student_id", student_id)\
                .execute()
            
            logger.info(f"Removed student {student_id} from class {class_id}")
            
        except AuthorizationError:
            raise
        except Exception as e:
            logger.error(f"Error removing student from class: {str(e)}")
            raise DatabaseError(f"Failed to remove student from class: {str(e)}")
    
    @staticmethod
    async def get_student_classes(student_id: str) -> List[Dict[str, Any]]:
        """
        Get all classes a student is enrolled in.
        
        Args:
            student_id: Student's ID
            
        Returns:
            List of class data with assessments
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("class_students")\
                .select("classes(*, assessments(*))")\
                .eq("student_id", student_id)\
                .execute()
            
            classes = [
                {
                    "id": item["classes"]["id"],
                    "name": item["classes"]["name"],
                    "description": item["classes"]["description"],
                    "assessments": item["classes"]["assessments"]
                }
                for item in response.data
            ]
            
            logger.debug(f"Retrieved {len(classes)} classes for student {student_id}")
            return classes
            
        except Exception as e:
            logger.error(f"Error getting student classes: {str(e)}")
            raise DatabaseError(f"Failed to retrieve classes: {str(e)}")

