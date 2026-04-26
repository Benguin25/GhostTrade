-- Run this in the Supabase SQL editor to create the watchlist table.

CREATE TABLE IF NOT EXISTS watchlist (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol    text        NOT NULL,
  starred   boolean     NOT NULL DEFAULT false,
  added_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own rows
CREATE POLICY "users_manage_own_watchlist"
  ON watchlist
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
