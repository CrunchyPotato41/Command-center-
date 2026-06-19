import React from 'react'

interface ProgressRingProps {
  size: number
  done: number
  total: number
  color: string
  trackColor?: string
  strokeWidth?: number
}

export function ProgressRing({
  size,
  done,
  total,
  color,
  trackColor = 'var(--theme-progress-track)',
  strokeWidth = 2.5
}: ProgressRingProps) {
  const radius = size / 2 - strokeWidth - 1
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? done / total : 0
  const dashArray = `${pct * circumference} ${circumference}`
  const center = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background fill */}
      <circle
        cx={center}
        cy={center}
        r={radius + strokeWidth / 2}
        fill="var(--theme-surface)"
      />
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      {/* Center text */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--theme-primary-text)"
        fontFamily="'JetBrains Mono', monospace"
        fontSize={size < 30 ? 7 : size < 50 ? 9 : 11}
        fontWeight={500}
      >
        {done}/{total}
      </text>
    </svg>
  )
}
