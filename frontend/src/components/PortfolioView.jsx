import { useState } from 'react'

const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function SummaryItem({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: color || '#e6edf3' }}>{value}</div>
    </div>
  )
}

export default function PortfolioView({ portfolio, trades, loading, selected, onSelectSymbol }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  const cash = portfolio?.cash ?? 0
  const positions = portfolio?.positions ?? []
  const totalValue = portfolio?.total_value ?? 0
  const totalGainLoss = portfolio?.total_gain_loss ?? 0
  const invested = positions.reduce((sum, p) => sum + p.shares * p.avg_cost, 0)
  const glColor = totalGainLoss >= 0 ? '#3fb950' : '#f85149'

  return (
    <aside style={{
      width: '340px',
      flexShrink: 0,
      borderRight: '1px solid #21262d',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#161b22',
    }}>
      {/* Summary bar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          <SummaryItem label="Cash" value={`$${fmt(cash)}`} />
          <SummaryItem label="Invested" value={`$${fmt(invested)}`} />
          <SummaryItem label="Total Value" value={`$${fmt(totalValue)}`} />
          <SummaryItem
            label="Total P&L"
            value={`${totalGainLoss >= 0 ? '+' : ''}$${fmt(totalGainLoss)}`}
            color={glColor}
          />
        </div>
      </div>

      {/* Positions */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px 16px', color: '#8b949e', fontSize: '13px', textAlign: 'center' }}>
            Loading…
          </div>
        ) : positions.length === 0 ? (
          <div style={{ padding: '40px 20px', color: '#8b949e', fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
            No positions yet — buy a stock from the watchlist
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div style={{
              padding: '5px 12px',
              display: 'grid',
              gridTemplateColumns: '64px repeat(5, 1fr)',
              gap: '4px',
              borderBottom: '1px solid #21262d',
              backgroundColor: '#0d1117',
              flexShrink: 0,
            }}>
              {['Symbol', 'Shares', 'Avg', 'Price', 'Value', 'P&L'].map(col => (
                <div key={col} style={{ fontSize: '10px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {col}
                </div>
              ))}
            </div>

            {/* Position rows */}
            {positions.map(pos => {
              const isSelected = selected?.symbol === pos.symbol
              const glPositive = pos.gain_loss >= 0
              return (
                <div
                  key={pos.symbol}
                  onClick={() => onSelectSymbol(pos.symbol)}
                  style={{
                    padding: '8px 12px',
                    display: 'grid',
                    gridTemplateColumns: '64px repeat(5, 1fr)',
                    gap: '4px',
                    borderBottom: '1px solid #21262d',
                    borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                    backgroundColor: isSelected ? '#1f2937' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1c2128' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pos.symbol}
                  </div>
                  <div style={{ fontSize: '11px', color: '#e6edf3' }}>
                    {pos.shares % 1 === 0 ? pos.shares : Number(pos.shares).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e' }}>${fmt(pos.avg_cost)}</div>
                  <div style={{ fontSize: '11px', color: '#e6edf3' }}>${fmt(pos.current_price)}</div>
                  <div style={{ fontSize: '11px', color: '#e6edf3' }}>${fmt(pos.current_value)}</div>
                  <div style={{ fontSize: '11px', color: glPositive ? '#3fb950' : '#f85149' }}>
                    {glPositive ? '+' : ''}{pos.gain_loss_pct.toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Trade history drawer */}
      <div style={{ borderTop: '1px solid #21262d', flexShrink: 0 }}>
        <button
          onClick={() => setHistoryOpen(o => !o)}
          style={{
            width: '100%',
            padding: '10px 14px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#8b949e',
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Trade History ({trades.length})</span>
          <span style={{ fontSize: '10px' }}>{historyOpen ? '▲' : '▼'}</span>
        </button>

        {historyOpen && (
          <div style={{ maxHeight: '220px', overflowY: 'auto', backgroundColor: '#0d1117' }}>
            {trades.length === 0 ? (
              <div style={{ padding: '14px 16px', color: '#8b949e', fontSize: '12px', textAlign: 'center' }}>
                No trades yet
              </div>
            ) : (
              trades.map((trade, i) => (
                <div key={i} style={{
                  padding: '7px 12px',
                  borderBottom: '1px solid #21262d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0 }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: trade.action === 'buy' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)',
                      color: trade.action === 'buy' ? '#3fb950' : '#f85149',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {trade.action}
                    </span>
                    <span style={{ fontSize: '12px', color: '#e6edf3', fontWeight: 600, flexShrink: 0 }}>
                      {trade.symbol}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {Number(trade.shares) % 1 === 0 ? trade.shares : Number(trade.shares).toFixed(2)}×${fmt(trade.price)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', color: '#e6edf3' }}>${fmt(trade.total)}</div>
                    <div style={{ fontSize: '10px', color: '#8b949e' }}>
                      {new Date(trade.executed_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
