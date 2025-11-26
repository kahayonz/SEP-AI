"""Example script showing how to use the Comment Quality Evaluator API."""

import requests
from pathlib import Path
import json

# API endpoint
API_URL = "http://localhost:8000"

def test_api_with_sample_file():
    """Example of how to call the API with a sample zip file."""
    
    # Check if sample file exists
    zip_file_path = Path("js-sample-project.zip")
    if not zip_file_path.exists():
        print(f"Sample file not found: {zip_file_path}")
        print("Please ensure js-sample-project.zip exists in the current directory")
        return
    
    # Prepare the file for upload
    with open(zip_file_path, "rb") as f:
        files = {"file": ("js-sample-project.zip", f, "application/zip")}
        
        print(f"Uploading {zip_file_path} to {API_URL}/predict...")
        response = requests.post(f"{API_URL}/predict", files=files)
    
    # Check response
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)


def check_api_health():
    """Check if the API is running and healthy."""
    try:
        response = requests.get(f"{API_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("API Health Check:")
            print(f"  Status: {data['status']}")
            print(f"  Model Loaded: {data['model_loaded']}")
            print(f"  Vectorizer Loaded: {data['vectorizer_loaded']}")
            return True
        else:
            print(f"API returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to API at {API_URL}")
        print("Make sure the API server is running:")
        print("  python api.py")
        return False


if __name__ == "__main__":
    print("Comment Quality Evaluator API - Example Usage\n")
    
    # Check health first
    if check_api_health():
        print()
        test_api_with_sample_file()
    else:
        print("\nPlease start the API server first:")
        print("  python api.py")

