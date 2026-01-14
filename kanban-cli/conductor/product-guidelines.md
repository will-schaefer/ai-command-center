# Product Guidelines: Tmux Agentic Kanban Board

## Visual Identity & UX
- **Minimalist ASCII Aesthetics:** The board will prioritize clean lines using standard ASCII characters (+, -, |). This ensures maximum compatibility across different terminal emulators and minimizes visual flicker during refreshes.
- **Data-First Layout:** The interface should maximize the space for task content while maintaining clear column boundaries for "Todo", "Doing", and "Done".
- **Tmux Integration:** The layout will be optimized for standard tmux pane splits, ensuring that the board remains readable even in smaller panes.

## Communication & Interaction
- **System-Led Interaction:** Communication between the system, human users, and AI agents will rely on standardized status messages, labels, and task IDs. 
- **Predictable CLI Behavior:** The CLI will provide technical and concise feedback. Error messages should be direct and actionable (e.g., "Error: Invalid task transition from 'Done' to 'Todo'").
- **Agent-Friendly Outputs:** All state-reading commands must support a `--json` flag to provide structured data that AI agents can parse reliably.

## Design Principles
- **Robustness over Flashiness:** Prioritize database integrity and concurrent access safety over complex animations or UI elements.
- **Context-Awareness:** The tool should infer the "current project" from the working directory or environment variables, making it feel integrated into the developer's local environment.
- **Low Overhead:** The board and its refresh mechanism should consume minimal CPU/Memory resources to avoid slowing down the main development work.
