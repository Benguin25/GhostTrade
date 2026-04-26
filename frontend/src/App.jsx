import { useState, useEffect } from 'react'
import WatchlistPanel from './components/WatchlistPanel'
import StockChart from './components/StockChart'
import SearchBar from './components/SearchBar'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [watchlist, setWatchlist] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/stocks/watchlist`)
      .then(r => r.json())
      .then(data => {
        setWatchlist(data)
        if (data.length > 0) setSelected(data[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSearch = async (symbol) => {
    setSearchError('')
    try {
      const res = await fetch(`${API_BASE}/stocks/${symbol}`)
      if (!res.ok) {
        setSearchError(`Symbol "${symbol}" not found`)
        return
      }
      const data = await res.json()
      setWatchlist(prev => {
        const exists = prev.find(s => s.symbol === data.symbol)
        return exists ? prev : [data, ...prev]
      })
      setSelected(data)
    } catch {
      setSearchError('Failed to fetch symbol')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{
        padding: '12px 24px',
        borderBottom: '1px solid #21262d',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        backgroundColor: '#161b22',
        flexShrink: 0,
      }}>
        <h1 style={{ color: '#58a6ff', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
          Ghost Trade
        </h1>
        <SearchBar onSearch={handleSearch} error={searchError} onClearError={() => setSearchError('')} />
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <WatchlistPanel stocks={watchlist} selected={selected} onSelect={setSelected} loading={loading} />
        <StockChart stock={selected} />
      </div>
    </div>
  )
}
