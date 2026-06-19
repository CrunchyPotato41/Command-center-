# Command Center 🚀

Command Center is a powerful, AI-Agent-Powered Project Management application. It acts as the central hub for human operators and autonomous AI agents to collaborate, track milestones, and execute tasks.

## 🌟 What it does

Command Center provides a real-time, visual interface to track your project's progress, combined with a backend server that allows AI agents to read and update the project state autonomously. 

Instead of treating AI agents as simple chat bots, Command Center treats them as **collaborators**. They can be assigned tasks, update their progress, and move items across your Kanban board while you oversee the entire operation from a unified dashboard.

## 🏗 How it works

The project is split into two primary components that communicate via a shared state file (`project-tracker.json`):

1. **Electron Desktop App (`command-center`)**: A React/Vite frontend wrapped in Electron. It acts as the visual shell. It watches `project-tracker.json` for changes using `chokidar` and provides a beautiful, responsive UI to manage tasks, milestones, and agents.
2. **MCP Server (`command-center-mcp`)**: A Model Context Protocol (MCP) server that exposes a suite of tools to your AI agents (like Claude Code, Cursor, etc.). When an AI agent uses these tools (e.g., `update_task_status`), the server modifies the `project-tracker.json` file.

Because both components read and write to the same JSON file with a debounced writing mechanism, the Electron app updates in real-time as your AI agents work in the background!

## 🚀 Getting Started

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
You can then connect your AI assistant to the MCP server by pointing it to `dist/index.js`.
