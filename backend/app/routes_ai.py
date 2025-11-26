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
from backend.app.zip_extractor import extract_developer_files

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
            llm_result = None

        # Convert Pydantic model to dict for JSON response
        return llm_result

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
        
        # Check ZIP file size and decide on approach
        # Model limit is ~2M tokens. Base64 encoding increases size by ~33%, and roughly 4 chars = 1 token
        # So max safe ZIP size is ~1.5MB (which becomes ~2MB base64 = ~500k tokens, leaving room for prompt)
        import base64
        import zipfile
        
        zip_size = os.path.getsize(zip_path)
        MAX_ZIP_SIZE_BYTES = 1_500_000  # ~1.5MB
        
        if zip_size > MAX_ZIP_SIZE_BYTES:
            # ZIP is too large - extract and send only developer-written source files
            print(f"ZIP file too large ({zip_size} bytes), extracting developer files only...")
            project_text = extract_developer_files(zip_path)
            prompt_text_end = f"Project files:\n{project_text}"
        else:
            # ZIP is small enough - send as base64
            try:
                with open(zip_path, 'rb') as zip_file:
                    zip_data = zip_file.read()
                    zip_base64 = base64.b64encode(zip_data).decode('utf-8')
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read ZIP file: {str(e)}")
            
            prompt_text_end = f"ZIP file (base64 encoded):\n{zip_base64}"
        
        
        schema = {
            "overall_score": {"type": "number", "minimum": 0, "maximum": 24},
            "max_score": {"type": "number", "minimum": 0, "maximum": 24},
            "percentage": {"type": "number", "minimum": 0, "maximum": 100},
            "evaluation": {
                "system_design_architecture": {"type": "number", "minimum": 1, "maximum": 4},
                "functionality_features": {"type": "number", "minimum": 1, "maximum": 4},
                "code_quality_efficiency": {"type": "number", "minimum": 1, "maximum": 4},
                "usability_user_interface": {"type": "number", "minimum": 1, "maximum": 4},
                "testing_debugging": {"type": "number", "minimum": 1, "maximum": 4},
                "documentation": {"type": "number", "minimum": 1, "maximum": 4}
            },
            "feedback": {"type": "array", "items": {"type": "string"}}
        }
        prompt_text = f"""Evaluate the provided software project using this rubric. Score each criterion 1-4 based on the descriptions.

## Rubric

**1. System Design & Architecture**
- 4: Innovative, well-organized, clear architecture meeting all requirements
- 3: Organized design meeting most requirements
- 2: Basic design present but could be more organized
- 1: Poorly organized, doesn't meet requirements

**2. Functionality & Features**
- 4: All features work correctly, meets/exceeds requirements
- 3: Most features work, meets major requirements
- 2: Some features work, issues or missing functionality
- 1: Fails most requirements, many features broken

**3. Code Quality & Efficiency**
- 4: Clean, efficient, follows best practices, well-documented
- 3: Mostly clean, minor efficiency/readability issues
- 2: Readability/efficiency issues, minimal best practices
- 1: Unorganized, inefficient, hard to understand

**4. Usability & User Interface**
- 4: Highly intuitive, visually appealing, accessible
- 3: Functional and user-friendly, minor issues
- 2: Somewhat functional, lacks intuitiveness
- 1: Difficult to use, poor design

**5. Testing & Debugging**
- 4: Comprehensive testing (unit, integration, system), no bugs
- 3: Tests cover major functionality, few bugs
- 2: Minimal testing, some untested functionality or bugs
- 1: Little/no testing, significant bugs

**6. Documentation**
- 4: Thorough, well-organized, includes design docs, guides, comments
- 3: Complete but lacks some clarity/detail
- 2: Basic, lacks organization/thoroughness
- 1: Little/no documentation

## Output JSON
{json.dumps(schema, indent=2)}

Please analyze the project files and provide your evaluation in this JSON format. Limit to 5 feedback items.

{prompt_text_end}"""

        # Prepare the request payload
        payload = {
            "model": "x-ai/grok-4.1-fast:free",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a software engineering expert. You are given a project and you need to evaluate it based on the project files."
                },
                {
                    "role": "user",
                    "content": prompt_text
                }
            ]
        }
        
        # Make the API request
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=120
        )
        
        # Check for HTTP errors
        response.raise_for_status()
        
        # Extract the assistant message with reasoning_details
        response_data = response.json()
        
        # Validate and retry if needed
        validation = await llm_check_json_schema(response_data["choices"][0]["message"]["content"], api_key)
        
        max_retries = 3
        retry_count = 0
        while not validation["validation"]["valid"] and retry_count < max_retries:
            print(f"Validation result: {validation['validation']}")
            retry_count += 1
            print(f"Validation failed, retrying ({retry_count}/{max_retries})...")
            # Create new payload
            payload = {
                "model": "x-ai/grok-4.1-fast:free",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a JSON Schema validation and correction expert. You are given a text and you need to check if it is a valid instance of the given JSON schema. If it is not, you need to correct it and return the corrected text."
                    },
                    {
                        "role": "user",
                        "content": f"The text to check is: ```json\n{response_data['choices'][0]['message']['content']}\n```\nThe JSON schema to check against is: ```json\n{json.dumps(schema, indent=2)}\n```\nThe following errors were found in the previous response: {validation['validation']['errors']}. Please fix them and return the corrected text in the same format as the previous response."
                    }
                ]
            }

            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=120
            )

            response.raise_for_status()
            response_data = response.json()
            validation = await llm_check_json_schema(response_data["choices"][0]["message"]["content"], api_key)

        
        json_response = json.loads(response_data["choices"][0]["message"]["content"])
        return json_response
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

