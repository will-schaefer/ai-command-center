import typer
import json
import time
import os
from dataclasses import asdict
from typing import Optional
from database import init_db, DB_NAME
from models import TaskManager
from rich.console import Console
from rich.live import Live
from ui import create_board
from tui import KanbanBoard

app = typer.Typer()
console = Console()

def get_manager() -> TaskManager:
    """
    Get a TaskManager instance for the current project.
    """
    return TaskManager(os.path.abspath(DB_NAME))

@app.callback()
def callback():
    """
    Tmux Agentic Kanban Board CLI
    """
    init_db(os.path.abspath(DB_NAME))

@app.command()
def add(title: str, desc: Optional[str] = typer.Option(None, "--desc", "-d")):
    """
    Add a new task to the Todo column
    """
    mgr = get_manager()
    mgr.add_task(title, desc)
    console.print(f"[green]Added task:[/green] {title}")

@app.command(name="list")
def list_tasks():
    """
    List all tasks in a simple format
    """
    mgr = get_manager()
    tasks = mgr.get_all_tasks()
    if not tasks:
        console.print("No tasks found.")
        return
    
    for task in tasks:
        console.print(f"ID: {task.id} | [{task.status.upper()}] {task.title}")

@app.command(name="move")
def move_task(task_id: int, status: str):
    """
    Move a task to a different status (todo, doing, done)
    """
    valid_statuses = ["todo", "doing", "done"]
    if status.lower() not in valid_statuses:
        console.print(f"[red]Error:[/red] Invalid status '{status}'. Must be one of {valid_statuses}")
        raise typer.Exit(code=1)
    
    mgr = get_manager()
    mgr.update_task_status(task_id, status.lower())
    console.print(f"[green]Moved task {task_id} to {status.lower()}[/green]")

@app.command(name="delete")
def delete_task(task_id: int):
    """
    Delete a task by its ID
    """
    mgr = get_manager()
    mgr.delete_task(task_id)
    console.print(f"[red]Deleted task {task_id}[/red]")

@app.command()

def view(watch: bool = typer.Option(False, "--watch", "-w", help="Auto-refresh the board")):

    """

    Render the Kanban board

    """

    if watch:

        # For now, keep the old watch behavior or deprecate it in favor of TUI

        # The TUI is inherently 'watching' since it's an app.

        # But for this MVP step, let's redirect standard view to TUI

        pass



    # Launch the interactive TUI

    tui_app = KanbanBoard()

    tui_app.run()



@app.command(name="json")
def list_json():
    """
    Output all tasks as a JSON list for agents
    """
    mgr = get_manager()
    tasks = mgr.get_all_tasks()
    tasks_dict = [asdict(t) for t in tasks]
    typer.echo(json.dumps(tasks_dict))

if __name__ == "__main__":
    app()