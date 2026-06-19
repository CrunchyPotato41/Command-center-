import { TrackerState, Subtask, Milestone, AgentLogEntry } from './tracker.js';

export function buildTaskContext(state: TrackerState, subtask: Subtask, milestone: Milestone): string {
  let ctx = `## Task: ${subtask.label} (${subtask.id})\n\n`;
  
  ctx += `**Status:** ${subtask.status}\n`;
  ctx += `**Priority:** ${subtask.priority || 'Unset'}\n`;
  ctx += `**Execution Mode:** ${subtask.execution_mode}\n`;
  ctx += `**Assignee:** ${subtask.assignee || 'Unassigned'}\n`;
  if (subtask.status === 'blocked') {
    ctx += `**Blocked Reason:** ${subtask.blocked_reason || 'Unknown'}\n`;
  }
  if (subtask.notes) {
    ctx += `**Notes:** ${subtask.notes}\n`;
  }
  
  ctx += `\n### Acceptance Criteria\n`;
  if (subtask.acceptance_criteria && subtask.acceptance_criteria.length > 0) {
    subtask.acceptance_criteria.forEach(c => {
      ctx += `- [ ] ${c}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Constraints\n`;
  if (subtask.constraints && subtask.constraints.length > 0) {
    subtask.constraints.forEach(c => {
      ctx += `- ${c}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Context Files\n`;
  if (subtask.context_files && subtask.context_files.length > 0) {
    subtask.context_files.forEach(f => {
      ctx += `- ${f}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Reference Docs\n`;
  if (subtask.reference_docs && subtask.reference_docs.length > 0) {
    subtask.reference_docs.forEach(r => {
      ctx += `- ${r}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Revision History\n`;
  const revisions = state.agent_log.filter(log => log.target_id === subtask.id && log.action === 'revision_requested');
  if (revisions.length > 0) {
    revisions.forEach((rev, idx) => {
      ctx += `**Revision ${idx + 1} (${rev.timestamp}):**\n${rev.description}\n\n`;
    });
  } else {
    ctx += `No prior revisions.\n`;
  }

  if (subtask.builder_prompt) {
    ctx += `\n### Builder Prompt Link\n`;
    ctx += `Refer to file: ${subtask.builder_prompt}\n`;
  }

  ctx += `\n### Milestone Info: ${milestone.title}\n`;
  ctx += `- Domain: ${milestone.domain}\n`;
  ctx += `- Phase: ${milestone.phase}\n`;
  ctx += `- Week: ${milestone.week}\n`;
  ctx += `- Planned: ${milestone.planned_start} to ${milestone.planned_end}\n`;
  ctx += `- Drift Days: ${milestone.drift_days}\n`;

  if (milestone.notes && milestone.notes.length > 0) {
    ctx += `\n### Milestone Exit Criteria\n`;
    milestone.notes.forEach(n => {
      ctx += `- ${n}\n`;
    });
  }

  ctx += `\n### Sibling Tasks (Milestone: ${milestone.title})\n`;
  let doneCount = 0;
  milestone.subtasks.forEach(t => {
    if (t.id !== subtask.id) {
      ctx += `- [${t.status}] ${t.label}\n`;
    }
    if (t.done) doneCount++;
  });
  ctx += `\nMilestone Progress: ${doneCount}/${milestone.subtasks.length}\n`;

  ctx += `\n### Upstream Dependencies\n`;
  if (milestone.dependencies && milestone.dependencies.length > 0) {
    milestone.dependencies.forEach(depId => {
      const depMilestone = state.milestones.find(m => m.id === depId);
      if (depMilestone) {
        const depDone = depMilestone.subtasks.filter(t => t.done).length;
        const total = depMilestone.subtasks.length;
        const pct = total > 0 ? Math.round((depDone / total) * 100) : 0;
        ctx += `- ${depMilestone.title}: ${pct}% complete\n`;
      } else {
        ctx += `- ${depId}: Not found\n`;
      }
    });
  } else {
    ctx += `None.\n`;
  }

  ctx += `\n### Downstream Milestones\n`;
  const downstream = state.milestones.filter(m => m.dependencies && m.dependencies.includes(milestone.id));
  if (downstream.length > 0) {
    downstream.forEach(m => {
      ctx += `- ${m.title}\n`;
    });
  } else {
    ctx += `None.\n`;
  }

  return ctx;
}

export function buildTaskSummary(state: TrackerState, subtask: Subtask, milestone: Milestone): string {
  let ctx = `## Task Summary: ${subtask.label} (${subtask.id})\n\n`;
  
  ctx += `**Status:** ${subtask.status}\n`;
  ctx += `**Domain:** ${milestone.domain}\n`;
  
  ctx += `\n### Acceptance Criteria\n`;
  if (subtask.acceptance_criteria && subtask.acceptance_criteria.length > 0) {
    subtask.acceptance_criteria.forEach(c => {
      ctx += `- [ ] ${c}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Constraints\n`;
  if (subtask.constraints && subtask.constraints.length > 0) {
    subtask.constraints.forEach(c => {
      ctx += `- ${c}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Context Files\n`;
  if (subtask.context_files && subtask.context_files.length > 0) {
    subtask.context_files.forEach(f => {
      ctx += `- ${f}\n`;
    });
  } else {
    ctx += `None defined.\n`;
  }

  ctx += `\n### Revision History\n`;
  const revisions = state.agent_log.filter(log => log.target_id === subtask.id && log.action === 'revision_requested');
  if (revisions.length > 0) {
    revisions.forEach((rev, idx) => {
      ctx += `**Revision ${idx + 1} (${rev.timestamp}):**\n${rev.description}\n\n`;
    });
  } else {
    ctx += `No prior revisions.\n`;
  }

  return ctx;
}

export function buildProjectStatus(state: TrackerState): string {
  let ctx = `# Project Status: ${state.project.name}\n\n`;
  ctx += `- Start Date: ${state.project.start_date}\n`;
  ctx += `- Target Date: ${state.project.target_date}\n`;
  ctx += `- Current Week: ${state.project.current_week}\n`;
  ctx += `- Schedule Status: ${state.project.schedule_status.toUpperCase()}\n`;
  
  let totalTasks = 0;
  let doneTasks = 0;
  let inProgressTasks = 0;
  let blockedTasks = 0;

  state.milestones.forEach(m => {
    totalTasks += m.subtasks.length;
    m.subtasks.forEach(t => {
      if (t.status === 'done') doneTasks++;
      else if (t.status === 'in_progress') inProgressTasks++;
      else if (t.status === 'blocked') blockedTasks++;
    });
  });

  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  ctx += `\n## Progress\n`;
  ctx += `- Overall Progress: ${doneTasks}/${totalTasks} tasks (${pct}%)\n`;
  ctx += `- In Progress: ${inProgressTasks}\n`;
  ctx += `- Blocked: ${blockedTasks}\n`;
  
  ctx += `\n## Milestones\n`;
  ctx += `- Total Milestones: ${state.milestones.length}\n`;

  const phase = state.schedule.phases.find(p => state.project.current_week >= p.start_week && state.project.current_week <= p.end_week);
  ctx += `\n## Current Phase\n`;
  ctx += `- ${phase ? phase.title : 'None'}\n`;

  return ctx;
}

export function buildMilestoneOverview(milestone: Milestone, state: TrackerState): string {
  let ctx = `## Milestone Overview: ${milestone.title} (${milestone.id})\n\n`;
  
  ctx += `- Domain: ${milestone.domain}\n`;
  ctx += `- Phase: ${milestone.phase}\n`;
  ctx += `- Week: ${milestone.week}\n`;
  ctx += `- Planned: ${milestone.planned_start} to ${milestone.planned_end}\n`;
  ctx += `- Drift Days: ${milestone.drift_days}\n`;
  if (milestone.is_key_milestone) {
    ctx += `- Key Milestone: ${milestone.key_milestone_label}\n`;
  }

  let doneCount = 0;
  milestone.subtasks.forEach(t => {
    if (t.done) doneCount++;
  });
  const total = milestone.subtasks.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  ctx += `\n### Progress\n`;
  ctx += `- ${doneCount}/${total} tasks (${pct}%)\n`;

  if (milestone.notes && milestone.notes.length > 0) {
    ctx += `\n### Exit Criteria\n`;
    milestone.notes.forEach(n => {
      ctx += `- ${n}\n`;
    });
  }

  ctx += `\n### Tasks\n`;
  milestone.subtasks.forEach(t => {
    ctx += `- [${t.status}] ${t.label} (Priority: ${t.priority || 'None'})\n`;
  });

  ctx += `\n### Dependencies\n`;
  if (milestone.dependencies && milestone.dependencies.length > 0) {
    milestone.dependencies.forEach(depId => {
      const depMilestone = state.milestones.find(m => m.id === depId);
      if (depMilestone) {
        const depDone = depMilestone.subtasks.filter(t => t.done).length;
        const depTotal = depMilestone.subtasks.length;
        const depPct = depTotal > 0 ? Math.round((depDone / depTotal) * 100) : 0;
        ctx += `- ${depMilestone.title}: ${depPct}% complete\n`;
      } else {
        ctx += `- ${depId}: Not found\n`;
      }
    });
  } else {
    ctx += `None.\n`;
  }

  return ctx;
}
