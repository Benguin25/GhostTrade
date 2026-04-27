import { useState } from 'react'
import { api } from '../lib/api'

const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      backgroundColor: '#0d1117',
      border: '1px solid #21262d',
      borderRadius: '8px',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: color || '#e6edf3', letterSpacing: '-0.2px' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: '#6e7681', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

export default function PortfolioView({ portfolio, trades, loading, selected, onSelectSymbol, token, onPortfolioChange }) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')

  const cash = portfolio?.cash ?? 0
  const positions = portfolio?.positions ?? []
  const totalValue = portfolio?.total_value ?? 0
  const totalGainLoss = portfolio?.total_gain_loss ?? 0
  const invested = positions.reduce((sum, p) => sum + p.shares * p.avg_cost, 0)
  const glPositive = totalGainLoss >= 0
  const glColor = glPositive ? '#3fb950' : '#f85149'

  const handleReset = async () => {
    setResetting(true)
    setResetError('')
    try {
      await api.resetPortfolio(token)
      setResetConfirm(false)
      await onPortfolioChange()
    } catch (err) {
      setResetError(err.message || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  return (
    <aside style={{
      width: '360px',
      flexShrink: 0,
      borderRight: '1px solid #21262d',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#161b22',
    }}>
      {/* Summary cards */}
      <div style={{ padding: '16px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Portfolio
          </span>
          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6e7681',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '2px 0',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f85149')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6e7681')}
            >
              Reset
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#8b949e' }}>Clear all positions?</span>
              <button
                onClick={() => setResetConfirm(false)}
                style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '11px', cursor: 'pointer', padding: '2px 0' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resetting ? '#8b949e' : '#f85149',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: resetting ? 'not-allowed' : 'pointer',
                  padding: '2px 0',
                }}
              >
                {resetting ? 'Resetting…' : 'Confirm'}
              </button>
            </div>
          )}
          {resetError && (
            <span style={{ fontSize: '11px', color: '#f85149', marginTop: '4px', display: 'block' }}>
              {resetError}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <StatCard label="Cash" value={`$${fmt(cash)}`} />
          <StatCard label="Invested" value={`$${fmt(invested)}`} />
          <StatCard label="Total Value" value={`$${fmt(totalValue)}`} />
          <StatCard
            label="Total P&L"
            value={`${glPositive ? '+' : ''}$${fmt(totalGainLoss)}`}
            color={glColor}
          />
        </div>
      </div>

      {/* Positions */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', color: '#8b949e', fontSize: '13px', textAlign: 'center' }}>
            Loading…
          </div>
        ) : positions.length === 0 ? (
          <div style={{ padding: '48px 24px', color: '#8b949e', fontSize: '13px', textAlign: 'center', lineHeight: 1.7 }}>
            No positions yet.<br />Buy a stock from the watchlist or discover tab.
          </div>
        ) : (
          <>
            {/* Sticky column headers */}
            <div style={{
              position: 'sticky',
              top: 0,
              padding: '7px 16px',
              display: 'grid',
              gridTemplateColumns: '68px repeat(5, 1fr)',
              gap: '4px',
              backgroundColor: '#0d1117',
              borderBottom: '1px solid #21262d',
              zIndex: 1,
            }}>
              {['Symbol', 'Qty', 'Avg', 'Price', 'Value', 'P&L'].map(col => (
                <div key={col} style={{ fontSize: '10px', fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {col}
                </div>
              ))}
            </div>

            {positions.map(pos => {
              const isSelected = selected?.symbol === pos.symbol
              const posGlPositive = pos.gain_loss >= 0
              const shares = Number(pos.shares)
              return (
                <div
                  key={pos.symbol}
                  onClick={() => onSelectSymbol(pos.symbol)}
                  style={{
                    padding: '10px 16px',
                    display: 'grid',
                    gridTemplateColumns: '68px repeat(5, 1fr)',
                    gap: '4px',
                    borderBottom: '1px solid #21262d',
                    borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                    backgroundColor: isSelected ? '#1f2937' : 'transparent',
                    cursor: 'pointer',
                    alignItems: 'center',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1c2128' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pos.symbol}
                  </div>
                  <div style={{ fontSize: '12px', color: '#e6edf3' }}>
                    {shares % 1 === 0 ? shares : shares.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8b949e' }}>${fmt(pos.avg_cost)}</div>
                  <div style={{ fontSize: '12px', color: '#e6edf3' }}>${fmt(pos.current_price)}</div>
                  <div style={{ fontSize: '12px', color: '#e6edf3' }}>${fmt(pos.current_value)}</div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: posGlPositive ? '#3fb950' : '#f85149',
                  }}>
                    {posGlPositive ? '+' : ''}{pos.gain_loss_pct.toFixed(1)}%
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
            padding: '11px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#8b949e',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e6edf3')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
        >
          <span>Trade History ({trades.length})</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>{historyOpen ? '▲' : '▼'}</span>
        </button>

        {historyOpen && (
          <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#0d1117', borderTop: '1px solid #21262d' }}>
            {trades.length === 0 ? (
              <div style={{ padding: '16px', color: '#8b949e', fontSize: '12px', textAlign: 'center' }}>
                No trades yet
              </div>
            ) : (
              trades.map((trade, i) => (
                <div key={i} style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #21262d',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', gap: '7px', alignItems: 'center', minWidth: 0 }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: trade.action === 'buy' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)',
                      color: trade.action === 'buy' ? '#3fb950' : '#f85149',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      flexShrink: 0,
                    }}>
                      {trade.action}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#e6edf3', flexShrink: 0 }}>
                      {trade.symbol}
                    </span>
                    <span style={{ fontSize: '11px', color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {Number(trade.shares) % 1 === 0 ? trade.shares : Number(trade.shares).toFixed(2)} @ ${fmt(trade.price)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3' }}>${fmt(trade.total)}</div>
                    <div style={{ fontSize: '10px', color: '#6e7681' }}>
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
