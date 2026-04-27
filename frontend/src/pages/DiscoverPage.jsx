import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import StockChart from '../components/StockChart'

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

function StockRow({ stock, isSelected, inWatchlist, onSelect, onAdd, adding }) {
  const isPos = stock.change_pct >= 0
  return (
    <div
      onClick={() => onSelect(stock)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer',
        backgroundColor: isSelected ? '#1f2937' : 'transparent',
        borderLeft: isSelected ? `2px solid ${C.blue}` : '2px solid transparent',
        transition: 'background-color 0.1s',
        gap: '10px',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1c2128' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>{stock.symbol}</span>
          <span style={{ fontSize: '12px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
          <span style={{ fontSize: '13px', color: C.muted }}>${stock.price.toFixed(2)}</span>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            color: isPos ? C.green : C.red,
            backgroundColor: isPos ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            padding: '1px 5px', borderRadius: '4px',
          }}>
            {isPos ? '+' : ''}{stock.change_pct.toFixed(2)}%
          </span>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); if (!inWatchlist) onAdd(stock.symbol) }}
        disabled={inWatchlist || adding}
        style={{
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '5px',
          border: `1px solid ${inWatchlist ? C.border : C.blue}`,
          backgroundColor: inWatchlist ? 'transparent' : 'rgba(88,166,255,0.1)',
          color: inWatchlist ? C.muted : C.blue,
          cursor: inWatchlist ? 'default' : 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {inWatchlist ? 'Added' : adding ? '...' : '+ Watch'}
      </button>
    </div>
  )
}

export default function DiscoverPage({ session, watchlist, onAddToWatchlist }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [selectedFull, setSelectedFull] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [adding, setAdding] = useState(new Set())
  const [addError, setAddError] = useState('')

  const watchlistSymbols = new Set(watchlist.map(s => s.symbol))

  useEffect(() => {
    api.getDiscover()
      .then(data => {
        setCategories(data.categories)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSelect = async (stock) => {
    setSelected(stock)
    setSelectedFull(null)
    setChartLoading(true)
    try {
      const full = await api.getStock(stock.symbol)
      setSelectedFull(full)
    } catch {
      // leave null — StockChart handles missing stock gracefully
    } finally {
      setChartLoading(false)
    }
  }

  const handleAdd = async (symbol) => {
    setAdding(prev => new Set(prev).add(symbol))
    setAddError('')
    try {
      await onAddToWatchlist(symbol)
    } catch (err) {
      setAddError(err.message || `Failed to add ${symbol}`)
    } finally {
      setAdding(prev => { const next = new Set(prev); next.delete(symbol); return next })
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Left: stock list */}
      <aside style={{ width: '320px', flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: 'auto', backgroundColor: C.surface }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Discover Stocks
          </span>
          {addError && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: C.red }}>
              {addError}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px 16px', color: C.muted, fontSize: '14px', textAlign: 'center' }}>
            Loading stocks...
          </div>
        ) : (
          categories.map(cat => (
            <div key={cat.name}>
              <div style={{ padding: '10px 14px 6px', fontSize: '11px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', backgroundColor: C.bg }}>
                {cat.name}
              </div>
              {cat.stocks.map(stock => (
                <StockRow
                  key={stock.symbol}
                  stock={stock}
                  isSelected={selected?.symbol === stock.symbol}
                  inWatchlist={watchlistSymbols.has(stock.symbol)}
                  onSelect={handleSelect}
                  onAdd={handleAdd}
                  adding={adding.has(stock.symbol)}
                />
              ))}
            </div>
          ))
        )}
      </aside>

      {/* Right: chart */}
      {chartLoading ? (
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: '14px' }}>
          Loading chart...
        </main>
      ) : (
        <StockChart stock={selectedFull} />
      )}
    </div>
  )
}
