import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label, color }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: '#1c2128',
      border: '1px solid #30363d',
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '13px',
    }}>
      <div style={{ color: '#8b949e', marginBottom: '4px' }}>{label}</div>
      <div style={{ color, fontWeight: 600 }}>${payload[0].value.toFixed(2)}</div>
    </div>
  )
}

export default function StockChart({ stock }) {
  if (!stock) {
    return (
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8b949e',
        fontSize: '14px',
      }}>
        Select a stock to view its chart
      </main>
    )
  }

  const isPositive = stock.change_pct >= 0
  const lineColor = isPositive ? '#3fb950' : '#f85149'

  const prices = stock.history.map(h => h.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = (maxPrice - minPrice) * 0.1 || 1

  return (
    <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{stock.symbol}</h2>
          <span style={{ fontSize: '28px', fontWeight: 700 }}>${stock.price.toFixed(2)}</span>
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: lineColor,
            backgroundColor: isPositive ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
            padding: '3px 8px',
            borderRadius: '5px',
          }}>
            {isPositive ? '+' : ''}{stock.change_pct.toFixed(2)}%
          </span>
        </div>
        <div style={{ color: '#8b949e', fontSize: '13px', marginTop: '6px' }}>
          Daily change
        </div>
      </div>

      <div style={{
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '20px 16px 12px',
        border: '1px solid #21262d',
      }}>
        <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
          30-Day Price History
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stock.history} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#8b949e', fontSize: 11 }}
              tickFormatter={d => d.slice(5)}
              stroke="#21262d"
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#8b949e', fontSize: 11 }}
              stroke="#21262d"
              tickLine={false}
              axisLine={false}
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={v => `$${v.toFixed(0)}`}
              width={55}
            />
            <Tooltip content={<CustomTooltip color={lineColor} />} />
            <Line
              type="monotone"
              dataKey="close"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  )
}
