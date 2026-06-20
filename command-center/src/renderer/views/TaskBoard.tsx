import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  rectIntersection,
  CollisionDetection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore, Milestone, Subtask, selectMilestoneProgress } from '../store'
import { ProgressRing } from '../components/ProgressRing'
import { TaskDetailModal } from '../components/TaskDetailModal'
import { motion } from 'framer-motion'

const COLUMNS = [
  { id: 'todo', label: 'TO DO', color: '#64748b' },
  { id: 'in_progress', label: 'IN PROGRESS', color: '#585CF0' },
  { id: 'review', label: 'REVIEW', color: '#f59e0b' },
  { id: 'done', label: 'DONE', color: '#22c55e' },
  { id: 'blocked', label: 'BLOCKED', color: '#ef4444' }
]

const EXEC_MODE_COLORS: Record<string, string> = {
  agent: '#ef4444',
  human: '#22c55e',
  pair: '#3b82f6'
}

// ─── Task Card ───────────────────────────────────────────────

function TaskCardContent({ subtask, isOverlay = false, onClick }: { subtask: Subtask; isOverlay?: boolean; onClick?: () => void }) {
  const labelStr = subtask.label || 'Untitled'
  const [titlePart, ...descParts] = labelStr.split(/[:\-–]/)
  const desc = descParts.join(' ').trim()
  const borderColor = COLUMNS.find(c => c.id === subtask.status)?.color || '#64748b'

  return (
    <div
      onClick={onClick}
      className={`rounded-lg transition-all duration-100 ${isOverlay ? 'shadow-2xl cursor-grabbing scale-105' : 'cursor-pointer'}`}
      onMouseEnter={(e) => { if (!isOverlay) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
      onMouseLeave={(e) => { if (!isOverlay) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)' }}
      style={{
        width: isOverlay ? 260 : 'auto',
        background: 'var(--theme-surface)',
        borderLeft: `3px solid ${borderColor}`,
        borderTop: '1px solid var(--theme-border)',
        borderRight: '1px solid var(--theme-border)',
        borderBottom: '1px solid var(--theme-border)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        ...(subtask.status === 'in_progress' && !isOverlay ? { animation: 'pulse-border 1.5s ease-in-out infinite' } : {})
      }}
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-2 font-mono" style={{ fontSize: 9 }}>
        <span style={{ color: '#22c55e', fontWeight: 700 }}>
          {subtask.id.toUpperCase()}
        </span>
        <span style={{ color: '#ef4444', fontWeight: 700 }}>
          {subtask.priority.toUpperCase()}
        </span>
        <div className="flex-1" />
        {subtask.execution_mode && (
          <span style={{ color: '#ef4444', fontWeight: 700, background: '#ef444410', padding: '2px 6px', borderRadius: 4 }}>
            {subtask.execution_mode}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>
        {titlePart.trim()}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 11, color: 'var(--theme-muted)', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minHeight: '2.6em'
        }}
      >
        {desc}
      </div>

      {/* Blocker bar */}
      {subtask.status === 'blocked' && subtask.blocked_reason && (
        <div
          style={{
            background: '#ef444415', color: '#ef4444', fontSize: 10,
            padding: '4px 8px', borderRadius: 4, marginTop: 6, lineHeight: 1.3
          }}
        >
          ⊘ {subtask.blocked_reason}
        </div>
      )}

      {/* Assignee
      {subtask.assignee && (
        <div className="flex justify-end mt-2">
          <span className="tag" style={{ background: 'var(--theme-border)', color: 'var(--theme-muted)', fontSize: 9 }}>
            @{subtask.assignee}
          </span>
        </div>
      )} */}
    </div>
  )
}

function TaskCard({ subtask, domain, onClick }: { subtask: Subtask; domain: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardContent subtask={subtask} onClick={onClick} />
    </div>
  )
}

// ─── Kanban Column ───────────────────────────────────────────

function KanbanColumn({ column, subtasks, domain, onCardClick, onAddTask }: {
  column: typeof COLUMNS[0]
  subtasks: Subtask[]
  domain: string
  onCardClick: (subtask: Subtask) => void
  onAddTask: (status: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      className="flex flex-col flex-1 min-w-0"
      style={{ minWidth: 200 }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: 'none' }}>
        <div style={{ width: 2, height: 14, background: column.color }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: column.color }}>
          {column.label}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 10, background: `${column.color}15`,
            padding: '2px 6px', borderRadius: 8, color: column.color, fontWeight: 600
          }}
        >
          {subtasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 flex flex-col gap-2 overflow-auto"
        style={{
          background: isOver ? 'rgba(88,92,240,0.05)' : 'transparent',
          minHeight: 120,
          transition: 'background 150ms ease'
        }}
      >
        <SortableContext items={subtasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {subtasks.map((task) => (
            <TaskCard
              key={task.id}
              subtask={task}
              domain={domain}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
        {subtasks.length === 0 && (
          <div
            style={{
              border: '2px dashed var(--theme-border)',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              color: 'var(--theme-muted)',
              fontSize: 11,
              fontWeight: 600,
              opacity: 0.5,
              minHeight: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--theme-surface)'
            }}
          >
            DROP HERE
          </div>
        )}

        {/* Add task to this column button */}
        <button
          onClick={() => onAddTask(column.id)}
          className="cursor-pointer transition-colors"
          style={{
            marginTop: 8,
            padding: '8px',
            borderRadius: 6,
            background: 'transparent',
            border: '1px dashed var(--theme-border)',
            color: 'var(--theme-muted)',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-border)'; e.currentTarget.style.color = 'var(--theme-primary-text)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-muted)' }}
        >
          + Add Task
        </button>
      </div>
    </div>
  )
}

// ─── Task Board View ─────────────────────────────────────────

export function TaskBoard() {
  const tracker = useStore((s) => s.tracker)
  const updateTracker = useStore((s) => s.updateTracker)
  const [milestoneIdx, setMilestoneIdx] = useState(0)
  const [selectedTask, setSelectedTask] = useState<Subtask | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  if (!tracker || tracker.milestones.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--theme-muted)' }}>
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">▦</div>
          <div className="text-sm font-medium">No milestones yet</div>
          <div className="text-xs mt-1 opacity-60">Tasks will appear after hydration</div>
        </div>
      </div>
    )
  }

  const milestone = tracker.milestones[milestoneIdx] || tracker.milestones[0]
  const { done, total, pct } = selectMilestoneProgress(milestone)

  const activeTask = activeTaskId ? milestone.subtasks.find(t => t.id === activeTaskId) : null

  // Apply filters
  let tasks = milestone.subtasks
  if (filter === 'blocked') {
    tasks = tasks.filter((t) => t.status === 'blocked')
  } else if (filter === 'my_tasks') {
    tasks = tasks.filter((t) => t.assignee === 'human' || t.assignee === 'operator')
  } else if (filter === 'agent_tasks') {
    tasks = tasks.filter((t) => t.execution_mode === 'agent')
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    setActiveTaskId(active.id as string)
  }

  function handleDragCancel() {
    setActiveTaskId(null)
  }

  const customCollisionDetection: CollisionDetection = (args) => {
    const rectCollisions = rectIntersection(args)
    if (rectCollisions.length > 0) {
      return rectCollisions
    }
    return closestCenter(args)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return

    let targetColumn = over.id as string
    const taskId = active.id as string

    // If dropped on a task instead of a column, find the column of that task
    const validColumns = ['todo', 'in_progress', 'review', 'done', 'blocked']
    if (!validColumns.includes(targetColumn)) {
      const m = tracker.milestones.find((ms) => ms.id === milestone.id)
      const overTask = m?.subtasks.find((t) => t.id === targetColumn)
      if (overTask) {
        targetColumn = overTask.status
      } else {
        return
      }
    }

    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (!m) return
      const task = m.subtasks.find((t) => t.id === taskId)
      if (!task || task.status === targetColumn) return

      task.status = targetColumn as Subtask['status']

      if (targetColumn === 'done') {
        task.done = true
        task.completed_at = new Date().toISOString()
        task.completed_by = 'operator'
        task.blocked_by = null
        task.blocked_reason = null
      } else if (targetColumn === 'blocked') {
        task.blocked_by = 'manual'
        task.completed_at = null
        task.completed_by = null
        task.done = false
      } else {
        task.blocked_by = null
        task.blocked_reason = null
        if (targetColumn !== 'done') {
          task.done = false
          task.completed_at = null
          task.completed_by = null
        }
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Context bar */}
      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ borderBottom: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}
      >
        <ProgressRing size={36} done={done} total={total} color="#585CF0" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="tag" style={{ background: '#585CF018', color: '#585CF0', fontSize: 9 }}>
              {milestone.domain}
            </span>
            <span className="tag mono" style={{ background: 'var(--theme-border)', color: 'var(--theme-muted)', fontSize: 9 }}>
              W{milestone.week}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            {milestone.title}
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--theme-muted)' }}>
              {done}/{total} tasks
            </span>
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => {
            const id = crypto.randomUUID()
            updateTracker(draft => {
              const m = draft.milestones[milestoneIdx]
              if (m) {
                m.subtasks.push({
                  id,
                  label: 'New Task: Click to edit description',
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
          }}
          className="cursor-pointer transition-opacity hover:opacity-80"
          style={{
            padding: '6px 14px', fontSize: 11, fontWeight: 600,
            background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6,
            marginRight: 16
          }}
        >
          + Add Task
        </button>

        {/* Navigation */}
        <button
          onClick={() => setMilestoneIdx(Math.max(0, milestoneIdx - 1))}
          disabled={milestoneIdx === 0}
          className="cursor-pointer disabled:opacity-30"
          style={{ background: 'none', border: 'none', color: 'var(--theme-muted)', fontSize: 16 }}
        >
          ◀
        </button>
        <select
          value={milestoneIdx}
          onChange={(e) => setMilestoneIdx(Number(e.target.value))}
          style={{
            background: 'var(--theme-dark)', border: '1px solid var(--theme-border)',
            borderRadius: 4, padding: '2px 8px', fontSize: 11,
            color: 'var(--theme-primary-text)'
          }}
        >
          {tracker.milestones.map((m, i) => (
            <option key={m.id} value={i}>{m.title}</option>
          ))}
        </select>
        <button
          onClick={() => setMilestoneIdx(Math.min(tracker.milestones.length - 1, milestoneIdx + 1))}
          disabled={milestoneIdx >= tracker.milestones.length - 1}
          className="cursor-pointer disabled:opacity-30"
          style={{ background: 'none', border: 'none', color: 'var(--theme-muted)', fontSize: 16 }}
        >
          ▶
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--theme-border)', background: 'var(--theme-surface)' }}>
        {[
          { id: 'all', label: 'All', count: milestone.subtasks.length },
          { id: 'my_tasks', label: 'My Tasks', count: milestone.subtasks.filter((t) => t.assignee === 'human' || t.assignee === 'operator').length },
          { id: 'agent_tasks', label: 'Agent Tasks', count: milestone.subtasks.filter((t) => t.execution_mode === 'agent').length },
          { id: 'blocked', label: 'Blocked', count: milestone.subtasks.filter((t) => t.status === 'blocked').length }
        ].map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="cursor-pointer transition-colors relative"
              style={{
                padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                color: isActive ? '#fff' : 'var(--theme-muted)',
                border: isActive ? 'none' : '1px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="active-filter"
                  className="absolute inset-0"
                  style={{ background: '#585CF0', borderRadius: 16, zIndex: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{f.label}</span>
              <span className="mono" style={{ 
                fontSize: 10, 
                position: 'relative',
                zIndex: 1,
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--theme-border)',
                padding: '2px 6px', borderRadius: 10,
                color: isActive ? '#fff' : 'var(--theme-muted)'
              }}>{f.count}</span>
            </button>
          )
        })}
      </div>

      {/* Kanban columns */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={customCollisionDetection} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex overflow-hidden">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id)
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                subtasks={colTasks}
                domain={milestone.domain}
                onCardClick={setSelectedTask}
                onAddTask={(status) => {
                  const id = crypto.randomUUID()
                  updateTracker(draft => {
                    const m = draft.milestones[milestoneIdx]
                    if (m) {
                      m.subtasks.push({
                        id,
                        label: 'New Task: Click to edit description',
                        status: status as any,
                        done: status === 'done',
                        assignee: null,
                        blocked_by: status === 'blocked' ? 'manual' : null,
                        blocked_reason: null,
                        completed_at: status === 'done' ? new Date().toISOString() : null,
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
                }}
              />
            )
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <TaskCardContent subtask={activeTask} isOverlay={true} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          subtask={selectedTask}
          milestone={milestone}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
