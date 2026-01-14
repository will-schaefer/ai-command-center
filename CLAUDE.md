# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Command Center** - A native desktop application that unifies AI development tools, project contexts, and task workflows into a single pane of glass.

**Key docs:**
- `docs/prd.md` - Full product requirements document
- `kanban-cli/conductor/prd-draft.md` - Kanban-specific requirements

## Monorepo Structure

```
ai-command-center/
├── desktop/        # Tauri + React desktop app (MVP)
├── kanban-cli/     # Python CLI for task management (v0.3)
└── docs/           # Documentation
```

## Commands

### Desktop App (Tauri + React)
```bash
cd desktop
bun install              # Install dependencies
bun tauri dev            # Run in development
bun tauri build          # Build release
bun run dev              # Vite dev server only (no Tauri)
```

### Kanban CLI (Python)
```bash
cd kanban-cli
uv sync                  # Install dependencies
python main.py add "task" --desc "description"
python main.py list
python main.py move <id> <status>   # todo, doing, done
python main.py delete <id>
python main.py view                 # Interactive TUI
python main.py json                 # JSON output for agents

# Tests
uv run pytest
uv run pytest tests/test_models.py  # Single file
```

## Architecture

### Desktop App (`desktop/`)
- **Framework**: Tauri v2 (Rust backend + webview)
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State**: Zustand
- **Build**: Vite, Bun
- **API Server**: Bun + Hono (localhost:7777 for AI agents)

**Key directories:**
- `src/pages/` - Route components (claude/, codex/, gemini/)
- `src/components/` - Reusable UI components
- `src-tauri/` - Rust backend code
- `server/` - Bun API server for AI agent access

### Kanban CLI (`kanban-cli/`)
- **Framework**: Typer (CLI), Textual (TUI)
- **Database**: SQLite per project directory
- **Language**: Python 3.12+

**Key files:**
- `main.py` - CLI entry point
- `models.py` - Task dataclass + TaskManager
- `database.py` - SQLite initialization
- `tui.py` - Interactive Textual app

## Version Roadmap

| Version | Focus | Status |
|---------|-------|--------|
| v0.1 | Config viewer (Claude, Codex, MCP) | In progress |
| v0.2 | Project discovery, config editing | Planned |
| v0.3 | Kanban integration, AI agent API | Planned |
| v0.4+ | Background service, AI autonomy | Future |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Tauri | Native, small binary, Rust security |
| Frontend | React | Existing code, ecosystem |
| Kanban hierarchy | Filesystem-based | Zero config, auto-discovery |
| Cross-board links | `[[project#42]]` | User-friendly syntax |
| API port | localhost:7777 | AI agent access |

## Code Style

### TypeScript/React (desktop/)
- Functional components with hooks
- Tailwind for styling
- Zustand for state management

### Python (kanban-cli/)
- Google Python Style Guide
- `snake_case` for functions/variables
- `PascalCase` for classes
- Type annotations for public APIs
- 80 character line limit

## Integration Points

| System | Method | Config Location |
|--------|--------|-----------------|
| Claude Code | JSON read | `~/.claude/settings.json` |
| Codex CLI | Shell exec | `~/.codex/` |
| Gemini CLI | Shell exec | `~/.gemini/` |
| MCP Servers | JSON read | `~/.mcp.json` |
| Kanban | SQLite | `kanban.db` per project |
