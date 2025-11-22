from fastapi import APIRouter, Depends, HTTPException, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from .auth import get_current_user
from .database import admin_client, supabase
from .ai_evaluator import evaluate_project
import uuid
from datetime import datetime
import os
import zipfile
import shutil
import atexit

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
    professor_feedback: str
    final_score: float

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
            "id, student_id, assessment_id, status, final_score, created_at, users!inner(first_name, last_name)"
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
                "score": submission.get("final_score", "-")
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

        # Delete class_students first
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
        # Set created_at to None to indicate newly added student (will display as "-")
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
                    "ai_feedback": None,
                    "ai_score": None,
                    "professor_feedback": None,
                    "final_score": None,
                    "zip_path": None,
                    "status": "no submission",
                    "created_at": None  # Explicitly set to None to indicate newly added
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
        # Debug logging before delete
        existing_records = admin_client.table("class_students").select("*").eq("class_id", class_id).eq("student_id", student_id).execute()
        print(f"DEBUG: Found {len(existing_records.data)} records to delete for class {class_id} and student {student_id}")
        if existing_records.data:
            print(f"DEBUG: Record data: {existing_records.data[0]}")

        # Remove student from class
        response = admin_client.table("class_students").delete().eq("class_id", class_id).eq("student_id", student_id).execute()
        
        print(f"DEBUG: Delete response data: {response.data}")
        print(f"DEBUG: Delete response status: {response.status_code if hasattr(response, 'status_code') else 'N/A'}")

        # Check if still exists after delete
        remaining_records = admin_client.table("class_students").select("*").eq("class_id", class_id).eq("student_id", student_id).execute()
        print(f"DEBUG: After delete, found {len(remaining_records.data)} records remaining")

        return {"message": "Student removed from class successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Students search endpoint
@router.get("/students/search", response_model=List[StudentResponse])
async def search_students(query: str, current_user=Depends(get_current_user)):
    try:
        response = admin_client.table("users").select("auth_id, first_name, last_name, email").eq("role", "student").ilike("first_name", f"%{query}%").execute()

        students = []
        for user in response.data:
            students.append(StudentResponse(
                id=user["auth_id"],
                first_name=user["first_name"],
                last_name=user["last_name"],
                email=user["email"]
            ))

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

        assessment_id = str(uuid.uuid4())
        response = admin_client.table("assessments").insert({
            "id": assessment_id,
            "class_id": assessment_data.class_id,
            "title": assessment_data.title,
            "instructions": assessment_data.instructions,
            "deadline": assessment_data.deadline
        }).execute()

        return AssessmentResponse(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/assessments", response_model=List[AssessmentResponse])
async def get_professor_assessments(current_user=Depends(get_current_user)):
    try:
        # Get all assessments for classes owned by this professor
        response = admin_client.table("assessments").select(
            "*, classes!inner(professor_id)"
        ).eq("classes.professor_id", current_user.id).execute()

        assessments = []
        for assessment in response.data:
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
            update_data["deadline"] = assessment_data["deadline"]

        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields provided for update")

        response = admin_client.table("assessments").update(update_data).eq("id", assessment_id).execute()

        return {"message": "Assessment updated successfully", "assessment": response.data[0]}
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

        return {
            "id": assessment["id"],
            "class_id": assessment["class_id"],
            "class_name": assessment["classes"]["name"],
            "title": assessment["title"],
            "instructions": assessment["instructions"],
            "deadline": assessment["deadline"],
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
        for item in students_response.data:
            user = item["users"]
            student_id = user["auth_id"]

            if student_id in submission_map:
                # Student submitted
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
        # Verify the professor owns the submission's assessment's class
        submission_check = admin_client.table("submissions").select(
            "*, assessments(classes(professor_id))"
        ).eq("id", submission_id).execute()

        if not submission_check.data or submission_check.data[0]["assessments"]["classes"]["professor_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this submission")

        submission = submission_check.data[0]
        return {
            "id": submission["id"],
            "assessment_id": submission["assessment_id"],
            "student_id": submission["student_id"],
            "ai_feedback": submission["ai_feedback"],
            "ai_score": submission["ai_score"],
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

        # Update submission
        response = admin_client.table("submissions").update({
            "professor_feedback": update_data.professor_feedback,
            "final_score": update_data.final_score,
            "status": "reviewed"
        }).eq("id", submission_id).execute()

        return {"message": "Submission updated successfully"}
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
        print(f"Starting submission for assessment {assessment_id} by user {current_user.id}")

        # Step 1: Get assessment details
        assessment_response = admin_client.table("assessments").select("*").eq("id", assessment_id).execute()
        if not assessment_response.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment_data = assessment_response.data[0]
        class_id = assessment_data["class_id"]
        print(f"Assessment data: {assessment_data}, Class ID: {class_id}")

        # Step 2: Verify student is enrolled in this class
        enrollment_check = admin_client.table("class_students").select("*").eq("class_id", class_id).eq("student_id", current_user.id).execute()
        if not enrollment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to submit to this assessment - not enrolled in class")

        print(f"Student is enrolled in class {class_id}")

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

        # Step 4: Run AI evaluation on extracted files
        ai_result = evaluate_project(extracted_dir)

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

        print(f"Inserting submission with:")
        print(f"  id: {submission_id} (type: {type(submission_id)})")
        print(f"  assessment_id: {assessment_id} (type: {type(assessment_id)})")
        print(f"  student_id: {current_user.id} (type: {type(current_user.id)})")

        submission_data = {
            "id": submission_id,
            "assessment_id": assessment_id,
            "student_id": current_user.id,
            "ai_feedback": ai_result["feedback"],
            "ai_score": ai_result["score"],
            "professor_feedback": "",
            "final_score": None,
            "zip_path": supabase_url,  # Store Supabase URL for persistent file access
            "status": "pending"
        }
        print(f"Full submission data: {submission_data}")

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
