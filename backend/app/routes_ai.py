# handles upload and evaluation endpoint
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Query
from typing import Optional
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
from backend.app.database import admin_client

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
async def ai_evaluate(
    file: UploadFile = File(...), 
    current_user=Depends(get_current_user)
):
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

        # Note: /ai_evaluate is for testing only - does not store evaluation data
        # Official submissions store evaluation data automatically in the submission endpoint

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

Note: You are evaluating a software project of a student, so be generous in your feedback and score.

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
        validation = await check_json_schema(response_data["choices"][0]["message"]["content"], api_key)
        
        try:
            json_response = json.loads(validation["validation"]["corrected_text"])
            return json_response
        except Exception as e:
            # If the JSON is not valid, return the error messages
            raise HTTPException(status_code=500, detail=f"AI Evaluation is currently unavailable.")
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
async def check_json_schema(text: str, api_key: str):
    """
    Check if the provided text is a valid instance of the given JSON schema.
    3 attempts to correct the text using an LLM if it is not valid.

    Args:
        text (str): The text to check.
        api_key (str): The OpenRouter API key.

    Returns:
        dict: Dictionary containing 'corrected_text' (str) and 'errors' (list of strings).
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
    
    # Try to parse and validate the JSON
    errors = []
    corrected_text = text
    
    for attempt in range(3):
        try:
            # Try to parse as JSON
            parsed_json = json.loads(corrected_text)
            
            # Basic validation against schema
            validation_errors = []
            
            # Check required fields
            required_fields = ["overall_score", "max_score", "percentage", "evaluation", "feedback"]
            for field in required_fields:
                if field not in parsed_json:
                    validation_errors.append(f"Missing required field: {field}")
            
            # Validate overall_score
            if "overall_score" in parsed_json:
                score = parsed_json["overall_score"]
                if not isinstance(score, (int, float)) or score < 0 or score > 24:
                    validation_errors.append(f"overall_score must be a number between 0 and 24, got: {score}")
            
            # Validate max_score
            if "max_score" in parsed_json:
                score = parsed_json["max_score"]
                if not isinstance(score, (int, float)) or score < 0 or score > 24:
                    validation_errors.append(f"max_score must be a number between 0 and 24, got: {score}")
            
            # Validate percentage
            if "percentage" in parsed_json:
                pct = parsed_json["percentage"]
                if not isinstance(pct, (int, float)) or pct < 0 or pct > 100:
                    validation_errors.append(f"percentage must be a number between 0 and 100, got: {pct}")
            
            # Validate evaluation object
            if "evaluation" in parsed_json:
                eval_obj = parsed_json["evaluation"]
                if not isinstance(eval_obj, dict):
                    validation_errors.append("evaluation must be an object")
                else:
                    eval_fields = [
                        "system_design_architecture",
                        "functionality_features",
                        "code_quality_efficiency",
                        "usability_user_interface",
                        "testing_debugging",
                        "documentation"
                    ]
                    for field in eval_fields:
                        if field not in eval_obj:
                            validation_errors.append(f"Missing evaluation field: {field}")
                        else:
                            val = eval_obj[field]
                            if not isinstance(val, (int, float)) or val < 1 or val > 4:
                                validation_errors.append(f"{field} must be a number between 1 and 4, got: {val}")
            
            # Validate feedback array
            if "feedback" in parsed_json:
                feedback = parsed_json["feedback"]
                if not isinstance(feedback, list):
                    validation_errors.append("feedback must be an array")
                else:
                    for i, item in enumerate(feedback):
                        if not isinstance(item, str):
                            validation_errors.append(f"feedback[{i}] must be a string")
            
            # If validation passed, return the corrected text
            if not validation_errors:
                return {
                    "validation": {
                        "corrected_text": corrected_text,
                        "errors": []
                    }
                }
            
            # If we have errors and this is the last attempt, return error messages
            if attempt == 2:
                errors.extend(validation_errors)
                return {
                    "validation": {
                        "corrected_text": corrected_text,
                        "errors": errors
                    }
                }
            
            # Otherwise, use LLM to fix the errors
            errors.extend(validation_errors)
            
        except json.JSONDecodeError as e:
            # JSON parsing failed - use LLM to fix it
            json_error = str(e)
            errors.append(f"JSON parsing error: {json_error}")
            
            if attempt == 2:
                # Last attempt - return what we have
                return {
                    "validation": {
                        "corrected_text": corrected_text,
                        "errors": errors
                    }
                }
        
        # Use LLM to correct the JSON
        correction_prompt = f"""The following text is supposed to be valid JSON matching this schema:

{schema_str}

The text provided was:
{corrected_text}

Errors found:
{chr(10).join(f"- {err}" for err in errors[-5:])}  # Show last 5 errors

Please correct the JSON to match the schema exactly. Return ONLY the corrected JSON, no additional text or markdown formatting."""
        
        try:
            correction_payload = {
                "model": "x-ai/grok-4.1-fast:free",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a JSON correction assistant. Fix JSON to match the provided schema exactly. Return only valid JSON, no markdown or explanations."
                    },
                    {
                        "role": "user",
                        "content": correction_prompt
                    }
                ]
            }
            
            correction_response = requests.post(
                url="https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=correction_payload,
                timeout=60
            )
            
            correction_response.raise_for_status()
            correction_data = correction_response.json()
            corrected_text = correction_data["choices"][0]["message"]["content"].strip()
            
            # Remove markdown code blocks if present
            if corrected_text.startswith("```"):
                lines = corrected_text.split("\n")
                # Remove first line (```json or ```)
                lines = lines[1:]
                # Remove last line (```)
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                corrected_text = "\n".join(lines)
            
        except Exception as e:
            # If LLM correction fails, return what we have
            errors.append(f"LLM correction failed: {str(e)}")
            return {
                "validation": {
                    "corrected_text": corrected_text,
                    "errors": errors
                }
            }
    
    # Fallback return (shouldn't reach here, but just in case)
    return {
        "validation": {
            "corrected_text": corrected_text,
            "errors": errors
        }
    }

    