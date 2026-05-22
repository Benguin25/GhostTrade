import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { api } from '../lib/api'

const C = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#21262d',
  text: '#e6edf3',
  muted: '#8b949e',
  blue: '#58a6ff',
  green: '#3fb950',
  red: '#f85149',
}

const TIME_RANGES = [
  { label: '1m',  seconds: 60 },
  { label: '5m',  seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '1H',  seconds: 3600 },
  { label: '4H',  seconds: 14400 },
  { label: '1D',  seconds: 86400 },
  { label: 'All', seconds: null },
]

const INTERVALS = [
  { label: '1s',  ms: 1000 },
  { label: '5s',  ms: 5000 },
  { label: '30s', ms: 30000 },
  { label: '1m',  ms: 60000 },
  { label: '5m',  ms: 300000 },
  { label: '10m', ms: 600000 },
]

// Max points to keep in the buffer (~2 hours at 1s, much more at slower intervals)
const MAX_BUFFER = 7200

function formatXLabel(ts, rangeSeconds) {
  const d = new Date(ts)
  if (rangeSeconds !== null && rangeSeconds <= 300) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const CustomTooltip = ({ active, payload, lineColor }) => {
  if (!active || !payload?.length) return null
  const { value, ts } = payload[0].payload
  return (
    <div style={{ backgroundColor: '#1c2128', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', fontSize: '13px' }}>
      <div style={{ color: C.muted, marginBottom: '4px' }}>
        {new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </div>
      <div style={{ color: lineColor, fontWeight: 600 }}>
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

function PillButton({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 9px', fontSize: '12px', fontWeight: active ? 700 : 400,
      borderRadius: '4px', border: 'none',
      backgroundColor: active ? (color === 'blue' ? 'rgba(88,166,255,0.15)' : '#21262d') : 'transparent',
      color: active ? (color === 'blue' ? C.blue : C.text) : C.muted,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  )
}

export default function PortfolioChart({ token }) {
  // Rolling buffer — never cleared, just capped at MAX_BUFFER
  const [buffer, setBuffer] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(TIME_RANGES[3])        // default 1H
  const [intervalOpt, setIntervalOpt] = useState(INTERVALS[1]) // default 5s
  const [live, setLive] = useState(true)
  const fetchingRef = useRef(false)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const p = await api.getPortfolio(token)
      setBuffer(prev => {
        const next = [...prev, { ts: Date.now(), value: p.total_value }]
        return next.length > MAX_BUFFER ? next.slice(next.length - MAX_BUFFER) : next
      })
    } catch { /* silent — don't interrupt the chart */ }
    fetchingRef.current = false
    setLoading(false)
  }, [token])

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (live) {
      poll()
      intervalRef.current = setInterval(poll, intervalOpt.ms)
    }
    return () => clearInterval(intervalRef.current)
  }, [poll, intervalOpt.ms, live])

  // Derive visible slice from the buffer based on selected range
  const now = Date.now()
  const cutoff = range.seconds ? now - range.seconds * 1000 : 0
  const visible = buffer.filter(p => p.ts >= cutoff)

  const chartData = visible.map(p => ({
    ts: p.ts,
    value: p.value,
    label: formatXLabel(p.ts, range.seconds),
  }))

  const baseline = chartData[0]?.value ?? null
  const current  = chartData[chartData.length - 1]?.value ?? null
  const delta    = baseline !== null && current !== null ? current - baseline : null
  const deltaPct = baseline ? (delta / baseline) * 100 : 0
  const isPos    = delta === null || delta >= 0
  const lineColor = isPos ? C.green : C.red

  const vals   = chartData.map(d => d.value)
  const minVal = vals.length ? Math.min(...vals) : 0
  const maxVal = vals.length ? Math.max(...vals) : 0
  const yPad   = (maxVal - minVal) * 0.2 || 200

  const fmt$ = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', marginBottom: '28px' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

        {/* Left: title + live dot + delta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
            Portfolio Value
          </span>
          {live && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: C.green }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.green,
                display: 'inline-block', animation: 'chartPulse 1.5s ease-in-out infinite',
              }} />
              LIVE
            </span>
          )}
          {delta !== null && (
            <span style={{ fontSize: '12px', fontWeight: 600, color: isPos ? C.green : C.red }}>
              {isPos ? '+' : ''}{fmt$(delta)} ({isPos ? '+' : ''}{deltaPct.toFixed(3)}%)
            </span>
          )}
        </div>

        {/* Time range */}
        <div style={{ display: 'flex', gap: '1px', backgroundColor: C.bg, borderRadius: '5px', padding: '2px', border: `1px solid ${C.border}` }}>
          {TIME_RANGES.map(r => (
            <PillButton key={r.label} label={r.label} active={range.label === r.label} onClick={() => setRange(r)} />
          ))}
        </div>

        {/* Interval */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: C.muted, whiteSpace: 'nowrap' }}>Updates</span>
          <div style={{ display: 'flex', gap: '1px', backgroundColor: C.bg, borderRadius: '5px', padding: '2px', border: `1px solid ${C.border}` }}>
            {INTERVALS.map(iv => (
              <PillButton key={iv.label} label={iv.label} active={intervalOpt.label === iv.label} color="blue" onClick={() => setIntervalOpt(iv)} />
            ))}
          </div>
          <button
            onClick={() => setLive(v => !v)}
            style={{
              padding: '3px 9px', fontSize: '12px', fontWeight: 600, borderRadius: '4px',
              border: `1px solid ${live ? 'rgba(63,185,80,0.4)' : C.border}`,
              backgroundColor: live ? 'rgba(63,185,80,0.1)' : 'transparent',
              color: live ? C.green : C.muted, cursor: 'pointer',
            }}
          >
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 8px 8px' }}>
        {loading ? (
          <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '13px' }}>
            Loading...
          </div>
        ) : chartData.length < 2 ? (
          <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '13px' }}>
            {live ? `Collecting data — updates every ${intervalOpt.label}` : 'Paused'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: C.muted, fontSize: 11 }}
                stroke={C.border}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 11 }}
                stroke="none"
                tickLine={false}
                axisLine={false}
                domain={[minVal - yPad, maxVal + yPad]}
                tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
                width={58}
              />
              <Tooltip content={<CustomTooltip lineColor={lineColor} />} />
              {baseline !== null && (
                <ReferenceLine y={baseline} stroke={C.muted} strokeDasharray="4 4" strokeOpacity={0.4} />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <style>{`
        @keyframes chartPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
