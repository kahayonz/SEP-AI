"""
Pydantic models for SEP-AI application.
Provides request/response validation and serialization.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime

from .config import UserRole, app_config


# Base models
class BaseResponse(BaseModel):
    """Base response model."""
    message: str


# User models
class SignupRequest(BaseModel):
    """Request model for user signup."""
    email: EmailStr
    password: str = Field(..., min_length=app_config.MIN_PASSWORD_LENGTH)
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    role: str
    university: str = Field(..., min_length=1, max_length=200)
    
    @validator('role')
    def validate_role(cls, v):
        if v not in UserRole.all_roles():
            raise ValueError(f'Invalid role. Must be one of: {", ".join(UserRole.all_roles())}')
        return v
    
    @validator('firstName', 'lastName')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class LoginRequest(BaseModel):
    """Request model for user login."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class UpdateUserRequest(BaseModel):
    """Request model for updating user profile."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    university: str = Field(..., min_length=1, max_length=200)
    
    @validator('first_name', 'last_name', 'university')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()


class UserResponse(BaseModel):
    """Response model for user data."""
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    university: Optional[str] = None


class AuthResponse(BaseModel):
    """Response model for authentication."""
    message: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    user: Optional[dict] = None


# Class models
class ClassCreate(BaseModel):
    """Request model for creating a class."""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Class name cannot be empty')
        return v.strip()


class ClassResponse(BaseModel):
    """Response model for class data."""
    id: str
    professor_id: str
    name: str
    description: Optional[str]
    created_at: str


# Assessment models
class AssessmentCreate(BaseModel):
    """Request model for creating an assessment."""
    class_id: str
    title: str = Field(..., min_length=1, max_length=200)
    instructions: str = Field(..., min_length=1, max_length=5000)
    deadline: str
    
    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @validator('instructions')
    def validate_instructions(cls, v):
        if not v or not v.strip():
            raise ValueError('Instructions cannot be empty')
        return v.strip()


class AssessmentUpdate(BaseModel):
    """Request model for updating an assessment."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    instructions: Optional[str] = Field(None, min_length=1, max_length=5000)
    deadline: Optional[str] = None


class AssessmentResponse(BaseModel):
    """Response model for assessment data."""
    id: str
    class_id: str
    title: str
    instructions: str
    deadline: str
    created_at: str


# Student models
class StudentResponse(BaseModel):
    """Response model for student data."""
    id: str
    first_name: str
    last_name: str
    email: str


class AddStudentToClass(BaseModel):
    """Request model for adding a student to a class."""
    student_id: str = Field(..., min_length=1)


# Submission models
class SubmissionUpdate(BaseModel):
    """Request model for updating a submission."""
    professor_feedback: str = Field(..., min_length=1, max_length=5000)
    final_score: float = Field(..., ge=0, le=100)
    
    @validator('professor_feedback')
    def validate_feedback(cls, v):
        if not v or not v.strip():
            raise ValueError('Feedback cannot be empty')
        return v.strip()


class SubmissionResponse(BaseModel):
    """Response model for submission data."""
    id: Optional[int]
    assessment_id: str
    student_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    ai_feedback: Optional[str]
    ai_score: Optional[float]
    professor_feedback: Optional[str]
    final_score: Optional[float]
    zip_path: Optional[str]
    status: str
    created_at: Optional[str]


# Dashboard models
class DashboardStats(BaseModel):
    """Response model for professor dashboard statistics."""
    total_submissions: int
    graded_submissions: int
    pending_submissions: int
    average_score: float


class RecentSubmission(BaseModel):
    """Response model for recent submission in dashboard."""
    id: int
    student_name: str
    project: str
    assessment_title: str
    class_name: str
    submission_date: str
    status: str
    score: Optional[float]


# AI Evaluation models
class AIEvaluationResult(BaseModel):
    """Response model for AI evaluation result."""
    feedback: str
    score: float = Field(..., ge=0, le=100)


class SubmissionCreateResponse(BaseModel):
    """Response model for submission creation."""
    message: str
    submission_id: int

