"""Ingestion module for extracting comments from code files."""

from .extractor import CommentExtractor
from .filters import FileFilter, create_default_filter

__all__ = ['CommentExtractor', 'FileFilter', 'create_default_filter']

