import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env file if it exists, but don't override existing environment variables
# This is important for production (Render) where env vars are set directly
load_dotenv(override=False)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
admin_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
