import React, { useRef, useEffect, useState } from 'react'
import {
  useStore,
  selectCurrentWeekFractional,
  selectMilestoneProgress,
  Milestone,
  TrackerState
} from '../store'
import { ProgressRing } from '../components/ProgressRing'
import { MilestoneDetailPanel } from '../components/MilestoneDetailPanel'

const WEEK_W = 100
const LANE_H = 200
const LABEL_W = 140
const HEADER_H = 44
const NODE_R = 20
const KEY_NODE_R = 26

const COLOR_PALETTE = [
  '#f59e0b', '#22c55e', '#8286FF', '#ef4444', '#14B8A6',
  '#EC4899', '#F97316', '#6366F1', '#06B6D4', '#64748b'
]

function getDomainColor(domain: string): string {
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[idx]
}

function formatWeekDate(startDate: string, weekIdx: number): string {
  const start = new Date(startDate + 'T00:00:00')
  const d = new Date(start.getTime() + weekIdx * 7 * 24 * 60 * 60 * 1000)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function SwimLane() {
  const tracker = useStore((s) => s.tracker)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [panelMilestoneId, setPanelMilestoneId] = useState<string | null>(null)
  const panelMilestone = panelMilestoneId && tracker ? tracker.milestones.find((m) => m.id === panelMilestoneId) : null

  if (!tracker) return null

  const startDate = tracker.project.start_date
  const targetDate = tracker.project.target_date
  const start = new Date(startDate + 'T00:00:00')
  const target = new Date(targetDate + 'T00:00:00')
  const totalWeeks = Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  const TOTAL_W = WEEK_W * totalWeeks
  const fractionalWeek = selectCurrentWeekFractional(tracker)

  // Group milestones by domain
  const domains = [...new Set(tracker.milestones.map((m) => m.domain))]
  if (domains.length === 0) domains.push('general')

  const totalHeight = HEADER_H + domains.length * LANE_H + 60

  // Auto-scroll to NOW on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowX = (fractionalWeek - 1) * WEEK_W + LABEL_W
      scrollRef.current.scrollLeft = Math.max(0, nowX - scrollRef.current.clientWidth / 2)
    }
  }, [])

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative" style={{ background: 'var(--theme-dark)' }}>
        <div style={{ width: LABEL_W + TOTAL_W, height: totalHeight, position: 'relative' }}>

          {/* Sticky left labels */}
          <div
            style={{
              position: 'sticky',
              left: 0,
              width: LABEL_W,
              height: totalHeight,
              zIndex: 20,
              background: 'var(--theme-dark)',
              borderRight: '1px solid var(--theme-border)',
              top: 0,
              float: 'left'
            }}
          >
            {/* Header spacer */}
            <div style={{ height: HEADER_H, borderBottom: '1px solid var(--theme-border)' }} />
            {domains.map((domain, i) => {
              const color = getDomainColor(domain)
              return (
                <div
                  key={domain}
                  style={{
                    height: LANE_H,
                    borderBottom: '1px solid var(--theme-border)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px'
                  }}
                >
                  <div
                    style={{
                      background: `${color}18`,
                      borderLeft: `3px solid ${color}`,
                      padding: '8px 12px',
                      borderRadius: '0 6px 6px 0',
                      width: '100%'
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color }}>{domain}</div>
                    <div className="mono" style={{ fontSize: 9, color: 'var(--theme-muted)', marginTop: 2 }}>
                      {tracker.milestones.filter((m) => m.domain === domain).length} milestones
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Timeline content */}
          <div style={{ marginLeft: LABEL_W, position: 'relative' }}>
            {/* Phase backgrounds */}
            {tracker.schedule.phases.map((phase) => {
              const x = (phase.start_week - 1) * WEEK_W
              const w = (phase.end_week - phase.start_week + 1) * WEEK_W
              return (
                <div
                  key={phase.id}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: HEADER_H,
                    width: w,
                    height: domains.length * LANE_H,
                    background: `${getDomainColor(phase.title)}08`,
                    borderLeft: `1px dashed ${getDomainColor(phase.title)}20`,
                    zIndex: 1
                  }}
                />
              )
            })}

            {/* Week grid lines */}
            {Array.from({ length: totalWeeks }, (_, i) => (
              <div
                key={`grid-${i}`}
                style={{
                  position: 'absolute',
                  left: i * WEEK_W,
                  top: 0,
                  width: 1,
                  height: totalHeight,
                  background: 'var(--theme-grid)',
                  zIndex: 2
                }}
              />
            ))}

            {/* Week headers */}
            <div style={{ display: 'flex', height: HEADER_H, borderBottom: '1px solid var(--theme-border)', position: 'relative', zIndex: 3 }}>
              {Array.from({ length: totalWeeks }, (_, i) => (
                <div
                  key={`header-${i}`}
                  style={{
                    width: WEEK_W,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    flexShrink: 0
                  }}
                >
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--theme-primary-text)', opacity: 0.7 }}>
                    W{i + 1}
                  </span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--theme-muted)' }}>
                    {formatWeekDate(startDate, i)}
                  </span>
                </div>
              ))}
            </div>

            {/* NOW marker */}
            <div
              style={{
                position: 'absolute',
                left: (fractionalWeek - 1) * WEEK_W,
                top: 0,
                width: 2,
                height: totalHeight,
                background: '#585CF0',
                zIndex: 15,
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: -20,
                  background: '#585CF0',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap'
                }}
                className="mono"
              >
                NOW
              </div>
            </div>

            {/* Swim lanes */}
            {domains.map((domain, laneIdx) => {
              const laneMilestones = tracker.milestones
                .filter((m) => m.domain === domain)
                .sort((a, b) => a.week - b.week)

              // Group milestones by week for stacking
              const byWeek: Record<number, Milestone[]> = {}
              laneMilestones.forEach((m) => {
                if (!byWeek[m.week]) byWeek[m.week] = []
                byWeek[m.week].push(m)
              })

              const laneY = HEADER_H + laneIdx * LANE_H
              const color = getDomainColor(domain)

              return (
                <div key={domain}>
                  {/* Lane background */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: laneY,
                      width: TOTAL_W,
                      height: LANE_H,
                      borderBottom: '1px solid var(--theme-border)',
                      zIndex: 3
                    }}
                  />

                  {/* Connection lines */}
                  {laneMilestones.length > 1 &&
                    laneMilestones.slice(0, -1).map((m, i) => {
                      const next = laneMilestones[i + 1]
                      const x1 = (m.week - 1) * WEEK_W + WEEK_W / 2 + NODE_R
                      const x2 = (next.week - 1) * WEEK_W + WEEK_W / 2 - NODE_R
                      const cy = laneY + LANE_H / 2
                      return (
                        <div
                          key={`conn-${m.id}-${next.id}`}
                          style={{
                            position: 'absolute',
                            left: x1,
                            top: cy - 1,
                            width: Math.max(0, x2 - x1),
                            height: 2,
                            background: `${color}40`,
                            zIndex: 4
                          }}
                        />
                      )
                    })}

                  {/* Milestone nodes */}
                  {Object.entries(byWeek).map(([weekStr, milestones]) => {
                    const week = parseInt(weekStr)
                    return milestones.map((m, stackIdx) => {
                      const cx = (week - 1) * WEEK_W + WEEK_W / 2
                      const stackOffset = (stackIdx - (milestones.length - 1) / 2) * 56
                      const cy = laneY + LANE_H / 2 + stackOffset
                      const r = m.is_key_milestone ? KEY_NODE_R : NODE_R
                      const { done, total } = selectMilestoneProgress(m)

                      return (
                        <React.Fragment key={m.id}>
                          {/* Removed Drift ghost node based on user request */}

                          {/* Main node */}
                          <div
                            onClick={() => setPanelMilestoneId(m.id)}
                            style={{
                              position: 'absolute',
                              left: cx - r + (m.drift_days * WEEK_W) / 7,
                              top: cy - r,
                              zIndex: 10,
                              cursor: 'pointer',
                              filter: panelMilestoneId === m.id 
                                ? `drop-shadow(0 0 8px ${color}80) drop-shadow(0 0 16px ${color}40)` 
                                : m.is_key_milestone 
                                  ? `drop-shadow(0 0 12px ${color}40)` 
                                  : undefined,
                              transition: 'all 150ms ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <ProgressRing size={r * 2} done={done} total={total} color={color} />
                          </div>

                          {/* Removed Drift bar based on user request */}

                          {/* Title below node */}
                          <div
                            style={{
                              position: 'absolute',
                              left: cx - 40 + (m.drift_days * WEEK_W) / 7,
                              top: cy + r + (m.drift_days !== 0 ? 22 : 6),
                              width: 80,
                              textAlign: 'center',
                              fontSize: 9,
                              color: 'var(--theme-muted)',
                              lineHeight: 1.2,
                              zIndex: 6,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {m.title}
                          </div>
                        </React.Fragment>
                      )
                    })
                  })}
                </div>
              )
            })}

            {/* Key milestone markers at bottom */}
            {tracker.milestones
              .filter((m) => m.is_key_milestone)
              .map((m) => {
                const cx = (m.week - 1) * WEEK_W + WEEK_W / 2
                const y = HEADER_H + domains.length * LANE_H + 10
                return (
                  <div key={`key-${m.id}`}>
                    {/* Dashed line through all lanes */}
                    <div
                      style={{
                        position: 'absolute',
                        left: cx,
                        top: HEADER_H,
                        width: 1,
                        height: domains.length * LANE_H,
                        borderLeft: `1px dashed ${getDomainColor(m.domain)}40`,
                        zIndex: 4
                      }}
                    />
                    {/* Diamond + label */}
                    <div
                      style={{
                        position: 'absolute',
                        left: cx - 40,
                        top: y,
                        width: 80,
                        textAlign: 'center',
                        zIndex: 6
                      }}
                    >
                      <div style={{ color: getDomainColor(m.domain), fontSize: 14 }}>◆</div>
                      <div className="mono" style={{ fontSize: 8, color: getDomainColor(m.domain), fontWeight: 600, marginTop: 2 }}>
                        {m.key_milestone_label}
                      </div>
                    </div>
                  </div>
                )
              })}

            {/* Empty state */}
            {tracker.milestones.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: HEADER_H,
                  width: TOTAL_W,
                  height: LANE_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--theme-muted)',
                  fontSize: 13,
                  opacity: 0.5
                }}
              >
                Milestones will appear here after hydration
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {panelMilestone && (
        <MilestoneDetailPanel
          milestone={panelMilestone}
          onClose={() => setPanelMilestoneId(null)}
        />
      )}
    </div>
  )
}
