# Ghost Trade

A stock analysis dashboard. Phase 0 — display stock data, no trading logic.

**Stack:** React + Vite (frontend) · FastAPI + yfinance (backend) · Supabase/Postgres (future)

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in Supabase values when ready
uvicorn main:app --reload
```

Runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stocks/watchlist` | Returns data for the default watchlist |
| GET | `/stocks/{symbol}` | Returns price, % change, and 30-day history for a symbol |

## Watchlist

Default symbols: `SHOP.TO`, `RY.TO`, `AAPL`, `TSLA`

Use the search bar to look up any symbol and add it to the watchlist for the session.
Canadian symbols use the `.TO` suffix (e.g. `SHOP.TO`).
