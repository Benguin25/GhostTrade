-- Run in the Supabase SQL editor after 001_create_watchlist.sql

CREATE TABLE IF NOT EXISTS portfolio (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    numeric(15,2) NOT NULL DEFAULT 100000.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holdings (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol     text          NOT NULL,
  shares     numeric(15,6) NOT NULL DEFAULT 0,
  avg_cost   numeric(15,2) NOT NULL DEFAULT 0,
  UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS trades (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol     text          NOT NULL,
  action     text          NOT NULL CHECK (action IN ('buy', 'sell')),
  shares     numeric(15,6) NOT NULL,
  price      numeric(15,2) NOT NULL,
  total      numeric(15,2) NOT NULL,
  created_at timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_portfolio" ON portfolio FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_manage_own_holdings"  ON holdings  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_manage_own_trades"    ON trades    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
