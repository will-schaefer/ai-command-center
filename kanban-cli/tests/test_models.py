import sqlite3
import pytest
import os
from database import init_db
from models import TaskManager, Task

DB_NAME = "test_models.db"

@pytest.fixture
def manager():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
    init_db(DB_NAME)
    mgr = TaskManager(DB_NAME)
    yield mgr
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)

def test_add_task(manager):
    task_id = manager.add_task("Test Task", "Test Description")
    assert task_id == 1
    
    tasks = manager.get_all_tasks()
    assert len(tasks) == 1
    assert tasks[0].title == "Test Task"
    assert tasks[0].status == "todo"

def test_get_tasks_by_status(manager):
    manager.add_task("T1", status="todo")
    manager.add_task("T2", status="doing")
    
    todo = manager.get_tasks_by_status("todo")
    doing = manager.get_tasks_by_status("doing")
    
    assert len(todo) == 1
    assert todo[0].title == "T1"
    assert len(doing) == 1
    assert doing[0].title == "T2"

def test_update_task_status(manager):
    task_id = manager.add_task("T1")
    manager.update_task_status(task_id, "doing")
    
    tasks = manager.get_all_tasks()
    assert tasks[0].status == "doing"

def test_delete_task(manager):
    task_id = manager.add_task("T1")
    manager.delete_task(task_id)
    
    tasks = manager.get_all_tasks()
    assert len(tasks) == 0
