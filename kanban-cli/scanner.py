import os
import re
from typing import List, Dict

# Regex patterns for markers
# Supports #TODO: Task description
# Supports #REVIEW: Task description
# Supports #DRAFT: Task description
MARKER_PATTERNS = {
    "todo": re.compile(r"#TODO:\s*(.*)", re.IGNORECASE),
    "doing": re.compile(r"#(?:REVIEW|DRAFT):\s*(.*)", re.IGNORECASE),
}

def scan_file(file_path: str) -> List[Dict]:
    """
    Scans a single file for action markers.
    """
    tasks = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                for status, pattern in MARKER_PATTERNS.items():
                    match = pattern.search(line)
                    if match:
                        title = match.group(1).strip()
                        if title:
                            tasks.append({
                                "title": title,
                                "status": status,
                                "source_file": os.path.relpath(file_path),
                                "line_number": i
                            })
    except (UnicodeDecodeError, PermissionError):
        # Skip binary files or files we can't read
        pass
    return tasks

def scan_project(root_dir: str = ".") -> List[Dict]:
    """
    Recursively scans the project directory for action markers.
    Ignores common non-source directories.
    """
    all_tasks = []
    ignore_dirs = {".git", ".venv", "__pycache__", ".pytest_cache", "node_modules", "build", "dist"}
    
    # Extensions to scan
    valid_extensions = {".py", ".md", ".txt", ".js", ".ts", ".jsx", ".tsx", ".sh", ".c", ".cpp", ".h"}

    for root, dirs, files in os.walk(root_dir):
        # Prune ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in valid_extensions:
                file_path = os.path.join(root, file)
                all_tasks.extend(scan_file(file_path))
                
    return all_tasks
