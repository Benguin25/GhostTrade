import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import TradeModal from '../components/TradeModal'

const C = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#21262d',
  text: '#e6edf3',
  muted: '#8b949e',
  blue: '#58a6ff',
  green: '#3fb950',
  greenBg: 'rgba(63,185,80,0.1)',
  red: '#f85149',
  redBg: 'rgba(248,81,73,0.1)',
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px 20px', minWidth: 0 }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color || C.text }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function PortfolioPage({ session }) {
  const [portfolio, setPortfolio] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [tradeModal, setTradeModal] = useState(null)
  const [tradeLoading, setTradeLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  const token = session?.access_token

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  const loadPortfolio = useCallback(async () => {
    try {
      const [p, h] = await Promise.all([
        api.getPortfolio(token),
        api.getPortfolioHistory(token),
      ])
      setPortfolio(p)
      setHistory(h)
    } catch {
      // silent fail — user sees empty state
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadPortfolio() }, [loadPortfolio])

  const handleTrade = async (action, shares) => {
    if (!tradeModal) return
    setTradeLoading(true)
    try {
      if (action === 'buy') {
        await api.buyStock(tradeModal.symbol, shares, token)
      } else {
        await api.sellStock(tradeModal.symbol, shares, token)
      }
      showToast(`${action === 'buy' ? 'Bought' : 'Sold'} ${shares} share${shares !== 1 ? 's' : ''} of ${tradeModal.symbol}`)
      setTradeModal(null)
      await loadPortfolio()
    } catch (err) {
      showToast(err.message, true)
    } finally {
      setTradeLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      await api.resetPortfolio(token)
      setResetConfirm(false)
      showToast('Portfolio reset to $100,000')
      await loadPortfolio()
    } catch (err) {
      showToast(err.message, true)
    }
  }

  const openTrade = (symbol, action, price, sharesOwned) => {
    setTradeModal({ symbol, action, price, sharesOwned })
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '14px' }}>
        Loading portfolio...
      </div>
    )
  }

  const balance = portfolio?.balance ?? 100000
  const holdings = portfolio?.holdings ?? []
  const invested = portfolio?.invested ?? 0
  const totalValue = portfolio?.total_value ?? balance
  const pnl = totalValue - 100000
  const pnlPct = (pnl / 100000) * 100

  const fmt$ = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: C.bg }}>
      {/* Toast */}
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

      {/* Reset confirm overlay */}
      {resetConfirm && (
        <div onClick={() => setResetConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '28px', width: '340px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>Reset Portfolio?</div>
            <div style={{ fontSize: '14px', color: C.muted, marginBottom: '24px' }}>This will clear all holdings and trade history, restoring your balance to $100,000.</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setResetConfirm(false)} style={{ padding: '8px 20px', backgroundColor: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleReset} style={{ padding: '8px 20px', backgroundColor: '#da3633', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.text, margin: 0 }}>Portfolio</h2>
        <button
          onClick={() => setResetConfirm(true)}
          style={{ padding: '6px 14px', backgroundColor: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.muted, fontSize: '13px', cursor: 'pointer' }}
          onMouseEnter={e => { e.target.style.borderColor = C.red; e.target.style.color = C.red }}
          onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted }}
        >
          Reset to $100k
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <StatCard label="Cash" value={fmt$(balance)} />
        <StatCard label="Invested" value={fmt$(invested)} />
        <StatCard label="Total Value" value={fmt$(totalValue)} />
        <StatCard
          label="P&L"
          value={`${pnl >= 0 ? '+' : ''}${fmt$(pnl)}`}
          sub={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
          color={pnl >= 0 ? C.green : C.red}
        />
      </div>

      {/* Holdings */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '28px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Holdings</span>
        </div>

        {holdings.length === 0 ? (
          <div style={{ padding: '32px 16px', color: C.muted, fontSize: '14px', textAlign: 'center' }}>
            No holdings yet — buy stocks to get started
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Symbol', 'Shares', 'Avg Cost', 'Price', 'Value', 'P&L', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: h === '' ? 'right' : 'left', color: C.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const isPos = h.gain_loss >= 0
                  return (
                    <tr key={h.symbol} style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1c2128')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: C.text }}>{h.symbol}</td>
                      <td style={{ padding: '12px 14px', color: C.muted }}>{h.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td style={{ padding: '12px 14px', color: C.muted }}>${h.avg_cost.toFixed(2)}</td>
                      <td style={{ padding: '12px 14px', color: C.text }}>${h.price.toFixed(2)}
                        <span style={{ marginLeft: '6px', fontSize: '11px', color: h.change_pct >= 0 ? C.green : C.red }}>
                          {h.change_pct >= 0 ? '+' : ''}{h.change_pct.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: C.text, fontWeight: 600 }}>{fmt$(h.value)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ color: isPos ? C.green : C.red, fontWeight: 600 }}>
                          {isPos ? '+' : ''}{fmt$(h.gain_loss)}
                        </span>
                        <span style={{ marginLeft: '6px', fontSize: '11px', color: isPos ? C.green : C.red }}>
                          ({isPos ? '+' : ''}{h.gain_pct.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openTrade(h.symbol, 'buy', h.price, h.shares)}
                          style={{ marginRight: '6px', padding: '4px 10px', backgroundColor: 'rgba(35,134,54,0.15)', border: `1px solid rgba(63,185,80,0.3)`, borderRadius: '5px', color: C.green, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >Buy</button>
                        <button
                          onClick={() => openTrade(h.symbol, 'sell', h.price, h.shares)}
                          style={{ padding: '4px 10px', backgroundColor: 'rgba(248,81,73,0.1)', border: `1px solid rgba(248,81,73,0.3)`, borderRadius: '5px', color: C.red, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >Sell</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade History */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Trade History</span>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '24px 16px', color: C.muted, fontSize: '14px', textAlign: 'center' }}>
            No trades yet
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Date', 'Symbol', 'Action', 'Shares', 'Price', 'Total'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: C.muted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(t => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1c2128')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', color: C.muted }}>
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: C.text }}>{t.symbol}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                        color: t.action === 'buy' ? C.green : C.red,
                        backgroundColor: t.action === 'buy' ? C.greenBg : C.redBg,
                        textTransform: 'uppercase',
                      }}>{t.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: C.muted }}>{parseFloat(t.shares).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                    <td style={{ padding: '10px 14px', color: C.muted }}>${parseFloat(t.price).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', color: C.text, fontWeight: 600 }}>{fmt$(parseFloat(t.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trade modal */}
      {tradeModal && (
        <TradeModal
          symbol={tradeModal.symbol}
          price={tradeModal.price}
          balance={balance}
          sharesOwned={tradeModal.sharesOwned}
          defaultAction={tradeModal.action}
          onClose={() => setTradeModal(null)}
          onConfirm={handleTrade}
          loading={tradeLoading}
        />
      )}
    </div>
  )
}
