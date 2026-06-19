import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { 
  TrackerState, 
  readTracker, 
  writeTracker, 
  findTask, 
  touchAgent, 
  autoUnblockDependents,
  AgentLogEntry,
  Milestone,
  Subtask
} from './tracker.js';
import { 
  buildTaskContext, 
  buildTaskSummary, 
  buildProjectStatus, 
  buildMilestoneOverview 
} from './context.js';

export const toolDefinitions: Tool[] = [
  // READ TOOLS
  {
    name: 'get_task_context',
    description: 'Get full context for a specific task',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'get_task_summary',
    description: 'Get slim summary for a specific task',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'get_project_status',
    description: 'Get current project status overview',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_milestone_overview',
    description: 'Get overview of a specific milestone',
    inputSchema: { type: 'object', properties: { milestone_id: { type: 'string' } }, required: ['milestone_id'] }
  },
  {
    name: 'list_tasks',
    description: 'List tasks across milestones with optional filters',
    inputSchema: { 
      type: 'object', 
      properties: { 
        milestone_id: { type: 'string' },
        status: { type: 'string' },
        domain: { type: 'string' }
      }
    }
  },
  {
    name: 'get_task_history',
    description: 'Get log history for a specific task',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'list_agents',
    description: 'List all registered agents and their status',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_activity_feed',
    description: 'Get recent activity feed',
    inputSchema: { 
      type: 'object', 
      properties: { 
        agent_id: { type: 'string' },
        limit: { type: 'number' }
      } 
    }
  },

  // WRITE TOOLS - Lifecycle
  {
    name: 'start_task',
    description: 'Start a task, setting status to in_progress',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' }, agent_id: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'complete_task',
    description: 'Submit a task for operator review',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' }, summary: { type: 'string' }, agent_id: { type: 'string' } }, required: ['task_id', 'summary'] }
  },
  {
    name: 'approve_task',
    description: 'OPERATOR ONLY: Approve a task, setting it to done',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' }, feedback: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'reject_task',
    description: 'OPERATOR ONLY: Reject a task with feedback, returning to in_progress',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' }, feedback: { type: 'string' } }, required: ['task_id', 'feedback'] }
  },
  {
    name: 'reset_task',
    description: 'OPERATOR ONLY: Reset a task to todo state',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'block_task',
    description: 'Mark a task as blocked',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' }, reason: { type: 'string' } }, required: ['task_id', 'reason'] }
  },
  {
    name: 'unblock_task',
    description: 'Remove blocked status from a task',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string' }, resolution: { type: 'string' } }, required: ['task_id'] }
  },
  {
    name: 'update_task',
    description: 'Update task properties',
    inputSchema: { 
      type: 'object', 
      properties: { 
        task_id: { type: 'string' },
        priority: { type: 'string' },
        assignee: { type: 'string' },
        execution_mode: { type: 'string' },
        notes: { type: 'string' }
      }, 
      required: ['task_id'] 
    }
  },
  {
    name: 'log_action',
    description: 'Log an action to the agent_log',
    inputSchema: { 
      type: 'object', 
      properties: { 
        task_id: { type: 'string' },
        action: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        agent_id: { type: 'string' }
      }, 
      required: ['task_id', 'action', 'description'] 
    }
  },

  // WRITE TOOLS - Enrichment
  {
    name: 'enrich_task',
    description: 'Enrich a task with context and criteria',
    inputSchema: { 
      type: 'object', 
      properties: { 
        task_id: { type: 'string' },
        prompt: { type: 'string' },
        builder_prompt: { type: 'string' },
        acceptance_criteria: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        context_files: { type: 'array', items: { type: 'string' } },
        reference_docs: { type: 'array', items: { type: 'string' } }
      }, 
      required: ['task_id'] 
    }
  },

  // WRITE TOOLS - Milestone
  {
    name: 'add_milestone_note',
    description: 'Add an exit criterion or note to a milestone',
    inputSchema: { type: 'object', properties: { milestone_id: { type: 'string' }, note: { type: 'string' } }, required: ['milestone_id', 'note'] }
  },
  {
    name: 'set_milestone_dates',
    description: 'Update actual start/end dates for a milestone',
    inputSchema: { type: 'object', properties: { milestone_id: { type: 'string' }, actual_start: { type: 'string' }, actual_end: { type: 'string' } }, required: ['milestone_id'] }
  },
  {
    name: 'update_drift',
    description: 'Update the drift days of a milestone',
    inputSchema: { type: 'object', properties: { milestone_id: { type: 'string' }, drift_days: { type: 'number' } }, required: ['milestone_id', 'drift_days'] }
  },
  {
    name: 'create_milestone',
    description: 'Create a new milestone',
    inputSchema: { 
      type: 'object', 
      properties: { 
        id: { type: 'string' }, 
        title: { type: 'string' },
        domain: { type: 'string' },
        phase: { type: 'string' },
        planned_start: { type: 'string' },
        planned_end: { type: 'string' }
      }, 
      required: ['id', 'title'] 
    }
  },
  {
    name: 'add_milestone_task',
    description: 'Add a subtask to a milestone',
    inputSchema: { 
      type: 'object', 
      properties: { 
        milestone_id: { type: 'string' }, 
        label: { type: 'string' },
        priority: { type: 'string' },
        acceptance_criteria: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        depends_on: { type: 'array', items: { type: 'string' } },
        execution_mode: { type: 'string' }
      }, 
      required: ['milestone_id', 'label'] 
    }
  },

  // WRITE TOOLS - Agent
  {
    name: 'register_agent',
    description: 'Register or update an agent',
    inputSchema: { 
      type: 'object', 
      properties: { 
        agent_id: { type: 'string' }, 
        name: { type: 'string' },
        type: { type: 'string' },
        permissions: { type: 'array', items: { type: 'string' } },
        color: { type: 'string' },
        parent_id: { type: 'string' }
      }, 
      required: ['agent_id', 'name', 'type', 'permissions'] 
    }
  }
];

