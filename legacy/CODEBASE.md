# Codebase Overview

## Directory structure

```
GhostTrade/
├── backend/                   FastAPI server
│   ├── main.py                App entry point, CORS, router registration
│   ├── requirements.txt
│   ├── routers/
│   │   ├── stocks.py          GET /stocks/discover, GET /stocks/{symbol}
│   │   ├── watchlist.py       CRUD /watchlist
│   │   └── portfolio.py       Buy/sell/reset/history /portfolio
│   └── services/
│       ├── auth.py            JWT validation via Supabase
│       ├── database.py        Supabase client + portfolio DB helpers
│       └── market_data.py     yfinance wrappers (single + batch)
├── frontend/                  React + Vite app
│   └── src/
│       ├── App.jsx            Root component, auth state, navigation
│       ├── lib/
│       │   ├── supabase.js    Supabase browser client
│       │   └── api.js         Typed fetch wrappers for every endpoint
│       ├── components/
│       │   ├── AuthPage.jsx   Login / signup form
│       │   ├── WatchlistPanel.jsx  Sidebar stock list
│       │   ├── SearchBar.jsx  Symbol search input
│       │   ├── StockChart.jsx Recharts 30-day line chart
│       │   └── TradeModal.jsx Buy / sell popup
│       └── pages/
│           ├── DiscoverPage.jsx   Browse stocks by sector
│           └── PortfolioPage.jsx  Holdings, P&L, trade history
└── supabase/
    └── migrations/
        ├── 001_create_watchlist.sql
        └── 002_portfolio.sql
```

## Data flow

```
Browser → api.js (fetch) → FastAPI router → service layer → Supabase / yfinance
```

Auth: Supabase issues a JWT on login. The browser stores it in localStorage (automatic). Every authenticated request sends it as `Authorization: Bearer <token>`. The backend validates it with `supabase.auth.get_user(token)` on every request.

## Database schema

**watchlist** — one row per user+symbol, tracks starred status.  
**portfolio** — one row per user, stores their cash balance (default $100,000).  
**holdings** — one row per user+symbol, tracks shares owned and average cost.  
**trades** — append-only log of every buy/sell, last 100 shown in the UI.

All tables have Row Level Security enabled so users can only access their own rows.

## Backend services

### `services/database.py`
Initialises the Supabase client and exposes simple helper functions for portfolio data:

- `get_portfolio(user_id)` — returns balance, creates the row if it doesn't exist yet
- `set_balance(user_id, balance)` — updates cash balance
- `get_holdings(user_id)` — list of `{symbol, shares, avg_cost}`
- `upsert_holding(user_id, symbol, shares, avg_cost)` — insert or update; deletes row if `shares <= 0`
- `add_trade(user_id, symbol, action, shares, price)` — appends a trade record
- `get_trades(user_id)` — last 100 trades newest-first
- `clear_portfolio(user_id)` — deletes holdings + trades and resets balance to $100k

### `services/market_data.py`
yfinance wrappers. All exceptions are caught silently (bad symbols just return `None`). yfinance logging is suppressed at module load.

- `get_stock_data(symbol)` — full data: price, % change, 30-day history
- `get_stock_summary(symbol)` — price + % change only (faster, no history)
- `get_stocks_summary(symbols)` — parallel batch using `ThreadPoolExecutor(max_workers=8)`

### `services/auth.py`
FastAPI dependency that validates the Bearer token and returns the Supabase `User` object. Used as `Depends(get_current_user)` in every authenticated route.

## Frontend

### `App.jsx`
Manages session state and the three-tab navigation (Watchlist / Discover / Portfolio). Owns the watchlist array and passes `onAddToWatchlist` down to pages that need it. The search bar is only shown on the Watchlist tab.

### `lib/api.js`
Single `request()` helper that attaches `Content-Type` and `Authorization` headers, parses JSON, and throws on non-OK responses. All API calls go through this — no raw `fetch` anywhere else.

### Pages

**DiscoverPage** — fetches `/stocks/discover` once on mount. Left panel: scrollable stock list grouped by sector. Right panel: `StockChart` for the selected stock (fetched on click). "Add to Watchlist" buttons are disabled once a symbol is already watched.

**PortfolioPage** — fetches `/portfolio` and `/portfolio/history` in parallel on mount. Shows four stat cards (cash, invested, total, P&L), a holdings table with inline Buy/Sell buttons, and a trade history table. The "Reset to $100k" button shows a confirmation dialog before calling `/portfolio/reset`.

### `TradeModal`
Overlay component for buying or selling. Takes `symbol`, `price`, `balance`, `sharesOwned` as props. Has a Buy/Sell tab toggle, a shares input with a Max button, live total calculation, a new-balance preview, and clear validation messaging. Calls `onConfirm(action, shares)` on submit.

## Styling
All styles are inline CSS objects. Colour palette is GitHub Dark (`#0d1117` background, `#161b22` surfaces, `#58a6ff` accent blue, `#3fb950` green, `#f85149` red, `#8b949e` muted text).
