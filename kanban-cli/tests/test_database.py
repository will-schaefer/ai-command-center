import sqlite3
import pytest
import os
from database import init_db

DB_NAME = "test_kanban.db"

def test_init_db():
    # Ensure db file doesn't exist
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
    
    init_db(DB_NAME)
    
    assert os.path.exists(DB_NAME)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks';")
    table = cursor.fetchone()
    conn.close()
    
    assert table is not None
    
    # Cleanup
    os.remove(DB_NAME)

def test_init_db_schema():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
    
    init_db(DB_NAME)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(tasks);")
    columns = [row[1] for row in cursor.fetchall()]
    conn.close()
    
    expected_columns = ['id', 'title', 'description', 'status', 'created_at']
    for col in expected_columns:
        assert col in columns
    
    os.remove(DB_NAME)
