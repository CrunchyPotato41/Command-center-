# Architecture: The Shared State Pattern

Command Center is built on a decoupled architecture utilizing a central **Shared JSON State**. This pattern ensures that the frontend UI, backend servers, and external AI agents remain perfectly synchronized without requiring complex websocket servers, databases, or REST APIs.

## The State File: `project-tracker.json`

At the root of the project sits `project-tracker.json`. This file acts as the single source of truth for the entire application. It stores:
- Global project metadata (deadlines, week numbers)
- Milestone definitions
- Subtasks (Kanban cards)
- Agent profiles
- Activity logs

## Read/Write Flow

1. **The Writer (AI Agents via MCP)**
   - When an AI agent needs to update a task, it invokes a tool on the `command-center-mcp` server.
   - The MCP server reads the current JSON, modifies the relevant objects in memory, and writes the updated JSON back to the disk.
   - To prevent file corruption from rapid successive updates, the `Tracker` class uses a **500ms Debounce** mechanism. If multiple updates occur within 500ms, they are batched into a single disk write.

2. **The Reader (Electron Frontend)**
   - The Electron main process uses `chokidar` to maintain a continuous, low-latency watch on `project-tracker.json`.
   - The instant a file system `change` event is detected, Electron reads the new file contents and broadcasts it to the renderer process via IPC (Inter-Process Communication).
   - The React frontend receives the payload, updates the Zustand global store, and triggers a UI re-render.

## Why this Architecture?

- **Simplicity**: No database to configure, host, or migrate. 
- **Portability**: The entire project state can be zipped, version controlled via Git, or shared as a single text file.
- **AI-Friendly**: Large Language Models (LLMs) are natively excellent at generating and parsing JSON. Exposing the state this way aligns perfectly with their capabilities.
