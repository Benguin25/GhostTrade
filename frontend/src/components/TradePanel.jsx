import { useState, useEffect } from 'react'
import { api } from '../lib/api'

const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function TradePanel({ stock, portfolio, token, onTrade }) {
  const [mode, setMode] = useState('buy')
  const [shares, setShares] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setShares('')
    setError('')
  }, [stock?.symbol])

  const price = stock?.price ?? 0
  const numShares = parseFloat(shares) || 0
  const estimatedTotal = numShares * price

  const cash = portfolio?.cash ?? 0
  const position = portfolio?.positions?.find(p => p.symbol === stock?.symbol)
  const heldShares = position?.shares ?? 0

  const cashShort = mode === 'buy' && numShares > 0 && estimatedTotal > cash
  const oversell = mode === 'sell' && numShares > 0 && numShares > heldShares + 1e-9

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!numShares || numShares <= 0) {
      setError('Enter a valid share count')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (mode === 'buy') {
        await api.buyStock(stock.symbol, numShares, token)
      } else {
        await api.sellStock(stock.symbol, numShares, token)
      }
      setShares('')
      await onTrade()
    } catch (err) {
      setError(err.message || 'Trade failed')
    } finally {
      setLoading(false)
    }
  }

  const isBuy = mode === 'buy'
  const activeColor = isBuy ? '#2ea043' : '#da3633'

  return (
    <div style={{
      backgroundColor: '#161b22',
      borderTop: '1px solid #21262d',
      padding: '14px 24px',
      flexShrink: 0,
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          borderRadius: '7px',
          overflow: 'hidden',
          border: '1px solid #30363d',
          flexShrink: 0,
        }}>
          {['buy', 'sell'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError('') }}
              style={{
                padding: '6px 18px',
                backgroundColor: mode === m ? (m === 'buy' ? '#2ea043' : '#da3633') : 'transparent',
                border: 'none',
                color: mode === m ? '#fff' : '#8b949e',
                fontSize: '13px',
                fontWeight: mode === m ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Shares input */}
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Shares"
          value={shares}
          onChange={e => { setShares(e.target.value); setError('') }}
          style={{
            width: '110px',
            padding: '7px 11px',
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '7px',
            color: '#e6edf3',
            fontSize: '13px',
            outline: 'none',
            flexShrink: 0,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = '#58a6ff')}
          onBlur={e => (e.target.style.borderColor = '#30363d')}
        />

        {/* Info strip */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#8b949e', flex: 1, flexWrap: 'wrap', minWidth: '120px' }}>
          {numShares > 0 && (
            <span>
              {isBuy ? 'Cost' : 'Proceeds'}:&nbsp;
              <strong style={{ color: '#e6edf3' }}>${fmt(estimatedTotal)}</strong>
            </span>
          )}
          {isBuy ? (
            <span>
              Available:&nbsp;
              <strong style={{ color: cashShort ? '#f85149' : '#e6edf3' }}>${fmt(cash)}</strong>
            </span>
          ) : (
            <span>
              Held:&nbsp;
              <strong style={{ color: oversell ? '#f85149' : '#e6edf3' }}>
                {Number(heldShares) % 1 === 0 ? heldShares : Number(heldShares).toFixed(4)} shares
              </strong>
            </span>
          )}
        </div>

        {/* Inline error */}
        {error && (
          <span style={{ fontSize: '12px', color: '#f85149', flexShrink: 0, maxWidth: '220px' }}>
            {error}
          </span>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '7px 20px',
            backgroundColor: loading ? '#21262d' : activeColor,
            border: 'none',
            borderRadius: '7px',
            color: loading ? '#8b949e' : '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Executing…' : `${isBuy ? 'Buy' : 'Sell'} ${stock?.symbol}`}
        </button>
      </form>
    </div>
  )
}