export function handleTool(name: string, args: Record<string, any>): { content: { type: 'text', text: string }[], isError?: boolean } {
  let state: TrackerState;
  try {
    state = readTracker();
  } catch (err: any) {
    return { content: [{ type: 'text', text: `Error reading tracker: ${err.message}` }], isError: true };
  }

  const result = processTool(name, args, state);

  return result;
}

function processTool(name: string, args: Record<string, any>, state: TrackerState): { content: { type: 'text', text: string }[], isError?: boolean } {
  const genId = () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  switch (name) {
    case 'get_task_context': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      return { content: [{ type: 'text', text: buildTaskContext(state, found.subtask, found.milestone) }] };
    }
    
    case 'get_task_summary': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      return { content: [{ type: 'text', text: buildTaskSummary(state, found.subtask, found.milestone) }] };
    }

    case 'get_project_status': {
      return { content: [{ type: 'text', text: buildProjectStatus(state) }] };
    }

    case 'get_milestone_overview': {
      const milestone = state.milestones.find(m => m.id === args.milestone_id);
      if (!milestone) return { content: [{ type: 'text', text: `Milestone '${args.milestone_id}' not found` }], isError: true };
      return { content: [{ type: 'text', text: buildMilestoneOverview(milestone, state) }] };
    }

    case 'list_tasks': {
      let filtered = [];
      for (const m of state.milestones) {
        if (args.milestone_id && m.id !== args.milestone_id) continue;
        if (args.domain && m.domain !== args.domain) continue;
        for (const t of m.subtasks) {
          if (args.status && t.status !== args.status) continue;
          filtered.push({ task: t, milestone: m });
        }
      }
      
      let text = `# Task List\n\n`;
      filtered.forEach(f => {
        text += `- [${f.task.status}] ${f.task.label} (ID: ${f.task.id}, Milestone: ${f.milestone.title})\n`;
      });
      return { content: [{ type: 'text', text: text || 'No tasks found.' }] };
    }

    case 'get_task_history': {
      const logs = state.agent_log.filter(l => l.target_id === args.task_id);
      if (logs.length === 0) return { content: [{ type: 'text', text: "No history found." }] };
      let text = `# Task History: ${args.task_id}\n\n`;
      logs.forEach(l => {
        text += `- [${l.timestamp}] **${l.agent_id}** performed **${l.action}**: ${l.description} (Tags: ${l.tags.join(', ')})\n`;
      });
      return { content: [{ type: 'text', text }] };
    }

    case 'list_agents': {
      let text = `# Registered Agents\n\n`;
      state.agents.forEach(a => {
        text += `- **${a.name}** (${a.id}) - Type: ${a.type}, Status: ${a.status}, Actions: ${a.session_action_count}\n`;
      });
      return { content: [{ type: 'text', text: text || 'No agents registered.' }] };
    }

    case 'get_activity_feed': {
      let sorted = [...state.agent_log].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (args.agent_id) sorted = sorted.filter(l => l.agent_id === args.agent_id);
      if (args.limit) sorted = sorted.slice(0, args.limit);
      else sorted = sorted.slice(0, 30);
      
      let text = `# Activity Feed\n\n`;
      sorted.forEach(l => {
        text += `- [${l.timestamp}] **${l.agent_id}**: ${l.description} (${l.action})\n`;
      });
      return { content: [{ type: 'text', text: text || 'No activity.' }] };
    }

    case 'start_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      
      found.subtask.status = 'in_progress';
      const agentId = args.agent_id || 'orchestrator';
      if (!found.subtask.assignee) found.subtask.assignee = agentId;
      found.subtask.last_run_id = 'run_' + Date.now();
      
      if (!found.milestone.actual_start) {
        found.milestone.actual_start = now.split('T')[0];
        if (found.milestone.planned_start) {
          const actual = new Date(found.milestone.actual_start + "T00:00:00");
          const planned = new Date(found.milestone.planned_start + "T00:00:00");
          found.milestone.drift_days = Math.round((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      state.agent_log.push({ id: genId(), agent_id: agentId, action: 'task_started', target_type: 'subtask', target_id: args.task_id, description: `Task started`, timestamp: now, tags: ['start', 'mcp'] });
      touchAgent(state, agentId);
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} started in milestone ${found.milestone.title}` }] };
    }

    case 'complete_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      
      found.subtask.status = 'review';
      found.subtask.blocked_by = null;
      found.subtask.blocked_reason = null;
      const agentId = args.agent_id || 'orchestrator';
      
      state.agent_log.push({ id: genId(), agent_id: agentId, action: 'task_submitted_for_review', target_type: 'subtask', target_id: args.task_id, description: args.summary, timestamp: now, tags: ['review', 'mcp'] });
      touchAgent(state, agentId);
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} submitted for review. Summary: ${args.summary}` }] };
    }

    case 'approve_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      if (found.subtask.status !== 'review') return { content: [{ type: 'text', text: `Task '${args.task_id}' is in status '${found.subtask.status}', expected 'review'` }], isError: true };
      
      found.subtask.status = 'done';
      found.subtask.done = true;
      found.subtask.completed_at = now;
      found.subtask.completed_by = 'operator';
      
      const unblocked = autoUnblockDependents(state, args.task_id, found.milestone.id);
      
      state.agent_log.push({ id: genId(), agent_id: 'operator', action: 'task_approved', target_type: 'subtask', target_id: args.task_id, description: `Task approved. ${args.feedback || ''}`, timestamp: now, tags: ['approve', 'mcp'] });
      touchAgent(state, 'operator');
      writeTracker(state);
      
      return { content: [{ type: 'text', text: `Task ${args.task_id} approved.\nUnblocked: ${unblocked.join(', ')}` }] };
    }

    case 'reject_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      if (found.subtask.status !== 'review') return { content: [{ type: 'text', text: `Task '${args.task_id}' is in status '${found.subtask.status}', expected 'review'` }], isError: true };
      
      found.subtask.status = 'in_progress';
      const priorRevisions = state.agent_log.filter(l => l.target_id === args.task_id && l.action === 'revision_requested').length;
      
      state.agent_log.push({ id: genId(), agent_id: 'operator', action: 'revision_requested', target_type: 'subtask', target_id: args.task_id, description: `Revision ${priorRevisions + 1} requested: ${args.feedback}`, timestamp: now, tags: ['reject', 'mcp'] });
      touchAgent(state, 'operator');
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} rejected. Revision ${priorRevisions + 1}. Feedback: ${args.feedback}` }] };
    }

    case 'reset_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      const prev = found.subtask.status;
      found.subtask.status = 'todo';
      found.subtask.done = false;
      found.subtask.assignee = null;
      found.subtask.blocked_by = null;
      found.subtask.blocked_reason = null;
      found.subtask.completed_at = null;
      found.subtask.completed_by = null;
      found.subtask.last_run_id = null;
      
      state.agent_log.push({ id: genId(), agent_id: 'operator', action: 'task_reset', target_type: 'subtask', target_id: args.task_id, description: `Task reset from ${prev}`, timestamp: now, tags: ['reset', 'mcp'] });
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} reset to todo (was ${prev}).` }] };
    }

    case 'block_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      found.subtask.status = 'blocked';
      found.subtask.blocked_reason = args.reason;
      found.subtask.blocked_by = 'orchestrator';
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'task_blocked', target_type: 'subtask', target_id: args.task_id, description: `Blocked: ${args.reason}`, timestamp: now, tags: ['block', 'mcp'] });
      touchAgent(state, 'orchestrator');
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} marked as blocked.` }] };
    }

    case 'unblock_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      if (found.subtask.status !== 'blocked') return { content: [{ type: 'text', text: `Task '${args.task_id}' is not blocked` }], isError: true };
      const oldReason = found.subtask.blocked_reason;
      found.subtask.status = found.subtask.last_run_id ? 'in_progress' : 'todo';
      found.subtask.blocked_by = null;
      found.subtask.blocked_reason = null;
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'task_unblocked', target_type: 'subtask', target_id: args.task_id, description: `Unblocked: ${args.resolution || ''}`, timestamp: now, tags: ['unblock', 'mcp'] });
      touchAgent(state, 'orchestrator');
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} unblocked (was blocked by: ${oldReason}). Status is now ${found.subtask.status}` }] };
    }

    case 'update_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      
      const changes: string[] = [];
      if (args.priority !== undefined) { found.subtask.priority = args.priority; changes.push('priority'); }
      if (args.assignee !== undefined) { found.subtask.assignee = args.assignee === '' ? null : args.assignee; changes.push('assignee'); }
      if (args.execution_mode !== undefined) { found.subtask.execution_mode = args.execution_mode; changes.push('execution_mode'); }
      if (args.notes !== undefined) { found.subtask.notes = args.notes; changes.push('notes'); }
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'task_updated', target_type: 'subtask', target_id: args.task_id, description: `Updated ${changes.join(', ')}`, timestamp: now, tags: ['update', 'mcp'] });
      touchAgent(state, 'orchestrator');
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} updated: ${changes.join(', ')}` }] };
    }

    case 'log_action': {
      const agentId = args.agent_id || 'orchestrator';
      const tags = Array.isArray(args.tags) ? args.tags : [];
      if (!tags.includes('mcp')) tags.push('mcp');
      state.agent_log.push({ id: genId(), agent_id: agentId, action: args.action, target_type: 'entity', target_id: args.task_id, description: args.description, timestamp: now, tags });
      touchAgent(state, agentId);
      writeTracker(state);
      return { content: [{ type: 'text', text: `Action logged successfully.` }] };
    }

    case 'enrich_task': {
      const found = findTask(state, args.task_id);
      if (!found) return { content: [{ type: 'text', text: `Task '${args.task_id}' not found` }], isError: true };
      
      const changes: string[] = [];
      if (args.prompt !== undefined) { found.subtask.prompt = args.prompt; changes.push('prompt'); }
      if (args.builder_prompt !== undefined) { found.subtask.builder_prompt = args.builder_prompt; changes.push('builder_prompt'); }
      if (args.acceptance_criteria !== undefined) { found.subtask.acceptance_criteria = Array.isArray(args.acceptance_criteria) ? args.acceptance_criteria : []; changes.push('acceptance_criteria'); }
      if (args.constraints !== undefined) { found.subtask.constraints = Array.isArray(args.constraints) ? args.constraints : []; changes.push('constraints'); }
      if (args.context_files !== undefined) { found.subtask.context_files = Array.isArray(args.context_files) ? args.context_files : []; changes.push('context_files'); }
      if (args.reference_docs !== undefined) { found.subtask.reference_docs = Array.isArray(args.reference_docs) ? args.reference_docs : []; changes.push('reference_docs'); }
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'task_enriched', target_type: 'subtask', target_id: args.task_id, description: `Enriched ${changes.join(', ')}`, timestamp: now, tags: ['enrich', 'mcp'] });
      touchAgent(state, 'orchestrator');
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task ${args.task_id} enriched: ${changes.join(', ')}` }] };
    }

    case 'add_milestone_note': {
      const milestone = state.milestones.find(m => m.id === args.milestone_id);
      if (!milestone) return { content: [{ type: 'text', text: `Milestone '${args.milestone_id}' not found` }], isError: true };
      if (!milestone.notes) milestone.notes = [];
      milestone.notes.push(args.note);
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'milestone_note_added', target_type: 'milestone', target_id: args.milestone_id, description: `Added note: ${args.note}`, timestamp: now, tags: ['note', 'mcp'] });
      writeTracker(state);
      return { content: [{ type: 'text', text: `Note added. Total notes: ${milestone.notes.length}` }] };
    }

    case 'set_milestone_dates': {
      const milestone = state.milestones.find(m => m.id === args.milestone_id);
      if (!milestone) return { content: [{ type: 'text', text: `Milestone '${args.milestone_id}' not found` }], isError: true };
      
      if (args.actual_start !== undefined) milestone.actual_start = args.actual_start;
      if (args.actual_end !== undefined) milestone.actual_end = args.actual_end;
      
      if (milestone.actual_start && milestone.planned_start) {
        const actual = new Date(milestone.actual_start + "T00:00:00");
        const planned = new Date(milestone.planned_start + "T00:00:00");
        milestone.drift_days = Math.round((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'milestone_dates_set', target_type: 'milestone', target_id: args.milestone_id, description: `Dates set`, timestamp: now, tags: ['milestone', 'mcp'] });
      writeTracker(state);
      return { content: [{ type: 'text', text: `Milestone dates updated. Drift is now ${milestone.drift_days} days.` }] };
    }

    case 'update_drift': {
      const milestone = state.milestones.find(m => m.id === args.milestone_id);
      if (!milestone) return { content: [{ type: 'text', text: `Milestone '${args.milestone_id}' not found` }], isError: true };
      const old = milestone.drift_days;
      milestone.drift_days = args.drift_days;
      
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: 'drift_updated', target_type: 'milestone', target_id: args.milestone_id, description: `Drift updated ${old} -> ${args.drift_days}`, timestamp: now, tags: ['drift', 'mcp'] });
      writeTracker(state);
      return { content: [{ type: 'text', text: `Drift updated to ${args.drift_days}.` }] };
    }

    case 'create_milestone': {
      if (state.milestones.find(m => m.id === args.id)) return { content: [{ type: 'text', text: `Milestone '${args.id}' already exists` }], isError: true };
      const newM: Milestone = {
        id: args.id,
        title: args.title,
        domain: args.domain || 'general',
        phase: args.phase || args.id,
        planned_start: args.planned_start || null,
        planned_end: args.planned_end || null,
        actual_start: null,
        actual_end: null,
        drift_days: 0,
        is_key_milestone: false,
        key_milestone_label: null,
        subtasks: [],
        dependencies: [],
        notes: [],
        week: 1
      };
      state.milestones.push(newM);
      writeTracker(state);
      return { content: [{ type: 'text', text: `Milestone ${args.id} created.` }] };
    }

    case 'add_milestone_task': {
      const milestone = state.milestones.find(m => m.id === args.milestone_id);
      if (!milestone) return { content: [{ type: 'text', text: `Milestone '${args.milestone_id}' not found` }], isError: true };
      
      const idx = milestone.subtasks.length + 1;
      const taskId = `${args.milestone_id}_${idx.toString().padStart(3, '0')}`;
      
      const newT: Subtask = {
        id: taskId,
        label: args.label,
        status: 'todo',
        done: false,
        assignee: null,
        blocked_by: null,
        blocked_reason: null,
        completed_at: null,
        completed_by: null,
        priority: args.priority || 'P2',
        notes: null,
        prompt: null,
        context_files: [],
        reference_docs: [],
        acceptance_criteria: args.acceptance_criteria || [],
        constraints: args.constraints || [],
        agent_target: null,
        execution_mode: args.execution_mode || 'agent',
        depends_on: args.depends_on || [],
        last_run_id: null,
        builder_prompt: null
      };
      
      milestone.subtasks.push(newT);
      writeTracker(state);
      return { content: [{ type: 'text', text: `Task created with ID ${taskId}` }] };
    }

    case 'register_agent': {
      let agent = state.agents.find(a => a.id === args.agent_id);
      if (agent) {
        agent.name = args.name;
        agent.type = args.type;
        agent.permissions = args.permissions;
        if (args.color) agent.color = args.color;
        if (args.parent_id) agent.parent_id = args.parent_id;
        agent.status = 'active';
        agent.last_action_at = now;
      } else {
        state.agents.push({
          id: args.agent_id,
          name: args.name,
          type: args.type,
          permissions: args.permissions,
          color: args.color || '#9B9BAA',
          parent_id: args.parent_id,
          status: 'active',
          last_action_at: now,
          session_action_count: 0
        });
      }
      state.agent_log.push({ id: genId(), agent_id: 'orchestrator', action: agent ? 'agent_updated' : 'agent_registered', target_type: 'agent', target_id: args.agent_id, description: `Agent ${args.agent_id} registered`, timestamp: now, tags: ['agent', 'mcp'] });
      writeTracker(state);
      return { content: [{ type: 'text', text: `Agent ${args.agent_id} registered.` }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
}
