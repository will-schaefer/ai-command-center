import pytest
from tui import KanbanBoard

def test_app_instantiation():
    app = KanbanBoard()
    assert app is not None
