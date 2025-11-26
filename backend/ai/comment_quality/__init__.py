"""
Comment Quality Evaluator
A machine learning tool for evaluating comment quality in Python and JavaScript codebases.
"""

from .ingestion.extractor import CommentExtractor
from .ingestion.filters import FileFilter, create_default_filter

__version__ = "0.1.0"

__all__ = ['CommentExtractor', 'FileFilter', 'create_default_filter']

