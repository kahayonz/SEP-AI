"""Main extractor class for processing entire projects."""

from typing import List, Optional, Tuple

from ..config import PYTHON_EXTENSIONS, JAVASCRIPT_EXTENSIONS
from .parser import (
    parse_python_file, 
    parse_javascript_file, 
    count_python_functions,
    count_javascript_functions,
    Comment
)
from .unzipper import unzip_project, find_source_files
from .filters import FileFilter, create_default_filter


class CommentExtractor:
    """Extracts comments from Python and JavaScript projects."""
    
    def __init__(
        self,
        file_filter: Optional[FileFilter] = None,
        enable_filtering: bool = True
    ):
        """
        Initialize the comment extractor.
        
        Args:
            file_filter: Optional FileFilter instance (uses default if None)
            enable_filtering: Whether to filter out vendor/library files
        """
        self.enable_filtering = enable_filtering
        
        if enable_filtering:
            self.file_filter = file_filter or create_default_filter()
        else:
            self.file_filter = None
    
    def extract_from_zip(self, zip_path: str, output_dir: str = None) -> Tuple[List[Comment], int, int]:
        """
        Extract comments from a zipped project.
        
        Args:
            zip_path: Path to the zip file
            output_dir: Optional directory to extract zip contents
            
        Returns:
            Tuple of (List of Comment objects, total files processed, total functions/classes found)
        """
        # Unzip the project
        extracted_dir = unzip_project(zip_path, output_dir)
        
        # Extract comments from the directory
        return self.extract_from_directory(extracted_dir)
    
    def extract_from_directory(self, directory: str) -> Tuple[List[Comment], int, int]:
        """
        Extract comments from all Python and JavaScript files in a directory.
        
        Args:
            directory: Path to the directory
            
        Returns:
            Tuple of (List of Comment objects, total files processed, total functions/classes found)
        """
        all_comments = []
        total_functions = 0
        
        # Find Python files
        python_files = find_source_files(directory, PYTHON_EXTENSIONS)
        # Find JavaScript files
        js_files = find_source_files(directory, JAVASCRIPT_EXTENSIONS)
        
        all_files = python_files + js_files
        
        # Filter out vendor/library files if filtering is enabled
        if self.enable_filtering and self.file_filter:
            all_files, _ = self.file_filter.filter_files(
                all_files, 
                project_root=directory,
                verbose=False
            )
        
        # Process each file
        for file_path in all_files:
            if any(file_path.endswith(ext) for ext in PYTHON_EXTENSIONS):
                comments = parse_python_file(file_path)
                total_functions += count_python_functions(file_path)
            elif any(file_path.endswith(ext) for ext in JAVASCRIPT_EXTENSIONS):
                comments = parse_javascript_file(file_path)
                total_functions += count_javascript_functions(file_path)
            else:
                continue
            
            all_comments.extend(comments)
        
        return all_comments, len(all_files), total_functions
    
    def extract_and_format_from_zip(self, zip_path: str) -> Tuple[List[str], int, int]:
        """
        Extract comments from a zipped project and format them as [query]<CODESPLIT>[func_code_string].
        
        Args:
            zip_path: Path to the zip file
            
        Returns:
            Tuple of (List of formatted strings, total files processed, total functions/classes found)
        """
        comments, total_files, total_functions = self.extract_from_zip(zip_path)
        formatted_list = []
        
        for comment in comments:
            formatted_text = f"{comment.text}<CODESPLIT>{comment.code_after}"
            formatted_list.append(formatted_text)
        
        return formatted_list, total_files, total_functions

