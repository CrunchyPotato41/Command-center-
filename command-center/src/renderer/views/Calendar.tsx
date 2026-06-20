import React, { useState, useMemo } from 'react'
import { useStore, Subtask, Milestone } from '../store'
import { TaskDetailModal } from '../components/TaskDetailModal'

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PALETTE = ['#f59e0b', '#22c55e', '#8286FF', '#ef4444', '#14B8A6', '#EC4899', '#F97316', '#6366F1']
function getDomainColor(domain: string): string {
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % PALETTE.length
  return PALETTE[idx]
}

export function Calendar() {
  const tracker = useStore((s) => s.tracker)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedTask, setSelectedTask] = useState<{ task: Subtask; milestone: Milestone } | null>(null)
  const updateTracker = useStore((s) => s.updateTracker)

  function handleAddTask(date: Date) {
    if (!tracker) return
    const id = crypto.randomUUID()
    updateTracker(draft => {
      // Just put it in the first milestone for now
      const m = draft.milestones[0]
      if (m) {
        m.subtasks.push({
          id,
          label: 'New Task',
          status: 'todo',
          done: false,
          assignee: null,
          blocked_by: null,
          blocked_reason: null,
          completed_at: null,
          completed_by: null,
          priority: 'p2',
          notes: null,
          prompt: null,
          context_files: [],
          reference_docs: [],
          acceptance_criteria: [],
          constraints: [],
          agent_target: null,
          execution_mode: 'agent',
          depends_on: [],
          last_run_id: null,
          builder_prompt: null
        })
      }
    })
  }

  if (!tracker) return null

  const today = new Date()
  const offsetDate = new Date(today)
  offsetDate.setDate(today.getDate() + weekOffset * 7)
  const { start: weekStart, end: weekEnd } = getWeekBounds(offsetDate)

  // Collect all tasks for the week
  const allTasks: (Subtask & { domain: string; milestone: Milestone })[] = useMemo(() => {
    const tasks: (Subtask & { domain: string; milestone: Milestone })[] = []
    for (const m of tracker.milestones) {
      for (const t of m.subtasks) {
        tasks.push({ ...t, domain: m.domain, milestone: m })
      }
    }
    return tasks
  }, [tracker.milestones])

  // Filter to this week
  const weekTasks = allTasks.filter((t) => {
    const dateStr = t.completed_at || t.milestone.planned_end || t.milestone.planned_start
    const d = dateStr ? new Date(dateStr) : today
    return d >= weekStart && d <= weekEnd
  })

  // Group by day of week
  const dayBuckets: Record<number, (Subtask & { domain: string; milestone: Milestone })[]> = {}
  for (let i = 0; i < 7; i++) dayBuckets[i] = []
  weekTasks.forEach((t) => {
    const dateStr = t.completed_at || t.milestone.planned_end || t.milestone.planned_start
    const d = dateStr ? new Date(dateStr) : today
    const dayOfWeek = d.getDay()
    const mondayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    dayBuckets[mondayIdx].push(t)
  })

  // Get week number relative to project start
  const projectStart = new Date(tracker.project.start_date + 'T00:00:00')
  const weekNum = Math.floor(
    (weekStart.getTime() - projectStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  ) + 1

  const isThisWeek = weekOffset === 0
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-4 relative" style={{ borderBottom: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
        <div className="absolute left-4">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="cursor-pointer transition-colors"
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
              borderRadius: 6, color: 'var(--theme-primary-text)'
            }}
          >
            ← Prev
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--theme-primary-text)' }}>
            Week {Math.max(1, weekNum)} · {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][weekStart.getMonth()]} {weekStart.getDate()} – {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][weekEnd.getMonth()]} {weekEnd.getDate()}, {weekEnd.getFullYear()}
          </span>
          <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>
            {weekTasks.filter(t => t.done).length} completed
          </span>
        </div>

        <button
          onClick={() => setWeekOffset(0)}
          className="cursor-pointer mt-2"
          style={{
            padding: '4px 12px', fontSize: 11, fontWeight: 600,
            background: isThisWeek ? '#585CF020' : 'var(--theme-border)',
            border: 'none',
            borderRadius: 6, color: isThisWeek ? '#585CF0' : 'var(--theme-muted)'
          }}
        >
          Today
        </button>
        
        <div className="absolute right-4">
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="cursor-pointer transition-colors"
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
              borderRadius: 6, color: 'var(--theme-primary-text)'
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex overflow-hidden">
        {DAYS.map((day, idx) => {
          const dayDate = new Date(weekStart)
          dayDate.setDate(weekStart.getDate() + idx)
          const isToday = isThisWeek && idx === todayIdx
          const tasks = dayBuckets[idx]

          return (
            <div
              key={day}
              className="flex-1 flex flex-col min-w-0"
              style={{
                borderRight: idx < 6 ? '1px solid var(--theme-border)' : 'none',
                background: isToday ? 'rgba(88,92,240,0.03)' : 'transparent'
              }}
            >
              {/* Day header */}
              <div
                className="flex flex-col px-3 py-3 relative group"
                style={{ borderBottom: `2px solid ${isToday ? '#585CF0' : 'transparent'}` }}
              >
                <div className="flex items-center gap-1">
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: isToday ? '#585CF0' : 'var(--theme-muted)'
                  }}>
                    {day}
                  </span>
                  {idx === 0 && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--theme-muted)' }}>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dayDate.getMonth()]}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 20, fontWeight: 700, marginTop: 2,
                  color: isToday ? '#585CF0' : 'var(--theme-primary-text)'
                }}>
                  {dayDate.getDate()}
                </span>

                {/* Add Task Button per day */}
                <button
                  className="absolute right-2 top-4 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => handleAddTask(dayDate)}
                  style={{ background: '#585CF0', color: '#fff', border: 'none', width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
                >
                  +
                </button>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-auto p-1.5 flex flex-col gap-1">
                {tasks.length === 0 && (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--theme-muted)', fontSize: 10, opacity: 0.3
                  }}>
                  </div>
                )}
                {tasks.map((task) => {
                  const borderColor = getDomainColor(task.domain)
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask({ task, milestone: task.milestone })}
                      style={{
                        background: 'var(--theme-surface)',
                        borderLeft: `3px solid ${borderColor}`,
                        borderRadius: '0 6px 6px 0',
                        padding: '6px 8px',
                        fontSize: 10,
                        lineHeight: 1.3,
                        cursor: 'pointer'
                      }}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <span style={{ color: task.done ? '#22c55e' : 'var(--theme-muted)', fontSize: 10 }}>
                          {task.done ? '✓' : '○'}
                        </span>
                        <span
                          style={{
                            flex: 1, fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            color: task.done ? 'var(--theme-muted)' : 'var(--theme-primary-text)',
                            textDecoration: task.done ? 'line-through' : 'none'
                          }}
                        >
                          {task.label}
                        </span>
                      </div>
                      <span className="tag" style={{ background: `${borderColor}18`, color: borderColor, fontSize: 8 }}>
                        {task.domain}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {weekTasks.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--theme-border)',
            padding: '8px 16px',
            borderRadius: 6,
            color: 'var(--theme-muted)',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            Completed tasks will appear here as work is finished
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          subtask={selectedTask.task}
          milestone={selectedTask.milestone}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
