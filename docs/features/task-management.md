# Task Management (Swimlanes & Kanban)

Command Center provides a robust task management suite tailored for hybrid human-AI teams. Instead of traditional list views, tasks are visualized dynamically to show who is working on what.

## Kanban Board

The Kanban Board is the traditional view for tracking the lifecycle of a task.

- **Columns**: Tasks flow through standard states like `Todo`, `In Progress`, `Review`, and `Done`.
- **Interactivity**: Users can drag and drop tasks between columns to update their status.
- **AI Integration**: When an AI agent marks a task as completed via the MCP server, the task card will automatically slide into the `Done` column in real-time.

## Agent Swimlanes

The Swimlane view is a unique feature designed specifically for multi-agent workflows.

- **Agent-Centric Visualization**: Instead of grouping tasks by status, the Swimlane view groups tasks horizontally by the **Agent** assigned to them.
- **Workload Balancing**: Easily spot if one agent is bottlenecked with too many `P1` priority tasks while another is idle.
- **Operator Lane**: Includes a dedicated lane for human operators to track tasks that require manual intervention or review.

## Task Details

Clicking on any task opens a detailed modal that displays:
- **Priority**: `P1` (Critical), `P2` (High), `P3` (Normal).
- **Execution Mode**: Indicates whether the task is strictly for an `agent`, a `human`, or a `pair` (collaboration).
- **Blockers & Dependencies**: Clear warnings if a task cannot proceed due to upstream dependencies.
