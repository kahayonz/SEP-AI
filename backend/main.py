# main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header, Request, Query
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from app.auth import get_current_user
from app.routes_ai import router as ai_router
from app.routes import router as main_router
from app.database import supabase, admin_client


load_dotenv()

app = FastAPI()
security = HTTPBearer()
app.include_router(ai_router, prefix="/api", tags=["AI Evaluation"])
app.include_router(main_router, prefix="/api", tags=["Main"])

# Add CORS middleware - restrict to allowed domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local dev
        "http://localhost:5500",  # Local dev
        "https://sep-ai-bice.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Frontend URL for redirects (configure in .env)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5500")

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
    try:
        user_data = admin_client.table("users").select("*").eq("auth_id", current_user.id).execute()
        if user_data.data and len(user_data.data) > 0:
            user = user_data.data[0]
            return {
                "user": {
                    "id": user["auth_id"],
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "role": user["role"],
                    "university": user["university"]
                }
            }
        else:
            raise HTTPException(status_code=404, detail="User data not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class UpdateUserIn(BaseModel):
    first_name: str
    last_name: str
    university: str

@app.put("/me")
async def update_me(update_data: UpdateUserIn, current_user=Depends(get_current_user)):
    try:
        # Update user data in users table
        update_response = admin_client.table("users").update({
            "first_name": update_data.first_name,
            "last_name": update_data.last_name,
            "university": update_data.university
        }).eq("auth_id", current_user.id).execute()

        if update_response.data:
            updated_user = update_response.data[0]
            return {
                "user": {
                    "id": updated_user["auth_id"],
                    "email": updated_user["email"],
                    "first_name": updated_user["first_name"],
                    "last_name": updated_user["last_name"],
                    "role": updated_user["role"],
                    "university": updated_user["university"]
                }
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/confirm")
async def confirm_email(
    access_token: str = Query(...),
    refresh_token: str = Query(None),
    type: str = Query(None)
):
    """
    Handle email confirmation and automatic login
    This endpoint is called when user clicks the confirmation link in their email
    """
    try:
        # Check if this is a confirmation flow
        if type != "signup":
            # For other confirmation types or direct access, just redirect to login
            return RedirectResponse(url=f"{FRONTEND_URL}/login.html?confirmed=true")

        # Set the session using the tokens from the confirmation link
        supabase.auth.set_session({
            "access_token": access_token,
            "refresh_token": refresh_token
        })

        # Verify the user is authenticated and get their data
        try:
            user = supabase.auth.get_user(access_token)
            user_id = user.user.id if user.user else None
        except Exception:
            return RedirectResponse(url=f"{FRONTEND_URL}/login.html?error=invalid_token")

        # Get user data from our database
        try:
            user_data = admin_client.table("users").select("role").eq("auth_id", user_id).execute()
            if user_data.data and len(user_data.data) > 0:
                role = user_data.data[0]["role"]
            else:
                return RedirectResponse(url=f"{FRONTEND_URL}/login.html?error=user_not_found")
        except Exception:
            return RedirectResponse(url=f"{FRONTEND_URL}/login.html?error=database_error")

        # Create login response data
        login_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user_id,
                "email": user.user.email,
                "role": role
            }
        }

        # Redirect to the appropriate dashboard with the auth data
        # We'll pass the tokens as URL fragments so the frontend can capture them
        dashboard_url = "student.html" if role == "student" else "professor.html"
        auth_params = f"access_token={access_token}&refresh_token={refresh_token}&user_id={user_id}&email={user.user.email}&role={role}"

        return RedirectResponse(url=f"{FRONTEND_URL}/{dashboard_url}?confirmed=true#{auth_params}")

    except Exception as e:
        print(f"Confirmation error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login.html?error=confirmation_failed")

# Mount static files from frontend directory with SPA support
app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")
