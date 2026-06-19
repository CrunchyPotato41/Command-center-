# Command Center

Command Center is a project management application designed to act as a central hub for hybrid teams of human operators and autonomous AI agents. It provides an interface to collaborate, track milestones, and execute tasks together.

## Overview

Command Center provides a real-time, visual interface for tracking project progress. It is paired with a backend Model Context Protocol (MCP) server that allows AI agents to read and update the project state autonomously.

Rather than treating AI agents as standard chat interfaces, Command Center treats them as team members. Agents can be assigned tasks, log their progress, and move items across the Kanban board while you oversee the operation from a unified dashboard.

## Architecture

The project is split into two primary components that communicate via a shared state file (`project-tracker.json`):

1. **Electron Desktop App (`command-center`)**: A React/Vite frontend wrapped in Electron. It acts as the visual shell, watching `project-tracker.json` for changes using `chokidar` to provide a responsive UI for managing tasks, milestones, and agents.
2. **MCP Server (`command-center-mcp`)**: An MCP server that exposes a suite of tools to external AI agents. When an AI agent uses these tools (e.g., `update_task_status`), the server modifies the `project-tracker.json` file.

Because both components read and write to the same JSON file with a debounced writing mechanism, the desktop application updates in real-time as your AI agents work in the background.

## Getting Started

### 1. Start the Desktop App
```powershell
cd command-center
npm install
npm run dev
```

### 2. Start the MCP Server
```powershell
cd command-center-mcp
npm install
npm run build
```
Once the server is built, you can connect your AI assistant to the MCP server by pointing it to `dist/index.js`.
