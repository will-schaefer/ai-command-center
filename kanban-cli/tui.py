from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Static, Label
from textual.containers import Container, VerticalScroll, Horizontal
from textual.binding import Binding
from textual.reactive import reactive
from models import Task, TaskManager
import os
from database import DB_NAME

class TaskWidget(Static):
    """A widget to display a single task."""
    
    can_focus = True
    grabbed = reactive(False)

    def __init__(self, task: Task) -> None:
        super().__init__()
        self.task = task

    def compose(self) -> ComposeResult:
        yield Label(f"#{self.task.id} {self.task.title}", classes="title")
        if self.task.description:
            yield Label(self.task.description, classes="description")
    
    def watch_grabbed(self, grabbed: bool) -> None:
        if grabbed:
            self.add_class("grabbed")
        else:
            self.remove_class("grabbed")

class ColumnWidget(Container):
    """A widget to display a column of tasks."""

    def __init__(self, title: str, tasks: list[Task], id: str) -> None:
        super().__init__(id=id)
        self.title = title
        self.tasks = tasks

    def compose(self) -> ComposeResult:
        yield Label(self.title, classes="column-header")
        with VerticalScroll(id=f"{self.id}-list"):
            for task in self.tasks:
                yield TaskWidget(task)

class KanbanBoard(App):
    """A Textual app to manage Kanban tasks."""
    
    CSS = """
    ColumnWidget {
        width: 1fr;
        border: solid;
        margin: 1;
    }
    TaskWidget {
        border: solid green;
        margin: 1;
        padding: 1;
    }
    TaskWidget:focus {
        border: double orange;
    }
    TaskWidget.grabbed {
        border: double red;
        background: $error 20%;
    }
    .title {
        text-style: bold;
    }
    .column-header {
        text-align: center;
        width: 100%;
        background: $primary;
        color: $text;
        padding: 1;
    }
    """

    BINDINGS = [
        ("q", "quit", "Quit"),
        Binding("enter", "toggle_grab", "Grab/Drop"),
        Binding("left", "move_left", "Move Left"),
        Binding("right", "move_right", "Move Right"),
    ]

    def action_toggle_grab(self) -> None:
        focused = self.screen.focused
        if isinstance(focused, TaskWidget):
            focused.grabbed = not focused.grabbed

    def action_move_left(self) -> None:
        self.move_task(-1)

    def action_move_right(self) -> None:
        self.move_task(1)

    def move_task(self, direction: int) -> None:
        focused = self.screen.focused
        if isinstance(focused, TaskWidget) and focused.grabbed:
            current_column = focused.parent.parent # Task -> VerticalScroll -> ColumnWidget
            cols = list(self.query(ColumnWidget))
            current_idx = cols.index(current_column)
            
            new_idx = current_idx + direction
            if 0 <= new_idx < len(cols):
                new_column = cols[new_idx]
                # Move visual
                focused.remove()
                new_column.query_one(VerticalScroll).mount(focused)
                focused.focus()
                
                # Update DB
                self.update_task_status(focused.task.id, new_column.id)

    def update_task_status(self, task_id: int, new_status: str) -> None:
        mgr = TaskManager(os.path.abspath(DB_NAME))
        mgr.update_task_status(task_id, new_status)

    def compose(self) -> ComposeResult:
        """Create child widgets for the app."""
        yield Header()
        
        mgr = TaskManager(os.path.abspath(DB_NAME))
        tasks = mgr.get_all_tasks()
        
        todo_tasks = [t for t in tasks if t.status == "todo"]
        doing_tasks = [t for t in tasks if t.status == "doing"]
        done_tasks = [t for t in tasks if t.status == "done"]

        yield Horizontal(
            ColumnWidget("Todo", todo_tasks, id="todo"),
            ColumnWidget("Doing", doing_tasks, id="doing"),
            ColumnWidget("Done", done_tasks, id="done")
        )
        
        yield Footer()

if __name__ == "__main__":
    app = KanbanBoard()
    app.run()
