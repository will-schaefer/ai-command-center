# Product Guide: Kanban Hub

## Vision

Kanban Hub is a native desktop project management application with the Kanban board as its centerpiece. It provides hierarchical multi-board support for managing tasks across individual projects, project groups, and a global overview. The application uses Tauri for native desktop delivery while maintaining a Python CLI for terminal workflows and AI agent integration.

## Target Users

### Primary: Solo Developer
- Manages 3-10 active projects simultaneously
- Prefers keyboard-driven workflows
- Uses terminal daily, comfortable with CLI
- Wants visual overview without leaving native environment
- May use AI assistants (Claude, GPT) for development tasks

### Secondary: AI Agent
- Programmatic access to read/write tasks via CLI
- Needs structured JSON output for parsing
- May orchestrate multi-project workflows

## Core Goals

- **Multi-Project Visibility**: See and manage tasks across all projects in one place
- **Native Experience**: Desktop app that feels native, not a web wrapper
- **Dual Interface**: CLI for terminal/agents, GUI for visual work
- **Zero Config**: Filesystem-based board discovery, no setup required
- **Data Integrity**: Shared SQLite layer with concurrent access support

## Feature Scope

### Current (Python CLI)
- Per-directory Kanban boards with SQLite persistence
- CLI commands: add, list, move, delete, view, json
- Interactive TUI with keyboard navigation
- Three-column layout: Todo, Doing, Done

### MVP (Tauri Desktop)
- All current CLI features in native GUI
- Hierarchical board discovery via filesystem
- Cross-board task references: `[[project-name#42]]`
- Navigation between project, group, and global views
- Shared data layer with Python CLI

### Future
- AI assistant panes embedded in app
- Mobile apps (iOS, Android)
- Time tracking, sprint planning
- Custom columns per board
- Real-time sync across machines

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Tauri | Native feel, small binary, Rust backend |
| Board hierarchy | Filesystem-based | Zero config, discoverable, intuitive |
| Cross-board links | `[[name#id]]` syntax | User-friendly, parseable |
| Python CLI fate | Keep on main branch | Agent access, backward compatibility |
| Tauri development | Feature branch | Isolated development, gradual transition |
