# PRD: AI Command Center

> **Status**: Final (v1.0)
> **Date**: 2026-01-14
> **Author**: Will Schaefer + Claude (Adversarial Spec Process)

## Executive Summary

AI Command Center is a native desktop application that unifies the management of AI development tools, project contexts, and task workflows. Built with Tauri and React, it provides a dashboard-centric interface for solo developers who work with multiple AI assistants (Claude, GPT/Codex, Gemini) and want a single pane of glass for their AI-powered development environment.

The application consolidates two existing projects: `agent-interface` (multi-AI frontend) and `project-mgmt-app` (Kanban CLI), merging them into a cohesive product that can evolve from a config viewer to a full AI-orchestrated project management system.

## Problem Statement

### Current State (Baseline)

| Activity | Current Approach | Time/Frequency |
|----------|-----------------|----------------|
| Check Claude config | `cat ~/.claude/settings.json` | 2-3x/day, ~30s each |
| Check MCP servers | `cat ~/.mcp.json`, check plugin status | 1x/day, ~1min |
| Re-explain project context to AI | Copy/paste CLAUDE.md, describe structure | ~80% of new sessions, 2-5min each |
| Check Codex auth | `codex login status` | 1x/day |
| View all projects with AI config | Manual navigation, `find` commands | 1x/week, ~5min |

**Estimated weekly overhead**: 30-60 minutes on configuration management alone.

### Current Pain Points

1. **Fragmented AI Tools**: Developers switch between Claude Code, ChatGPT, Gemini CLI, and other AI tools 10-20x daily. Each has its own configuration, history, and interface.

2. **AI Lacks Project Context**: AI assistants can't see your overall project state, tasks, or progress across sessions. Context is re-explained in ~80% of new sessions.

3. **Manual Configuration Management**: Checking AI configs requires 5+ manual steps (navigate, cat, parse JSON mentally). There's no unified view.

4. **No AI-Aware Project Management**: Traditional Kanban tools don't integrate with AI workflows. AI agents can't read or update task status.

### What Happens If Unsolved

- 30-60 minutes/week lost to configuration management
- Repeated context explanation reduces AI effectiveness
- Config drift leads to "works on my machine" issues with AI tools
- Missed opportunity to leverage AI for project management automation

## Target Users

### Primary Persona: Will (Solo Developer)

- **Role**: Full-stack developer managing 5-10 active projects
- **Environment**: Linux (WSL2), terminal-heavy workflow
- **AI Usage**: Daily user of Claude Code, Codex CLI, occasionally Gemini
- **Pain**: Fragmented tools, manual config checking, no unified AI workspace
- **Goal**: One app to rule all AI development tools
- **Success indicator**: Opens app instead of terminal for config checks

### Secondary Persona: Power User

- **Role**: Developer managing 15+ projects across multiple workspaces
- **Environment**: Multiple machines, complex directory structures
- **AI Usage**: Heavy user of multiple AI tools with custom configurations
- **Pain**: Can't find which project has which AI config, batch operations impossible
- **Goal**: Cross-project visibility and management
- **Success indicator**: Finds any project's AI config in < 10 seconds

### Tertiary Persona: Claude Code Agent

- **Role**: Programmatic actor (Claude operating via CLI)
- **Needs**: Read project state, task status, config values via structured JSON API
- **Capabilities**: HTTP requests, JSON parsing, file reading
- **Goal**: Understand project context to provide better assistance
- **Success indicator**: Can answer "what's the project status?" without user re-explaining

## User Stories

### Configuration Management (v0.1)

| Story | Acceptance Criteria |
|-------|---------------------|
| As a developer, I want to see all my AI tool configurations in one dashboard | Done when: Claude settings, Codex auth, and MCP servers visible in single view, loads < 500ms |
| As a developer, I want to see which MCP servers are configured and their status | Done when: List shows server name, type (stdio/sse), and enabled/disabled state |
| As a developer, I want to see enabled plugins with version info | Done when: Plugin list shows name, version, enabled state for all plugins |

### Configuration Management (v0.2+)

- As a developer, I want to edit Claude Code settings from a GUI so that I don't make JSON syntax errors
  - Done when: Can toggle settings, changes persist to settings.json, validation prevents invalid JSON

### Project Discovery (v0.2)

- As a developer, I want the app to discover all my projects with AI configs so that I have a unified view of my workspace
  - Done when: Scan button finds all directories with CLAUDE.md, .claude/, .cursorrules, or .mcp.json
- As a developer, I want to see which projects have CLAUDE.md, .cursorrules, or other AI context files so that I know where AI is configured
  - Done when: Project list shows icons indicating which config files exist
- As a developer, I want to navigate to any project and see its AI configuration at a glance
  - Done when: Click project → detail view loads in < 200ms

### AI Agent Integration (v0.3)

