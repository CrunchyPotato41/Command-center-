import { create } from 'zustand'
import { produce } from 'immer'

// ─── Types (mirrored from tracker schema) ────────────────────

export interface ProjectMeta {
  name: string
  start_date: string
  target_date: string
  current_week: number
  schedule_status: 'on_track' | 'behind' | 'ahead'
  overall_progress: number
}

export interface Subtask {
  id: string
  label: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  done: boolean
  assignee: string | null
  blocked_by: string | null
  blocked_reason: string | null
  completed_at: string | null
  completed_by: string | null
  priority: string
  notes: string | null
  prompt: string | null
  context_files: string[]
  reference_docs: string[]
  acceptance_criteria: string[]
  constraints: string[]
  agent_target: string | null
  execution_mode: 'human' | 'agent' | 'pair'
  depends_on: string[]
  last_run_id: string | null
  builder_prompt: string | null
}

export interface Milestone {
  id: string
  title: string
  domain: string
  week: number
  phase: string
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  drift_days: number
  is_key_milestone: boolean
  key_milestone_label: string | null
  subtasks: Subtask[]
  dependencies: string[]
  notes: string[]
}

export interface Agent {
  id: string
  name: string
  type: 'orchestrator' | 'sub-agent' | 'human' | 'external'
  parent_id?: string
  color: string
  status: string
  permissions: string[]
  last_action_at: string | null
  session_action_count: number
}

export interface AgentLogEntry {
  id: string
  agent_id: string
  action: string
  target_type: string
  target_id: string
  description: string
  timestamp: string
  tags: string[]
}

export interface Phase {
  id: string
  title: string
  start_week: number
  end_week: number
}

export interface TrackerState {
  project: ProjectMeta
  milestones: Milestone[]
  agents: Agent[]
  agent_log: AgentLogEntry[]
  schedule: { phases: Phase[] }
}

export type TabId = 'swim-lane' | 'task-board' | 'agent-hub' | 'calendar'

// ─── Derived Selectors ───────────────────────────────────────

export function selectCurrentWeek(tracker: TrackerState | null): number {
  if (!tracker) return 1
  const start = new Date(tracker.project.start_date + 'T00:00:00')
  const target = new Date(tracker.project.target_date + 'T00:00:00')
  const now = new Date()
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const totalWeeks = Math.ceil(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )
  return Math.max(1, Math.min(totalWeeks, Math.floor(diffDays / 7) + 1))
}

export function selectCurrentWeekFractional(tracker: TrackerState | null): number {
  if (!tracker) return 1
  const start = new Date(tracker.project.start_date + 'T00:00:00')
  const target = new Date(tracker.project.target_date + 'T00:00:00')
  const now = new Date()
  const diffDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const totalWeeks = Math.ceil(
    (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )
  return Math.max(1, Math.min(totalWeeks + 0.99, diffDays / 7 + 1))
}

export function selectCurrentPhase(tracker: TrackerState | null): string {
  if (!tracker) return ''
  const week = selectCurrentWeek(tracker)
  const phase = tracker.schedule.phases.find(
    (p) => week >= p.start_week && week <= p.end_week
  )
  return phase?.title ?? ''
}

export function selectScheduleStatus(
  tracker: TrackerState | null
): 'on_track' | 'behind' | 'ahead' {
  if (!tracker || tracker.milestones.length === 0) return 'on_track'
  const drifts = tracker.milestones.map((m) => m.drift_days)
  if (Math.max(...drifts) > 3) return 'behind'
  if (Math.min(...drifts) < -3) return 'ahead'
  return 'on_track'
}

export function selectOverallProgress(tracker: TrackerState | null): number {
  return tracker?.project.overall_progress ?? 0
}

export function selectMilestoneProgress(milestone: Milestone): {
  done: number
  total: number
  pct: number
} {
  const total = milestone.subtasks.length
  const done = milestone.subtasks.filter((t) => t.done).length
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
}

// ─── Write-Back Debounce ─────────────────────────────────────

let writeTimer: ReturnType<typeof setTimeout> | null = null
let suppressTimer: ReturnType<typeof setTimeout> | null = null
let suppressExternalRefresh = false

function scheduleWriteBack(tracker: TrackerState) {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(async () => {
    suppressExternalRefresh = true
    try {
      const res = await window.api.tracker.write(JSON.stringify(tracker, null, 2))
      if (res && !res.success) {
        useStore.getState().setError(res.error || 'Failed to write tracker data')
      }
    } catch (err: any) {
      useStore.getState().setError(err.message || 'Write failed')
    } finally {
      if (suppressTimer) clearTimeout(suppressTimer)
      suppressTimer = setTimeout(() => {
        suppressExternalRefresh = false
      }, 700)
    }
  }, 500)
}

export function isSuppressed(): boolean {
  return suppressExternalRefresh
}

// ─── Store ───────────────────────────────────────────────────

interface AppState {
  tracker: TrackerState | null
  loading: boolean
  error: string | null
  synced: boolean
  activeTab: TabId
  selectedMilestoneId: string | null
  theme: 'dark' | 'light'

  setTracker: (data: TrackerState) => void
  updateTracker: (updater: (draft: TrackerState) => void) => void
  setActiveTab: (tab: TabId) => void
  setSelectedMilestoneId: (id: string | null) => void
  setLoading: (v: boolean) => void
  setError: (err: string | null) => void
  setSynced: (v: boolean) => void
  toggleTheme: () => void
}

const savedTheme =
  (typeof localStorage !== 'undefined' && localStorage.getItem('command-center-theme')) || 'dark'

export const useStore = create<AppState>((set, get) => ({
  tracker: null,
  loading: true,
  error: null,
  synced: true,
  activeTab: 'swim-lane',
  selectedMilestoneId: null,
  theme: savedTheme as 'dark' | 'light',

  setTracker: (data) => set({ tracker: data, synced: true }),

  updateTracker: (updater) => {
    const tracker = get().tracker
    if (!tracker) return
    
    const nextTracker = produce(tracker, (draft) => {
      updater(draft as TrackerState)

      // Recompute derived fields
      const total = draft.milestones.reduce((s, m) => s + m.subtasks.length, 0)
      const done = draft.milestones.reduce(
        (s, m) => s + m.subtasks.filter((t) => t.done).length,
        0
      )
      draft.project.overall_progress =
        total > 0 ? parseFloat((done / total).toFixed(4)) : 0
      draft.project.current_week = selectCurrentWeek(draft as TrackerState)
      draft.project.schedule_status = selectScheduleStatus(draft as TrackerState)
    })

    set({ tracker: nextTracker })
    scheduleWriteBack(nextTracker)
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedMilestoneId: (id) => set({ selectedMilestoneId: id }),
  setLoading: (v) => set({ loading: v }),
  setError: (err) => set({ error: err }),
  setSynced: (v) => set({ synced: v }),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('command-center-theme', next)
    set({ theme: next })
  }
}))
