# handles AI and heuristic evaluations for code submissions

import os
import anthropic  # Claude client

def evaluate_project(project_path: str) -> dict:
    # Check if API key is configured
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_anthropic_api_key_here":
        return {
            "feedback": "AI evaluation is not configured. Please set the ANTHROPIC_API_KEY environment variable.",
            "score": 0
        }

    # Gather summary of files
    files_summary = []
    for root, _, files in os.walk(project_path):
        for f in files:
            if f.endswith((".py", ".js", ".html", ".css", ".md")):
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as code_file:
                        content = code_file.read(3000)  # limit text size
                        files_summary.append({"filename": f, "content": content})
                except Exception:
                    continue

    if not files_summary:
        return {
            "feedback": "No supported files found in the project. Please include .py, .js, .html, .css, or .md files.",
            "score": 0
        }

    # Create prompt for Claude
    prompt = "You are SEP-AI. Analyze the student's software project and provide:\n"
    prompt += "1. Strengths\n2. Weaknesses\n3. Suggested improvements\n4. Tentative score (0–100)\n\n"

    combined_code = "\n\n".join([f"# {f['filename']}\n{f['content']}" for f in files_summary])

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            messages=[
                {"role": "user", "content": prompt + combined_code[:15000]}
            ],
            max_tokens=500
        )

        return {
            "feedback": response.content[0].text,
            "score": extract_score(response.content[0].text)
        }
    except Exception as e:
        error_message = str(e)
        if "credit balance is too low" in error_message:
            # Use fallback evaluation when credits are low
            return evaluate_project_fallback(project_path)
        elif "invalid_request_error" in error_message:
            return {
                "feedback": "AI evaluation failed due to an API configuration issue. Please contact your instructor for assistance.",
                "score": 0
            }
        else:
            return {
                "feedback": f"AI evaluation failed: {error_message}",
                "score": 0
            }

def evaluate_project_fallback(project_path: str) -> dict:
    """Fallback evaluation when AI API is unavailable"""
    # Gather basic project statistics
    files_summary = []
    total_lines = 0
    file_count = 0
    has_readme = False
    has_tests = False

    for root, _, files in os.walk(project_path):
        for f in files:
            if f.endswith((".py", ".js", ".html", ".css", ".md")):
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

                        files_summary.append({"filename": f, "lines": lines})
                except Exception:
                    continue

    if not files_summary:
        return {
            "feedback": "No supported files found in the project. Please include .py, .js, .html, .css, or .md files.",
            "score": 0
        }

    # Calculate basic score based on heuristics
    score = 50  # Base score

    # File count bonus
    if file_count >= 5:
        score += 15
    elif file_count >= 3:
        score += 10
    elif file_count >= 1:
        score += 5

    # Lines of code bonus
    if total_lines >= 500:
        score += 15
    elif total_lines >= 200:
        score += 10
    elif total_lines >= 50:
        score += 5

    # Documentation bonus
    if has_readme:
        score += 10

    # Testing bonus
    if has_tests:
        score += 10

    # Generate feedback
    feedback = f"Basic project evaluation (AI unavailable):\n\n"
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

    return {
        "feedback": feedback,
        "score": 90
    }

def extract_score(feedback_text: str) -> int:
    import re
    match = re.search(r"(\b\d{1,3}\b)", feedback_text)
    if match:
        score = int(match.group(1))
        return min(100, max(0, score))
    return 0
