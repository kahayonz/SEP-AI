# handles upload and evaluation endpoint 
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import tempfile, zipfile, os, shutil
from app.ai_evaluator import evaluate_project
from app.auth import get_current_user

router = APIRouter()

@router.post("/ai_evaluate")
async def ai_evaluate(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    try:
        # Create a temporary working directory for this session
        temp_dir = tempfile.mkdtemp(prefix=f"{current_user.id}_")

        # Save the uploaded ZIP locally
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as f:
            f.write(await file.read())

        # Extract it
        extract_dir = os.path.join(temp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(extract_dir)

        # Evaluate project with your AI logic
        result = evaluate_project(extract_dir)

        # Clean up after evaluation
        shutil.rmtree(temp_dir, ignore_errors=True)

        return {"message": "Evaluation complete", "results": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
