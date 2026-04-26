import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import AuthPage from './components/AuthPage'
import WatchlistPanel from './components/WatchlistPanel'
import StockChart from './components/StockChart'
import SearchBar from './components/SearchBar'

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [watchlist, setWatchlist] = useState([])
  const [selected, setSelected] = useState(null)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Track auth state from Supabase (persisted in localStorage automatically)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadWatchlist = useCallback(async (token) => {
    setWatchlistLoading(true)
    try {
      const data = await api.getWatchlist(token)
      setWatchlist(data)
      if (data.length > 0) setSelected(prev => prev ?? data[0])
    } catch {
      // leave watchlist empty on error
    } finally {
      setWatchlistLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.access_token) {
      loadWatchlist(session.access_token)
    } else {
      setWatchlist([])
      setSelected(null)
    }
  }, [session, loadWatchlist])

  const handleSearch = async (symbol) => {
    setSearchError('')
    const token = session?.access_token
    // Optimistic: fetch stock data then POST to persist
    try {
      const existing = watchlist.find(s => s.symbol === symbol)
      if (existing) { setSelected(existing); return }

      const data = await api.addSymbol(symbol, token)
      setWatchlist(prev => {
        const exists = prev.find(s => s.symbol === data.symbol)
        return exists ? prev : [...prev, data]
      })
      setSelected(data)
    } catch (err) {
      if (err.message.includes('already in watchlist')) {
        const existing = watchlist.find(s => s.symbol === symbol)
        if (existing) setSelected(existing)
      } else {
        setSearchError(err.message || `Symbol "${symbol}" not found`)
      }
    }
  }

  const handleRemove = async (symbol) => {
    const token = session?.access_token
    // Optimistic remove
    const prev = watchlist
    setWatchlist(list => list.filter(s => s.symbol !== symbol))
    if (selected?.symbol === symbol) {
      const remaining = prev.filter(s => s.symbol !== symbol)
      setSelected(remaining[0] ?? null)
    }
    try {
      await api.removeSymbol(symbol, token)
    } catch {
      setWatchlist(prev) // revert
    }
  }

  const handleToggleStar = async (symbol) => {
    const token = session?.access_token
    // Optimistic toggle
    const prev = watchlist
    setWatchlist(list =>
      list.map(s => s.symbol === symbol ? { ...s, starred: !s.starred } : s)
    )
    try {
      await api.toggleStar(symbol, token)
    } catch {
      setWatchlist(prev) // revert
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setWatchlist([])
    setSelected(null)
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0d1117', color: '#8b949e', fontSize: '14px' }}>
        Loading...
      </div>
    )
  }

  if (!session) return <AuthPage />

  // Sort: starred first, then by original order
  const sortedWatchlist = [
    ...watchlist.filter(s => s.starred),
    ...watchlist.filter(s => !s.starred),
  ]

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
        <button
          onClick={handleLogout}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#8b949e',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#f85149'; e.target.style.color = '#f85149' }}
          onMouseLeave={e => { e.target.style.borderColor = '#30363d'; e.target.style.color = '#8b949e' }}
        >
          Log out
        </button>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <WatchlistPanel
          stocks={sortedWatchlist}
          selected={selected}
          onSelect={setSelected}
          loading={watchlistLoading}
          onRemove={handleRemove}
          onToggleStar={handleToggleStar}
        />
        <StockChart stock={selected} />
      </div>
    </div>
  )
}
