#!/bin/bash
export PYTHONPATH=.
uv run pytest tests/test_deployment.py
