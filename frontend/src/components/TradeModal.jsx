import { useState } from 'react'

const COLORS = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#8b949e',
  blue: '#58a6ff',
  green: '#238636',
  greenText: '#3fb950',
  red: '#da3633',
  redText: '#f85149',
}

export default function TradeModal({ symbol, price, balance, sharesOwned, defaultAction = 'buy', onClose, onConfirm, loading }) {
  const [action, setAction] = useState(defaultAction)
  const [sharesInput, setSharesInput] = useState('')

  const shares = parseFloat(sharesInput) || 0
  const total = Math.round(shares * price * 100) / 100
  const isBuy = action === 'buy'

  const maxShares = isBuy
    ? Math.floor((balance / price) * 10000) / 10000
    : sharesOwned

  const isValid = shares > 0 && (isBuy ? total <= balance : shares <= sharesOwned)

  const handleSetMax = () => {
    setSharesInput(String(maxShares))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid || loading) return
    onConfirm(action, shares)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '380px',
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', color: COLORS.text }}>{symbol}</span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
            >×</button>
          </div>
          <div style={{ color: COLORS.muted, fontSize: '13px', marginTop: '4px' }}>
            Current price: <span style={{ color: COLORS.text, fontWeight: 600 }}>${price.toFixed(2)}</span>
          </div>
        </div>

        {/* Buy / Sell toggle */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}` }}>
          {['buy', 'sell'].map(a => (
            <button
              key={a}
              onClick={() => { setAction(a); setSharesInput('') }}
              style={{
                flex: 1,
                padding: '10px',
                background: action === a
                  ? (a === 'buy' ? 'rgba(35,134,54,0.15)' : 'rgba(218,54,51,0.15)')
                  : 'transparent',
                border: 'none',
                borderBottom: action === a
                  ? `2px solid ${a === 'buy' ? COLORS.greenText : COLORS.redText}`
                  : '2px solid transparent',
                color: action === a
                  ? (a === 'buy' ? COLORS.greenText : COLORS.redText)
                  : COLORS.muted,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Shares
              </label>
              <button
                type="button"
                onClick={handleSetMax}
                style={{ background: 'none', border: 'none', color: COLORS.blue, fontSize: '12px', cursor: 'pointer', padding: 0 }}
              >
                Max: {maxShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={sharesInput}
              onChange={e => setSharesInput(e.target.value)}
              placeholder="0"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                color: COLORS.text,
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = COLORS.blue)}
              onBlur={e => (e.target.style.borderColor = COLORS.border)}
            />
          </div>

          {/* Total row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: COLORS.muted }}>Total</span>
            <span style={{ color: COLORS.text, fontWeight: 600 }}>${total.toFixed(2)}</span>
          </div>

          {/* Balance row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
            <span style={{ color: COLORS.muted }}>{isBuy ? 'Available cash' : 'Shares owned'}</span>
            <span style={{ color: COLORS.muted }}>
              {isBuy ? `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : sharesOwned.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
          </div>

          {/* After-trade preview */}
          {shares > 0 && (
            <div style={{
              backgroundColor: 'rgba(88,166,255,0.05)',
              border: `1px solid rgba(88,166,255,0.15)`,
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: COLORS.muted }}>New cash balance</span>
                <span style={{ color: isBuy ? (total <= balance ? COLORS.greenText : COLORS.redText) : COLORS.greenText, fontWeight: 600 }}>
                  ${(isBuy ? balance - total : balance + total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Error hint */}
          {shares > 0 && !isValid && (
            <div style={{ color: COLORS.redText, fontSize: '13px', marginBottom: '12px' }}>
              {isBuy ? `Insufficient funds — need $${total.toFixed(2)}` : `Only ${sharesOwned} shares available`}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              width: '100%',
              padding: '11px',
              backgroundColor: !isValid || loading ? '#21262d' : (isBuy ? COLORS.green : COLORS.red),
              color: !isValid || loading ? COLORS.muted : '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {loading ? 'Processing...' : `Confirm ${action === 'buy' ? 'Buy' : 'Sell'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
