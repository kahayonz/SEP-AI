"""
Authentication routes for SEP-AI application.
Handles user signup, login, logout, and email confirmation.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from gotrue.types import User

from .auth import get_current_user
from .database import supabase, admin_client
from .models import SignupRequest, LoginRequest, UpdateUserRequest, AuthResponse, UserResponse
from .services import UserService
from .exceptions import (
    AuthenticationError,
    ResourceNotFoundError,
    DatabaseError
)
from .config import app_config, messages
from .logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest):
    """
    Register a new user account.
    
    Args:
        payload: Signup request with email, password, name, role, and university
        
    Returns:
        Success message and user data
        
    Raises:
        AuthenticationError: If signup fails
        DatabaseError: If user record creation fails
    """
    try:
        auth_response = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        logger.error(f"Supabase auth signup failed: {str(e)}")
        raise AuthenticationError(f"Signup failed: {str(e)}")

    user = auth_response.user
    if not user:
        raise AuthenticationError("Signup failed")

    auth_id = user.id
    logger.info(f"User authenticated: {auth_id}")

    try:
        await UserService.create_user(
            auth_id=auth_id,
            email=payload.email,
            first_name=payload.firstName,
            last_name=payload.lastName,
            role=payload.role,
            university=payload.university
        )
        
        logger.info(f"User record created for {payload.email}")
        
        return AuthResponse(
            message=messages.SIGNUP_SUCCESS,
            user={
                "id": user.id,
                "email": user.email,
                "role": payload.role
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to create user record: {str(e)}")
        raise DatabaseError(f"Failed to create user record: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    """
    Authenticate a user and return access tokens.
    
    Args:
        payload: Login request with email and password
        
    Returns:
        Access tokens and user data
        
    Raises:
        AuthenticationError: If login fails
        ResourceNotFoundError: If user role not found
    """
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
        logger.warning(f"Login failed for {payload.email}: {str(e)}")
        raise AuthenticationError(f"Login failed: {str(e)}")

    session = auth_response.session
    user = auth_response.user

    # Get user role from database
    try:
        role = await UserService.get_user_role(user.id)
        
        logger.info(f"User {user.email} logged in successfully")
        
        return AuthResponse(
            message=messages.LOGIN_SUCCESS,
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user={
                "id": user.id,
                "email": user.email,
                "role": role
            }
        )
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error getting user role during login: {str(e)}")
        raise DatabaseError(f"Failed to retrieve user data: {str(e)}")


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint (validates token is still valid).
    Note: JWT tokens are stateless, actual logout happens client-side.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    logger.info(f"User {current_user.id} logged out")
    return {"message": messages.LOGOUT_SUCCESS}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile information.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        User profile data
        
    Raises:
        ResourceNotFoundError: If user data not found
    """
    try:
        user_data = await UserService.get_user_data(current_user.id)
        
        return {
            "user": {
                "id": user_data["auth_id"],
                "email": user_data["email"],
                "first_name": user_data["first_name"],
                "last_name": user_data["last_name"],
                "role": user_data["role"],
                "university": user_data["university"]
            }
        }
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error getting user info: {str(e)}")
        raise DatabaseError(f"Failed to retrieve user information: {str(e)}")


@router.put("/me")
async def update_current_user_info(
    update_data: UpdateUserRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's profile information.
    
    Args:
        update_data: Updated user data
        current_user: Authenticated user
        
    Returns:
        Updated user profile data
        
    Raises:
        ResourceNotFoundError: If user not found
        DatabaseError: If update fails
    """
    try:
        updated_user = await UserService.update_user(
            auth_id=current_user.id,
            first_name=update_data.first_name,
            last_name=update_data.last_name,
            university=update_data.university
        )
        
        logger.info(f"User {current_user.id} updated profile")
        
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
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise DatabaseError(f"Failed to update user: {str(e)}")


@router.get("/confirm")
async def confirm_email(
    access_token: str = Query(...),
    refresh_token: str = Query(None),
    type: str = Query(None)
):
    """
    Handle email confirmation and automatic login.
    This endpoint is called when user clicks the confirmation link in their email.
    
    Args:
        access_token: JWT access token from confirmation email
        refresh_token: JWT refresh token from confirmation email
        type: Confirmation type (e.g., "signup")
        
    Returns:
        Redirect to appropriate page
    """
    try:
        # Check if this is a confirmation flow
        if type != "signup":
            logger.info(f"Non-signup confirmation type: {type}")
            return RedirectResponse(
                url=f"{app_config.FRONTEND_URL}/login.html?confirmed=true"
            )

        # Set the session using the tokens from the confirmation link
        supabase.auth.set_session({
            "access_token": access_token,
            "refresh_token": refresh_token
        })

        # Verify the user is authenticated and get their data
        try:
            user = supabase.auth.get_user(access_token)
            user_id = user.user.id if user.user else None
        except Exception as e:
            logger.warning(f"Invalid token during confirmation: {str(e)}")
            return RedirectResponse(
                url=f"{app_config.FRONTEND_URL}/login.html?error=invalid_token"
            )

        # Get user data from database
        try:
            role = await UserService.get_user_role(user_id)
        except ResourceNotFoundError:
            logger.warning(f"User not found during confirmation: {user_id}")
            return RedirectResponse(
                url=f"{app_config.FRONTEND_URL}/login.html?error=user_not_found"
            )
        except Exception as e:
            logger.error(f"Database error during confirmation: {str(e)}")
            return RedirectResponse(
                url=f"{app_config.FRONTEND_URL}/login.html?error=database_error"
            )

        # Redirect to the appropriate dashboard
        dashboard_url = "student.html" if role == "student" else "professor.html"
        auth_params = f"access_token={access_token}&refresh_token={refresh_token}&user_id={user_id}&email={user.user.email}&role={role}"

        logger.info(f"Email confirmed for user {user_id}, redirecting to {dashboard_url}")
        return RedirectResponse(
            url=f"{app_config.FRONTEND_URL}/{dashboard_url}?confirmed=true#{auth_params}"
        )

    except Exception as e:
        logger.error(f"Confirmation error: {str(e)}")
        return RedirectResponse(
            url=f"{app_config.FRONTEND_URL}/login.html?error=confirmation_failed"
        )

