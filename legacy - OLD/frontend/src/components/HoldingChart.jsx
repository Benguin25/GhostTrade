import { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { api } from '../lib/api'
import TradeModal from './TradeModal'

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
  { label: 'All', seconds: null },
]

const MAX_BUFFER = 3600 // 1 hour at 1s

function formatLabel(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

const CustomTooltip = ({ active, payload, lineColor }) => {
  if (!active || !payload?.length) return null
  const { value, ts } = payload[0].payload
  return (
    <div style={{ backgroundColor: '#1c2128', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 12px', fontSize: '13px' }}>
      <div style={{ color: C.muted, marginBottom: '4px' }}>{formatLabel(ts)}</div>
      <div style={{ color: lineColor, fontWeight: 600 }}>
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  )
}

function PillButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 9px', fontSize: '12px', fontWeight: active ? 700 : 400,
      borderRadius: '4px', border: 'none',
      backgroundColor: active ? '#21262d' : 'transparent',
      color: active ? C.text : C.muted,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  )
}

export default function HoldingChart({ symbol, holding, balance, token, onTradeComplete }) {
  const [buffer, setBuffer] = useState([])
  const [range, setRange] = useState(TIME_RANGES[1]) // default 5m
  const [livePrice, setLivePrice] = useState(holding.price)
  const [tradeModal, setTradeModal] = useState(null)
  const [tradeLoading, setTradeLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const fetchingRef = useRef(false)

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  const poll = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const p = await api.getStockPrice(symbol)
      const point = { ts: Date.now(), value: p.price }
      setLivePrice(p.price)
      setBuffer(prev => {
        const next = [...prev, point]
        return next.length > MAX_BUFFER ? next.slice(next.length - MAX_BUFFER) : next
      })
    } catch { /* silent */ }
    fetchingRef.current = false
  }, [symbol])

  useEffect(() => {
    poll()
    const id = setInterval(poll, 1000)
    return () => clearInterval(id)
  }, [poll])

  const handleTrade = async (action, shares) => {
    setTradeLoading(true)
    try {
      if (action === 'buy') {
        await api.buyStock(symbol, shares, token)
      } else {
        await api.sellStock(symbol, shares, token)
      }
      showToast(`${action === 'buy' ? 'Bought' : 'Sold'} ${shares} share${shares !== 1 ? 's' : ''} of ${symbol}`)
      setTradeModal(null)
      onTradeComplete()
    } catch (err) {
      showToast(err.message || 'Trade failed', true)
    } finally {
      setTradeLoading(false)
    }
  }

  // Derive visible slice
  const now = Date.now()
  const cutoff = range.seconds ? now - range.seconds * 1000 : 0
  const chartData = buffer
    .filter(p => p.ts >= cutoff)
    .map(p => ({ ts: p.ts, value: p.value, label: formatLabel(p.ts) }))

  const sessionOpen = buffer[0]?.value ?? holding.price
  const delta    = livePrice - sessionOpen
  const deltaPct = sessionOpen ? (delta / sessionOpen) * 100 : 0
  const isPos    = delta >= 0
  const lineColor = isPos ? C.green : C.red

  const vals   = chartData.map(d => d.value)
  const minVal = vals.length ? Math.min(...vals) : livePrice * 0.998
  const maxVal = vals.length ? Math.max(...vals) : livePrice * 1.002
  const yPad   = (maxVal - minVal) * 0.3 || livePrice * 0.002

  const posValue   = holding.shares * livePrice
  const gainLoss   = (livePrice - holding.avg_cost) * holding.shares
  const gainPct    = holding.avg_cost ? ((livePrice - holding.avg_cost) / holding.avg_cost) * 100 : 0
  const isGainPos  = gainLoss >= 0

  const fmt$ = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: C.bg }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 2000,
          backgroundColor: toast.isError ? 'rgba(218,54,51,0.9)' : 'rgba(35,134,54,0.9)',
          color: '#fff', padding: '10px 16px', borderRadius: '8px',
          fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {tradeModal && (
        <TradeModal
          symbol={symbol}
          price={livePrice}
          balance={balance}
          sharesOwned={holding.shares}
          defaultAction={tradeModal.action}
          onClose={() => setTradeModal(null)}
          onConfirm={handleTrade}
          loading={tradeLoading}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: 0 }}>{symbol}</h2>
            <span style={{ fontSize: '28px', fontWeight: 700, color: C.text }}>
              {fmt$(livePrice)}
            </span>
            <span style={{
              fontSize: '14px', fontWeight: 600, padding: '3px 8px', borderRadius: '5px',
              color: lineColor,
              backgroundColor: isPos ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            }}>
              {isPos ? '+' : ''}{delta.toFixed(2)} ({isPos ? '+' : ''}{deltaPct.toFixed(3)}%)
            </span>
            <span style={{ fontSize: '11px', color: C.muted, alignSelf: 'center' }}>vs session open</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', backgroundColor: C.green,
              display: 'inline-block', animation: 'holdingPulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: C.green }}>LIVE · 1s</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setTradeModal({ action: 'buy' })}
            style={{ padding: '8px 20px', backgroundColor: 'rgba(35,134,54,0.15)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: '6px', color: C.green, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >Buy</button>
          <button
            onClick={() => setTradeModal({ action: 'sell' })}
            style={{ padding: '8px 20px', backgroundColor: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '6px', color: C.red, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >Sell</button>
        </div>
      </div>

      {/* Live chart */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', flex: 1 }}>
            Live Price
          </span>
          <div style={{ display: 'flex', gap: '1px', backgroundColor: C.bg, borderRadius: '5px', padding: '2px', border: `1px solid ${C.border}` }}>
            {TIME_RANGES.map(r => (
              <PillButton key={r.label} label={r.label} active={range.label === r.label} onClick={() => setRange(r)} />
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 8px 8px' }}>
          {chartData.length < 2 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '13px' }}>
              Collecting data…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} stroke={C.border} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fill: C.muted, fontSize: 10 }} stroke="none" tickLine={false} axisLine={false}
                  domain={[minVal - yPad, maxVal + yPad]}
                  tickFormatter={v => `$${v.toFixed(2)}`}
                  width={62}
                />
                <Tooltip content={<CustomTooltip lineColor={lineColor} />} />
                {chartData[0] && <ReferenceLine y={chartData[0].value} stroke={C.muted} strokeDasharray="4 4" strokeOpacity={0.4} />}
                <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 3, fill: lineColor, strokeWidth: 0 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Position summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Shares', value: holding.shares.toLocaleString(undefined, { maximumFractionDigits: 4 }) },
          { label: 'Avg Cost', value: fmt$(holding.avg_cost) },
          { label: 'Market Value', value: fmt$(posValue) },
          {
            label: 'Unrealised P&L',
            value: `${isGainPos ? '+' : ''}${fmt$(gainLoss)}`,
            sub: `${isGainPos ? '+' : ''}${gainPct.toFixed(2)}%`,
            color: isGainPos ? C.green : C.red,
          },
        ].map(card => (
          <div key={card.label} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{card.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: card.color || C.text }}>{card.value}</div>
            {card.sub && <div style={{ fontSize: '12px', color: card.color || C.muted, marginTop: '2px' }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes holdingPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
