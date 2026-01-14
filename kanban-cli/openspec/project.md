# Project: Kanban Hub

A native desktop project management application with hierarchical Kanban boards. Designed for solo developers managing multiple projects, with CLI support for AI agent integration.

## Overview

Kanban Hub evolves from a terminal-based Kanban CLI into a Tauri-based native desktop application. The Kanban board remains the centerpiece, with multi-board support enabling task management across projects, project groups, and a global overview.

## Target Users

- **Solo Developers** - Personal task management across multiple projects
- **AI Agents** - Programmatic task access via CLI commands and JSON output

## Tech Stack

| Component | Current (Python) | Future (Tauri) |
|-----------|-----------------|----------------|
| Language | Python 3.12+ | Rust + Svelte |
| Framework | Typer + Textual | Tauri v2 |
| Database | SQLite | SQLite (shared) |
| Platforms | Terminal | macOS, Windows, Linux |

## Project Structure

```
kanban-board/
├── main.py           # CLI entry point (Typer app)
├── models.py         # Task dataclass and TaskManager
├── database.py       # SQLite initialization
├── tui.py            # Textual-based interactive board
├── ui.py             # Rich-based static board rendering
├── tests/            # Test suite
├── conductor/        # Project documentation
│   ├── product.md    # Product vision
│   ├── tech-stack.md # Technology decisions
│   ├── prd-draft.md  # Full PRD for Tauri version
│   └── tracks/       # Implementation tracks
└── openspec/         # OpenSpec project definition
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `python main.py add "title"` | Add task to Todo |
| `python main.py list` | List all tasks |
| `python main.py move <id> <status>` | Move task (todo/doing/done) |
| `python main.py delete <id>` | Delete task |
| `python main.py view` | Launch interactive TUI |
| `python main.py json` | Output as JSON (for agents) |

## Key Features

### Current (Python CLI)
- **Interactive TUI**: Keyboard navigation with Enter to grab/drop, arrows to move
- **Agent-Friendly**: JSON output mode for AI integration
- **Project-Scoped**: Each directory has its own `kanban.db`

### Planned (Tauri Desktop)
- **Multi-Board Navigation**: Project → Group → Global views
- **Filesystem Discovery**: Auto-discover boards from directory hierarchy
- **Cross-Board Links**: Reference tasks via `[[project-name#42]]` syntax
- **Shared Data Layer**: Same SQLite used by CLI and GUI

## Roadmap

### Completed
- [x] Core CLI with add/list/move/delete
- [x] SQLite persistence with auto-initialization
- [x] Rich board rendering
- [x] Interactive TUI with keyboard navigation
- [x] JSON output for agents

### In Progress
- [ ] PRD finalization for Tauri version
- [ ] Tauri scaffold on feature branch

### MVP (Tauri Desktop)
- [ ] Single-board view (port existing UI)
- [ ] Filesystem board discovery
- [ ] Parent/child board navigation
- [ ] Cross-board reference parsing
- [ ] Shared SQLite layer with CLI

### Future
- [ ] AI assistant panes
- [ ] Mobile apps (iOS/Android)
- [ ] Time tracking, sprint planning
- [ ] Custom columns per board
- [ ] Real-time sync

## Conventions

### Code Style
- Google Python Style Guide
- `snake_case` for functions/variables, `PascalCase` for classes
- Type annotations for public APIs
- 80 character line limit

### Database
- SQLite per project directory (`kanban.db`)
- WAL mode for concurrent CLI/GUI access
- Schema: `tasks(id, title, description, status, created_at)`

### Testing
- Tests in `tests/` directory
- Run with `uv run pytest`
