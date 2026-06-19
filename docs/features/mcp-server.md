# MCP Server (Model Context Protocol)

The MCP Server is the bridge between the Command Center application and external AI agents (like Claude Code, Cursor, Windsurf, etc.). 

## What is MCP?
The Model Context Protocol (MCP) is an open standard that allows AI models to securely connect to local or remote tools and data sources. By implementing an MCP server, Command Center turns a static UI into an interactive environment that AI agents can directly manipulate.

## Exposed Tools

The `command-center-mcp` package exposes several tools to connected clients:

1. **`get_project_status`**
   - **Description**: Retrieves the overall project timeline, schedule status, and milestone progress.
   - **Usage**: Agents use this to orient themselves and understand the current sprint's goals.

2. **`list_tasks`**
   - **Description**: Returns a filtered list of subtasks. Can filter by status, assignee, or priority.
   - **Usage**: Agents use this to find their next assigned task in the backlog.

3. **`update_task_status`**
   - **Description**: Moves a task across the Kanban board (e.g., from `todo` to `in_progress`).
   - **Usage**: When an agent begins writing code or finishes a feature, it calls this tool to update the board.

4. **`add_agent_log`**
   - **Description**: Writes a timestamped entry to the unified activity log.
   - **Usage**: Agents log their reasoning, errors, or successes, which instantly appear in the Electron UI's Agent Hub.

## Server Execution
The server can run via `stdio` (standard input/output), which allows it to be easily spawned by IDEs or CLI tools as a subprocess without requiring complex network configurations.
