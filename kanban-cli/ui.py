from rich.panel import Panel
from rich.console import Group
from rich.text import Text
from rich.columns import Columns
from typing import List
from models import Task

def create_column(title: str, tasks: List[Task]) -> Panel:
    task_renderables = []
    
    for task in tasks:
        task_text = Text()
        task_text.append(f"#{task.id} ", style="dim")
        task_text.append(task.title, style="bold")
        if task.description:
            task_text.append(f"\n{task.description}", style="italic dim")
        task_text.append("\n") # Spacer
        
        task_renderables.append(Panel(task_text, border_style="dim"))
        
    return Panel(
        Group(*task_renderables),
        title=title,
        border_style="blue" if title == "Todo" else "yellow" if title == "Doing" else "green",
        padding=(1, 1)
    )

def create_board(tasks: List[Task]) -> Columns:
    todo_tasks = [t for t in tasks if t.status == "todo"]
    doing_tasks = [t for t in tasks if t.status == "doing"]
    done_tasks = [t for t in tasks if t.status == "done"]
    
    return Columns(
        [
            create_column("Todo", todo_tasks),
            create_column("Doing", doing_tasks),
            create_column("Done", done_tasks)
        ],
        expand=True
    )