- As an AI agent, I want to query the app for current project context so that I can provide relevant assistance
  - Done when: GET /api/projects/:id returns JSON with CLAUDE.md content, tasks, config
- As an AI agent, I want to read task status from the Kanban board so that I understand project progress
  - Done when: GET /api/projects/:id/tasks returns todo/doing/done counts and task list

### Task Management (v0.3+)

- As a developer, I want a Kanban board that AI agents can see so that they understand my work priorities
- As a developer, I want cross-project task visibility so that I can prioritize across all my work
- As a developer, I want AI to suggest task priorities based on context so that planning is assisted

## Functional Requirements

### F1: Unified Configuration Viewer (MVP - v0.1)

- **F1.1**: Display Claude Code settings (`~/.claude/settings.json`) in a readable format
  - Show model preference, permissions, enabled plugins as collapsible sections
- **F1.2**: Display Codex CLI configuration and auth status
  - Show logged-in account, configured model, last used timestamp
- **F1.3**: Display configured MCP servers with connection status
  - Parse `~/.mcp.json` and show server name, type, command/url
- **F1.4**: Display enabled plugins with version info
  - List from `~/.claude/plugins/cache/`, show name, version, enabled state
- **F1.5**: Support read-only view initially; editing in v0.2+

### F2: Project Discovery (v0.2)

- **F2.1**: Scan configurable root directories for projects (default: `~/dev/projects`)
- **F2.2**: Detect AI configuration files: `CLAUDE.md`, `.cursorrules`, `.claude/`, `.mcp.json`
- **F2.3**: Display project list with AI config summary (icons for each config type)
- **F2.4**: Navigate to project detail view showing full config
- **F2.5**: Cache discovery results in SQLite, manual re-scan button

### F3: Kanban Integration (v0.3)

- **F3.1**: Embed existing Kanban CLI functionality into GUI (reuse Python SQLite schema)
- **F3.2**: Per-project task boards (existing behavior)
- **F3.3**: Cross-project task aggregation view
- **F3.4**: JSON API for AI agent read access (`/api/projects/:id/tasks`)
- **F3.5**: (Future) AI agent write access with approval workflow

### F4: AI Agent API (v0.3)

- **F4.1**: HTTP server on localhost:7777 (configurable port)
- **F4.2**: Endpoints:
  - `GET /api/config` - Returns Claude/Codex/MCP config
  - `GET /api/projects` - Returns discovered projects list
  - `GET /api/projects/:id` - Returns project detail with CLAUDE.md content
  - `GET /api/projects/:id/tasks` - Returns Kanban tasks
- **F4.3**: JSON responses compatible with AI tool calling
- **F4.4**: Authentication via bearer token stored in `~/.ai-command-center/token`

### F5: Dashboard

- **F5.1**: Overview panels: Config status (green/yellow/red), Project count, Active tasks count
- **F5.2**: Quick actions: Open project in terminal, View config, Refresh MCP status
- **F5.3**: Recent activity feed (optional, v0.3+)

## Non-Functional Requirements

### Performance

| Metric | Target | Failure Threshold |
|--------|--------|-------------------|
| App launch | < 3 seconds | > 5 seconds |
| Config load | < 500ms | > 2 seconds |
| Project discovery (cold) | < 10 seconds for 50 projects | > 30 seconds |
| Project discovery (cached) | < 100ms | > 500ms |
| Dashboard render | < 200ms | > 1 second |

### Compatibility

- Linux (primary): Ubuntu 20.04+, Fedora 36+, Arch
- macOS (future): 12+
- Windows (future): 10+

### Reliability

- Graceful handling of missing config files (show "Not configured" instead of error)
- Fallback UI when external tools (Claude CLI, Codex) unavailable
- SQLite with WAL mode for task persistence
- Config file version detection for graceful degradation

### Extensibility

- AI tool adapters follow interface pattern for easy addition
- Themeable UI via CSS variables
- Configurable dashboard layout (future)

## Success Metrics

| Metric | Target | Measurement | Failure Indicator |
|--------|--------|-------------|-------------------|
| Daily active use | Open app every workday | Local usage log | < 3 opens/week |
| Config viewer adoption | 0 shell commands to view config | App usage vs terminal history | Still using `cat` |
| AI agent integration | 1+ AI queries app state | API access log | 0 API calls in 7 days |
| Extensibility | New AI tool adapter in < 4 hours | Development time | > 1 day |
| Project discovery accuracy | 95%+ of AI-configured projects found | Manual verification | < 80% |
| App performance | Stays within performance targets | Timing logs | Exceeds failure thresholds |

## Scope

### In Scope (v0.1 MVP)

- Tauri desktop app for Linux
- Dashboard shell with sidebar navigation
- Claude Code config viewer (settings.json, plugins, MCP servers)
- Codex CLI status display
- Read-only config view
- **Total scope: ~5 screens, ~10 components**

