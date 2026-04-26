export default function WatchlistPanel({ stocks, selected, onSelect, loading }) {
  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      borderRight: '1px solid #21262d',
      overflowY: 'auto',
      backgroundColor: '#161b22',
    }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #21262d' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Watchlist
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '32px 16px', color: '#8b949e', fontSize: '14px', textAlign: 'center' }}>
          Loading...
        </div>
      ) : stocks.length === 0 ? (
        <div style={{ padding: '32px 16px', color: '#8b949e', fontSize: '14px', textAlign: 'center' }}>
          No stocks yet
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
                padding: '13px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #21262d',
                backgroundColor: isSelected ? '#1f2937' : 'transparent',
                borderLeft: isSelected ? '2px solid #58a6ff' : '2px solid transparent',
                transition: 'background-color 0.1s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1c2128' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#e6edf3' }}>
                  {stock.symbol}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isPositive ? '#3fb950' : '#f85149',
                  backgroundColor: isPositive ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  {isPositive ? '+' : ''}{stock.change_pct.toFixed(2)}%
                </span>
              </div>
              <div style={{ marginTop: '4px', color: '#8b949e', fontSize: '13px' }}>
                ${stock.price.toFixed(2)}
              </div>
            </div>
          )
        })
      )}
    </aside>
  )
}
