export default function WatchlistPanel({ stocks, selected, onSelect, loading, onRemove, onToggleStar }) {
  return (
    <aside style={{
      width: '280px',
      flexShrink: 0,
      borderRight: '1px solid #21262d',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#161b22',
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Watchlist
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px 20px', color: '#8b949e', fontSize: '13px', textAlign: 'center' }}>
            Loading…
          </div>
        ) : stocks.length === 0 ? (
          <div style={{ padding: '40px 20px', color: '#8b949e', fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
            Your watchlist is empty.<br />Search a symbol or browse stocks to add one.
          </div>
        ) : (
          stocks.map(stock => {
            const isSelected = selected?.symbol === stock.symbol
            const isPositive = stock.change_pct >= 0
            return (
              <div
                key={stock.symbol}
                onClick={() => onSelect(stock)}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #21262d',
                  borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                  backgroundColor: isSelected ? '#1f2937' : 'transparent',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1c2128' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Top row: star + symbol + change% + remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    title={stock.starred ? 'Unstar' : 'Star'}
                    onClick={e => { e.stopPropagation(); onToggleStar(stock.symbol) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 2px',
                      color: stock.starred ? '#e3b341' : '#484f58',
                      fontSize: '14px',
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { if (!stock.starred) e.currentTarget.style.color = '#8b949e' }}
                    onMouseLeave={e => { if (!stock.starred) e.currentTarget.style.color = '#484f58' }}
                  >
                    {stock.starred ? '★' : '☆'}
                  </button>

                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#e6edf3', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stock.symbol}
                  </span>

                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isPositive ? '#3fb950' : '#f85149',
                    backgroundColor: isPositive ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}>
                    {isPositive ? '+' : ''}{stock.change_pct.toFixed(2)}%
                  </span>

                  <button
                    title="Remove"
                    onClick={e => { e.stopPropagation(); onRemove(stock.symbol) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 2px',
                      color: '#484f58',
                      fontSize: '18px',
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f85149')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
                  >
                    ×
                  </button>
                </div>

                {/* Bottom row: price */}
                <div style={{ marginTop: '5px', paddingLeft: '22px', fontSize: '13px', color: '#8b949e', fontWeight: 500 }}>
                  ${stock.price.toFixed(2)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
