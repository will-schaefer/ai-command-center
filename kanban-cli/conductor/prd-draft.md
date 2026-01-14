# Product Requirements Document: Kanban Hub

## Executive Summary

Kanban Hub evolves from a terminal-based Kanban CLI into a native desktop project management application. The Kanban board remains the centerpiece, with hierarchical multi-board support enabling task management across individual projects, project groups, and a global overview. The application uses Tauri for native desktop delivery while maintaining the Python CLI for terminal workflows and agent integration.

## Problem Statement

**Current limitations:**
- Terminal-only interface limits adoption to CLI-comfortable users
- Single-board-per-directory model doesn't scale to multi-project workflows
- No way to see cross-project status or link related tasks
- Limited visual capabilities constrain project management features

**What happens if unsolved:**
- Users managing multiple projects lack unified visibility
- Context switching between project directories is friction-heavy
- Cross-project dependencies remain invisible and untracked

## Target Users

### Primary Persona: Solo Developer
- Manages 3-10 active projects simultaneously
- Prefers keyboard-driven workflows
- Uses terminal daily, comfortable with CLI
- Wants visual overview without leaving native environment
- May use AI assistants (Claude, GPT) for development tasks

### Secondary Persona: AI Agent
- Programmatic access to read/write tasks
- Operates via CLI commands or API
- Needs structured output (JSON) for parsing
- May orchestrate multi-project workflows

## User Stories

### Multi-Board Navigation
- As a developer, I want to see all my project boards in one view so that I can prioritize across projects
- As a developer, I want to group related projects under a parent board so that I can track initiatives spanning multiple repos
- As a developer, I want to quickly switch between project, group, and global views so that I can zoom in/out as needed

### Cross-Board References
- As a developer, I want to link a task in one board to a task in another so that I can track dependencies across projects
- As a developer, I want to see which external tasks reference a given task so that I understand downstream impact

### Dual Interface
- As a developer, I want the desktop app and CLI to share the same data so that I can use whichever is convenient
- As an agent, I want to add tasks via CLI that appear in the desktop app so that my actions are visible to humans

## Functional Requirements

### F1: Hierarchical Board Structure
- **F1.1**: Each project directory can have its own board (existing behavior)
- **F1.2**: Parent directories auto-discover child boards via filesystem hierarchy
  - A directory with subdirectories containing `kanban.db` files becomes a parent board
  - No explicit configuration required
  - Parent board shows aggregated list of child boards
- **F1.3**: Global board is the topmost parent in the hierarchy
- **F1.4**: Navigation between levels via sidebar or breadcrumb
- **F1.5**: Board names derived from directory names

### F2: Cross-Board Task Linking
- **F2.1**: Tasks can reference tasks from other boards
- **F2.2**: References are bidirectional (linked task shows backlinks)
- **F2.3**: Reference syntax: `[[project-name#42]]` where `project-name` is the directory name
- **F2.4**: When linked task is deleted, reference becomes broken link (visible, not auto-removed)
- **F2.5**: Clicking a reference navigates to the target board and highlights the task

### F3: Shared Data Layer
- **F3.1**: SQLite database shared between CLI and Tauri app
- **F3.2**: CLI remains functional for agent access
- **F3.3**: File locking or WAL mode for concurrent access

### F4: Tauri Desktop Application
- **F4.1**: Native desktop app for macOS, Windows, Linux
- **F4.2**: Svelte or React frontend (TBD)
- **F4.3**: Same task operations as CLI: add, move, delete, edit
- **F4.4**: Keyboard shortcuts for power users

## Non-Functional Requirements

### Performance
- App launch: < 2 seconds
- Board switch: < 500ms
- Task operations: < 100ms perceived latency

### Compatibility
- macOS 12+, Windows 10+, Ubuntu 20.04+
- Existing kanban.db files from Python CLI importable

### Data Integrity
- SQLite with WAL mode for concurrent CLI/GUI access
- No data loss on crash or force quit

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task operations per session | >5 operations (add/move/delete/edit) | App telemetry (opt-in) |
| Multi-board usage | >50% of sessions navigate between boards | Navigation events |
| CLI+GUI coexistence | Both interfaces used within 7 days | Usage logs |
| Cross-reference adoption | >10% of tasks contain `[[...]]` references | Database query |
| App stability | Zero data loss incidents | Error logging |

**Baseline**: Compare against current Python CLI usage patterns after 30 days of Tauri adoption.

## Scope

### In Scope (MVP)
- Tauri desktop app with multi-board navigation
- Cross-board task references
- Shared SQLite data layer
- Basic task operations (add, move, delete, edit)
- macOS build (primary development platform)

### Out of Scope (Future)
- AI assistant panes (nice to have, post-MVP)
- Mobile apps (eventual goal)
- Real-time sync across machines
- Time tracking, sprint planning, reporting
- Custom columns per board

## Dependencies

- Tauri v2 for desktop application framework
- Rust for backend logic (if porting from Python)
- SQLite for persistence
- Existing Python codebase for CLI compatibility

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite concurrent access issues | Data corruption | Use WAL mode, test thoroughly |
| Tauri learning curve | Slow development | Start with simple MVP, iterate |
| Python/Rust data model drift | Compatibility bugs | Shared schema definition, integration tests |
| Feature creep | Never ships | Strict MVP scope, post-MVP backlog |

## Resolved Questions

| Question | Decision |
|----------|----------|
| Parent boards: explicit or virtual? | **Virtual via filesystem** - auto-discovered from directory hierarchy |
| Cross-board reference syntax? | **`[[project-name#42]]`** - name-based, user-friendly |
| Python CLI vs Tauri branches? | **Tauri on feature branch** - keeps CLI on main |

## Open Questions

1. Should the global view aggregate task counts or show all tasks inline?
2. How should the app handle very deep directory hierarchies (>5 levels)?
3. Should board names be configurable or always match directory names?
4. Frontend framework: Svelte vs React? (Recommend Svelte for Tauri)

## Database Schema (Extended)

The existing schema (`tasks` table) remains. New additions for multi-board:

```sql
-- Board metadata (optional, for custom names/settings)
CREATE TABLE IF NOT EXISTS board_meta (
    id INTEGER PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,      -- absolute path to kanban.db
    display_name TEXT,              -- optional override for dir name
    parent_path TEXT,               -- path to parent board (nullable)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cross-board references are stored as text in task description
-- Pattern: [[project-name#42]] parsed at render time
-- No separate table needed for MVP
```

## Implementation Priority (MVP)

1. **Phase 1**: Tauri scaffold with single-board view (port existing Python UI)
2. **Phase 2**: Filesystem discovery of child boards, parent board navigation
3. **Phase 3**: Cross-board reference parsing and linking
4. **Phase 4**: Shared SQLite layer, CLI compatibility verification
