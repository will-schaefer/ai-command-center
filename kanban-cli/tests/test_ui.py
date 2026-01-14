import pytest
from rich.panel import Panel
from rich.console import Console
from models import Task
from ui import create_column

def test_create_column():
    tasks = [
        Task(1, "Task 1", "Desc 1", "todo", "2023-01-01"),
        Task(2, "Task 2", "Desc 2", "todo", "2023-01-02")
    ]
    
    panel = create_column("Todo", tasks)
    
    assert isinstance(panel, Panel)
    assert panel.title == "Todo"
    
    # Render to string to verify content
    console = Console(file=open("/dev/null", "w"))
    with console.capture() as capture:
        console.print(panel)
    output = capture.get()
    
    assert "Task 1" in output
    assert "Task 2" in output

def test_create_board():
    from ui import create_board
    from rich.columns import Columns
    
    tasks = [
        Task(1, "Task 1", "Desc 1", "todo", "2023-01-01"),
        Task(2, "Task 2", "Desc 2", "doing", "2023-01-02"),
        Task(3, "Task 3", "Desc 3", "done", "2023-01-03")
    ]
    
    board = create_board(tasks)
    
    assert isinstance(board, Columns)
    
    # Render to string to verify content
    console = Console(file=open("/dev/null", "w"))
    with console.capture() as capture:
        console.print(board)
    output = capture.get()
    
    assert "Todo" in output
    assert "Doing" in output
    assert "Done" in output
    assert "Task 1" in output
    assert "Task 2" in output
    assert "Task 3" in output
