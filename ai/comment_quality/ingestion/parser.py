"""Parsers for extracting comments from Python and JavaScript files."""

import ast
import re
from typing import List, Dict, Any


class Comment:
    """Represents a comment with its context."""
    
    def __init__(
        self,
        text: str,
        code_after: str,
        language: str
    ):
        self.text = text
        self.code_after = code_after
        self.language = language
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert comment to dictionary representation."""
        return {
            'func_code_string': self.code_after,
            'query': self.text,
            'language': self.language
        }


def count_python_functions(file_path: str) -> int:
    """
    Count total number of functions and classes in a Python file.
    
    Args:
        file_path: Path to the Python file
        
    Returns:
        Number of functions and classes found
    """
    count = 0
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.AsyncFunctionDef)):
                    count += 1
        except (SyntaxError, Exception):
            pass
    except Exception:
        pass
    
    return count


def count_javascript_functions(file_path: str) -> int:
    """
    Count total number of functions and classes in a JavaScript file.
    
    Args:
        file_path: Path to the JavaScript file
        
    Returns:
        Number of functions and classes found
    """
    count = 0
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Count function declarations: function name() or function name() {}
        function_pattern = r'(?:^|\s)(?:export\s+)?(?:async\s+)?function\s+\w+'
        function_matches = len(re.findall(function_pattern, content, re.MULTILINE))
        
        # Count arrow functions assigned to const/let/var: const name = () => {}
        arrow_pattern = r'(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>'
        arrow_matches = len(re.findall(arrow_pattern, content))
        
        # Count class declarations: class Name {}
        class_pattern = r'(?:^|\s)(?:export\s+)?class\s+\w+'
        class_matches = len(re.findall(class_pattern, content, re.MULTILINE))
        
        count = function_matches + arrow_matches + class_matches
    except Exception:
        pass
    
    return count


def parse_python_file(file_path: str) -> List[Comment]:
    """
    Extract comments from a Python file.
    
    Extracts only function and class docstrings with their complete function/class body.
    Inline comments are excluded.
    
    Args:
        file_path: Path to the Python file
        
    Returns:
        List of Comment objects with complete function/class bodies
    """
    comments = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.splitlines(keepends=True)
        
        # Extract docstrings using AST
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                # Only check nodes that can have docstrings
                if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.AsyncFunctionDef)):
                    docstring = ast.get_docstring(node)
                    if docstring:
                        # Get the complete function/class body
                        start_line = node.lineno - 1  # 0-indexed
                        
                        # Find the end line of this node
                        if hasattr(node, 'end_lineno') and node.end_lineno:
                            end_line = node.end_lineno
                        else:
                            # Fallback: estimate based on the last statement in the body
                            if node.body:
                                last_node = node.body[-1]
                                if hasattr(last_node, 'end_lineno') and last_node.end_lineno:
                                    end_line = last_node.end_lineno
                                elif hasattr(last_node, 'lineno'):
                                    end_line = last_node.lineno
                                else:
                                    end_line = start_line + 10  # Fallback
                            else:
                                end_line = start_line + 1
                        
                        # Extract the entire function/class definition
                        code_after = ''.join(lines[start_line:min(end_line, len(lines))]).strip()
                        
                        comments.append(Comment(
                            text=docstring,
                            code_after=code_after,
                            language='python'
                        ))
                elif isinstance(node, ast.Module):
                    # Module docstrings (file-level) - optional, can be excluded if not needed
                    docstring = ast.get_docstring(node)
                    if docstring:
                        # For module docstring, include some context (first 50 lines or so)
                        code_after = ''.join(lines[:min(50, len(lines))]).strip()
                        
                        comments.append(Comment(
                            text=docstring,
                            code_after=code_after,
                            language='python'
                        ))
        except SyntaxError:
            pass  # File has syntax errors, skip AST parsing
        except Exception as e:
            # Catch any other AST-related errors and continue
            pass
        
        # Skip inline comments - we only want function/class docstrings
            
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    
    return comments


def parse_javascript_file(file_path: str) -> List[Comment]:
    """
    Extract comments from a JavaScript file.
    
    Extracts only JSDoc-style comments (/** ... */) that precede function/class definitions,
    with the complete function/class body as context.
    
    Args:
        file_path: Path to the JavaScript file
        
    Returns:
        List of Comment objects with complete function bodies
    """
    comments = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.splitlines(keepends=True)
        
        # Pattern for JSDoc comments (/** ... */) followed by function/class
        # This pattern looks for JSDoc comments and captures them along with the following function/class
        jsdoc_pattern = r'/\*\*(.+?)\*/\s*(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)'
        
        matches = re.finditer(jsdoc_pattern, content, re.DOTALL)
        for match in matches:
            comment_text = match.group(1).strip()
            function_name = match.group(2)
            
            if len(comment_text) >= 3:
                # Find the function/class body
                # Start from where the function declaration begins
                func_start = match.end() - len(function_name) - 1
                
                # Find the end of the function by counting braces
                func_end = _find_function_end(content, func_start)
                
                if func_end > func_start:
                    # Extract the complete function definition
                    func_line_start = content[:func_start].count('\n')
                    func_line_end = content[:func_end].count('\n') + 1
                    
                    code_after = ''.join(lines[func_line_start:min(func_line_end, len(lines))]).strip()
                    
                    comments.append(Comment(
                        text=comment_text,
                        code_after=code_after,
                        language='javascript'
                    ))
        
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
    
    return comments


def _find_function_end(content: str, start_pos: int) -> int:
    """
    Find the end of a JavaScript function by counting braces.
    
    Args:
        content: Full file content
        start_pos: Starting position to search from
        
    Returns:
        End position of the function
    """
    brace_count = 0
    in_string = False
    string_char = None
    i = start_pos
    
    # First, find the opening brace
    while i < len(content) and content[i] != '{':
        i += 1
    
    if i >= len(content):
        return start_pos + 100  # Fallback
    
    # Now count braces
    while i < len(content):
        char = content[i]
        
        # Handle strings
        if char in ('"', "'", '`'):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char and (i == 0 or content[i-1] != '\\'):
                in_string = False
                string_char = None
        
        # Handle comments
        elif not in_string:
            if i < len(content) - 1 and content[i:i+2] == '//':
                # Skip to end of line
                while i < len(content) and content[i] != '\n':
                    i += 1
                continue
            elif i < len(content) - 1 and content[i:i+2] == '/*':
                # Skip to end of comment
                i += 2
                while i < len(content) - 1 and content[i:i+2] != '*/':
                    i += 1
                i += 2
                continue
        
        # Count braces (only if not in string or comment)
        if not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    return i + 1
        
        i += 1
    
    return len(content)  # Fallback to end of file

