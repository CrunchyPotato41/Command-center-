import React from 'react'
import { useStore, TabId } from '../store'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'swim-lane',
    label: 'Swim Lane',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="4" r="1.5" fill="currentColor" />
        <circle cx="9" cy="8" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'task-board',
    label: 'Task Board',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="6" y="1" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="11" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  },
  {
    id: 'agent-hub',
    label: 'Agent Hub',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l5 3v6l-5 3-5-3V5l5-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }
]

import { motion } from 'framer-motion'

export function TabBar() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const agentLog = useStore((s) => s.tracker?.agent_log)

  const hasRecentActivity = agentLog?.some((entry) => {
    const entryTime = new Date(entry.timestamp).getTime()
    return Date.now() - entryTime < 30 * 60 * 1000
  }) ?? false

  return (
    <div className="no-drag flex items-center gap-1 px-3">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer"
            style={{
              color: isActive ? '#fff' : 'var(--theme-muted)',
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--theme-primary-text)'
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = 'var(--theme-muted)'
            }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-md"
                style={{ background: '#585CF0', zIndex: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
            </span>
            {tab.id === 'agent-hub' && hasRecentActivity && (
              <span
                className="animate-pulse-dot absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full z-20"
                style={{ background: '#22c55e' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
