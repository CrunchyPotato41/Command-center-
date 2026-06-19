import path from 'path';
import fs from 'fs';

// ─── Root State ───────────────────────────────────────────────
export interface TrackerState {
  project: ProjectMeta;
  milestones: Milestone[];
  agents: Agent[];
  agent_log: AgentLogEntry[];
  schedule: { phases: Phase[] };
}

// ─── Project Metadata ─────────────────────────────────────────
export interface ProjectMeta {
  name: string;
  start_date: string;
  target_date: string;
  current_week: number;
  schedule_status: 'on_track' | 'behind' | 'ahead';
  overall_progress: number;
}

// ─── Milestone ────────────────────────────────────────────────
export interface Milestone {
  id: string;
  title: string;
  domain: string;
  week: number;
  phase: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  drift_days: number;
  is_key_milestone: boolean;
  key_milestone_label: string | null;
  subtasks: Subtask[];
  dependencies: string[];
  notes: string[];
}

// ─── Subtask (Task) ───────────────────────────────────────────
export interface Subtask {
  id: string;
  label: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  done: boolean;
  assignee: string | null;
  blocked_by: string | null;
  blocked_reason: string | null;
  completed_at: string | null;
  completed_by: string | null;
  priority: string;
  notes: string | null;

  prompt: string | null;
  context_files: string[];
  reference_docs: string[];
  acceptance_criteria: string[];
  constraints: string[];

  agent_target: string | null;
  execution_mode: 'human' | 'agent' | 'pair';
  depends_on: string[];
  last_run_id: string | null;
  builder_prompt: string | null;
}

// ─── Agent ────────────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'sub-agent' | 'human' | 'external';
  parent_id?: string;
  color: string;
  status: string;
  permissions: string[];
  last_action_at: string | null;
  session_action_count: number;
}

// ─── Agent Log Entry ──────────────────────────────────────────
export interface AgentLogEntry {
  id: string;
  agent_id: string;
  action: string;
  target_type: string;
  target_id: string;
  description: string;
  timestamp: string;
  tags: string[];
}

// ─── Schedule Phase ───────────────────────────────────────────
export interface Phase {
  id: string;
  title: string;
  start_week: number;
  end_week: number;
}

// ─── Utility Functions ────────────────────────────────────────
export function resolveProjectRoot(): string {
  let root = process.env.PROJECT_ROOT;

  if (!root) {
    let currentDir = process.cwd();
    while (currentDir !== path.parse(currentDir).root) {
      try {
        const envPath = path.join(currentDir, '.env');
        const env = fs.readFileSync(envPath, 'utf-8');
        const match = env.match(/^PROJECT_ROOT=(.+)$/m);
        if (match) { 
          root = match[1].trim(); 
          break; 
        }
      } catch { /* .env not found in this dir */ }
      currentDir = path.dirname(currentDir);
    }
  }

  // Fallback for easy testing without .env if running from workspace root
  if (!root && fs.existsSync(path.join(process.cwd(), 'project-tracker.json'))) {
      root = process.cwd();
  }

  if (!root) {
      throw new Error('PROJECT_ROOT is not set. Please set it in .env or environment variable.');
  }

  return path.normalize(path.resolve(root));
}

export const PROJECT_ROOT = resolveProjectRoot();
export const TRACKER_PATH = path.join(PROJECT_ROOT, 'project-tracker.json');

export function readTracker(): TrackerState {
  if (!fs.existsSync(TRACKER_PATH)) {
    throw new Error(`Tracker file not found at ${TRACKER_PATH}`);
  }
  const content = fs.readFileSync(TRACKER_PATH, 'utf-8');
  return JSON.parse(content) as TrackerState;
}

function selectCurrentWeek(tracker: TrackerState): number {
  const start = new Date(tracker.project.start_date + "T00:00:00");
  const target = new Date(tracker.project.target_date + "T00:00:00");
  const now = new Date();
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const totalWeeks = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, Math.min(totalWeeks, Math.floor(diffDays / 7) + 1));
}

function selectScheduleStatus(tracker: TrackerState): 'on_track' | 'behind' | 'ahead' {
  if (tracker.milestones.length === 0) return 'on_track';
  const drifts = tracker.milestones.map(m => m.drift_days);
  const max_drift = Math.max(...drifts);
  const min_drift = Math.min(...drifts);
  if (max_drift > 3) return 'behind';
  if (min_drift < -3) return 'ahead';
  return 'on_track';
}

