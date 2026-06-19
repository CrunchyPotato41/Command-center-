import React, { useState, useMemo } from 'react'
import { useStore, AgentLogEntry, Agent } from '../store'

const TAG_COLORS: Record<string, string> = {
  start: '#585CF0',
  review: '#f59e0b',
  approve: '#22c55e',
  reject: '#ef4444',
  block: '#ef4444',
  unblock: '#22c55e',
  enrich: '#8286FF',
  agent: '#14B8A6',
  mcp: '#585CF0',
  reset: '#9B9BAA',
  system: '#6366F1',
  note: '#f59e0b',
  milestone: '#EC4899',
  drift: '#F97316',
  update: '#06B6D4'
}

function groupByDay(entries: AgentLogEntry[]): Record<string, AgentLogEntry[]> {
  const groups: Record<string, AgentLogEntry[]> = {}
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  for (const entry of entries) {
    const day = entry.timestamp.split('T')[0]
    const label = day === today ? 'TODAY' : day === yesterday ? 'YESTERDAY' : day
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }
  return groups
}

export function AgentHub() {
  const tracker = useStore((s) => s.tracker)
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayLimit, setDisplayLimit] = useState(30)
  const [copiedContext, setCopiedContext] = useState(false)

  if (!tracker) return null

  // Left sidebar data
  const agents = tracker.agents
  const orchestrators = agents.filter((a) => a.type === 'orchestrator')
  const subAgents = agents.filter((a) => a.type === 'sub-agent')
  const humans = agents.filter((a) => a.type === 'human')
  const externals = agents.filter((a) => a.type === 'external')

  // Stats
  const todayLog = tracker.agent_log.filter((l) => {
    return new Date(l.timestamp).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
  })
  const completedToday = todayLog.filter((l) => l.action === 'task_approved').length
  const inProgressCount = tracker.milestones.reduce(
    (s, m) => s + m.subtasks.filter((t) => t.status === 'in_progress').length, 0
  )
  const blockedCount = tracker.milestones.reduce(
    (s, m) => s + m.subtasks.filter((t) => t.status === 'blocked').length, 0
  )

  // Activity feed
  const filteredLog = useMemo(() => {
    let logs = [...tracker.agent_log].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    if (agentFilter !== 'all') logs = logs.filter((l) => l.agent_id === agentFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      logs = logs.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return logs
  }, [tracker.agent_log, agentFilter, searchQuery])

  const displayedLog = filteredLog.slice(0, displayLimit)
  const groupedLog = groupByDay(displayedLog)

  // Context injection preview
  const contextPreview = `Project: ${tracker.project.name}\nWeek: ${tracker.project.current_week}\nStatus: ${tracker.project.schedule_status}\nProgress: ${Math.round(tracker.project.overall_progress * 100)}%\nAgents: ${agents.length} registered\nMilestones: ${tracker.milestones.length}\nActive tasks: ${inProgressCount}\nBlocked: ${blockedCount}`

  function handleCopyContext() {
    navigator.clipboard.writeText(contextPreview).then(() => {
      setCopiedContext(true)
      setTimeout(() => setCopiedContext(false), 2000)
    })
  }

  const statusDot = (status: string) => {
    const color = status === 'active' ? '#22c55e' : status === 'idle' ? '#f59e0b' : '#9B9BAA'
    return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar */}
      <div
        className="flex flex-col overflow-auto"
        style={{
          width: 340, minWidth: 340, borderRight: '1px solid var(--theme-border)',
          background: 'var(--theme-surface)'
        }}
      >
        {/* Connected Agents */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--theme-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)', marginBottom: 8 }}>
            Connected Agents ({agents.length})
          </div>
          {agents.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--theme-muted)', opacity: 0.5 }}>No agents registered</div>
          ) : (
            <>
              {[
                { label: 'Orchestrators', items: orchestrators },
                { label: 'Sub-Agents', items: subAgents },
                { label: 'Humans', items: humans },
                { label: 'External', items: externals }
              ].filter((g) => g.items.length > 0).map((group) => (
                <div key={group.label} className="mb-3">
                  <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--theme-muted)', marginBottom: 4 }}>
                    {group.label}
                  </div>
                  {group.items.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded mb-1"
                      style={{ background: 'var(--theme-dark)', fontSize: 11 }}
                    >
                      {statusDot(agent.status)}
                      <div
                        style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: agent.color, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 700, color: '#fff'
                        }}
                      >
                        {agent.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate" style={{ fontWeight: 500 }}>{agent.name}</div>
                        <div className="mono" style={{ fontSize: 9, color: 'var(--theme-muted)' }}>
                          {agent.session_action_count} actions
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {agent.permissions.slice(0, 2).map((p) => (
                          <span key={p} className="tag" style={{ background: 'var(--theme-border)', color: 'var(--theme-muted)', fontSize: 7 }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Context Injection Preview */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--theme-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)' }}>
              Context Preview
            </div>
            <button
              onClick={handleCopyContext}
              className="cursor-pointer"
              style={{
                padding: '2px 8px', fontSize: 9, fontWeight: 600,
                background: copiedContext ? '#22c55e' : '#585CF0',
                color: '#fff', border: 'none', borderRadius: 4,
                transition: 'background 150ms ease'
              }}
            >
              {copiedContext ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre
            className="mono"
            style={{
              fontSize: 9, lineHeight: 1.5, padding: '8px 10px',
              background: 'var(--theme-dark)', borderRadius: 6,
              color: 'var(--theme-muted)', whiteSpace: 'pre-wrap',
              border: '1px solid var(--theme-border)',
              overflow: 'auto', maxHeight: 140
            }}
          >
            {contextPreview}
          </pre>
        </div>

        {/* Today's Summary */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-muted)', marginBottom: 8 }}>
            Today's Summary
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div style={{ background: 'var(--theme-dark)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{completedToday}</div>
              <div style={{ fontSize: 9, color: 'var(--theme-muted)' }}>Completed</div>
            </div>
            <div style={{ background: 'var(--theme-dark)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#585CF0' }}>{inProgressCount}</div>
              <div style={{ fontSize: 9, color: 'var(--theme-muted)' }}>Active</div>
            </div>
            <div style={{ background: 'var(--theme-dark)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{blockedCount}</div>
              <div style={{ fontSize: 9, color: 'var(--theme-muted)' }}>Blocked</div>
            </div>
          </div>

          {/* Per-agent breakdown */}
          {todayLog.length > 0 && (
            <div className="mt-3">
              <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: 'var(--theme-muted)', marginBottom: 4 }}>
                Contributions
              </div>
              {[...new Set(todayLog.map((l) => l.agent_id))].map((agentId) => {
                const count = todayLog.filter((l) => l.agent_id === agentId).length
                const agent = agents.find((a) => a.id === agentId)
                return (
                  <div key={agentId} className="flex items-center gap-2 py-1" style={{ fontSize: 10 }}>
                    <div
                      style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: agent?.color || '#9B9BAA'
                      }}
                    />
                    <span style={{ flex: 1 }}>{agent?.name || agentId}</span>
                    <span className="mono" style={{ color: 'var(--theme-muted)' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Activity Feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Filter bar */}
        <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <div className="flex gap-1 flex-1">
            <button
              onClick={() => setAgentFilter('all')}
              className="cursor-pointer"
              style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 500,
                background: agentFilter === 'all' ? '#585CF0' : 'transparent',
                color: agentFilter === 'all' ? '#fff' : 'var(--theme-muted)',
                border: 'none'
              }}
            >
              All
            </button>
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgentFilter(a.id)}
                className="cursor-pointer"
                style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 500,
                  background: agentFilter === a.id ? a.color : 'transparent',
                  color: agentFilter === a.id ? '#fff' : 'var(--theme-muted)',
                  border: 'none'
                }}
              >
                {a.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            style={{
              width: 160, padding: '4px 10px', fontSize: 10,
              background: 'var(--theme-dark)', border: '1px solid var(--theme-border)',
              borderRadius: 6, color: 'var(--theme-primary-text)', outline: 'none'
            }}
          />
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {Object.entries(groupedLog).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--theme-muted)', fontSize: 11, opacity: 0.5 }}>
              No activity recorded yet
            </div>
          ) : (
            Object.entries(groupedLog).map(([day, entries]) => (
              <div key={day} className="mb-4">
                <div className="sticky top-0 z-10 py-1 mb-2" style={{ background: 'var(--theme-dark)' }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: 'var(--theme-muted)',
                      background: 'var(--theme-surface)', padding: '2px 8px', borderRadius: 4
                    }}
                  >
                    {day}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {entries.map((entry) => {
                    const agent = agents.find((a) => a.id === entry.agent_id)
                    return (
                      <div
                        key={entry.id}
                        className="flex gap-2 py-2 px-3 rounded-lg"
                        style={{ background: 'var(--theme-surface)', fontSize: 11 }}
                      >
                        <div
                          style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            background: agent?.color || '#9B9BAA',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, fontWeight: 700, color: '#fff', marginTop: 1
                          }}
                        >
                          {(agent?.name || entry.agent_id)[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span style={{ fontWeight: 600 }}>{agent?.name || entry.agent_id}</span>
                            <span style={{ color: 'var(--theme-muted)', fontSize: 10 }}>·</span>
                            <span className="mono" style={{ fontSize: 9, color: 'var(--theme-muted)' }}>
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ color: 'var(--theme-muted)', lineHeight: 1.4 }}>
                            {entry.description}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="tag"
                                style={{
                                  background: `${TAG_COLORS[tag] || '#9B9BAA'}15`,
                                  color: TAG_COLORS[tag] || '#9B9BAA',
                                  fontSize: 8
                                }}
                              >
                                {tag.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {/* Load More */}
          {filteredLog.length > displayLimit && (
            <button
              onClick={() => setDisplayLimit((l) => l + 30)}
              className="w-full py-2 cursor-pointer"
              style={{
                background: 'var(--theme-surface)', border: '1px solid var(--theme-border)',
                borderRadius: 6, fontSize: 10, color: 'var(--theme-muted)', marginTop: 8
              }}
            >
              Load More ({filteredLog.length - displayLimit} remaining)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
