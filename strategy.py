import os
from datetime import datetime, timedelta, timezone

import pandas as pd
import pandas_ta as ta
from alpaca.data.enums import DataFeed
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("APCA_API_KEY_ID")
secret_key = os.getenv("APCA_API_SECRET_KEY")

if not api_key or not secret_key:
    raise SystemExit(
        "Missing API credentials. Copy .env.example to .env and fill in "
        "APCA_API_KEY_ID and APCA_API_SECRET_KEY."
    )

SYMBOL = "TSLA"
LOOKBACK_DAYS = 100
RSI_PERIOD = 14
EMA_FAST = 9
EMA_SLOW = 21

client = StockHistoricalDataClient(api_key, secret_key)

# Pad the calendar window so we still get ~100 trading days after weekends/holidays.
end = datetime.now(timezone.utc)
start = end - timedelta(days=LOOKBACK_DAYS * 2)

request = StockBarsRequest(
    symbol_or_symbols=SYMBOL,
    timeframe=TimeFrame.Day,
    start=start,
    end=end,
    feed=DataFeed.IEX,  # free Alpaca keys can't query SIP
)

bars = client.get_stock_bars(request).df

if bars.empty:
    raise SystemExit(f"No bars returned for {SYMBOL}. Check market data access on your Alpaca key.")

# Multi-symbol requests come back with a (symbol, timestamp) MultiIndex; drop the symbol level.
if isinstance(bars.index, pd.MultiIndex):
    bars = bars.xs(SYMBOL, level="symbol")

bars = bars.tail(LOOKBACK_DAYS)

close = bars["close"]
rsi = ta.rsi(close, length=RSI_PERIOD)
ema_fast = ta.ema(close, length=EMA_FAST)
ema_slow = ta.ema(close, length=EMA_SLOW)

latest_close = close.iloc[-1]
latest_rsi = rsi.iloc[-1]
latest_ema_fast = ema_fast.iloc[-1]
latest_ema_slow = ema_slow.iloc[-1]

if pd.isna(latest_rsi) or pd.isna(latest_ema_fast) or pd.isna(latest_ema_slow):
    raise SystemExit("Indicators returned NaN — not enough bars to evaluate.")

bullish_trend = latest_ema_fast > latest_ema_slow
bearish_trend = latest_ema_fast < latest_ema_slow

if bullish_trend and latest_rsi < 70:
    decision = "BUY"
elif bearish_trend and latest_rsi > 30:
    decision = "SELL"
else:
    decision = "HOLD"

print(f"Symbol:          {SYMBOL}")
print(f"Bars analyzed:   {len(bars)}")
print(f"Latest close:    ${latest_close:.2f}")
print(f"RSI({RSI_PERIOD}):         {latest_rsi:.2f}")
print(f"EMA({EMA_FAST}):           {latest_ema_fast:.2f}")
print(f"EMA({EMA_SLOW}):          {latest_ema_slow:.2f}")
print(f"Decision:        {decision}")
