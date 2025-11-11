from fastapi import Depends, HTTPException
from dotenv import load_dotenv
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from supabase import create_client, Client
import os

security = HTTPBearer()

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
