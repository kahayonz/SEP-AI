"""
AI evaluation module for SEP-AI application.
Handles AI and heuristic evaluations for code submissions.
"""
import os
from typing import Dict, Any, List
import anthropic

from .config import ai_config
from .logger import get_logger
from .utils import extract_score_from_text

logger = get_logger(__name__)


def evaluate_project(project_path: str) -> Dict[str, Any]:
    """
    Evaluate a student project using AI or fallback heuristics.
    
    Args:
        project_path: Path to the extracted project directory
        
    Returns:
        Dictionary containing 'feedback' and 'score' keys
    """
    # Check if API key is configured
    if not ai_config.ANTHROPIC_API_KEY or ai_config.ANTHROPIC_API_KEY == "your_anthropic_api_key_here":
        logger.warning("AI evaluation attempted without valid API key")
        return {
            "feedback": "AI evaluation is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
            "score": 0
        }

    # Gather files for analysis
    files_summary = _gather_project_files(project_path)
    
    if not files_summary:
        logger.warning(f"No supported files found in {project_path}")
        return {
            "feedback": "No supported files found in the project. Please include .py, .js, .html, .css, or .md files.",
            "score": 0
        }

    # Attempt AI evaluation
    try:
        return _evaluate_with_ai(files_summary)
    except Exception as e:
        error_message = str(e)
        logger.error(f"AI evaluation failed: {error_message}")
        
        if "credit balance is too low" in error_message:
            logger.info("Falling back to heuristic evaluation due to low credits")
            return evaluate_project_fallback(project_path)
        elif "invalid_request_error" in error_message:
            return {
                "feedback": "AI evaluation failed due to an API configuration issue. Please contact your instructor for assistance.",
                "score": 0
            }
        else:
            logger.info("Falling back to heuristic evaluation due to error")
            return evaluate_project_fallback(project_path)

def _gather_project_files(project_path: str) -> List[Dict[str, str]]:
    """
    Gather and read supported files from the project.
    
    Args:
        project_path: Path to the project directory
        
    Returns:
        List of dictionaries with 'filename' and 'content' keys
    """
    files_summary = []
    
    for root, _, files in os.walk(project_path):
        for f in files:
            if f.endswith(ai_config.SUPPORTED_EXTENSIONS):
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as code_file:
                        content = code_file.read(ai_config.MAX_FILE_CONTENT_LENGTH)
                        files_summary.append({"filename": f, "content": content})
                except Exception as e:
                    logger.warning(f"Failed to read file {f}: {str(e)}")
                    continue
    
    logger.debug(f"Gathered {len(files_summary)} files for evaluation")
    return files_summary


def _evaluate_with_ai(files_summary: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Evaluate project using Claude AI.
    
    Args:
        files_summary: List of file data with filename and content
        
    Returns:
        Dictionary with feedback and score
    """
    # Create prompt for Claude
    prompt = "You are SEP-AI. Analyze the student's software project and provide:\n"
    prompt += "1. Strengths\n2. Weaknesses\n3. Suggested improvements\n4. Tentative score (0–100)\n\n"

    combined_code = "\n\n".join(
        [f"# {f['filename']}\n{f['content']}" for f in files_summary]
    )
    
    # Limit total content length
    content = prompt + combined_code[:ai_config.MAX_COMBINED_CODE_LENGTH]
    
    client = anthropic.Anthropic(api_key=ai_config.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=ai_config.AI_MODEL,
        messages=[{"role": "user", "content": content}],
        max_tokens=ai_config.AI_MAX_TOKENS
    )

    feedback = response.content[0].text
    score = extract_score_from_text(feedback)
    
    logger.info(f"AI evaluation completed with score: {score}")
    return {"feedback": feedback, "score": score}


def evaluate_project_fallback(project_path: str) -> Dict[str, Any]:
    """
    Fallback evaluation using heuristics when AI API is unavailable.
    
    Args:
        project_path: Path to the project directory
        
    Returns:
        Dictionary with feedback and score based on heuristics
    """
    logger.info("Using fallback heuristic evaluation")
    
    # Gather basic project statistics
    total_lines = 0
    file_count = 0
    has_readme = False
    has_tests = False
    files_data = []

    for root, _, files in os.walk(project_path):
        for f in files:
            if f.endswith(ai_config.SUPPORTED_EXTENSIONS):
                path = os.path.join(root, f)
                file_count += 1
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as code_file:
                        content = code_file.read()
                        lines = len(content.split('\n'))
                        total_lines += lines

                        if f.lower() == 'readme.md':
                            has_readme = True
                        if 'test' in f.lower() or 'spec' in f.lower():
                            has_tests = True

                        files_data.append({"filename": f, "lines": lines})
                except Exception as e:
                    logger.warning(f"Failed to read file {f}: {str(e)}")
                    continue

    if not files_data:
        return {
            "feedback": "No supported files found in the project. Please include .py, .js, .html, .css, or .md files.",
            "score": 0
        }

    # Calculate score based on heuristics
    score = _calculate_heuristic_score(
        file_count, total_lines, has_readme, has_tests
    )
    
    # Generate feedback
    feedback = _generate_heuristic_feedback(
        file_count, total_lines, has_readme, has_tests, score
    )
    
    logger.info(f"Fallback evaluation completed with score: {score}")
    return {"feedback": feedback, "score": score}


def _calculate_heuristic_score(
    file_count: int,
    total_lines: int,
    has_readme: bool,
    has_tests: bool
) -> int:
    """
    Calculate a score based on project heuristics.
    
    Args:
        file_count: Number of files in the project
        total_lines: Total lines of code
        has_readme: Whether a README file exists
        has_tests: Whether test files exist
        
    Returns:
        Score (0-100)
    """
    score = 50  # Base score

    # File count bonus (max 15 points)
    if file_count >= 5:
        score += 15
    elif file_count >= 3:
        score += 10
    elif file_count >= 1:
        score += 5

    # Lines of code bonus (max 15 points)
    if total_lines >= 500:
        score += 15
    elif total_lines >= 200:
        score += 10
    elif total_lines >= 50:
        score += 5

    # Documentation bonus (10 points)
    if has_readme:
        score += 10

    # Testing bonus (10 points)
    if has_tests:
        score += 10

    return min(100, max(0, score))


def _generate_heuristic_feedback(
    file_count: int,
    total_lines: int,
    has_readme: bool,
    has_tests: bool,
    score: int
) -> str:
    """
    Generate feedback text based on heuristics.
    
    Args:
        file_count: Number of files
        total_lines: Total lines of code
        has_readme: Whether README exists
        has_tests: Whether tests exist
        score: Calculated score
        
    Returns:
        Feedback string
    """
    feedback = "Basic project evaluation (AI unavailable):\n\n"
    feedback += f"• Files analyzed: {file_count}\n"
    feedback += f"• Total lines of code: {total_lines}\n"
    feedback += f"• README present: {'Yes' if has_readme else 'No'}\n"
    feedback += f"• Test files detected: {'Yes' if has_tests else 'No'}\n\n"

    if score >= 80:
        feedback += "Excellent project structure and completeness!"
    elif score >= 60:
        feedback += "Good project with room for improvement."
    else:
        feedback += "Basic project structure. Consider adding more files, documentation, and tests."

    return feedback
