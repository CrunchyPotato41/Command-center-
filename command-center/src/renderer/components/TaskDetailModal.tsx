import React, { useState } from 'react'
import { useStore, Subtask, Milestone } from '../store'

interface Props {
  subtask: Subtask
  milestone: Milestone
  onClose: () => void
}

export function TaskDetailModal({ subtask, milestone, onClose }: Props) {
  const tracker = useStore((s) => s.tracker)
  const updateTracker = useStore((s) => s.updateTracker)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [status, setStatus] = useState(subtask.status)
  const [priority, setPriority] = useState(subtask.priority)
  const [assignee, setAssignee] = useState(subtask.assignee || '')
  const [execMode, setExecMode] = useState(subtask.execution_mode)
  const [notes, setNotes] = useState(subtask.notes || '')
  const [isBlocked, setIsBlocked] = useState(subtask.status === 'blocked')
  const [blockedReason, setBlockedReason] = useState(subtask.blocked_reason || '')
  const [copied, setCopied] = useState(false)

  const agentLog = (tracker?.agent_log ?? []).filter((l) => l.target_id === subtask.id)

  function handleSave() {
    updateTracker((draft) => {
      const m = draft.milestones.find((ms) => ms.id === milestone.id)
      if (!m) return
      const task = m.subtasks.find((t) => t.id === subtask.id)
      if (!task) return

      task.priority = priority
      task.assignee = assignee || null
      task.execution_mode = execMode as Subtask['execution_mode']
      task.notes = notes || null

      if (isBlocked && task.status !== 'blocked') {
        task.status = 'blocked'
        task.blocked_reason = blockedReason
        task.blocked_by = 'operator'
      } else if (!isBlocked && task.status === 'blocked') {
        task.status = 'todo'
        task.blocked_by = null
        task.blocked_reason = null
      }
    })
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'done': return '#22c55e'
      case 'in_progress': return '#585CF0'
      case 'blocked': return '#ef4444'
      case 'review': return '#f59e0b'
      default: return 'var(--theme-muted)'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.1)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div
        className="h-full shadow-2xl flex flex-col"
        style={{
          background: 'var(--theme-surface)',
          width: 500,
          animation: 'slide-in-right 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 24px 0 24px' }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: '#22c55e15', padding: '2px 6px', borderRadius: 4 }}>
              {milestone.domain}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: '#ef444415', padding: '2px 6px', borderRadius: 4 }}>
              {subtask.priority.toUpperCase()}
            </span>
            {subtask.execution_mode && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: '#ef444415', padding: '2px 6px', borderRadius: 4 }}>
                {subtask.execution_mode}
              </span>
            )}
          </div>
          
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--theme-primary-text)', lineHeight: 1.3, marginBottom: 8 }}>
            {(subtask.label || 'Untitled').split(/[:\-–]/)[0].trim()}: {((subtask.label || 'Untitled').split(/[:\-–]/).slice(1).join(' ').trim())}
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <span className="mono" style={{ fontSize: 11, color: 'var(--theme-muted)' }}>{subtask.id.toLowerCase()}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(subtask.id).then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }).catch(err => console.error('Failed to copy ID', err))
              }}
              className="cursor-pointer transition-colors"
              style={{
                fontSize: 10, padding: '2px 6px', border: copied ? '1px solid #22c55e' : '1px solid var(--theme-border)',
                background: copied ? '#22c55e20' : 'transparent', borderRadius: 4, color: copied ? '#22c55e' : 'var(--theme-muted)'
              }}
            >
              {copied ? '✓ Copied' : 'Copy ID'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
            {(['details', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="cursor-pointer capitalize pb-2"
                style={{
                  fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
                  color: activeTab === tab ? '#585CF0' : 'var(--theme-muted)',
                  background: 'none', border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #585CF0' : '2px solid transparent',
                  marginBottom: -1
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '24px' }}>
          {activeTab === 'details' ? (
            <div className="flex flex-col gap-6">
              {/* Status */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>STATUS</label>
                <div style={{ padding: '10px 12px', border: '1px solid var(--theme-border)', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                  {status.replace('_', ' ')}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>PRIORITY</label>
                <div style={{ padding: '10px 12px', border: '1px solid var(--theme-border)', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                  {priority === 'p1' ? 'P1 — Critical' : priority === 'p2' ? 'P2 — High' : 'P3 — Normal'}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>ASSIGNEE</label>
                <div style={{ padding: '10px 12px', border: '1px solid var(--theme-border)', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                  {assignee || 'Unassigned'}
                </div>
              </div>

              {/* Execution mode */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>EXECUTION MODE</label>
                <div className="flex gap-2">
                  {(['human', 'agent', 'pair'] as const).map((mode) => {
                    const isSelected = execMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setExecMode(mode)}
                        className="cursor-pointer flex-1"
                        style={{
                          padding: '10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: isSelected ? '#ef444410' : 'transparent',
                          color: isSelected ? '#ef4444' : 'var(--theme-muted)',
                          border: isSelected ? '1px solid #ef4444' : '1px solid var(--theme-border)', 
                          textTransform: 'capitalize'
                        }}
                      >
                        {mode}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Blocked */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBlocked}
                    onChange={(e) => setIsBlocked(e.target.checked)}
                    style={{ width: 14, height: 14 }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', letterSpacing: '0.05em' }}>BLOCKED</span>
                </label>
                {isBlocked && (
                  <input
                    className="mt-3 w-full"
                    style={{
                      background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
                      padding: '8px 12px', borderRadius: 6, fontSize: 12, color: 'var(--theme-primary-text)'
                    }}
                    placeholder="Blocked reason..."
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                  />
                )}
              </div>

              {/* Other tasks in this milestone */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.05em' }}>
                  OTHER TASKS IN THIS MILESTONE ({(milestone.subtasks ?? []).length - 1})
                </label>
                <div className="flex flex-col gap-2">
                  {(milestone.subtasks ?? []).filter(t => t.id !== subtask.id).slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--theme-muted)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--theme-border)' }} />
                      <div className="truncate">{t.label || 'Untitled'}</div>
                    </div>
                  ))}
                  {(milestone.subtasks ?? []).length > 6 && (
                    <div style={{ fontSize: 12, color: 'var(--theme-muted)', paddingLeft: 14 }}>
                      + {(milestone.subtasks ?? []).length - 6} more
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>NOTES</label>
                <textarea
                  style={{
                    width: '100%', minHeight: 80, background: 'var(--theme-dark)',
                    border: '1px solid var(--theme-border)', borderRadius: 6, padding: '12px',
                    fontSize: 13, color: 'var(--theme-primary-text)', resize: 'vertical'
                  }}
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Milestone link */}
              <div style={{ padding: '16px', background: 'var(--theme-dark)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--theme-border)' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--theme-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>MILESTONE</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-primary-text)' }}>{milestone.title}</div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('swim-lane')
                    onClose()
                  }}
                  className="cursor-pointer"
                  style={{ fontSize: 11, fontWeight: 600, color: '#585CF0', background: 'transparent', border: '1px solid #585CF040', padding: '6px 12px', borderRadius: 6 }}
                >
                  View in Swimlane
                </button>
              </div>
            </div>
          ) : (
            /* History tab */
            <div className="flex flex-col gap-2">
              {agentLog.length === 0 ? (
                <div style={{ color: 'var(--theme-muted)', fontSize: 11, opacity: 0.5, textAlign: 'center', padding: 20 }}>
                  No history recorded yet
                </div>
              ) : (
                agentLog.map((entry) => (
                  <div
                    key={entry.id}
                    style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--theme-dark)', fontSize: 11 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontWeight: 600 }}>{entry.agent_id}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--theme-muted)' }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ color: 'var(--theme-muted)', lineHeight: 1.4 }}>{entry.description}</div>
                    <div className="flex gap-1 mt-1.5">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="tag" style={{ background: 'var(--theme-border)', color: 'var(--theme-muted)', fontSize: 8 }}>
                          {tag.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--theme-border)' }}>
          <div className="flex gap-2 w-full justify-between items-center">
            <div className="flex items-center gap-4">
              <span style={{ fontSize: 11, color: 'var(--theme-muted)' }}>Status: {status}</span>
              <button
                onClick={() => {
                  updateTracker((draft) => {
                    const m = draft.milestones.find((ms) => ms.id === milestone.id)
                    if (m) {
                      m.subtasks = (m.subtasks ?? []).filter((t) => t.id !== subtask.id)
                    }
                  })
                  onClose()
                }}
                className="cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  padding: '4px 8px', fontSize: 10, background: 'transparent', fontWeight: 600,
                  border: '1px solid #ef444440', borderRadius: 4, color: '#ef4444'
                }}
              >
                Delete
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'var(--theme-dark)',
                  border: '1px solid var(--theme-border)', borderRadius: 6, color: 'var(--theme-primary-text)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600,
                  background: '#585CF0', border: 'none', borderRadius: 6, color: '#fff'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
