# Ghost Trade

A paper-trading web app where you can track stocks, explore the market, and practice buying and selling with a simulated $100,000 portfolio.

## Features

- **Watchlist** — search any ticker and build a personal list with star/remove controls
- **Discover** — browse popular stocks across sectors (Tech, Finance, Healthcare, Consumer, Energy, Canadian) with live prices
- **Portfolio** — start with $100k, buy and sell stocks at live prices, track P&L, and reset at any time
- **Charts** — 30-day price history for any stock
- **Auth** — email/password accounts backed by Supabase, session persisted in browser

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python) + yfinance |
| Database | Supabase (PostgreSQL) |
| Charts | Recharts |

## Docs

- [SETUP.md](SETUP.md) — how to run the project locally
- [CODEBASE.md](CODEBASE.md) — technical overview of the architecture and code
