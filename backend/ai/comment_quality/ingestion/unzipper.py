"""Utilities for unzipping project archives."""

import os
import zipfile
import tempfile
from pathlib import Path
from typing import Optional


def unzip_project(zip_path: str, output_dir: Optional[str] = None) -> str:
    """
    Unzip a project archive to a specified or temporary directory.
    
    Args:
        zip_path: Path to the zip file
        output_dir: Optional output directory. If None, creates a temp directory
        
    Returns:
        Path to the extracted directory
    """
    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="comment_quality_")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(output_path)
    
    return str(output_path)


def find_source_files(directory: str, extensions: list) -> list:
    """
    Recursively find all source files with specified extensions.
    
    Args:
        directory: Root directory to search
        extensions: List of file extensions to match (e.g., ['.py', '.js'])
        
    Returns:
        List of file paths
    """
    source_files = []
    directory_path = Path(directory)
    
    for ext in extensions:
        source_files.extend(directory_path.rglob(f"*{ext}"))
    
    return [str(f) for f in source_files]

