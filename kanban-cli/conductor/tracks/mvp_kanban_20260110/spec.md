# Specification: MVP Tmux Agentic Kanban Board

This specification defines the core functionality and technical requirements for the MVP of the Python-based Kanban Board.

## 1. Overview
The goal is to build a CLI tool that renders a Kanban board in the terminal (optimized for a tmux pane) and provides commands to manage tasks. This design prioritizes "Agent Interoperability" by using standard shell commands for control.

## 2. User Stories
- **View Board:** As a user, I want to see a 3-column board (Todo, Doing, Done) in my terminal that updates when data changes.
- **Add Task:** As a user/agent, I want to add a task to "Todo" via a single command.
- **Move Task:** As a user/agent, I want to move a task to a different column by its ID.
- **Agent Output:** As an agent, I want to request the board state in JSON format to "see" the project status.

## 3. Technical Stack
- **Language:** Python
- **CLI:** Typer
- **Rendering:** Rich
- **Database:** SQLite

## 4. Architecture
- **`main.py`:** Entry point for the `Typer` app.
- **`database.py`:** Handles SQLite connection and schema creation.
- **`models.py`:** Defines the Task data structure (SQLAlchemy or raw SQL).
- **`ui.py`:** Uses `Rich` to construct the board layout (Columns, Panels).
- **`commands.py`:** Implements the logic for `add`, `move`, `list`, `delete`.

## 5. Data Model (SQLite)
Table: `tasks`
- `id`: Integer (Primary Key, Auto-increment)
- `title`: Text
- `description`: Text (Optional)
- `status`: Text (Enum: 'todo', 'doing', 'done')
- `created_at`: Timestamp

## 6. CLI API
- `kb view`: Render the graphical board.
- `kb add "Title" --desc "Description"`: Create a new task.
- `kb move <id> <status>`: Update task status.
- `kb delete <id>`: Remove a task.
- `kb json`: Output tasks as a JSON list.