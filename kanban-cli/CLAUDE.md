# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

**Kanban Hub** - Native desktop project management application with hierarchical Kanban boards. Currently a Python CLI, evolving into a Tauri desktop app.

**Key docs:**
- `conductor/prd-draft.md` - Full PRD for Tauri version
- `conductor/product.md` - Product vision
- `conductor/tech-stack.md` - Technology decisions

## Commands

```bash
# Install dependencies
uv sync

# Run CLI
python main.py add "task title" --desc "description"
python main.py list
python main.py move <id> <status>   # status: todo, doing, done
python main.py delete <id>
python main.py view                 # Launch interactive TUI
python main.py json                 # JSON output for agents

# Run tests
uv run pytest
uv run pytest tests/test_models.py  # Single file
uv run pytest --cov                 # With coverage
```

## Architecture

### Current (Python CLI)
- `main.py` - CLI entry point (Typer). Initializes DB via `@app.callback()`.
- `models.py` - `Task` dataclass + `TaskManager` for DB operations.
- `database.py` - SQLite init. Creates `kanban.db` per directory.
- `tui.py` - Textual app. `KanbanBoard` → `ColumnWidget` → `TaskWidget`.
- `ui.py` - Rich-based static board rendering.

### Planned (Tauri Desktop)
- Tauri v2 + Svelte frontend
- Rust backend for filesystem discovery and SQLite access
- Multi-board navigation: project → group → global
- Cross-board links: `[[project-name#42]]` syntax
- Shared SQLite with Python CLI

## Key Decisions

| Decision | Choice |
|----------|--------|
| Desktop framework | Tauri (not Electron) |
| Board hierarchy | Filesystem-based discovery |
| Cross-board links | `[[project-name#42]]` syntax |
| Python CLI | Kept on main branch |
| Tauri development | Feature branch |

## Code Style

Google Python Style Guide:
- `snake_case` for functions/variables, `PascalCase` for classes
- Type annotations for public APIs
- 80 character line limit
- Docstrings with `Args:`, `Returns:`, `Raises:`
