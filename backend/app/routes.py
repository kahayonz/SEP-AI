from fastapi import APIRouter, Depends, HTTPException, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from .auth import get_current_user
from .database import admin_client, supabase
from .ai_evaluator import evaluate_project
import uuid
from datetime import datetime, timezone, timedelta
import os
import zipfile
import shutil
import atexit
import json
import tempfile
import sys
from pathlib import Path
from .zip_extractor import extract_developer_files
import requests
from dotenv import load_dotenv

# Manila timezone (UTC+8)
MANILA_TZ = timezone(timedelta(hours=8))

def parse_manila_datetime(datetime_str: str) -> datetime:
    """Parse Manila timezone datetime string and convert to UTC for storage"""
    if datetime_str.endswith('+08:00'):
        # Parse as Manila time and convert to UTC
        manila_time = datetime.fromisoformat(datetime_str[:-6])  # Remove +08:00
        manila_time = manila_time.replace(tzinfo=MANILA_TZ)
        return manila_time.astimezone(timezone.utc)
    else:
        # Fallback for existing data - assume it's already UTC
        return datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))

def format_manila_datetime(utc_datetime: datetime) -> str:
    """Convert UTC datetime back to Manila time for display"""
    if utc_datetime.tzinfo is None:
        utc_datetime = utc_datetime.replace(tzinfo=timezone.utc)
    manila_time = utc_datetime.astimezone(MANILA_TZ)
    return manila_time.isoformat()

# Import LLM evaluation function from routes_ai
# We need to import it carefully to avoid circular imports
# Load environment variables first
# In production (Render), environment variables are set directly, so we only load .env files if they exist
# and don't override existing environment variables
backend_env = Path(__file__).parent.parent / ".env"
root_env = Path(__file__).parent.parent.parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=False)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=False)
else:
    # Only load if .env exists in current directory, don't override existing env vars
    load_dotenv(override=False)

# Import the LLM evaluation function
from backend.app.routes_ai import llm_evaluate

router = APIRouter()

# Pydantic models
class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ClassResponse(BaseModel):
    id: str
    professor_id: str
    name: str
    description: Optional[str]
    created_at: str

class AssessmentCreate(BaseModel):
    class_id: str
    title: str
    instructions: str
    deadline: str

class AssessmentResponse(BaseModel):
    id: str
    class_id: str
    title: str
    instructions: str
    deadline: str
    created_at: str
    class_name: Optional[str] = None

class StudentSearch(BaseModel):
    name: str

class StudentResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str

class AddStudentToClass(BaseModel):
    student_id: str

class SubmissionUpdate(BaseModel):
    professor_feedback: Optional[str] = ""
    final_score: float
    adjusted_ai_score: Optional[float] = None
    human_evaluation: Optional[dict] = None

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    role: str

