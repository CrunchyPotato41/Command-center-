# Changelog

All notable changes to this project will be documented in this file.

## [2026-06-20]

### Added
- Added `glob` dependency to MCP server for enhanced file tracking.
- Introduced new MCP tools for project and milestone tracking.

### Fixed
- Fixed drag-and-drop React state handling for active tasks (`activeTask` to `activeTaskId`).
- Replaced unreliable `Math.random` ID generation with standard `crypto.randomUUID()`.
- Improved color generation for domains using a deterministic hash instead of random assignment.
- Updated "My Tasks" filter logic to include tasks assigned to the `operator`.

## [1.0.2] - 2026-06-19

### Changed

### Fixed
- Fixed a potential server crash in the MCP tool logic caused by improperly structured array inputs (`tags`, `acceptance_criteria`, etc).
- Resolved a critical UI bug where malformed task labels could crash the React rendering tree.
- Improved the task ID generation logic to prevent duplicate keys and drag-and-drop collisions.

### Added
- Added the `docs/` folder to `.gitignore` to prevent tracking local documentation templates.

## [1.0.1] - 2026-06-19

### Added
- Created `dev.bat` shortcut and added it to `.gitignore`.
- Included `.env` config within the `.exe` package build to ensure `PROJECT_ROOT` resolves correctly on startup.
- Added visual "Copied" feedback state to the Copy ID button in the Task Details modal.

### Fixed
- Disabled automatic Chrome DevTools opening on app launch in production.
- Converted hardcoded light mode backgrounds in the Task Detail Modal to use proper CSS theme variables for dark mode compatibility.
- Fixed potential UI crashes in Agent Hub and App caused by undefined values (`agent_log`, `subtasks`, `unlisten`).

## [1.0.0] - 2026-06-19

### Added
- **Electron Desktop Shell**: A beautiful desktop application built with Electron, Vite, React, and Tailwind CSS.
- **Agent Hub**: A dedicated view to monitor active AI agents, their permissions, and real-time execution logs.
- **Task Management**: Interactive Kanban boards and Agent Swimlanes to visualize workload distribution.
- **Calendar View**: A timeline view for tracking milestones and project deadlines.
- **MCP Server**: A standalone Model Context Protocol server that allows external AI agents to read and write to the project state.
- **Shared State Architecture**: Implementation of a debounced `project-tracker.json` system for seamless real-time syncing between the UI and autonomous agents.
- **Automated Testing**: Integration of Vitest for both the React frontend and the MCP backend tools.
- **Installer Generation**: Configured `electron-builder` to package the application into a standalone Windows `.exe` installer.