export function writeTracker(state: TrackerState): void {
  let totalTasks = 0;
  let doneTasks = 0;

  for (const m of state.milestones) {
    totalTasks += m.subtasks.length;
    for (const t of m.subtasks) {
      if (t.done) doneTasks++;
    }
  }

  state.project.overall_progress = totalTasks > 0 ? parseFloat((doneTasks / totalTasks).toFixed(4)) : 0;
  state.project.current_week = selectCurrentWeek(state);
  state.project.schedule_status = selectScheduleStatus(state);

  fs.writeFileSync(TRACKER_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export function findTask(state: TrackerState, taskId: string): { subtask: Subtask, milestone: Milestone } | null {
  for (const milestone of state.milestones) {
    for (const subtask of milestone.subtasks) {
      if (subtask.id === taskId) {
        return { subtask, milestone };
      }
    }
  }
  return null;
}

export function touchAgent(state: TrackerState, agentId: string = 'orchestrator'): void {
  const agent = state.agents.find(a => a.id === agentId);
  if (agent) {
    agent.last_action_at = new Date().toISOString();
    agent.session_action_count += 1;
    agent.status = 'active';
  }
}

export function autoUnblockDependents(state: TrackerState, completedTaskId: string, completedMilestoneId: string): string[] {
  const unblockedLog: string[] = [];

  // 1. Check tasks
  for (const milestone of state.milestones) {
    let allMilestoneTasksDone = true;
    for (const subtask of milestone.subtasks) {
      if (subtask.depends_on && subtask.depends_on.includes(completedTaskId)) {
        // Check if all dependencies are done
        const allDepsDone = subtask.depends_on.every(depId => {
          const found = findTask(state, depId);
          return found && found.subtask.status === 'done';
        });

        if (allDepsDone && subtask.status === 'blocked') {
          subtask.status = 'todo';
          subtask.blocked_by = null;
          subtask.blocked_reason = null;
          unblockedLog.push(`Task ${subtask.id} unblocked (all dependencies met)`);
          
          state.agent_log.push({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agent_id: 'system',
            action: 'task_auto_unblocked',
            target_type: 'subtask',
            target_id: subtask.id,
            description: `Auto-unblocked after completion of ${completedTaskId}`,
            timestamp: new Date().toISOString(),
            tags: ['system', 'unblock']
          });
        }
      }
      if (subtask.status !== 'done') {
          allMilestoneTasksDone = false;
      }
    }
    
    // Auto-complete milestone actual_end if all tasks are done
    if (allMilestoneTasksDone && milestone.subtasks.length > 0 && !milestone.actual_end) {
        milestone.actual_end = new Date().toISOString().split('T')[0];
    }
  }

  // 2. Check downstream milestones if the completed milestone is now fully complete
  const completedMilestone = state.milestones.find(m => m.id === completedMilestoneId);
  const isMilestoneFullyComplete = completedMilestone && completedMilestone.subtasks.length > 0 && completedMilestone.subtasks.every(t => t.status === 'done');

  if (isMilestoneFullyComplete) {
    for (const downstream of state.milestones) {
      if (downstream.dependencies && downstream.dependencies.includes(completedMilestoneId)) {
        const allDepsComplete = downstream.dependencies.every(depId => {
          const depMilestone = state.milestones.find(m => m.id === depId);
          return depMilestone && depMilestone.subtasks.length > 0 && depMilestone.subtasks.every(t => t.status === 'done');
        });

        if (allDepsComplete) {
          // Unblock any blocked tasks in the downstream milestone
          for (const subtask of downstream.subtasks) {
            if (subtask.status === 'blocked' && (!subtask.depends_on || subtask.depends_on.length === 0)) {
              subtask.status = 'todo';
              subtask.blocked_by = null;
              subtask.blocked_reason = null;
              unblockedLog.push(`Task ${subtask.id} in downstream milestone ${downstream.id} auto-unblocked`);
              
              state.agent_log.push({
                id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                agent_id: 'system',
                action: 'task_auto_unblocked',
                target_type: 'subtask',
                target_id: subtask.id,
                description: `Auto-unblocked after parent milestone ${completedMilestoneId} completed`,
                timestamp: new Date().toISOString(),
                tags: ['system', 'unblock']
              });
            }
          }
        }
      }
    }
  }

  return unblockedLog;
}
