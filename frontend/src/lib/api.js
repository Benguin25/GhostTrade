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
  getWatchlist: (token) => request('/watchlist', {}, token),
  addSymbol: (symbol, token) => request(`/watchlist/${symbol}`, { method: 'POST' }, token),
  removeSymbol: (symbol, token) => request(`/watchlist/${symbol}`, { method: 'DELETE' }, token),
  toggleStar: (symbol, token) => request(`/watchlist/${symbol}/star`, { method: 'PATCH' }, token),
  getStock: (symbol, token) => request(`/stocks/${symbol}`, {}, token),
  getPortfolio: (token) => request('/portfolio', {}, token),
  buyStock: (symbol, shares, token) =>
    request('/portfolio/buy', { method: 'POST', body: JSON.stringify({ symbol, shares }) }, token),
  sellStock: (symbol, shares, token) =>
    request('/portfolio/sell', { method: 'POST', body: JSON.stringify({ symbol, shares }) }, token),
  getTrades: (token) => request('/portfolio/trades', {}, token),
  resetPortfolio: (token) => request('/portfolio/reset', { method: 'POST' }, token),
}
