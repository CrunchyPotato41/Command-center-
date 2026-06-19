# Changelog

All notable changes to this project will be documented in this file.

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
