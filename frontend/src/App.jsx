import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import AuthPage from './components/AuthPage'
import WatchlistPanel from './components/WatchlistPanel'
import PortfolioView from './components/PortfolioView'
import DiscoverView from './components/DiscoverView'
import StockChart from './components/StockChart'
import SearchBar from './components/SearchBar'
import TradePanel from './components/TradePanel'

const TABS = ['watchlist', 'portfolio', 'discover']

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('watchlist')

  const [watchlist, setWatchlist] = useState([])
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [portfolio, setPortfolio] = useState(null)
  const [trades, setTrades] = useState([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  const [selected, setSelected] = useState(null)

  // ── auth ──────────────────────────────────────────────────────────────────
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

  // ── data loaders ──────────────────────────────────────────────────────────
  const loadWatchlist = useCallback(async (token) => {
    setWatchlistLoading(true)
    try {
      const data = await api.getWatchlist(token)
      setWatchlist(data)
      if (data.length > 0) setSelected(prev => prev ?? data[0])
    } catch {
      // leave empty on error
    } finally {
      setWatchlistLoading(false)
    }
  }, [])

  const loadPortfolio = useCallback(async (token) => {
    setPortfolioLoading(true)
    try {
      const [portData, tradesData] = await Promise.all([
        api.getPortfolio(token),
        api.getTrades(token),
      ])
      setPortfolio(portData)
      setTrades(tradesData)
    } catch {
      // leave empty on error
    } finally {
      setPortfolioLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.access_token) {
      loadWatchlist(session.access_token)
      loadPortfolio(session.access_token)
    } else {
      setWatchlist([])
      setSelected(null)
      setPortfolio(null)
      setTrades([])
    }
  }, [session, loadWatchlist, loadPortfolio])

  // ── actions ───────────────────────────────────────────────────────────────
  const handleSearch = async (symbol) => {
    setSearchError('')
    const token = session?.access_token
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

  // Fetch full stock data (with chart history) by symbol — used by Discover + Portfolio
  const handleSelectSymbol = useCallback(async (symbol) => {
    const token = session?.access_token
    try {
      const data = await api.getStock(symbol, token)
      setSelected(data)
    } catch {
      const pos = portfolio?.positions?.find(p => p.symbol === symbol)
      if (pos) setSelected({ symbol: pos.symbol, price: pos.current_price, change_pct: pos.gain_loss_pct, history: [] })
    }
  }, [session, portfolio])

  const handleTrade = useCallback(async () => {
    const token = session?.access_token
    if (token) await loadPortfolio(token)
  }, [session, loadPortfolio])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setWatchlist([])
    setSelected(null)
    setPortfolio(null)
    setTrades([])
  }

  // ── render ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0d1117', color: '#8b949e', fontSize: '14px' }}>
        Loading…
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
      {/* ── Header ── */}
      <header style={{
        padding: '0 24px',
        height: '52px',
        borderBottom: '1px solid #21262d',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        backgroundColor: '#161b22',
        flexShrink: 0,
      }}>
        <h1 style={{ color: '#58a6ff', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.4px', whiteSpace: 'nowrap' }}>
          Ghost Trade
        </h1>

        {/* Tab nav */}
        <nav style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          {TABS.map(tab => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: active ? '#30363d' : 'transparent',
                  backgroundColor: active ? '#21262d' : 'transparent',
                  color: active ? '#e6edf3' : '#8b949e',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#e6edf3' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#8b949e' }}
              >
                {tab}
              </button>
            )
          })}
        </nav>

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
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f85149'; e.currentTarget.style.color = '#f85149' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#8b949e' }}
        >
          Log out
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel — switches with active tab */}
        {activeTab === 'watchlist' && (
          <WatchlistPanel
            stocks={sortedWatchlist}
            selected={selected}
            onSelect={setSelected}
            loading={watchlistLoading}
            onRemove={handleRemove}
            onToggleStar={handleToggleStar}
          />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioView
            portfolio={portfolio}
            trades={trades}
            loading={portfolioLoading}
            selected={selected}
            onSelectSymbol={handleSelectSymbol}
            token={session?.access_token}
            onPortfolioChange={() => loadPortfolio(session?.access_token)}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverView
            watchlist={watchlist}
            selected={selected}
            onSelectSymbol={handleSelectSymbol}
            onAddToWatchlist={handleSearch}
          />
        )}

        {/* Right panel: chart + trade panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <StockChart stock={selected} />
          </div>
          {selected && (
            <TradePanel
              stock={selected}
              portfolio={portfolio}
              token={session?.access_token}
              onTrade={handleTrade}
            />
          )}
        </div>
      </div>
    </div>
  )
}
