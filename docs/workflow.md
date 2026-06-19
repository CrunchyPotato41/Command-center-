# Task Workflow (Agent Execution Guide)

## Task Lifecycle States

```text
                    ┌──────────┐
                    │   TODO   │
                    └────┬─────┘
                         │ start_task()
                         ▼
                  ┌─────────────┐
            ┌────▶│ IN PROGRESS │◀────┐
            │     └──────┬──────┘     │
            │            │            │
      reject_task()  complete_task() block_task()
            │            │            │
            │            ▼            │
            │       ┌────────┐        │
            └───────│ REVIEW │    ┌───┴────┐
                    └───┬────┘    │BLOCKED │
                        │         └────────┘
                   approve_task()      │
                        │         unblock_task()
                        ▼              │
                    ┌──────┐           │
                    │ DONE │◀──────────┘
                    └──────┘
```

## State Transition Rules

| From | To | Tool | Who |
|------|----|------|-----|
| `todo` | `in_progress` | `start_task` | Agent or operator |
| `in_progress` | `review` | `complete_task` | Agent |
| `review` | `done` | `approve_task` | **Operator only** |
| `review` | `in_progress` | `reject_task` | **Operator only** |
| `in_progress` | `blocked` | `block_task` | Agent or operator |
| `blocked` | `in_progress` or `todo` | `unblock_task` | Agent or operator |
| any | `todo` | `reset_task` | **Operator only** |

## Prepare Phase
Before starting implementation, the orchestrator agent dispatches two sub-agents:
1. **Explorer Agent** — Investigates the codebase
2. **Researcher Agent** — Looks up external documentation

## Build Phase
When the orchestrator begins implementation:
1. Call `start_task(task_id)` — moves to `in_progress`
2. Read full context: call `get_task_context(task_id)`
3. Implement according to acceptance criteria and constraints
4. Run build, typecheck, lint — fix all errors
5. Dispatch **Post-Build Auditor** agent
6. When auditor passes: call `complete_task(task_id, summary)` — moves to `review`

## Review Phase
The operator reviews the submitted task:
- **Accept:** call `approve_task(task_id)` — moves to `done`
- **Reject:** call `reject_task(task_id, feedback)` — moves back to `in_progress`

When rejected, the agent re-reads the context (which now includes revision history) and addresses all prior feedback before resubmitting.

## Approve Phase
When the operator explicitly says "approve task X" / "complete task X" / "done":
1. Call `approve_task(task_id)` — moves to `done`
2. Auto-unblock cascade runs (downstream dependent tasks are unblocked if all their dependencies are now satisfied)
This is the ONLY way a task reaches `done`. Never call `approve_task` without explicit operator instruction.

## General Rules
- Always call `start_task` before implementation. Never write code for a task in `todo`.
- Always call `complete_task` after finishing. Never leave a task stuck in `in_progress`.
- Use `log_action` to record significant events (files created, tests passed, architecture decisions).
- Use `block_task` if you hit a blocker you cannot resolve.
- If a task has revision history (from prior `reject_task` calls), address ALL prior feedback before resubmitting.
