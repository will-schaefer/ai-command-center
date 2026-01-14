from typer.testing import CliRunner
import pytest
import os
from main import app
from database import init_db
from models import TaskManager

runner = CliRunner()
DB_NAME = "test_cli.db"

@pytest.fixture(autouse=True)
def setup_db():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
    init_db(DB_NAME)
    # Patch TaskManager to use test DB
    import main
    main.mgr = TaskManager(DB_NAME)
    yield
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)

def test_add_command():
    result = runner.invoke(app, ["add", "New Task", "--desc", "Some description"])
    assert result.exit_code == 0
    assert "Added task: New Task" in result.output
    
    mgr = TaskManager(DB_NAME)
    tasks = mgr.get_all_tasks()
    assert len(tasks) == 1
    assert tasks[0].title == "New Task"
    assert tasks[0].description == "Some description"

def test_list_command():
    runner.invoke(app, ["add", "Task 1"])
    runner.invoke(app, ["add", "Task 2"])
    
    result = runner.invoke(app, ["list"])
    assert result.exit_code == 0
    assert "Task 1" in result.output
    assert "Task 2" in result.output

def test_move_command():
    runner.invoke(app, ["add", "Move Me"])
    result = runner.invoke(app, ["move", "1", "doing"])
    assert result.exit_code == 0
    assert "Moved task 1 to doing" in result.output
    
    mgr = TaskManager(DB_NAME)
    tasks = mgr.get_all_tasks()
    assert tasks[0].status == "doing"

def test_move_command_invalid_status():
    runner.invoke(app, ["add", "Move Me"])
    result = runner.invoke(app, ["move", "1", "invalid"])
    assert result.exit_code != 0
    assert "Invalid status" in result.output

def test_delete_command():
    runner.invoke(app, ["add", "Delete Me"])
    result = runner.invoke(app, ["delete", "1"])
    assert result.exit_code == 0
    assert "Deleted task 1" in result.output
    
    mgr = TaskManager(DB_NAME)
    tasks = mgr.get_all_tasks()
    assert len(tasks) == 0

def test_view_command():
    runner.invoke(app, ["add", "Task 1"])
    runner.invoke(app, ["add", "Task 2"])
    
    result = runner.invoke(app, ["view"])
    assert result.exit_code == 0
    # Check for column titles
    assert "Todo" in result.output
    assert "Doing" in result.output
    assert "Done" in result.output
    # Check for task content
    assert "Task 1" in result.output
    assert "Task 2" in result.output

def test_json_command():
    import json
    runner.invoke(app, ["add", "JSON Task", "--desc", "For agents"])
    
    result = runner.invoke(app, ["json"])
    assert result.exit_code == 0
    
    data = json.loads(result.output)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "JSON Task"
    assert data[0]["description"] == "For agents"
    assert "status" in data[0]

def test_view_watch_flag(mocker):
    # Mock Live and time.sleep to avoid infinite loop
    mock_live = mocker.patch("main.Live")
    mocker.patch("time.sleep", side_effect=InterruptedError) # Break loop
    
    # We expect an InterruptedError or similar if it hits the loop
    with pytest.raises(InterruptedError):
        runner.invoke(app, ["view", "--watch"], catch_exceptions=False)
    
    assert mock_live.called
