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
        return {
            "feedback": f"AI evaluation failed: {str(e)}",
            "score": 0
        }

def extract_score(feedback_text: str) -> int:
    import re
    match = re.search(r"(\b\d{1,3}\b)", feedback_text)
    if match:
        score = int(match.group(1))
        return min(100, max(0, score))
    return 0
