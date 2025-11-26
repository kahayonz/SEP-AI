"""Utilities for extracting and filtering developer-written source files from ZIP archives."""

import zipfile
from fastapi import HTTPException


def should_include_file(file_path: str) -> bool:
    """Check if a file should be included in the evaluation.
    
    Excludes static assets, vendor libraries, and generated files.
    Includes only developer-written source code files.
    
    Args:
        file_path: Path to the file within the ZIP archive
        
    Returns:
        True if the file should be included, False otherwise
    """
    file_path_lower = file_path.lower()
    
    # Exclude static assets
    static_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp',
                        '.woff', '.woff2', '.ttf', '.eot', '.otf',  # Fonts
                        '.mp4', '.mp3', '.avi', '.mov', '.wav', '.ogg',  # Media
                        '.pdf', '.zip', '.tar', '.gz', '.rar',  # Archives
                        '.exe', '.dll', '.so', '.dylib']  # Binaries
    if any(file_path_lower.endswith(ext) for ext in static_extensions):
        return False
    
    # Exclude vendor/library directories
    exclude_dirs = ['node_modules', 'vendor', 'lib', 'dist', 'build', '.venv', 'venv',
                  'env', '__pycache__', '.pytest_cache', '.mypy_cache', '.git',
                  'bower_components', '.next', '.nuxt', 'target', 'bin', 'obj',
                  '.gradle', '.idea', '.vscode', 'coverage', '.nyc_output']
    path_parts = file_path.replace('\\', '/').split('/')
    if any(excluded in path_parts for excluded in exclude_dirs):
        return False
    
    # Exclude minified/compiled files
    if any(file_path_lower.endswith(ext) for ext in ['.min.js', '.min.css', '.bundle.js']):
        return False
    
    # Exclude lock files and large generated files
    if any(file_path_lower.endswith(ext) for ext in ['package-lock.json', 'yarn.lock', 
                                                      'pnpm-lock.yaml', '.map']):
        return False
    
    # Include source code files
    source_extensions = ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', 
                        '.md', '.json', '.java', '.cpp', '.c', '.h', '.hpp',
                        '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala']
    if any(file_path_lower.endswith(ext) for ext in source_extensions):
        return True
    
    return False


def get_file_priority(file_path: str) -> int:
    """Return priority for file sorting (lower = higher priority).
    
    Prioritizes important source files like main entry points,
    files in source directories, and configuration files.
    
    Args:
        file_path: Path to the file within the ZIP archive
        
    Returns:
        Integer priority (lower = higher priority)
    """
    path_lower = file_path.lower()
    # Prioritize files in common source directories
    if any(dir in path_lower for dir in ['/src/', '/app/', '/components/', '/lib/', '/utils/', '/helpers/']):
        return 1
    # Prioritize main entry points
    if any(name in path_lower for name in ['main.', 'index.', 'app.', 'server.', 'app.py', 'main.py']):
        return 2
    # Prioritize config files (but not lock files)
    if any(name in path_lower for name in ['package.json', 'requirements.txt', 'setup.py', 'config.']):
        return 3
    # Lower priority for test files
    if 'test' in path_lower or 'spec' in path_lower:
        return 5
    # Default priority
    return 4


def extract_developer_files(zip_path: str, max_total_chars: int = 500_000, max_files: int = 50) -> str:
    """Extract and filter developer-written source files from a ZIP archive.
    
    This function extracts only source code files written by the developer,
    excluding static assets, vendor libraries, and generated files.
    
    Args:
        zip_path: Path to the ZIP file
        max_total_chars: Maximum total characters to extract (default: 500k)
        max_files: Maximum number of files to extract (default: 50)
        
    Returns:
        Formatted string containing the extracted file contents
        
    Raises:
        HTTPException: If ZIP is invalid or no source files found
    """
    project_content = []
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Get all files and filter
            all_files = zip_ref.namelist()
            source_files = [f for f in all_files if should_include_file(f)]
            
            # Sort by priority (most important files first)
            source_files.sort(key=get_file_priority)
            
            # Extract files up to limits
            total_chars = 0
            
            for file_name in source_files[:max_files]:
                if total_chars >= max_total_chars:
                    break
                try:
                    with zip_ref.open(file_name) as f:
                        content = f.read().decode('utf-8', errors='ignore')
                        
                        # Skip empty or very small files (likely not important)
                        if len(content.strip()) < 10:
                            continue
                        
                        # Limit file content to avoid exceeding token limits
                        max_file_chars = min(5000, max_total_chars - total_chars)
                        if len(content) > max_file_chars:
                            content = content[:max_file_chars] + "\n... (truncated)"
                        project_content.append(f"=== {file_name} ===\n{content}\n")
                        total_chars += len(content)
                except Exception as e:
                    print(f"Skipping file {file_name}: {str(e)}")
                    continue  # Skip files that can't be read
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file format")
    
    if not project_content:
        raise HTTPException(
            status_code=400, 
            detail="No developer source code files found in the ZIP archive. Please ensure your project contains source code files (not just libraries or static assets)."
        )
    
    return "\n".join(project_content)

