import pytest

def test_textual_installed():
    try:
        import textual
        assert True
    except ImportError:
        pytest.fail("Textual not installed")
