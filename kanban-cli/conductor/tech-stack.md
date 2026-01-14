# Technology Stack - Kanban Hub

This document outlines the technologies used across both the current Python CLI and the upcoming Tauri desktop application.

## Current Stack (Python CLI)

### Programming Language: Python 3.12+
- **Rationale**: De facto language for modern CLI tools. Pre-installed in most developer environments.

### CLI Framework: Typer
- **Rationale**: Modern, type-driven library with auto-generated help. Easy for both humans and agents to use.

### Terminal UI: Textual
- **Rationale**: Powerful TUI framework built on Rich. Provides reactive components and CSS-based styling.

### Database: SQLite
- **Rationale**: Serverless, file-based. Per-project `kanban.db` files. WAL mode for concurrent access.

## Future Stack (Tauri Desktop)

### Application Framework: Tauri v2
- **Rationale**: Native desktop apps with small binaries (~10MB vs Electron's 150MB+). Rust backend provides performance and safety.

### Backend: Rust
- **Rationale**: Tauri's native language. Handles filesystem discovery, SQLite access, and cross-board logic.

### Frontend: Svelte (Recommended)
- **Rationale**: Compiles away to vanilla JS, minimal runtime. Excellent Tauri integration. Simpler than React for this use case.
- **Alternative**: React if team familiarity is a factor.

### Database: SQLite (Shared)
- **Rationale**: Same `kanban.db` files used by Python CLI. Enables CLI+GUI coexistence.
- **Mode**: WAL (Write-Ahead Logging) for concurrent access from CLI and GUI.

### Build/Package: Tauri CLI + pnpm
- **Rationale**: Standard Tauri toolchain. pnpm for fast, disk-efficient package management.

## Shared Components

### Data Layer
- SQLite database schema shared between Python and Rust
- Schema defined in `database.py` (Python) and mirrored in Rust
- Cross-board references stored as text, parsed at render time

### Filesystem
- Board hierarchy discovered by traversing directories for `kanban.db` files
- No additional configuration files required

## Platform Targets

| Platform | Support Level | Notes |
|----------|---------------|-------|
| macOS 12+ | Primary | Development platform |
| Windows 10+ | Secondary | Tauri builds natively |
| Ubuntu 20.04+ | Secondary | Tauri builds natively |
| iOS/Android | Future | Eventual mobile goal |

## Development Environment

```bash
# Python CLI development
uv sync                    # Install dependencies
python main.py <command>   # Run CLI
uv run pytest              # Run tests

# Tauri development (future)
pnpm install               # Install frontend deps
pnpm tauri dev             # Run in development
pnpm tauri build           # Build release
```
