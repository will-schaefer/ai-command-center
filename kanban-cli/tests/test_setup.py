import typer
import rich

def test_dependencies():
    # Pass with actual version
    assert typer.__version__ == "0.21.1"