import sqlite3
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class Task:
    id: int
    title: str
    description: Optional[str]
    status: str
    created_at: str

class TaskManager:
    def __init__(self, db_name: str = "kanban.db"):
        self.db_name = db_name

    def _get_connection(self):
        return sqlite3.connect(self.db_name)

    def add_task(self, title: str, description: str = None, status: str = "todo") -> int:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)",
            (title, description, status)
        )
        task_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return task_id

    def get_all_tasks(self) -> List[Task]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, description, status, created_at FROM tasks ORDER BY created_at")
        rows = cursor.fetchall()
        conn.close()
        return [Task(*row) for row in rows]

    def get_tasks_by_status(self, status: str) -> List[Task]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, title, description, status, created_at FROM tasks WHERE status = ? ORDER BY created_at",
            (status,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [Task(*row) for row in rows]

    def update_task_status(self, task_id: int, status: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
        conn.commit()
        conn.close()

    def delete_task(self, task_id: int):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        conn.close()
