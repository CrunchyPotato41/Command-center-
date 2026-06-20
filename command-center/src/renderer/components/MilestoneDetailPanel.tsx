import React, { useState } from 'react'
import { useStore, Milestone, selectMilestoneProgress } from '../store'
import { ProgressRing } from './ProgressRing'

interface Props {
  milestone: Milestone
  onClose: () => void
}

export function MilestoneDetailPanel({ milestone, onClose }: Props) {
  const tracker = useStore((s) => s.tracker)
  const updateTracker = useStore((s) => s.updateTracker)
  const { done, total, pct } = selectMilestoneProgress(milestone)
  const [newNote, setNewNote] = useState('')
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [plannedStart, setPlannedStart] = useState(milestone.planned_start || '')
  const [plannedEnd, setPlannedEnd] = useState(milestone.planned_end || '')

  const domainColor = '#585CF0' // fallback, ideally from getDomainColor

  function handleCheckboxToggle(taskId: string) {
    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (!m) return
      const task = m.subtasks.find((t) => t.id === taskId)
      if (!task) return
      if (task.done) {
        task.done = false
        task.status = 'todo'
        task.completed_at = null
        task.completed_by = null
      } else {
        task.done = true
        task.status = 'done'
        task.completed_at = new Date().toISOString()
        task.completed_by = 'operator'
      }
    })
  }

  function handleAddNote() {
    if (!newNote.trim()) return
    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (m) {
        if (!m.notes) m.notes = []
        m.notes.push(newNote.trim())
      }
    })
    setNewNote('')
  }

  function handleSaveDates() {
    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (!m) return
      m.planned_start = plannedStart || null
      m.planned_end = plannedEnd || null
    })
  }

  function handleSaveEditNote(index: number) {
    if (!editNoteText.trim()) return
    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (m && m.notes && m.notes[index] !== undefined) {
        m.notes[index] = editNoteText.trim()
      }
    })
    setEditingNoteIndex(null)
  }

  function handleDeleteNote(index: number) {
    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (m && m.notes) {
        m.notes.splice(index, 1)
      }
    })
    setEditingNoteIndex(null)
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': return '✓'
      case 'in_progress': return '▶'
      case 'blocked': return '⊘'
      case 'review': return '◎'
      default: return '○'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'done': return '#22c55e'
      case 'in_progress': return '#585CF0'
      case 'blocked': return '#ef4444'
      case 'review': return '#f59e0b'
      default: return 'var(--theme-muted)'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-20" 
        style={{ background: 'rgba(0,0,0,0.1)' }} 
        onClick={onClose}
      />
      <div
        className="animate-slide-in"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 480,
          background: 'var(--theme-surface)',
          borderLeft: '1px solid var(--theme-border)',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--theme-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="tag" style={{ background: `${domainColor}18`, color: domainColor }}>
              {milestone.domain}
            </span>
            <span className="tag mono" style={{ background: 'var(--theme-border)', color: 'var(--theme-muted)' }}>
              W{milestone.week}
            </span>
            {milestone.key_milestone_label && (
              <span className="tag" style={{ background: '#f59e0b18', color: '#f59e0b' }}>
                {milestone.key_milestone_label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer"
            style={{ color: 'var(--theme-muted)', fontSize: 18, background: 'none', border: 'none', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{milestone.title}</div>
        {milestone.notes?.[0] && (
          <div style={{ fontSize: 11, color: 'var(--theme-muted)', marginTop: 4, lineHeight: 1.4 }} className="line-clamp-2">
            {milestone.notes[0]}
          </div>
        )}
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <span style={{ fontSize: 10, color: 'var(--theme-muted)' }}>Progress</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--theme-muted)' }}>{done}/{total} ({pct}%)</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--theme-progress-track)' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: domainColor, transition: 'width 300ms ease' }} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {/* Schedule */}
        <div className="mb-5">
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)' }}>
            Schedule
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label style={{ fontSize: 10, color: 'var(--theme-muted)' }}>Planned Start</label>
              <input
                type="date"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                style={{
                  width: '100%', padding: '4px 8px', fontSize: 11,
                  background: 'var(--theme-dark)', border: '1px solid var(--theme-border)',
                  borderRadius: 4, color: 'var(--theme-primary-text)', marginTop: 2
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--theme-muted)' }}>Planned End</label>
              <input
                type="date"
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
                style={{
                  width: '100%', padding: '4px 8px', fontSize: 11,
                  background: 'var(--theme-dark)', border: '1px solid var(--theme-border)',
                  borderRadius: 4, color: 'var(--theme-primary-text)', marginTop: 2
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--theme-muted)' }}>Actual Start</label>
              <div className="mono" style={{ fontSize: 11, marginTop: 4, color: 'var(--theme-primary-text)' }}>
                {milestone.actual_start || '—'}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--theme-muted)' }}>Actual End</label>
              <div className="mono" style={{ fontSize: 11, marginTop: 4, color: 'var(--theme-primary-text)' }}>
                {milestone.actual_end || '—'}
              </div>
            </div>
          </div>
          {milestone.drift_days !== 0 && (
            <div
              className="mono mt-2"
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: milestone.drift_days > 0 ? '#ef4444' : '#22c55e'
              }}
            >
              {Math.abs(milestone.drift_days)} DAYS {milestone.drift_days > 0 ? 'BEHIND' : 'AHEAD'}
            </div>
          )}
          <button
            onClick={handleSaveDates}
            className="mt-2 cursor-pointer"
            style={{
              padding: '4px 12px', fontSize: 10, fontWeight: 600,
              background: '#585CF0', color: '#fff', border: 'none',
              borderRadius: 4
            }}
          >
            Save Dates
          </button>
        </div>

        {/* Subtasks */}
        <div className="mb-5">
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)' }}>
            SUBTASKS — {done}/{total}
          </div>
          {(milestone.subtasks ?? []).length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--theme-muted)', opacity: 0.5 }}>No tasks yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {(milestone.subtasks ?? []).map((task) => {
                // Determine priority colors
                let pBg = 'var(--theme-border)'
                let pColor = 'var(--theme-muted)'
                const normalizedPriority = (task.priority || '').toUpperCase()
                if (normalizedPriority === 'P1') {
                  pBg = 'rgba(239, 68, 68, 0.1)'
                  pColor = '#ef4444'
                } else if (normalizedPriority === 'P2') {
                  pBg = 'rgba(245, 158, 11, 0.1)'
                  pColor = '#f59e0b'
                } else if (normalizedPriority === 'P3') {
                  pBg = 'rgba(34, 197, 94, 0.1)'
                  pColor = '#22c55e'
                }

                return (
                  <div
                    key={task.id}
                    onClick={() => handleCheckboxToggle(task.id)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded cursor-pointer hover:bg-[var(--theme-hover)] transition-all"
                    style={{ 
                      background: 'var(--theme-surface)', 
                      border: '1px solid var(--theme-border)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div 
                      className="flex items-center justify-center shrink-0 transition-colors"
                      style={{ 
                        width: 14, height: 14, borderRadius: 3, 
                        border: task.done ? 'none' : '1px solid var(--theme-muted)', 
                        background: task.done ? '#22c55e' : 'transparent',
                        opacity: task.done ? 1 : 0.5
                      }}
                    >
                      {task.done && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1.5 4L3.5 6L8.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span 
                      style={{ 
                        flex: 1, 
                        fontSize: 12,
                        color: task.done ? 'var(--theme-muted)' : 'var(--theme-primary-text)', 
                        textDecoration: task.done ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {task.label}
                    </span>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {task.assignee && (
                        <span className="tag" style={{ background: 'var(--theme-border)', color: 'var(--theme-muted)', fontSize: 9 }}>
                          @{task.assignee}
                        </span>
                      )}
                      
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--theme-muted)', opacity: 0.5 }} />
                      
                      <span className="tag mono" style={{ background: pBg, color: pColor, fontSize: 9, fontWeight: 700 }}>
                        {normalizedPriority}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Dependencies */}
        {milestone.dependencies.length > 0 && (
          <div className="mb-5">
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)' }}>
              Dependencies
            </div>
            <div className="flex flex-col gap-2">
              {milestone.dependencies.map((depId) => {
                const dep = tracker?.milestones.find((m) => m.id === depId)
                if (!dep) return null
                const depProgress = selectMilestoneProgress(dep)
                return (
                  <div key={depId} className="flex items-center gap-2" style={{ fontSize: 11 }}>
                    <ProgressRing size={24} done={depProgress.done} total={depProgress.total} color="#585CF0" />
                    <span>{dep.title}</span>
                    <span className="mono" style={{ color: 'var(--theme-muted)', fontSize: 9 }}>W{dep.week}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-5">
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)' }}>
            Notes / Exit Criteria
          </div>
          {milestone.notes?.map((note, i) => (
            editingNoteIndex === i ? (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  type="text"
                  value={editNoteText}
                  onChange={(e) => setEditNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEditNote(i)
                    if (e.key === 'Escape') setEditingNoteIndex(null)
                  }}
                  autoFocus
                  style={{
                    flex: 1, padding: '6px 10px', fontSize: 11,
                    background: 'var(--theme-surface)', border: '1px solid #585CF0',
                    borderRadius: 4, color: 'var(--theme-primary-text)',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSaveEditNote(i)}
                  className="cursor-pointer"
                  style={{
                    padding: '6px 12px', fontSize: 10, fontWeight: 600,
                    background: '#585CF0', color: '#fff', border: 'none',
                    borderRadius: 4
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => handleDeleteNote(i)}
                  className="cursor-pointer hover:bg-red-50"
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 600,
                    background: 'transparent', color: '#ef4444', border: '1px solid var(--theme-border)',
                    borderRadius: 4
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                key={i}
                className="group relative cursor-pointer"
                onClick={() => {
                  setEditingNoteIndex(i)
                  setEditNoteText(note)
                }}
                style={{
                  padding: '8px 12px', marginBottom: 4, borderRadius: 6,
                  background: 'var(--theme-dark)', fontSize: 11,
                  color: 'var(--theme-primary-text)', lineHeight: 1.5,
                  paddingRight: 40
                }}
              >
                {note}
                <div className="absolute right-3 top-[50%] -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span style={{ fontSize: 10, color: 'var(--theme-muted)' }}>Edit</span>
                </div>
              </div>
            )
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              placeholder="Add a note..."
              style={{
                flex: 1, padding: '6px 10px', fontSize: 11,
                background: 'var(--theme-dark)', border: '1px solid var(--theme-border)',
                borderRadius: 4, color: 'var(--theme-primary-text)',
                outline: 'none'
              }}
            />
            <button
              onClick={handleAddNote}
              className="cursor-pointer"
              style={{
                padding: '6px 12px', fontSize: 10, fontWeight: 600,
                background: '#585CF0', color: '#fff', border: 'none',
                borderRadius: 4
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
