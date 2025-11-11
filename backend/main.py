# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from supabase import create_client, Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from app.auth import get_current_user
from app.routes_ai import router as ai_router

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


app = FastAPI()
security = HTTPBearer()
app.include_router(ai_router, prefix="/api", tags=["AI Evaluation"])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SignupIn(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    role: str
    university: str

class LoginIn(BaseModel):
    email: str
    password: str

@app.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    # JWT tokens are stateless - actual logout happens client-side
    # This endpoint just validates the token is still valid
    return {"message": "Successfully logged out"}

@app.post("/signup")
async def signup(payload: SignupIn):
    try:
        auth_response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = auth_response.user
    if not user:
        raise HTTPException(status_code=400, detail="Signup failed.")

    auth_id = user.id

    try:
        insert_response = admin_client.table("users").insert({
            "auth_id": auth_id,
            "email": payload.email,
            "first_name": payload.firstName,
            "last_name": payload.lastName,
            "role": payload.role,
            "university": payload.university
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": "Please check your email to confirm your account",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": payload.role
        }
    }

@app.post("/login")
async def login(payload: LoginIn):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    session = auth_response.session
    user = auth_response.user

    # Get user role from users table
    try:
        user_data = admin_client.table("users").select("role").eq("auth_id", user.id).execute()
        if user_data.data and len(user_data.data) > 0:
            role = user_data.data[0]["role"]
        else:
            raise HTTPException(status_code=400, detail="User role not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": "Login successful",
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "user": {"id": user.id, "email": user.email, "role": role}
    }

@app.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"user": current_user}
