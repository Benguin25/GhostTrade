import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import AuthPage from './components/AuthPage'
import WatchlistPanel from './components/WatchlistPanel'
import StockChart from './components/StockChart'
import SearchBar from './components/SearchBar'
import DiscoverPage from './pages/DiscoverPage'
import PortfolioPage from './pages/PortfolioPage'

const NAV_TABS = ['Watchlist', 'Discover', 'Portfolio']

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [watchlist, setWatchlist] = useState([])
  const [selected, setSelected] = useState(null)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [activePage, setActivePage] = useState('Watchlist')

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

  const handleAddToWatchlist = async (symbol) => {
    const token = session?.access_token
    const existing = watchlist.find(s => s.symbol === symbol)
    if (existing) { setSelected(existing); setActivePage('Watchlist'); return }
    try {
      const data = await api.addSymbol(symbol, token)
      setWatchlist(prev => {
        const exists = prev.find(s => s.symbol === data.symbol)
        return exists ? prev : [...prev, data]
      })
      setSelected(data)
    } catch (err) {
      if (err.message.includes('already in watchlist')) {
        const found = watchlist.find(s => s.symbol === symbol)
        if (found) setSelected(found)
      } else {
        setSearchError(err.message || `Symbol "${symbol}" not found`)
        throw err
      }
    }
  }

  const handleSearch = async (symbol) => {
    setSearchError('')
    await handleAddToWatchlist(symbol)
    setActivePage('Watchlist')
  }

  const handleRemove = async (symbol) => {
    const token = session?.access_token
    const prev = watchlist
    setWatchlist(list => list.filter(s => s.symbol !== symbol))
    if (selected?.symbol === symbol) {
      const remaining = prev.filter(s => s.symbol !== symbol)
      setSelected(remaining[0] ?? null)
    }
    try {
      await api.removeSymbol(symbol, token)
    } catch {
      setWatchlist(prev)
    }
  }

  const handleToggleStar = async (symbol) => {
    const token = session?.access_token
    const prev = watchlist
    setWatchlist(list =>
      list.map(s => s.symbol === symbol ? { ...s, starred: !s.starred } : s)
    )
    try {
      await api.toggleStar(symbol, token)
    } catch {
      setWatchlist(prev)
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

  const sortedWatchlist = [
    ...watchlist.filter(s => s.starred),
    ...watchlist.filter(s => !s.starred),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d1117' }}>
      {/* Header */}
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
        {activePage === 'Watchlist' && (
          <SearchBar onSearch={handleSearch} error={searchError} onClearError={() => setSearchError('')} />
        )}
        <div style={{ marginLeft: activePage === 'Watchlist' ? '0' : 'auto', display: 'flex', gap: '2px', backgroundColor: '#0d1117', borderRadius: '7px', padding: '3px', border: '1px solid #21262d', flexShrink: 0 }}>
          {NAV_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActivePage(tab)}
              style={{
                padding: '5px 14px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: activePage === tab ? '#21262d' : 'transparent',
                color: activePage === tab ? '#e6edf3' : '#8b949e',
                fontSize: '13px',
                fontWeight: activePage === tab ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activePage !== tab) e.target.style.color = '#e6edf3' }}
              onMouseLeave={e => { if (activePage !== tab) e.target.style.color = '#8b949e' }}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={handleLogout}
          style={{
            marginLeft: activePage === 'Watchlist' ? 'auto' : '0',
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#8b949e',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#f85149'; e.target.style.color = '#f85149' }}
          onMouseLeave={e => { e.target.style.borderColor = '#30363d'; e.target.style.color = '#8b949e' }}
        >
          Log out
        </button>
      </header>

      {/* Page content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activePage === 'Watchlist' && (
          <>
            <WatchlistPanel
              stocks={sortedWatchlist}
              selected={selected}
              onSelect={setSelected}
              loading={watchlistLoading}
              onRemove={handleRemove}
              onToggleStar={handleToggleStar}
            />
            <StockChart stock={selected} />
          </>
        )}
        {activePage === 'Discover' && (
          <DiscoverPage
            session={session}
            watchlist={watchlist}
            onAddToWatchlist={handleAddToWatchlist}
          />
        )}
        {activePage === 'Portfolio' && (
          <PortfolioPage session={session} />
        )}
      </div>
    </div>
  )
}
