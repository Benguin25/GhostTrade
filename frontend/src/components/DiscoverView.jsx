import { useState, useMemo } from 'react'

const CATEGORIES = [
  {
    name: 'Tech',
    stocks: [
      { symbol: 'AAPL', name: 'Apple' },
      { symbol: 'MSFT', name: 'Microsoft' },
      { symbol: 'GOOGL', name: 'Alphabet' },
      { symbol: 'AMZN', name: 'Amazon' },
      { symbol: 'NVDA', name: 'NVIDIA' },
      { symbol: 'META', name: 'Meta Platforms' },
      { symbol: 'TSLA', name: 'Tesla' },
      { symbol: 'NFLX', name: 'Netflix' },
      { symbol: 'AMD', name: 'AMD' },
      { symbol: 'INTC', name: 'Intel' },
      { symbol: 'CRM', name: 'Salesforce' },
      { symbol: 'ORCL', name: 'Oracle' },
    ],
  },
  {
    name: 'Finance',
    stocks: [
      { symbol: 'JPM', name: 'JPMorgan Chase' },
      { symbol: 'BAC', name: 'Bank of America' },
      { symbol: 'GS', name: 'Goldman Sachs' },
      { symbol: 'MS', name: 'Morgan Stanley' },
      { symbol: 'V', name: 'Visa' },
      { symbol: 'MA', name: 'Mastercard' },
      { symbol: 'WFC', name: 'Wells Fargo' },
      { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
    ],
  },
  {
    name: 'Health',
    stocks: [
      { symbol: 'JNJ', name: 'Johnson & Johnson' },
      { symbol: 'PFE', name: 'Pfizer' },
      { symbol: 'MRK', name: 'Merck' },
      { symbol: 'ABBV', name: 'AbbVie' },
      { symbol: 'UNH', name: 'UnitedHealth Group' },
      { symbol: 'LLY', name: 'Eli Lilly' },
    ],
  },
  {
    name: 'Energy',
    stocks: [
      { symbol: 'XOM', name: 'ExxonMobil' },
      { symbol: 'CVX', name: 'Chevron' },
      { symbol: 'COP', name: 'ConocoPhillips' },
      { symbol: 'SLB', name: 'SLB (Schlumberger)' },
    ],
  },
  {
    name: 'Consumer',
    stocks: [
      { symbol: 'WMT', name: 'Walmart' },
      { symbol: 'COST', name: 'Costco' },
      { symbol: 'MCD', name: "McDonald's" },
      { symbol: 'SBUX', name: 'Starbucks' },
      { symbol: 'NKE', name: 'Nike' },
      { symbol: 'DIS', name: 'Disney' },
      { symbol: 'AMZN', name: 'Amazon' },
    ],
  },
  {
    name: 'ETFs',
    stocks: [
      { symbol: 'SPY', name: 'S&P 500 ETF' },
      { symbol: 'QQQ', name: 'Nasdaq-100 ETF' },
      { symbol: 'VTI', name: 'Total Market ETF' },
      { symbol: 'IWM', name: 'Russell 2000 ETF' },
      { symbol: 'GLD', name: 'Gold ETF' },
      { symbol: 'TLT', name: '20+ Year Treasury ETF' },
    ],
  },
  {
    name: 'Canadian',
    stocks: [
      { symbol: 'SHOP.TO', name: 'Shopify' },
      { symbol: 'RY.TO', name: 'Royal Bank of Canada' },
      { symbol: 'TD.TO', name: 'TD Bank' },
      { symbol: 'BNS.TO', name: 'Scotiabank' },
      { symbol: 'CNR.TO', name: 'Canadian National Railway' },
      { symbol: 'ENB.TO', name: 'Enbridge' },
      { symbol: 'BCE.TO', name: 'BCE Inc.' },
      { symbol: 'BAM.TO', name: 'Brookfield Asset Mgmt' },
    ],
  },
]

const ALL_STOCKS = CATEGORIES.flatMap(c => c.stocks.map(s => ({ ...s, category: c.name })))
const CATEGORY_NAMES = ['All', ...CATEGORIES.map(c => c.name)]

export default function DiscoverView({ watchlist, selected, onSelectSymbol, onAddToWatchlist }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const watchlistSymbols = useMemo(() => new Set(watchlist.map(w => w.symbol)), [watchlist])

  const filtered = useMemo(() => {
    let stocks = activeCategory === 'All'
      ? ALL_STOCKS
      : ALL_STOCKS.filter(s => s.category === activeCategory)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      stocks = stocks.filter(s =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
    }
    // Deduplicate by symbol
    const seen = new Set()
    return stocks.filter(s => {
      if (seen.has(s.symbol)) return false
      seen.add(s.symbol)
      return true
    })
  }, [query, activeCategory])

  return (
    <aside style={{
      width: '320px',
      flexShrink: 0,
      borderRight: '1px solid #21262d',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#161b22',
    }}>
      {/* Header + search */}
      <div style={{ padding: '16px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Browse Stocks
        </div>
        <input
          type="text"
          placeholder="Search symbol or company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#e6edf3',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category pills */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #21262d',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        {CATEGORY_NAMES.map(cat => {
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: active ? '#58a6ff' : '#30363d',
                backgroundColor: active ? 'rgba(88,166,255,0.12)' : 'transparent',
                color: active ? '#58a6ff' : '#8b949e',
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'border-color 0.15s, color 0.15s, background-color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Stock list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8b949e', fontSize: '13px' }}>
            No stocks match "{query}"
          </div>
        ) : (
          filtered.map(stock => {
            const isSelected = selected?.symbol === stock.symbol
            const inWatchlist = watchlistSymbols.has(stock.symbol)
            return (
              <div
                key={stock.symbol + stock.category}
                onClick={() => onSelectSymbol(stock.symbol)}
                style={{
                  padding: '11px 16px',
                  borderBottom: '1px solid #21262d',
                  borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                  backgroundColor: isSelected ? '#1f2937' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1c2128' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#e6edf3' }}>
                    {stock.symbol}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stock.name}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (!inWatchlist) onAddToWatchlist(stock.symbol)
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: inWatchlist ? 'rgba(63,185,80,0.4)' : '#30363d',
                    backgroundColor: inWatchlist ? 'rgba(63,185,80,0.08)' : 'transparent',
                    color: inWatchlist ? '#3fb950' : '#8b949e',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: inWatchlist ? 'default' : 'pointer',
                    flexShrink: 0,
                    transition: 'border-color 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!inWatchlist) { e.currentTarget.style.borderColor = '#58a6ff'; e.currentTarget.style.color = '#58a6ff' } }}
                  onMouseLeave={e => { if (!inWatchlist) { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' } }}
                >
                  {inWatchlist ? '✓ Watching' : '+ Watch'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
