"""
Submission service for SEP-AI application.
Handles submission-related business logic.
"""
from typing import Dict, Any, List, Optional

from ..database import admin_client
from ..exceptions import (
    ResourceNotFoundError,
    DatabaseError,
    AuthorizationError,
    ResourceAlreadyExistsError
)
from ..config import SubmissionStatus
from ..logger import get_logger
from ..utils import generate_numeric_id

logger = get_logger(__name__)


class SubmissionService:
    """Service class for submission operations."""
    
    @staticmethod
    async def create_submission(
        assessment_id: str,
        student_id: str,
        ai_feedback: str,
        ai_score: float,
        zip_path: str,
        status: str = SubmissionStatus.PENDING
    ) -> Dict[str, Any]:
        """
        Create a new submission record.
        
        Args:
            assessment_id: Assessment ID
            student_id: Student's ID
            ai_feedback: AI-generated feedback
            ai_score: AI-generated score
            zip_path: Path to submitted ZIP file
            status: Submission status
            
        Returns:
            Created submission data
            
        Raises:
            ResourceAlreadyExistsError: If submission already exists
            DatabaseError: If database operation fails
        """
        try:
            # Check for existing submission
            existing = admin_client.table("submissions")\
                .select("id")\
                .eq("assessment_id", assessment_id)\
                .eq("student_id", student_id)\
                .execute()
            
            if existing.data:
                raise ResourceAlreadyExistsError("Submission for this assessment")
            
            # Note: Using numeric ID for legacy compatibility
            submission_id = generate_numeric_id()
            
            response = admin_client.table("submissions").insert({
                "id": submission_id,
                "assessment_id": assessment_id,
                "student_id": student_id,
                "ai_feedback": ai_feedback,
                "ai_score": ai_score,
                "professor_feedback": "",
                "final_score": None,
                "zip_path": zip_path,
                "status": status
            }).execute()
            
            logger.info(f"Created submission {submission_id} for student {student_id}")
            return response.data[0] if response.data else {}
            
        except ResourceAlreadyExistsError:
            raise
        except Exception as e:
            logger.error(f"Error creating submission: {str(e)}")
            raise DatabaseError(f"Failed to create submission: {str(e)}")
    
    @staticmethod
    async def get_submission(submission_id: str) -> Dict[str, Any]:
        """
        Get submission details.
        
        Args:
            submission_id: Submission ID
            
        Returns:
            Submission data
            
        Raises:
            ResourceNotFoundError: If submission not found
            DatabaseError: If database operation fails
        """
        try:
            response = admin_client.table("submissions")\
                .select("*")\
                .eq("id", submission_id)\
                .execute()
            
            if not response.data:
                raise ResourceNotFoundError("Submission")
            
            return response.data[0]
            
        except ResourceNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting submission: {str(e)}")
            raise DatabaseError(f"Failed to retrieve submission: {str(e)}")
    
    @staticmethod
    async def update_submission(
        submission_id: str,
        professor_feedback: Optional[str] = None,
        final_score: Optional[float] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update a submission (typically by professor).
        
        Args:
            submission_id: Submission ID
            professor_feedback: Professor's feedback (optional)
            final_score: Final score (optional)
            status: New status (optional)
            
        Returns:
            Updated submission data
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            update_data = {}
            if professor_feedback is not None:
                update_data["professor_feedback"] = professor_feedback
            if final_score is not None:
                update_data["final_score"] = final_score
            if status is not None:
                update_data["status"] = status
            
            if not update_data:
                raise DatabaseError("No fields to update")
            
            response = admin_client.table("submissions")\
                .update(update_data)\
                .eq("id", submission_id)\
                .execute()
            
            logger.info(f"Updated submission {submission_id}")
            return response.data[0] if response.data else {}
            
        except Exception as e:
            logger.error(f"Error updating submission: {str(e)}")
            raise DatabaseError(f"Failed to update submission: {str(e)}")
    
    @staticmethod
    async def get_assessment_submissions(
        assessment_id: str,
        class_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get all submissions for an assessment, including students who haven't submitted.
        
        Args:
            assessment_id: Assessment ID
            class_id: Class ID
            
        Returns:
            List of submission data with student information
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Get all students in the class
            students_response = admin_client.table("class_students")\
                .select("users!inner(auth_id, first_name, last_name, email)")\
                .eq("class_id", class_id)\
                .execute()
            
            # Get all submissions for this assessment
            submissions_response = admin_client.table("submissions")\
                .select("*, users!inner(first_name, last_name, email)")\
                .eq("assessment_id", assessment_id)\
                .execute()
            
            # Create a map of submissions by student_id
            submission_map = {
                sub["student_id"]: sub 
                for sub in submissions_response.data
            }
            
            # Build result list
            submissions = []
            for item in students_response.data:
                user = item["users"]
                student_id = user["auth_id"]
                
                if student_id in submission_map:
                    submission = submission_map[student_id]
                    submissions.append({
                        "id": submission["id"],
                        "assessment_id": submission["assessment_id"],
                        "student_id": submission["student_id"],
                        "student_name": f"{user['first_name']} {user['last_name']}",
                        "student_email": user["email"],
                        "ai_feedback": submission["ai_feedback"],
                        "ai_score": submission["ai_score"],
                        "professor_feedback": submission["professor_feedback"],
                        "final_score": submission["final_score"],
                        "zip_path": submission["zip_path"],
                        "status": submission["status"],
                        "created_at": submission["created_at"]
                    })
                else:
                    # Student hasn't submitted
                    submissions.append({
                        "id": None,
                        "assessment_id": assessment_id,
                        "student_id": student_id,
                        "student_name": f"{user['first_name']} {user['last_name']}",
                        "student_email": user["email"],
                        "ai_feedback": None,
                        "ai_score": None,
                        "professor_feedback": None,
                        "final_score": None,
                        "zip_path": None,
                        "status": SubmissionStatus.NO_SUBMISSION,
                        "created_at": None
                    })
            
            logger.debug(f"Retrieved {len(submissions)} submissions for assessment {assessment_id}")
            return submissions
            
        except Exception as e:
            logger.error(f"Error getting assessment submissions: {str(e)}")
            raise DatabaseError(f"Failed to retrieve submissions: {str(e)}")
    
    @staticmethod
    async def release_assessment_scores(assessment_id: str, class_id: str) -> int:
        """
        Release scores for all submissions in an assessment.
        Creates 0-score submissions for students who didn't submit.
        
        Args:
            assessment_id: Assessment ID
            class_id: Class ID
            
        Returns:
            Number of submissions released
            
        Raises:
            DatabaseError: If database operation fails
        """
        try:
            # Get all students in the class
            students_response = admin_client.table("class_students")\
                .select("users!inner(auth_id)")\
                .eq("class_id", class_id)\
                .execute()
            
            # Get existing submissions
            submissions_response = admin_client.table("submissions")\
                .select("student_id")\
                .eq("assessment_id", assessment_id)\
                .execute()
            
            existing_student_ids = {
                sub["student_id"] 
                for sub in submissions_response.data
            }
            
            # Create submissions for students who haven't submitted
            for item in students_response.data:
                student_id = item["users"]["auth_id"]
                if student_id not in existing_student_ids:
                    submission_id = generate_numeric_id()
                    admin_client.table("submissions").insert({
                        "id": submission_id,
                        "assessment_id": assessment_id,
                        "student_id": student_id,
                        "ai_feedback": "No submission.",
                        "ai_score": 0.0,
                        "professor_feedback": "No submission.",
                        "final_score": 0.0,
                        "zip_path": None,
                        "status": SubmissionStatus.RELEASED
                    }).execute()
            
            # Update all reviewed submissions to released
            admin_client.table("submissions")\
                .update({"status": SubmissionStatus.RELEASED})\
                .eq("assessment_id", assessment_id)\
                .eq("status", SubmissionStatus.REVIEWED)\
                .execute()
            
            # Count total released
            total_released = admin_client.table("submissions")\
                .select("id")\
                .eq("assessment_id", assessment_id)\
                .eq("status", SubmissionStatus.RELEASED)\
                .execute()
            
            count = len(total_released.data)
            logger.info(f"Released {count} submissions for assessment {assessment_id}")
            return count
            
        except Exception as e:
            logger.error(f"Error releasing scores: {str(e)}")
            raise DatabaseError(f"Failed to release scores: {str(e)}")

