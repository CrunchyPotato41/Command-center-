import React, { useEffect } from 'react'
import { useStore } from './store'
import { TabBar } from './components/TabBar'
import { StatusBar } from './components/StatusBar'

// Views
import { SwimLane } from './views/SwimLane'
import { TaskBoard } from './views/TaskBoard'
import { AgentHub } from './views/AgentHub'
import { Calendar } from './views/Calendar'

export default function App() {
  const activeTab = useStore((s) => s.activeTab)
  const isConnected = useStore((s) => s.synced)
  const tracker = useStore((s) => s.tracker)
  const setTracker = useStore((s) => s.setTracker)
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    // Initial read
    window.api.tracker.read().then((data) => {
      if (data) setTracker(JSON.parse(data))
    })

    // Listen for updates from main process
    const unlisten = window.api.tracker.onUpdated((json) => {
      setTracker(JSON.parse(json))
    })

    return () => unlisten()
  }, [setTracker])

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden" style={{ background: 'var(--theme-dark)', color: 'var(--theme-primary-text)' }}>
      <TabBar />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Splash screen when not connected/hydrated */}
        {!isConnected || !tracker ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--theme-muted)]">
            <div className="mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="animate-pulse">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                <path d="M12 6v6l4 2" strokeOpacity="0.5" />
              </svg>
            </div>
            <div className="text-sm font-medium tracking-wider">
              {!isConnected ? 'CONNECTING TO MAIN PROCESS...' : 'WAITING FOR HYDRATION...'}
            </div>
            <div className="text-xs opacity-50 mt-2 font-mono">
              d:\GameDev\command\project-tracker.json
            </div>
          </div>
        ) : (
          /* View Router */
          <>
            {activeTab === 'swim-lane' && <SwimLane />}
            {activeTab === 'task-board' && <TaskBoard />}
            {activeTab === 'agent-hub' && <AgentHub />}
            {activeTab === 'calendar' && <Calendar />}
          </>
        )}
      </main>

      <StatusBar />
    </div>
  )
}
