const API_BASE = 'http://localhost:8000'

async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 204) return null
  const body = await res.json().catch(() => ({ detail: 'Request failed' }))
  if (!res.ok) throw new Error(body.detail || 'Request failed')
  return body
}

export const api = {
  // Watchlist
  getWatchlist:  (token)                => request('/watchlist', {}, token),
  addSymbol:     (symbol, token)        => request(`/watchlist/${symbol}`, { method: 'POST' }, token),
  removeSymbol:  (symbol, token)        => request(`/watchlist/${symbol}`, { method: 'DELETE' }, token),
  toggleStar:    (symbol, token)        => request(`/watchlist/${symbol}/star`, { method: 'PATCH' }, token),

  // Stocks
  getStock:      (symbol)               => request(`/stocks/${symbol}`),
  getDiscover:   ()                     => request('/stocks/discover'),

  // Portfolio
  getPortfolio:     (token)             => request('/portfolio', {}, token),
  getPortfolioHistory: (token)          => request('/portfolio/history', {}, token),
  buyStock:      (symbol, shares, token) => request('/portfolio/buy',  { method: 'POST', body: JSON.stringify({ symbol, shares }) }, token),
  sellStock:     (symbol, shares, token) => request('/portfolio/sell', { method: 'POST', body: JSON.stringify({ symbol, shares }) }, token),
  resetPortfolio: (token)               => request('/portfolio/reset', { method: 'POST' }, token),
}
