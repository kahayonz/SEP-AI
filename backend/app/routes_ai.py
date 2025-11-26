# handles upload and evaluation endpoint
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import tempfile
import os
import shutil
import sys
from pathlib import Path
from backend.app.auth import get_current_user

# Add ai directory to path to import evaluate_comment_quality
ai_dir = Path(__file__).parent.parent.parent / "ai"
sys.path.insert(0, str(ai_dir))
from api import evaluate_comment_quality

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

        # Evaluate project with comment quality evaluation
        comment_quality_result_all = evaluate_comment_quality(zip_path).model_dump()
        print(comment_quality_result_all)
        comment_quality_score = comment_quality_result_all["overall_score"]["score"]

        # Clean up after evaluation
        shutil.rmtree(temp_dir, ignore_errors=True)

        # Convert Pydantic model to dict for JSON response
        return {"message": "Evaluation complete", "results": comment_quality_score}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
