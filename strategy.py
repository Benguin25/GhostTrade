import os

from alpaca.data.historical import StockHistoricalDataClient
from dotenv import load_dotenv

from indicators import EMA_FAST, EMA_SLOW, RSI_PERIOD, evaluate, fetch_daily_bars

load_dotenv()

api_key = os.getenv("APCA_API_KEY_ID")
secret_key = os.getenv("APCA_API_SECRET_KEY")

if not api_key or not secret_key:
    raise SystemExit(
        "Missing API credentials. Copy .env.example to .env and fill in "
        "APCA_API_KEY_ID and APCA_API_SECRET_KEY."
    )

SYMBOL = "TSLA"

data_client = StockHistoricalDataClient(api_key, secret_key)
bars = fetch_daily_bars(data_client, SYMBOL)

if bars.empty:
    raise SystemExit(f"No bars returned for {SYMBOL}. Check market data access on your Alpaca key.")

result = evaluate(bars)

print(f"Symbol:          {SYMBOL}")
print(f"Bars analyzed:   {result['bars_analyzed']}")
print(f"Latest close:    ${result['close']:.2f}")
print(f"RSI({RSI_PERIOD}):         {result['rsi']:.2f}")
print(f"EMA({EMA_FAST}):           {result['ema_fast']:.2f}")
print(f"EMA({EMA_SLOW}):          {result['ema_slow']:.2f}")
print(f"Decision:        {result['decision']}")
