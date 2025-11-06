# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from supabase import create_client, Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


app = FastAPI()
security = HTTPBearer()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:3000", "http://127.0.0.1:3000"],  # Add your frontend URLs
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
        raise HTTPException(status_code=400, detail="Signup failed or confirmation required.")

    auth_id = user.id

    #use service role client to bypass RLS
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

    return {"message": "User created successfully", "user": {"id": user.id, "email": user.email}}

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

    return {
        "message": "Login successful",
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "user": {"id": user.id, "email": user.email}
    }

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials  # Extract the actual JWT token

    try:
        user_response = supabase.auth.get_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_response.user

@app.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {"user": current_user}