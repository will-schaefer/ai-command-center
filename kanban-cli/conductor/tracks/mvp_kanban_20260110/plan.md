# Plan: MVP Tmux Agentic Kanban Board

This plan outlines the phases and tasks required to implement the Python CLI Kanban board.

## Phase 1: Project Skeleton & Database [checkpoint: 1f9d639]
- [x] Task: Initialize Python project (poetry/pip), install Typer & Rich (1b900f2)
- [x] Task: Implement SQLite connection and 'tasks' table creation (7ef293d)
- [x] Task: Create basic Task model/data access layer (4e318d4)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Project Skeleton & Database' (Protocol in workflow.md) (1f9d639)

## Phase 2: Core CLI Commands (CRUD) [checkpoint: 47586f8]
- [x] Task: Implement `add` command (3c8aaca)
- [x] Task: Implement `list` command (raw text output) (5464d58)
- [x] Task: Implement `move` command (5a63f96)
- [x] Task: Implement `delete` command (8c9f7f1)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Core CLI Commands (CRUD)' (Protocol in workflow.md) (47586f8)

## Phase 3: Visual Board Rendering [checkpoint: 48df834]
- [x] Task: Create `Rich` layout for a single column (2476b34)
- [x] Task: Create `Rich` layout for the full board (3 columns) (7a3f785)
- [x] Task: Implement `view` command to render the board (7229cbd)
- [x] Task: Conductor - User Manual Verification 'Phase 3: Visual Board Rendering' (Protocol in workflow.md) (48df834)

## Phase 4: Agent & Watch Support [checkpoint: 60c3237]
- [x] Task: Implement `json` command for machine-readable output (ea897f1)
- [x] Task: Add `--watch` flag to `view` command (auto-refresh loop) (892cb41)
- [x] Task: Conductor - User Manual Verification 'Phase 4: Agent & Watch Support' (Protocol in workflow.md) (60c3237)
