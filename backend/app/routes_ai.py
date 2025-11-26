# handles upload and evaluation endpoint
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import tempfile
import os
import shutil
import sys
from pathlib import Path
import requests
import json
from dotenv import load_dotenv
from backend.app.auth import get_current_user

# Load environment variables - check both backend directory and project root
# routes_ai.py is at backend/app/routes_ai.py, so:
# - parent.parent = backend/
# - parent.parent.parent = project root
backend_env = Path(__file__).parent.parent / ".env"
root_env = Path(__file__).parent.parent.parent / ".env"

# Try to load from root first (where .env actually is), then backend, then fallback
# Use override=True to ensure we get the latest values
env_loaded = False
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
    env_loaded = True
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
    env_loaded = True
else:
    # Fallback to default behavior (current working directory)
    load_dotenv(override=True)
    env_loaded = True

# Add ai directory to path to import evaluate_comment_quality
ai_dir = Path(__file__).parent.parent / "ai"
sys.path.insert(0, str(ai_dir))
from api import evaluate_comment_quality

router = APIRouter()

@router.post("/ai_evaluate")
async def ai_evaluate(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    temp_dir = None
    try:
        # Create a temporary working directory for this session
        temp_dir = tempfile.mkdtemp(prefix=f"{current_user.id}_")

        # Save the uploaded ZIP locally
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as f:
            f.write(await file.read())

        # Evaluate project with comment quality evaluation
        comment_quality_result_all = evaluate_comment_quality(zip_path).model_dump()
        comment_quality_score = comment_quality_result_all["overall_score"]["score"]

        # Run LLM evaluation (optional - can fail without breaking the response)
        try:
            llm_result = await llm_evaluate(zip_path)
        except Exception as llm_error:
            # Log LLM error but don't fail the entire request
            print(f"LLM evaluation failed (non-critical): {str(llm_error)}")

        # Convert Pydantic model to dict for JSON response
        return {"message": "Evaluation complete", "results": comment_quality_score}

    except HTTPException:
        # Re-raise HTTPExceptions as-is (they already have proper status codes)
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in ai_evaluate: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Always clean up temp directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

# LLM Evaluation
async def llm_evaluate(zip_path: str):
    try:
        # Check if API key is loaded
        api_key = os.getenv('OPENROUTER_API_KEY')
        if not api_key or api_key == "your-api-key-here":
            # Debug: Check which .env file was loaded
            backend_env = Path(__file__).parent.parent / ".env"
            root_env = Path(__file__).parent.parent.parent / ".env"
            env_location = "root" if root_env.exists() else ("backend" if backend_env.exists() else "not found")
            raise HTTPException(
                status_code=500, 
                detail=f"OPENROUTER_API_KEY not found or is placeholder. .env file location: {env_location}. Please check your .env file in the project root."
            )
        
        # Extract and read project files from zip
        import zipfile
        project_content = []
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                # Get list of source code files
                source_extensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.md']
                file_list = [f for f in zip_ref.namelist() 
                           if any(f.endswith(ext) for ext in source_extensions) 
                           and not f.startswith('__pycache__') 
                           and not f.startswith('node_modules')]
                
                # Limit to first 20 files to avoid token limits
                for file_name in file_list[:20]:
                    try:
                        with zip_ref.open(file_name) as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            # Limit file content to 2000 chars per file
                            if len(content) > 2000:
                                content = content[:2000] + "\n... (truncated)"
                            project_content.append(f"=== {file_name} ===\n{content}\n")
                    except Exception:
                        continue  # Skip files that can't be read
        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file format")
        
        if not project_content:
            raise HTTPException(status_code=400, detail="No source code files found in the ZIP archive")
        
        # TODO: Implement agentic evaluation

        # Build the prompt with project content
        project_text = "\n".join(project_content)
        prompt = f"""Evaluate the software engineering principles of the following project. 
Provide feedback and recommendations in 200 words or less.

Project files:
{project_text}"""
        
        # Prepare the request payload (OpenRouter expects JSON, not form data)
        payload = {
            "model": "x-ai/grok-4.1-fast:free",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "extra_body": {
                "reasoning": {
                    "enabled": True
                }
            }
        }
        
        # Make the API request
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/your-repo",  # Optional: for OpenRouter tracking
            },
            json=payload,
            timeout=120
        )
        
        # Check for HTTP errors
        response.raise_for_status()
        
        # Extract the assistant message with reasoning_details
        response_data = response.json()
        print(f"OpenRouter response: {response_data}")
        return response_data
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except requests.exceptions.RequestException as e:
        # Handle requests-specific errors
        import traceback
        error_trace = traceback.format_exc()
        print(f"Request error in llm_evaluate: {str(e)}")
        print(f"Traceback: {error_trace}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"API error response: {error_detail}")
                raise HTTPException(status_code=500, detail=f"LLM API error: {error_detail}")
            except:
                pass
        raise HTTPException(status_code=500, detail=f"LLM API request failed: {str(e)}")
    except Exception as e:
        # Log and re-raise other exceptions
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in llm_evaluate: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=str(e))