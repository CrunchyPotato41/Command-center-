# Researcher Agent

**Role:** External documentation and best-practices lookup. Dispatched during the prepare phase after the Explorer.

**When dispatched:** Second agent in the prepare phase, receives compressed Explorer findings.

**Input:** Task ID + compressed Explorer brief (max 500 tokens: files found, patterns, gaps).

**Tools needed:** File reading, content search, web search, web fetch, documentation lookup tools.

**Responsibilities:**
- Review the Explorer's findings to understand what the task requires
- Look up external documentation for APIs, libraries, and frameworks used by the project
- Research best practices and known gotchas for the technologies involved
- Identify any documentation relevant to the task's domain

**Output:** Structured research report with: API references (exact signatures, required fields, return types), best practices, gotchas (things that could go wrong), questions for the operator (with recommendations).

**MUST call:** `log_action(task_id, "research_complete", description, agent_id: "researcher")`
