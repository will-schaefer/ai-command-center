import os
import pytest
from scanner import scan_file, scan_project

def test_scan_file_todo(tmp_path):
    f = tmp_path / "test.py"
    f.write_text("# TODO: Implement this\n# Some other line\n# REVIEW: Check this")
    
    tasks = scan_file(str(f))
    assert len(tasks) == 2
    
    assert tasks[0]["title"] == "Implement this"
    assert tasks[0]["status"] == "todo"
    assert tasks[0]["line_number"] == 1
    
    assert tasks[1]["title"] == "Check this"
    assert tasks[1]["status"] == "doing"
    assert tasks[1]["line_number"] == 3

def test_scan_project(tmp_path):
    # Create structure
    (tmp_path / "src").mkdir()
    (tmp_path / ".git").mkdir()
    
    f1 = tmp_path / "src" / "main.py"
    f1.write_text("# TODO: Task 1")
    
    f2 = tmp_path / "README.md"
    f2.write_text("# DRAFT: Task 2")
    
    # Should ignore .git
    f3 = tmp_path / ".git" / "config"
    f3.write_text("# TODO: Hidden task")
    
    tasks = scan_project(str(tmp_path))
    
    # We use relpath in scanner, so we need to account for that if we change CWD or just check titles
    titles = [t["title"] for t in tasks]
    assert "Task 1" in titles
    assert "Task 2" in titles
    assert "Hidden task" not in titles
    assert len(tasks) == 2
