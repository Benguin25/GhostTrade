# Setup

## Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project

## Supabase

1. Create a new Supabase project.
2. Open the SQL Editor and run the two migration files in order:
   - `supabase/migrations/001_create_watchlist.sql`
   - `supabase/migrations/002_portfolio.sql`
3. Note your **Project URL** and **anon key** (Settings → API).

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and fill in:

```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<service-role-key>
```

Start the server:

```bash
uvicorn main:app --reload
```

Runs at `http://localhost:8000`

## Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Start the dev server:

```bash
npm run dev
```

Runs at `http://localhost:5173`

## Running both at once

Open two terminals — one for each of the commands above. The frontend proxies API calls to `http://localhost:8000`.

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stocks/discover` | No | Batch prices for popular stocks by sector |
| GET | `/stocks/{symbol}` | No | Price + 30-day history for a symbol |
| GET | `/watchlist` | Yes | User's watchlist with live prices |
| POST | `/watchlist/{symbol}` | Yes | Add symbol to watchlist |
| DELETE | `/watchlist/{symbol}` | Yes | Remove symbol |
| PATCH | `/watchlist/{symbol}/star` | Yes | Toggle star |
| GET | `/portfolio` | Yes | Balance, holdings, P&L |
| POST | `/portfolio/buy` | Yes | Buy shares `{symbol, shares}` |
| POST | `/portfolio/sell` | Yes | Sell shares `{symbol, shares}` |
| POST | `/portfolio/reset` | Yes | Reset to $100,000 |
| GET | `/portfolio/history` | Yes | Last 100 trades |
