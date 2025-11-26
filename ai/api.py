"""Comment quality evaluation module."""

import json
from pathlib import Path
from typing import List, Dict
import joblib
from pydantic import BaseModel

from comment_quality import CommentExtractor, FileFilter
from comment_quality.config import PYTHON_EXTENSIONS, JAVASCRIPT_EXTENSIONS

# Global variables for model and vectorizer
model = None
vectorizer = None
metadata = None


class PredictionResult(BaseModel):
    """Model for prediction result."""
    text: str
    predicted_class: int
    probabilities: Dict[int, float]
    query: str
    func_code_string: str


class OverallScore(BaseModel):
    """Model for overall comment quality score."""
    score: float
    average_quality: float
    coverage_ratio: float
    total_comments: int
    total_files: int
    total_functions: int
    is_python_or_javascript_project: bool


class PredictionResponse(BaseModel):
    """Model for API response."""
    predictions: List[PredictionResult]
    total_comments: int
    overall_score: OverallScore


def load_model():
    """Load the model, vectorizer, and metadata."""
    global model, vectorizer, metadata
    
    if model is None or vectorizer is None:
        # Get the directory where this file is located
        api_dir = Path(__file__).parent
        model_path = api_dir / "model" / "Bernolli_TfIdf.joblib"
        vectorizer_path = api_dir / "model" / "Bernolli_TfIdf_vectorizer.joblib"
        metadata_path = api_dir / "model" / "Bernolli_TfIdf_meta.json"
        
        if not all([model_path.exists(), vectorizer_path.exists(), metadata_path.exists()]):
            raise FileNotFoundError(
                "Model files not found. Please ensure model files are in the 'model/' directory."
            )
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        vectorizer = joblib.load(vectorizer_path)
        model = joblib.load(model_path)
    
    return model, vectorizer, metadata


def evaluate_comment_quality(zip_path: str) -> PredictionResponse:
    """
    Evaluate comment quality from a zip file path.
    
    Args:
        zip_path: Path to the zip file containing the project
        
    Returns:
        PredictionResponse with predictions, total_comments, and overall_score
    """
    # Load model if not already loaded
    try:
        model, vectorizer, metadata = load_model()
    except Exception as e:
        raise Exception(f"Failed to load model: {str(e)}")
    
    # Check if the project contains Python or JavaScript files
    # Check zip file contents directly without extracting
    import zipfile
    is_python_or_javascript_project = False
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            # Check if any files have Python or JavaScript extensions
            for file_name in file_list:
                if any(file_name.endswith(ext) for ext in PYTHON_EXTENSIONS + JAVASCRIPT_EXTENSIONS):
                    is_python_or_javascript_project = True
                    break
    except Exception:
        # If we can't check, assume it's not a Python/JavaScript project
        is_python_or_javascript_project = False
    
    # Extract comments using comment_quality module
    file_filter = FileFilter(
        min_comment_density=0.02,
        max_file_size_kb=500,
        enable_minification_detection=True,
        enable_content_analysis=True
    )
    
    extractor = CommentExtractor(
        file_filter=file_filter,
        enable_filtering=True
    )
    
    # Get formatted list of comments with metadata
    formatted_texts, total_files, total_functions = extractor.extract_and_format_from_zip(zip_path)
    
    if not formatted_texts:
        return PredictionResponse(
            predictions=[],
            total_comments=0,
            overall_score=OverallScore(
                score=0.0,
                average_quality=0.0,
                coverage_ratio=0.0,
                total_comments=0,
                total_files=total_files,
                total_functions=total_functions,
                is_python_or_javascript_project=is_python_or_javascript_project
            )
        )
    
    # Extract query and func_code_string from formatted texts
    comments_data = []
    for formatted_text in formatted_texts:
        if '<CODESPLIT>' in formatted_text:
            parts = formatted_text.split('<CODESPLIT>', 1)
            query = parts[0] if len(parts) > 0 else ""
            func_code_string = parts[1] if len(parts) > 1 else ""
            comments_data.append({
                'query': query,
                'func_code_string': func_code_string,
                'formatted_text': formatted_text
            })
        else:
            # Fallback if format is unexpected
            comments_data.append({
                'query': formatted_text,
                'func_code_string': '',
                'formatted_text': formatted_text
            })
    
    # Transform texts using vectorizer
    texts_to_predict = [item['formatted_text'] for item in comments_data]
    features = vectorizer.transform(texts_to_predict)
    
    # Make predictions
    predictions = model.predict(features)
    probabilities = model.predict_proba(features)
    
    # Format results
    results = []
    quality_scores = []
    
    for i, (comment_data, pred, prob) in enumerate(zip(comments_data, predictions, probabilities)):
        # Map probabilities to label indices
        prob_dict = {
            int(label): float(prob[j]) 
            for j, label in enumerate(metadata['labels'])
        }
        
        predicted_class = int(pred)
        quality_scores.append(predicted_class)
        
        results.append(PredictionResult(
            text=comment_data['formatted_text'],
            predicted_class=predicted_class,
            probabilities=prob_dict,
            query=comment_data['query'],
            func_code_string=comment_data['func_code_string']
        ))
    
    # Calculate overall score
    # Average quality score (0-3 scale, normalized to 0-1)
    average_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0.0
    normalized_average = average_quality / 3.0  # Normalize to 0-1
    
    # Coverage ratio (comments found / total functions, capped at 1.0)
    coverage_ratio = min(len(results) / total_functions, 1.0) if total_functions > 0 else 0.0
    
    # Overall score: weighted combination of quality (70%) and coverage (30%)
    overall_score_value = (normalized_average * 0.7) + (coverage_ratio * 0.3)
    
    overall_score = OverallScore(
        score=round(overall_score_value, 4),
        average_quality=round(average_quality, 2),
        coverage_ratio=round(coverage_ratio, 4),
        total_comments=len(results),
        total_files=total_files,
        total_functions=total_functions,
        is_python_or_javascript_project=is_python_or_javascript_project
    )
    
    return PredictionResponse(
        predictions=results,
        total_comments=len(results),
        overall_score=overall_score
    )

