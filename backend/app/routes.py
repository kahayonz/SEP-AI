from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from .auth import get_current_user
from .database import admin_client
import uuid
from datetime import datetime

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

@router.get("/classes/{class_id}/students", response_model=List[StudentResponse])
async def get_class_students(class_id: str, current_user=Depends(get_current_user)):
    try:
        # First verify the professor owns this class
        class_check = admin_client.table("classes").select("id").eq("id", class_id).eq("professor_id", current_user.id).execute()
        if not class_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to view this class")

        # Get students in the class
        response = admin_client.table("class_students").select(
            "users!inner(id, first_name, last_name, email)"
        ).eq("class_id", class_id).execute()

        students = []
        for item in response.data:
            user = item["users"]
            students.append(StudentResponse(
                id=user["id"],
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
        response = admin_client.table("class_students").delete().eq("class_id", class_id).eq("student_id", student_id).execute()

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

@router.get("/assessments/{assessment_id}/submissions")
async def get_assessment_submissions(assessment_id: str, current_user=Depends(get_current_user)):
    try:
        # Verify the professor owns the assessment's class
        assessment_check = admin_client.table("assessments").select(
            "classes!inner(professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not assessment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to view this assessment")

        # Get submissions
        response = admin_client.table("submissions").select(
            "*, users!inner(first_name, last_name, email)"
        ).eq("assessment_id", assessment_id).execute()

        submissions = []
        for submission in response.data:
            user = submission["users"]
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

        return submissions
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
            "classes!inner(professor_id)"
        ).eq("id", assessment_id).eq("classes.professor_id", current_user.id).execute()

        if not assessment_check.data:
            raise HTTPException(status_code=403, detail="Not authorized to release scores for this assessment")

        # Update all submissions for this assessment to 'released' status
        response = admin_client.table("submissions").update({
            "status": "released"
        }).eq("assessment_id", assessment_id).eq("status", "reviewed").execute()

        return {"message": f"Released scores for {len(response.data)} submissions"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
