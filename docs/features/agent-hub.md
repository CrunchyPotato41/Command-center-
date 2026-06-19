# Agent Hub

The Agent Hub is the central monitoring station for all autonomous entities operating within the Command Center ecosystem.

## Overview
As AI agents connect to the Command Center via the MCP server, they register themselves in the shared project state. The Agent Hub visualizes these agents, providing a real-time overview of their status, permissions, and recent activities.

## Key Capabilities

1. **Live Agent Status Monitoring**
   - See which agents are currently `active`, `idle`, or `offline`.
   - Monitor the total number of actions an agent has performed during its session.
   - Agents are color-coded for easy visual identification across the app.

2. **Permission Auditing**
   - View exactly what capabilities each agent has (e.g., `fs-read`, `fs-write`, `execute`).
   - Ensures transparency and security when working with autonomous systems.

3. **Real-time Activity Logs**
   - The Agent Hub contains a unified log viewer that displays a streaming feed of agent activities.
   - Logs include timestamps, the agent responsible, the action performed (e.g., `task_completed`), and the target of that action.
   - Tags like `success`, `error`, or `system` help filter and categorize the logs quickly.

## Under the Hood
The Agent Hub reads from the `agents` and `agent_log` arrays in `project-tracker.json`. When an external MCP tool writes a new log entry to the JSON file, the Electron shell's file watcher (`chokidar`) detects the change and triggers a React state update, causing the UI to reflect the new log instantly.
