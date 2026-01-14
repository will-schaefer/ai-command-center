# AI Command Center

A native desktop application that unifies AI development tools, project contexts, and task workflows into a single pane of glass.

## Overview

AI Command Center consolidates:
- **Config Viewer**: See all AI tool configurations (Claude, Codex, Gemini, MCP servers) in one dashboard
- **Project Discovery**: Find and manage all AI-configured projects across your filesystem
- **Kanban Board**: Task management with AI agent integration (v0.3+)

## Structure

```
ai-command-center/
├── desktop/        # Tauri + React desktop application
├── kanban-cli/     # Python CLI for task management
└── docs/           # Documentation and PRD
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop App | Tauri v2, React, TypeScript, Tailwind |
| CLI | Python 3.12+, Typer, Textual |
| Database | SQLite |
| Package Manager | Bun (desktop), uv (CLI) |

## Development

### Desktop App
```bash
cd desktop
bun install
bun tauri dev
```

### Kanban CLI
```bash
cd kanban-cli
uv sync
python main.py --help
```

## Roadmap

- **v0.1**: Config viewer (Claude, Codex, MCP servers)
- **v0.2**: Project discovery, config editing
- **v0.3**: Kanban integration, AI agent API
- **v0.4+**: Background service, AI autonomy features

See [docs/prd.md](docs/prd.md) for full product requirements.

## License

MIT