# Classes endpoints
@router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, current_user=Depends(get_current_user)):
    try:
        class_id = str(uuid.uuid4())
        response = admin_client.table("classes").insert({
            "id": class_id,
            "professor_id": current_user.id,
            "name": class_data.name,
            "description": class_data.description
        }).execute()

        return ClassResponse(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/classes", response_model=List[ClassResponse])
async def get_professor_classes(current_user=Depends(get_current_user)):
    try:
        response = admin_client.table("classes").select("*").eq("professor_id", current_user.id).execute()
        return [ClassResponse(**cls) for cls in response.data]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/professor/dashboard-stats")
async def get_professor_dashboard_stats(current_user=Depends(get_current_user)):
    try:
        # Get all classes for the professor
        classes_response = admin_client.table("classes").select("id").eq("professor_id", current_user.id).execute()
        class_ids = [cls["id"] for cls in classes_response.data]
        
        if not class_ids:
            return {
                "total_submissions": 0,
                "graded_submissions": 0,
                "pending_submissions": 0,
                "average_score": 0.0
            }
        
        # Get all assessments for these classes
        assessments_response = admin_client.table("assessments").select("id").in_("class_id", class_ids).execute()
        assessment_ids = [a["id"] for a in assessments_response.data]
        
        if not assessment_ids:
            return {
                "total_submissions": 0,
                "graded_submissions": 0,
                "pending_submissions": 0,
                "average_score": 0.0
            }
        
        # Get all submissions for these assessments
        submissions_response = admin_client.table("submissions").select("*").in_("assessment_id", assessment_ids).execute()
        submissions = submissions_response.data
        
        total_submissions = len(submissions)
        # A submission is graded if it has been reviewed (status = 'reviewed' or 'released')
        graded_submissions = len([s for s in submissions if s.get("status") in ["reviewed", "released"]])
        pending_submissions = len([s for s in submissions if s.get("status") not in ["reviewed", "released"]])
        
        # Calculate average score from graded submissions
        graded_list = [s for s in submissions if s.get("status") in ["reviewed", "released"]]
        scores = [s.get("final_score") for s in graded_list if s.get("final_score") is not None]
        average_score = sum(scores) / len(scores) if scores else 0.0
        
        return {
            "total_submissions": total_submissions,
            "graded_submissions": graded_submissions,
            "pending_submissions": pending_submissions,
            "average_score": round(average_score, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/professor/recent-submissions")
async def get_recent_submissions(current_user=Depends(get_current_user)):
    try:
        # Get all classes for the professor
        classes_response = admin_client.table("classes").select("id").eq("professor_id", current_user.id).execute()
        class_ids = [cls["id"] for cls in classes_response.data]
        
        if not class_ids:
            return []
        
        # Get all assessments for these classes
        assessments_response = admin_client.table("assessments").select("id, title, classes(name)").in_("class_id", class_ids).execute()
        assessment_ids = [a["id"] for a in assessments_response.data]
        assessment_map = {a["id"]: a for a in assessments_response.data}
        
        if not assessment_ids:
            return []
        
        # Get all submissions for these assessments, ordered by created_at, limit to 5
        submissions_response = admin_client.table("submissions").select(
            "id, student_id, assessment_id, status, ai_score, final_score, created_at, users!inner(first_name, last_name)"
        ).in_("assessment_id", assessment_ids).order("created_at", desc=True).limit(5).execute()

        submissions = submissions_response.data
        result = []

        for submission in submissions:
            assessment = assessment_map.get(submission["assessment_id"], {})
            student_name = f"{submission['users']['first_name']} {submission['users']['last_name']}"
            # For newly added students with no actual submission, show "-" as date
            submission_date = submission.get("created_at") or ("-" if submission.get("status") == "no submission" else "")

            result.append({
                "id": submission["id"],
                "student_name": student_name,
                "project": submission.get("project_name", "Project"),
                "assessment_title": assessment.get("title", "Unknown Assessment"),
                "class_name": assessment.get("classes", {}).get("name", "Unknown Class"),
                "submission_date": submission_date,
                "status": submission.get("status", "pending"),
                "ai_score": submission.get("ai_score"),
                "final_score": submission.get("final_score")
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/classes/{class_id}")
async def delete_class(class_id: str, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns this class
        class_check = admin_client.table("classes").select("id").eq("id", class_id).eq("professor_id", current_user.id).execute()
        if not class_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to delete this class")

        # Get all assessments for this class
        assessments_response = admin_client.table("assessments").select("id").eq("class_id", class_id).execute()

        # Delete submissions and assessments in cascade order
        for assessment in assessments_response.data:
            assessment_id = assessment["id"]
            # Delete associated submissions first
            admin_client.table("submissions").delete().eq("assessment_id", assessment_id).execute()
            # Delete the assessment
            admin_client.table("assessments").delete().eq("id", assessment_id).execute()

        # Delete class_students
        admin_client.table("class_students").delete().eq("class_id", class_id).execute()

        # Delete the class
        admin_client.table("classes").delete().eq("id", class_id).execute()

        return {"message": "Class deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/classes/{class_id}/students", response_model=List[StudentResponse])
async def get_class_students(class_id: str, current_user=Depends(get_current_user)):
    try:
        # First verify the professor owns this class
        class_check = admin_client.table("classes").select("id").eq("id", class_id).eq("professor_id", current_user.id).execute()
        if not class_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to view this class")

        # Get students in the class
        response = admin_client.table("class_students").select(
            "users!inner(auth_id, first_name, last_name, email)"
        ).eq("class_id", class_id).execute()


        students = []
        for item in response.data:
            user = item["users"]
            students.append(StudentResponse(
                id=user["auth_id"],
                first_name=user["first_name"],
                last_name=user["last_name"],
                email=user["email"]
            ))

        return students
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/classes/{class_id}/students")
async def add_student_to_class(class_id: str, student_data: AddStudentToClass, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns this class
        class_check = admin_client.table("classes").select("id").eq("id", class_id).eq("professor_id", current_user.id).execute()
        if not class_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to modify this class")

        # Check if student exists
        student_check = admin_client.table("users").select("id").eq("auth_id", student_data.student_id).eq("role", "student").execute()
        if not student_check.data:
            raise HTTPException(status_code=404, detail="Student not found")

        # Check if student is already in the class
        existing = admin_client.table("class_students").select("id").eq("class_id", class_id).eq("student_id", student_data.student_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Student already in class")

        # Add student to class
        response = admin_client.table("class_students").insert({
            "id": str(uuid.uuid4()),
            "class_id": class_id,
            "student_id": student_data.student_id
        }).execute()

        # Get all assessments for this class
        assessments_response = admin_client.table("assessments").select("id").eq("class_id", class_id).execute()
        assessment_ids = [a["id"] for a in assessments_response.data]

        # Create submission records for all existing assessments for this newly added student
        import random
        for assessment_id in assessment_ids:
            # Check if submission already exists (shouldn't happen but safety check)
            existing_submission = admin_client.table("submissions").select("id").eq("assessment_id", assessment_id).eq("student_id", student_data.student_id).execute()
            if not existing_submission.data:
                submission_id = random.randint(1000000000, 9999999999)
                admin_client.table("submissions").insert({
                    "id": submission_id,
                    "assessment_id": assessment_id,
                    "student_id": student_data.student_id,
                    "ai_feedback": "No submission yet.",
                    "ai_score": None,
                    "professor_feedback": "",
                    "final_score": None,
                    "zip_path": None,
                    "status": "no submission",
                    "created_at": datetime.utcnow().isoformat()  # Set current time for new records
                }).execute()

        return {"message": "Student added to class successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/classes/{class_id}/students/{student_id}")
async def remove_student_from_class(class_id: str, student_id: str, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns this class
        class_check = admin_client.table("classes").select("id").eq("id", class_id).eq("professor_id", current_user.id).execute()
        if not class_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to modify this class")

        # Remove student from class
        admin_client.table("class_students").delete().eq("class_id", class_id).eq("student_id", student_id).execute()

        return {"message": "Student removed from class successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Students search endpoint
@router.get("/students/search", response_model=List[StudentResponse])
async def search_students(query: str, current_user=Depends(get_current_user)):
    try:
        # Search across first_name, last_name, and email fields
        first_name_results = admin_client.table("users").select("auth_id, first_name, last_name, email").eq("role", "student").ilike("first_name", f"%{query}%").execute()
        last_name_results = admin_client.table("users").select("auth_id, first_name, last_name, email").eq("role", "student").ilike("last_name", f"%{query}%").execute()
        email_results = admin_client.table("users").select("auth_id, first_name, last_name, email").eq("role", "student").ilike("email", f"%{query}%").execute()

        # Combine and deduplicate results
        all_users = {}

        for user in first_name_results.data:
            all_users[user["auth_id"]] = user
        for user in last_name_results.data:
            all_users[user["auth_id"]] = user
        for user in email_results.data:
            all_users[user["auth_id"]] = user

        students = [StudentResponse(
            id=user["auth_id"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            email=user["email"]
        ) for user in all_users.values()]

        return students
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/students", response_model=List[StudentResponse])
async def get_all_students(current_user=Depends(get_current_user)):
    try:
        response = admin_client.table("users").select("auth_id, first_name, last_name, email").eq("role", "student").execute()

        students = []
        for user in response.data:
            students.append(StudentResponse(
                id=user["auth_id"],
                first_name=user["first_name"],
                last_name=user["email"],
                email=user["email"]
            ))

        return students
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Assessments endpoints
@router.post("/assessments", response_model=AssessmentResponse)
async def create_assessment(assessment_data: AssessmentCreate, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the class
        class_check = admin_client.table("classes").select("id").eq("id", assessment_data.class_id).eq("professor_id", current_user.id).execute()
        if not class_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to create assessments for this class")

        # Convert Manila time to UTC for storage
        deadline_utc = parse_manila_datetime(assessment_data.deadline)

        assessment_id = str(uuid.uuid4())
        response = admin_client.table("assessments").insert({
            "id": assessment_id,
            "class_id": assessment_data.class_id,
            "title": assessment_data.title,
            "instructions": assessment_data.instructions,
            "deadline": deadline_utc.isoformat()
        }).execute()

        # Convert back to Manila time for response
        assessment_data = response.data[0]
        assessment_data['deadline'] = format_manila_datetime(datetime.fromisoformat(assessment_data['deadline']))

        return AssessmentResponse(**assessment_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/assessments", response_model=List[AssessmentResponse])
async def get_professor_assessments(current_user=Depends(get_current_user)):
    try:
        # Get professor's classes first to get class names
        classes_response = admin_client.table("classes").select("id, name").eq("professor_id", current_user.id).execute()
        class_map = {cls["id"]: cls["name"] for cls in classes_response.data}
        class_ids = list(class_map.keys())

        if not class_ids:
            return []

        # Get assessments for these classes
        response = admin_client.table("assessments").select("*").in_("class_id", class_ids).execute()

        assessments = []
        for assessment in response.data:
            # Convert UTC deadline back to Manila time for display
            utc_deadline = datetime.fromisoformat(assessment['deadline'].replace('Z', '+00:00'))
            assessment['deadline'] = format_manila_datetime(utc_deadline)
            assessment['class_name'] = class_map.get(assessment['class_id'], 'Unknown')
            assessments.append(AssessmentResponse(**assessment))

        return assessments
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/assessments/{assessment_id}")
async def update_assessment(assessment_id: str, assessment_data: dict, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the assessment
        ownership_check = admin_client.table("assessments").select(
            "class_id, classes!inner(professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not ownership_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to update this assessment")

        # Update the assessment
        update_data = {}
        if "title" in assessment_data:
            update_data["title"] = assessment_data["title"]
        if "instructions" in assessment_data:
            update_data["instructions"] = assessment_data["instructions"]
        if "deadline" in assessment_data:
            # Convert Manila time to UTC for storage
            deadline_utc = parse_manila_datetime(assessment_data["deadline"])
            update_data["deadline"] = deadline_utc.isoformat()

        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields provided for update")

        response = admin_client.table("assessments").update(update_data).eq("id", assessment_id).execute()

        # Convert back to Manila time for response
        assessment = response.data[0]
        utc_deadline = datetime.fromisoformat(assessment['deadline'].replace('Z', '+00:00'))
        assessment['deadline'] = format_manila_datetime(utc_deadline)

        return {"message": "Assessment updated successfully", "assessment": assessment}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/assessments/{assessment_id}")
async def get_assessment_details(assessment_id: str, current_user=Depends(get_current_user)):
    try:
        # Get assessment with class info to verify ownership
        assessment_response = admin_client.table("assessments").select(
            "*, classes!inner(name, professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not assessment_response.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment = assessment_response.data[0]

        # Convert UTC deadline back to Manila time for display
        utc_deadline = datetime.fromisoformat(assessment['deadline'].replace('Z', '+00:00'))
        deadline_manila = format_manila_datetime(utc_deadline)

        return {
            "id": assessment["id"],
            "class_id": assessment["class_id"],
            "class_name": assessment["classes"]["name"],
            "title": assessment["title"],
            "instructions": assessment["instructions"],
            "deadline": deadline_manila,
            "created_at": assessment["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/assessments/{assessment_id}/submissions")
async def get_assessment_submissions(assessment_id: str, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the assessment's class and get class_id
        assessment_check = admin_client.table("assessments").select(
            "class_id, classes!inner(professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not assessment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to view this assessment")

        class_id = assessment_check.data[0]["class_id"]

        # Get all students in the class
        students_response = admin_client.table("class_students").select(
            "users!inner(auth_id, first_name, last_name, email)"
        ).eq("class_id", class_id).execute()

        # Get all submissions for this assessment
        submissions_response = admin_client.table("submissions").select(
            "*, users!inner(first_name, last_name, email)"
        ).eq("assessment_id", assessment_id).execute()

        # Create a map of submissions by student_id
        submission_map = {sub["student_id"]: sub for sub in submissions_response.data}

        submissions = []
        import json
        for item in students_response.data:
            user = item["users"]
            student_id = user["auth_id"]

            if student_id in submission_map:
                # Student submitted
                submission = submission_map[student_id]
                
                # Parse ai_evaluation_data if it exists
                ai_evaluation_data = None
                if submission.get("ai_evaluation_data"):
                    try:
                        ai_evaluation_data = json.loads(submission["ai_evaluation_data"])
                    except (json.JSONDecodeError, TypeError):
                        ai_evaluation_data = None
                
                submissions.append({
                    "id": submission["id"],
                    "assessment_id": submission["assessment_id"],
                    "student_id": submission["student_id"],
                    "student_name": f"{user['first_name']} {user['last_name']}",
                    "student_email": user["email"],
                    "ai_feedback": submission["ai_feedback"],
                    "ai_score": submission["ai_score"],
                    "ai_evaluation_data": ai_evaluation_data,  # Full evaluation data
                    "professor_feedback": submission["professor_feedback"],
                    "final_score": submission["final_score"],
                    "zip_path": submission["zip_path"],
                    "status": submission["status"],
                    "created_at": submission["created_at"]
                })
            else:
                # Student did not submit - create placeholder
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
                    "status": "no submission",
                    "created_at": None
                })

        return submissions
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/submissions/{submission_id}")
async def get_submission(submission_id: str, current_user=Depends(get_current_user)):
    try:
        # Get the submission first
        submission_response = admin_client.table("submissions").select("*").eq("id", submission_id).execute()

        if not submission_response.data:
            raise HTTPException(status_code=404, detail="Submission not found")

        submission = submission_response.data[0]

        # Get the assessment
        assessment_response = admin_client.table("assessments").select("class_id").eq("id", submission["assessment_id"]).execute()

        if not assessment_response.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment = assessment_response.data[0]

        # Get the class and check professor_id
        class_response = admin_client.table("classes").select("professor_id").eq("id", assessment["class_id"]).execute()

        if not class_response.data or class_response.data[0]["professor_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this submission")

        # Parse ai_evaluation_data if it exists
        ai_evaluation_data = None
        if submission.get("ai_evaluation_data"):
            try:
                import json
                ai_evaluation_data = json.loads(submission["ai_evaluation_data"])
            except (json.JSONDecodeError, TypeError):
                # If parsing fails, just use None
                ai_evaluation_data = None
        
        # Get adjusted_ai_score if it exists
        adjusted_ai_score = submission.get("adjusted_ai_score")
        
        # Parse human_evaluation if it exists
        human_evaluation = None
        if submission.get("human_evaluation"):
            try:
                human_evaluation = json.loads(submission["human_evaluation"])
            except (json.JSONDecodeError, TypeError):
                human_evaluation = None

        return {
            "id": submission["id"],
            "assessment_id": submission["assessment_id"],
            "student_id": submission["student_id"],
            "ai_feedback": submission["ai_feedback"],
            "ai_score": submission["ai_score"],
            "ai_evaluation_data": ai_evaluation_data,  # Full evaluation data
            "adjusted_ai_score": adjusted_ai_score,  # Adjusted AI score
            "human_evaluation": human_evaluation,  # Human evaluation scores
            "professor_feedback": submission["professor_feedback"],
            "final_score": submission["final_score"],
            "zip_path": submission["zip_path"],
            "status": submission["status"],
            "created_at": submission["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/submissions/{submission_id}")
async def update_submission(submission_id: str, update_data: SubmissionUpdate, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the submission's assessment's class
        submission_check = admin_client.table("submissions").select(
            "assessments(classes(professor_id))"
        ).eq("id", submission_id).execute()

        if not submission_check.data or submission_check.data[0]["assessments"]["classes"]["professor_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this submission")

        # Validate final score
        if update_data.final_score < 0 or update_data.final_score > 100:
            raise HTTPException(status_code=400, detail="Final score must be between 0 and 100")

        # Validate adjusted AI score if provided
        if update_data.adjusted_ai_score is not None:
            if update_data.adjusted_ai_score < 0 or update_data.adjusted_ai_score > 24:
                raise HTTPException(status_code=400, detail="Adjusted AI score must be between 0 and 24")

        # Validate human evaluation if provided
        if update_data.human_evaluation:
            human_eval = update_data.human_evaluation
            required_fields = ['innovation_score', 'collaboration_score', 'presentation_score']
            
            for field in required_fields:
                if field not in human_eval:
                    raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
                
                score = human_eval[field]
                if not isinstance(score, (int, float)) or score < 0 or score > 4:
                    raise HTTPException(status_code=400, detail=f"{field} must be a number between 0 and 4")

        # Prepare update data
        update_dict = {
            "professor_feedback": update_data.professor_feedback or "",
            "final_score": update_data.final_score,
            "status": "reviewed"
        }
        
        # Add adjusted AI score if provided
        if update_data.adjusted_ai_score is not None:
            update_dict["adjusted_ai_score"] = float(update_data.adjusted_ai_score)
        
        # Add human evaluation if provided (store as JSON string)
        if update_data.human_evaluation:
            # Ensure all scores are floats
            human_eval_clean = {
                "innovation_score": float(update_data.human_evaluation.get("innovation_score", 0)),
                "collaboration_score": float(update_data.human_evaluation.get("collaboration_score", 0)),
                "presentation_score": float(update_data.human_evaluation.get("presentation_score", 0))
            }
            update_dict["human_evaluation"] = json.dumps(human_eval_clean)
        
        # Update submission
        try:
            response = admin_client.table("submissions").update(update_dict).eq("id", submission_id).execute()

            if not response.data:
                raise HTTPException(status_code=404, detail="Submission not found")

            return {"message": "Submission updated successfully"}
        except Exception as db_error:
            error_str = str(db_error)
            # Check if it's a missing column error
            if "PGRST204" in error_str or "column" in error_str.lower() and "schema cache" in error_str.lower():
                missing_column = None
                if "adjusted_ai_score" in error_str:
                    missing_column = "adjusted_ai_score"
                elif "human_evaluation" in error_str:
                    missing_column = "human_evaluation"
                
                if missing_column:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Database column '{missing_column}' is missing. Please run the migration file: backend/migrations/001_add_submission_columns.sql"
                    )
            raise HTTPException(status_code=400, detail=f"Database error: {error_str}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/assessments/{assessment_id}/release-scores")
async def release_assessment_scores(assessment_id: str, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the assessment's class
        assessment_check = admin_client.table("assessments").select(
            "class_id, classes!inner(professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not assessment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to release scores for this assessment")

        class_id = assessment_check.data[0]["class_id"]

        import random

        # Get all students in the class to check for missing submissions
        students_response = admin_client.table("class_students").select(
            "users!inner(auth_id, first_name, last_name, email)"
        ).eq("class_id", class_id).execute()

        # Get existing submissions
        submissions_response = admin_client.table("submissions").select(
            "student_id"
        ).eq("assessment_id", assessment_id).execute()

        existing_student_ids = {sub["student_id"] for sub in submissions_response.data}

        # Create submissions for students who haven't submitted
        for item in students_response.data:
            student_id = item["users"]["auth_id"]
            if student_id not in existing_student_ids:
                # Create a "no submission" record
                submission_id = random.randint(1000000000, 9999999999)
                admin_client.table("submissions").insert({
                    "id": submission_id,
                    "assessment_id": assessment_id,
                    "student_id": student_id,
                    "ai_feedback": "No submission.",
                    "ai_score": 0.0,
                    "professor_feedback": "No submission.",
                    "final_score": 0.0,
                    "zip_path": None,
                    "status": "released"
                }).execute()

        # Update all submissions for this assessment to 'released' status (this will also update the ones we just created)
        response = admin_client.table("submissions").update({
            "status": "released"
        }).eq("assessment_id", assessment_id).eq("status", "reviewed").execute()

        # Count total released submissions
        total_released = admin_client.table("submissions").select(
            "id"
        ).eq("assessment_id", assessment_id).eq("status", "released").execute()

        return {"message": f"Released scores for {len(total_released.data)} submissions"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the assessment
        ownership_check = admin_client.table("assessments").select(
            "class_id, classes!inner(professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not ownership_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to delete this assessment")

        # Delete associated submissions first
        admin_client.table("submissions").delete().eq("assessment_id", assessment_id).execute()

        # Delete the assessment
        admin_client.table("assessments").delete().eq("id", assessment_id).execute()

        return {"message": "Assessment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Student routes
@router.get("/student/classes")
async def get_student_classes(current_user=Depends(get_current_user)):
    try:
        # Get classes where student is enrolled
        response = admin_client.table("class_students").select(
            "classes(*, assessments(*))"
        ).eq("student_id", current_user.id).execute()

        classes = []
        for item in response.data:
            cls = item["classes"]
            classes.append({
                "id": cls["id"],
                "name": cls["name"],
                "description": cls["description"],
                "assessments": cls["assessments"]
            })

        return classes
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/student/assessments/{assessment_id}")
async def get_assessment_details(assessment_id: str, current_user=Depends(get_current_user)):
    try:
        # Get assessment details
        assessment_response = admin_client.table("assessments").select("*").eq("id", assessment_id).execute()
        if not assessment_response.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment = assessment_response.data[0]
        class_id = assessment["class_id"]

        # Verify student is enrolled in this class
        enrollment_check = admin_client.table("class_students").select("*").eq("class_id", class_id).eq("student_id", current_user.id).execute()
        if not enrollment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to view this assessment - not enrolled in class")

        # Check if student already submitted
        submission_check = admin_client.table("submissions").select("*").eq("assessment_id", assessment_id).eq("student_id", current_user.id).execute()

        submission = None
        if submission_check.data:
            submission = submission_check.data[0]

        return {
            "assessment": assessment,
            "submission": submission
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/student/assessments/{assessment_id}/submit")
async def submit_assessment(assessment_id: str, file: bytes = File(...), current_user=Depends(get_current_user)):
    temp_dirs = []  # Track directories for cleanup

    try:
        # Step 1: Get assessment details
        assessment_response = admin_client.table("assessments").select("*").eq("id", assessment_id).execute()
        if not assessment_response.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment_data = assessment_response.data[0]
        class_id = assessment_data["class_id"]

        # Step 2: Verify student is enrolled in this class
        enrollment_check = admin_client.table("class_students").select("*").eq("class_id", class_id).eq("student_id", current_user.id).execute()
        if not enrollment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to submit to this assessment - not enrolled in class")

        # Check if student already submitted
        existing_submission = admin_client.table("submissions").select("id").eq("assessment_id", assessment_id).eq("student_id", current_user.id).execute()

        if existing_submission.data:
            raise HTTPException(status_code=400, detail="You have already submitted to this assessment")

        # Step 1: Create organized directory structure
        base_upload_dir = "backend/uploads"
        class_dir = os.path.join(base_upload_dir, f"class_{class_id}")
        assessment_dir = os.path.join(class_dir, f"assessment_{assessment_id}")
        extracted_dir = os.path.join(assessment_dir, "extracted")

        # Create directories
        os.makedirs(extracted_dir, exist_ok=True)
        temp_dirs.extend([extracted_dir, assessment_dir, class_dir])

        # Step 2: Save ZIP file temporarily
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"student_{current_user.id}_project.zip"
        zip_path = os.path.join(assessment_dir, zip_filename)

        with open(zip_path, "wb") as f:
            f.write(file)

        # Step 3: Extract ZIP file
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extracted_dir)
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file")

        # Step 4: Run LLM evaluation on ZIP file (for official submissions)
        llm_evaluation_result = None
        try:
            llm_evaluation_result = await llm_evaluate(zip_path)
            print(f"LLM evaluation completed for submission")
        except Exception as llm_error:
            # Log LLM error but don't fail the submission
            print(f"LLM evaluation failed (non-critical): {str(llm_error)}")
            # Fallback to basic evaluation
            ai_result = evaluate_project(extracted_dir)
            llm_evaluation_result = None

        # Step 5: Upload ZIP to Supabase storage
        supabase_storage_path = f"submissions/student_{current_user.id}/{assessment_id}_{timestamp}.zip"

        # Upload file to Supabase storage
        with open(zip_path, 'rb') as f:
            supabase.storage.from_("submissions").upload(
                path=supabase_storage_path,
                file=f,
                file_options={"content-type": "application/zip"}
            )

        # Get public URL for the uploaded file
        supabase_url = supabase.storage.from_("submissions").get_public_url(supabase_storage_path)

        # Step 6: Create submission record in database
        # Note: The submissions table uses bigint for id instead of uuid
        # Generate a random integer ID for compatibility
        import random
        submission_id = random.randint(1000000000, 9999999999)  # 10-digit random number

        # Prepare submission data with LLM evaluation if available
        if llm_evaluation_result:
            # Store full LLM evaluation data
            submission_data = {
                "id": submission_id,
                "assessment_id": assessment_id,
                "student_id": current_user.id,
                "ai_evaluation_data": json.dumps(llm_evaluation_result),  # Full evaluation as JSON
                "ai_score": llm_evaluation_result.get("overall_score", 0),
                "ai_feedback": "\n".join(llm_evaluation_result.get("feedback", [])) if llm_evaluation_result.get("feedback") else None,
                "professor_feedback": "",
                "final_score": None,
                "zip_path": supabase_url,
                "status": "pending"
            }
        else:
            # Fallback to basic evaluation
            if 'ai_result' not in locals():
                ai_result = evaluate_project(extracted_dir)
            submission_data = {
                "id": submission_id,
                "assessment_id": assessment_id,
                "student_id": current_user.id,
                "ai_feedback": ai_result["feedback"],
                "ai_score": ai_result["score"],
                "professor_feedback": "",
                "final_score": None,
                "zip_path": supabase_url,
                "status": "pending"
            }

        response = admin_client.table("submissions").insert(submission_data).execute()

        # Step 7: Cleanup - Delete local files immediately after successful upload
        try:
            shutil.rmtree(class_dir)  # Remove entire class directory
        except Exception as e:
            print(f"Warning: Failed to cleanup local files: {e}")

        return {"message": "Assessment submitted successfully", "submission_id": submission_id}

    except Exception as e:
        # Cleanup any created directories on error
        for temp_dir in temp_dirs:
            try:
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)
            except Exception as cleanup_error:
                print(f"Warning: Failed to cleanup {temp_dir}: {cleanup_error}")

        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")