# Async function to check if the text follows a specific JSON schema using an LLM
async def llm_check_json_schema(text: str, api_key: str):
    """
    Uses an LLM to check if the provided text is a valid instance of the given JSON schema.

    Args:
        text (str): The text to check.
        api_key (str): The OpenRouter API key.

    Returns:
        dict: Dictionary containing 'llm_output' (str) and 'validation' (dict).
    """
    schema = {
        "overall_score": {"type": "number", "minimum": 0, "maximum": 24},
        "max_score": {"type": "number", "minimum": 0, "maximum": 24},
        "percentage": {"type": "number", "minimum": 0, "maximum": 100},
        "evaluation": {
            "system_design_architecture": {"type": "number", "minimum": 1, "maximum": 4},
            "functionality_features": {"type": "number", "minimum": 1, "maximum": 4},
            "code_quality_efficiency": {"type": "number", "minimum": 1, "maximum": 4},
            "usability_user_interface": {"type": "number", "minimum": 1, "maximum": 4},
            "testing_debugging": {"type": "number", "minimum": 1, "maximum": 4},
            "documentation": {"type": "number", "minimum": 1, "maximum": 4}
        },
        "feedback": {"type": "array", "items": {"type": "string"}}
    }

    schema_str = json.dumps(schema, indent=2)

    prompt = f"""You are a JSON Schema validation expert.
Given the following JSON Schema:
{schema_str}

Does the given text strictly conform to this schema? Reply exclusively with JSON in the format:
{{
  "valid": true/false,
  "errors": [<list of validation errors as strings, can be empty>],
  "corrected_text": <the corrected text if the text was not valid, otherwise empty>
}}

The text to check is:
```json
{text}
```
"""

    payload = {
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [
            {
                "role": "system",
                "content": "You are a JSON Schema validation and correction expert. You are given a text and you need to check if it is a valid instance of the given JSON schema. If it is not, you need to correct it and return the corrected text."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    try:
        # Since this is an async function, run blocking IO in a threadpool
        import asyncio

        def request_llm():
            response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=90
            )
            response.raise_for_status()
            return response.json()

        response_data = await asyncio.to_thread(request_llm)
        answer = response_data["choices"][0]["message"]["content"]
        validation = None

        try:
            validation = json.loads(answer)
        except Exception:
            import re
            match = re.search(r"\{.*\}", answer, re.DOTALL)
            if match:
                try:
                    validation = json.loads(match.group())
                except Exception:
                    validation = {"valid": False, "errors": ["Could not parse LLM output as JSON."]}
            else:
                validation = {"valid": False, "errors": ["LLM did not return recognizable JSON."]}

        return {
            "llm_output": answer,
            "validation": validation,
        }

    except requests.exceptions.RequestException as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Request error in llm_check_json_schema: {str(e)}")
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
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in llm_check_json_schema: {str(e)}")
        print(f"Traceback: {error_trace}")
        raise HTTPException(status_code=500, detail=str(e))

