const fs = require('fs');
const path = require('path');

const trackerPath = path.join(__dirname, '../project-tracker.json');

const mockData = {
  "project": {
    "name": "Command Center Dev",
    "start_date": "2026-06-01",
    "target_date": "2026-08-30",
    "current_week": 3,
    "schedule_status": "on_track",
    "overall_progress": 0.35
  },
  "schedule": {
    "phases": [
      { "id": "phase1", "title": "Foundation", "start_week": 1, "end_week": 4 },
      { "id": "phase2", "title": "Execution", "start_week": 5, "end_week": 10 }
    ]
  },
  "milestones": [
    {
      "id": "m1",
      "title": "Setup Architecture",
      "domain": "backend",
      "phase": "phase1",
      "planned_start": "2026-06-01",
      "planned_end": "2026-06-15",
      "actual_start": "2026-06-01",
      "actual_end": "2026-06-14",
      "drift_days": -1,
      "is_key_milestone": true,
      "key_milestone_label": "Arch Complete",
      "week": 2,
      "dependencies": [],
      "notes": [],
      "subtasks": [
        {
          "id": "t1",
          "label": "Init repo",
          "status": "done",
          "done": true,
          "assignee": "agent-1",
          "priority": "P1",
          "execution_mode": "agent",
          "completed_at": "2026-06-10T10:00:00Z"
        },
        {
          "id": "t2",
          "label": "Configure CI/CD",
          "status": "done",
          "done": true,
          "assignee": "operator",
          "priority": "P2",
          "execution_mode": "human",
          "completed_at": "2026-06-12T15:00:00Z"
        }
      ]
    },
    {
      "id": "m2",
      "title": "Build UI Components",
      "domain": "frontend",
      "phase": "phase1",
      "planned_start": "2026-06-16",
      "planned_end": "2026-06-30",
      "actual_start": "2026-06-16",
      "actual_end": null,
      "drift_days": 2,
      "is_key_milestone": false,
      "key_milestone_label": null,
      "week": 3,
      "dependencies": ["m1"],
      "notes": [],
      "subtasks": [
        {
          "id": "t3",
          "label": "Swimlane View",
          "status": "in_progress",
          "done": false,
          "assignee": "agent-2",
          "priority": "P1",
          "execution_mode": "pair"
        },
        {
          "id": "t4",
          "label": "Kanban Board",
          "status": "blocked",
          "done": false,
          "assignee": "agent-1",
          "priority": "P2",
          "execution_mode": "agent",
          "blocked_reason": "Waiting on Dnd-kit dependency update"
        },
        {
          "id": "t5",
          "label": "Agent Logs Pane",
          "status": "todo",
          "done": false,
          "assignee": null,
          "priority": "P3",
          "execution_mode": "agent"
        }
      ]
    }
  ],
  "agents": [
    {
      "id": "agent-1",
      "name": "Backend Bot",
      "type": "sub-agent",
      "color": "#f59e0b",
      "status": "idle",
      "permissions": ["fs-read", "fs-write"],
      "session_action_count": 42
    },
    {
      "id": "agent-2",
      "name": "Frontend Bot",
      "type": "sub-agent",
      "color": "#8286FF",
      "status": "active",
      "permissions": ["fs-read"],
      "session_action_count": 128
    }
  ],
  "agent_log": [
    {
      "id": "log1",
      "agent_id": "agent-1",
      "action": "task_completed",
      "target_type": "subtask",
      "target_id": "t1",
      "description": "Initialized repository with standard templates.",
      "timestamp": new Date(Date.now() - 3600000).toISOString(),
      "tags": ["success", "system"]
    },
    {
      "id": "log2",
      "agent_id": "agent-2",
      "action": "task_started",
      "target_type": "subtask",
      "target_id": "t3",
      "description": "Began work on Swimlane View rendering.",
      "timestamp": new Date(Date.now() - 1800000).toISOString(),
      "tags": ["start", "ui"]
    }
  ]
};

fs.writeFileSync(trackerPath, JSON.stringify(mockData, null, 2));
console.log('Mock data written to project-tracker.json');
