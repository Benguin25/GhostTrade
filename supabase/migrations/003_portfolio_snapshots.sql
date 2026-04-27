-- Run in the Supabase SQL editor after 002_portfolio.sql

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_value numeric(15,2) NOT NULL,
  recorded_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX portfolio_snapshots_user_time
  ON portfolio_snapshots (user_id, recorded_at DESC);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_snapshots"
  ON portfolio_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
