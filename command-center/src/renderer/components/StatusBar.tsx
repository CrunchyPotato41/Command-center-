import React from 'react'
import { useStore, selectCurrentWeek, selectCurrentPhase, selectScheduleStatus, selectOverallProgress } from '../store'

export function StatusBar() {
  const tracker = useStore((s) => s.tracker)
  const synced = useStore((s) => s.synced)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)

  const week = selectCurrentWeek(tracker)
  const phase = selectCurrentPhase(tracker)
  const status = selectScheduleStatus(tracker)
  const progress = selectOverallProgress(tracker)

  const totalTasks = tracker?.milestones.reduce((s, m) => s + m.subtasks.length, 0) ?? 0
  const doneTasks = tracker?.milestones.reduce(
    (s, m) => s + m.subtasks.filter((t) => t.done).length, 0
  ) ?? 0
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const statusConfig = {
    on_track: { label: 'ON TRACK', color: '#22c55e' },
    behind: { label: 'BEHIND', color: '#ef4444' },
    ahead: { label: 'AHEAD', color: '#22c55e' }
  }
  const st = statusConfig[status]

  return (
    <div className="no-drag flex items-center gap-3 px-4 text-xs">
      {/* Week + Phase */}
      <span className="mono font-medium" style={{ color: 'var(--theme-primary-text)' }}>
        WEEK {week}
      </span>
      {phase && (
        <>
          <span style={{ color: 'var(--theme-muted)' }}>·</span>
          <span style={{ color: 'var(--theme-muted)' }}>{phase}</span>
        </>
      )}

      {/* Mini progress bar */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{ width: 60, height: 4, background: 'var(--theme-progress-track)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: '#585CF0' }}
        />
      </div>

      {/* Progress text */}
      <span className="mono" style={{ color: 'var(--theme-muted)' }}>
        {doneTasks}/{totalTasks} ({pct}%)
      </span>

      {/* Schedule chip */}
      <span
        className="tag"
        style={{
          background: `${st.color}15`,
          color: st.color,
          fontWeight: 600,
          letterSpacing: '0.03em'
        }}
      >
        {st.label}
      </span>

      {/* Sync indicator */}
      <div className="flex items-center gap-1">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: synced ? '#22c55e' : '#ef4444' }}
        />
        <span style={{ color: 'var(--theme-muted)', fontSize: 10 }}>
          {synced ? 'Synced' : 'Out of sync'}
        </span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-1 rounded transition-colors cursor-pointer"
        style={{ color: 'var(--theme-muted)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--theme-primary-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--theme-muted)')}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 9.5A5.5 5.5 0 016.5 2.5 6 6 0 1013.5 9.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}
