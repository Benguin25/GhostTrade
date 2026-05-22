import logging
import os

from alpaca.common.exceptions import APIError
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.trading.client import TradingClient
from alpaca.trading.enums import OrderSide, TimeInForce
from alpaca.trading.requests import MarketOrderRequest
from dotenv import load_dotenv

from indicators import evaluate, fetch_daily_bars

load_dotenv()

api_key = os.getenv("APCA_API_KEY_ID")
secret_key = os.getenv("APCA_API_SECRET_KEY")

if not api_key or not secret_key:
    raise SystemExit(
        "Missing API credentials. Copy .env.example to .env and fill in "
        "APCA_API_KEY_ID and APCA_API_SECRET_KEY."
    )

SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "SPY"]
NOTIONAL_PER_BUY = 1000

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(message)s",
    handlers=[logging.FileHandler("decisions.log"), logging.StreamHandler()],
)
log = logging.getLogger("ghosttrade")

data_client = StockHistoricalDataClient(api_key, secret_key)
trading_client = TradingClient(api_key, secret_key, paper=True)

clock = trading_client.get_clock()
if not clock.is_open:
    log.info("Market is closed (next open: %s). Exiting without trading.", clock.next_open)
    raise SystemExit(0)

# One call to learn which symbols we already hold; avoids a 404 per symbol.
held_symbols = {p.symbol for p in trading_client.get_all_positions()}

for symbol in SYMBOLS:
    try:
        bars = fetch_daily_bars(data_client, symbol)
        if bars.empty:
            log.warning("%s | no bars returned, skipping", symbol)
            continue

        result = evaluate(bars)
        decision = result["decision"]
        has_position = symbol in held_symbols

        indicator_str = (
            f"close=${result['close']:.2f} "
            f"rsi={result['rsi']:.2f} "
            f"ema_fast={result['ema_fast']:.2f} "
            f"ema_slow={result['ema_slow']:.2f}"
        )

        if decision == "BUY" and not has_position:
            order = MarketOrderRequest(
                symbol=symbol,
                notional=NOTIONAL_PER_BUY,
                side=OrderSide.BUY,
                time_in_force=TimeInForce.DAY,
            )
            trading_client.submit_order(order)
            action = f"submitted BUY ${NOTIONAL_PER_BUY} notional"
        elif decision == "SELL" and has_position:
            trading_client.close_position(symbol)
            action = "closed position"
        else:
            action = "no action"

        log.info("%s | %s | %s | decision=%s | %s", symbol, indicator_str,
                 "in_position" if has_position else "flat", decision, action)

    except APIError as e:
        log.error("%s | API error: %s", symbol, e)
    except Exception as e:
        log.error("%s | unexpected error: %s", symbol, e)