### In Scope (v0.2)

- Project filesystem discovery (manual scan)
- Per-project AI config display
- Config editing capability with validation
- Gemini integration

### In Scope (v0.3)

- Kanban board integration
- Cross-project task view
- AI agent read API (localhost HTTP)

### Out of Scope (Future)

- Mobile apps
- Team collaboration features
- Real-time sync across machines
- AI agent write access to tasks
- Custom AI model hosting
- Prompt library management (defer to later version)
- Background service (v0.4+)

## Technical Architecture

### Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Desktop Framework | Tauri v2 | Native performance, small binary, Rust security |
| Frontend | React 18, TypeScript, Tailwind CSS | Existing codebase, ecosystem |
| Backend (Tauri) | Rust | File system access, config parsing |
| Backend (API) | Bun + Hono | AI agent API server, lightweight |
| Database | SQLite | Tasks, project cache, consistent with Kanban CLI |
| State Management | Zustand | Already in use, simple |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri App                                │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Zustand state)                                 │
│    ↓ IPC commands                                               │
│  Tauri Rust Backend                                             │
│    → Read ~/.claude/settings.json                               │
│    → Read ~/.mcp.json                                           │
│    → Scan ~/.claude/plugins/cache/                              │
│    → Execute: codex login status                                │
│    → Query SQLite (tasks, cache)                                │
├─────────────────────────────────────────────────────────────────┤
│  Bun API Server (localhost:7777) - v0.3+                        │
│    → Serves /api/* endpoints for AI agents                      │
│    → Reads from same SQLite                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Points

| System | Integration Method | Config Location |
|--------|-------------------|-----------------|
| Claude Code | JSON file read | `~/.claude/settings.json`, `~/.claude/plugins/` |
| Codex CLI | Shell exec `codex login status` | `~/.codex/` |
| Gemini CLI | Shell exec `gemini --version` | `~/.gemini/` |
| MCP Servers | JSON file read | `~/.mcp.json` |
| Filesystem | Tauri fs API | Configurable root dirs |

### Existing Code Assets

- `agent-interface/`: React frontend with routing, pages for Claude/Codex/Gemini
- `project-mgmt-app/`: Python Kanban CLI with SQLite persistence
- Tauri scaffold exists in `agent-interface/src-tauri/`

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Motivation fatigue | Project abandoned | Medium | Ship tiny v0.1 fast, use daily, track streaks |
| Scope creep | Never ships | High | Strict version boundaries, no unplanned features |
| CLI tool changes | Integration breaks | Medium | Abstract integrations, version detection |
| Config schema changes | Parsing breaks | High | Version detection, graceful fallback to raw JSON |
| Tauri learning curve | Slow progress | Low | Use existing scaffold, simple features first |

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Background service vs only when open? | **Only when open** (v0.1-v0.3); background service in v0.4+ | Simpler to build, less resource usage, can add later |
| Strict vs permissive config validation? | **Permissive read, strict write** | Read any JSON without crashing; validate before saving |
| Auto vs manual project discovery? | **Manual scan button** | User control, predictable, less surprising |
| Full state dump vs specific API queries? | **Specific queries** | More efficient, clearer API contract, easier to cache |

## Version Roadmap

### v0.1: Config Viewer (MVP)

- Dashboard shell with sidebar
- Claude Code settings viewer (read-only)
- MCP server list
- Plugin list
- Codex auth status

### v0.2: Project Discovery

- Filesystem scanner with configurable roots
- Project list with AI config indicators
- Project detail view
- Config editing with validation
- Gemini integration

### v0.3: Kanban Integration

- Embed Kanban board (port from Python)
- Cross-project task view
- AI agent read API (localhost:7777)
- Task filtering and search

### v0.4+: AI Autonomy

- Background service for always-on API
- AI agent task creation (with approval)
- Smart task suggestions
- Prompt library management
- Custom dashboard layouts

---

## Appendix: Adversarial Debate Log

### Process

- **Document type**: PRD (Product Requirements Document)
- **Interview**: Comprehensive requirements gathering (8 question rounds)
- **Debate rounds**: 1 (Claude critique)
- **Models**: Claude Opus 4.5 (GPT/Gemini unavailable due to API key/CLI issues)

### Round 1: Claude's Critique

**Issues identified and resolved:**

1. Problem definition lacked evidence → Added "Current State" baseline table
2. Only one human persona → Added "Power User" persona
3. User stories missing acceptance criteria → Added criteria for v0.1 stories
4. Success metrics not measurable → Added failure indicators
5. Open questions unanswered → Created "Design Decisions" section
6. Architecture missing data flow → Added diagram
7. Missing config schema change risk → Added to risks table

### Convergence

Document accepted after Round 1 with all 7 issues addressed.
