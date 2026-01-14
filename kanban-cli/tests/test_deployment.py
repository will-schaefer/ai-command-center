import os
import shutil
from typer.testing import CliRunner
from main import app
import pytest

runner = CliRunner()

def test_auto_initialization_in_new_dir(tmp_path):
    # Change to a new temporary directory
    os.chdir(tmp_path)
    
    # Run a command (e.g., list) in the new empty directory
    result = runner.invoke(app, ["list"])
    
    assert result.exit_code == 0
    assert "No tasks found." in result.output
    # Check if kanban.db was created in the CWD
    assert os.path.exists("kanban.db")

def test_project_local_scope(tmp_path):
    # Setup two different project directories
    proj1 = tmp_path / "proj1"
    proj2 = tmp_path / "proj2"
    proj1.mkdir()
    proj2.mkdir()
    
    # Add a task in proj1
    os.chdir(proj1)
    runner.invoke(app, ["add", "Task in Proj1"])
    
    # Add a task in proj2
    os.chdir(proj2)
    runner.invoke(app, ["add", "Task in Proj2"])
    
    # Verify proj1 only has its task
    os.chdir(proj1)
    result1 = runner.invoke(app, ["list"])
    assert "Task in Proj1" in result1.output
    assert "Task in Proj2" not in result1.output
    
    # Verify proj2 only has its task
    os.chdir(proj2)
    result2 = runner.invoke(app, ["list"])
    assert "Task in Proj2" in result2.output
    assert "Task in Proj1" not in result2.output
