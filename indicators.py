from datetime import datetime, timedelta, timezone

import pandas as pd
import pandas_ta as ta
from alpaca.data.enums import DataFeed
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame

LOOKBACK_DAYS = 100
RSI_PERIOD = 14
EMA_FAST = 9
EMA_SLOW = 21


def fetch_daily_bars(data_client: StockHistoricalDataClient, symbol: str) -> pd.DataFrame:
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=LOOKBACK_DAYS * 2)

    request = StockBarsRequest(
        symbol_or_symbols=symbol,
        timeframe=TimeFrame.Day,
        start=start,
        end=end,
        feed=DataFeed.IEX,  # free Alpaca keys can't query SIP
    )

    bars = data_client.get_stock_bars(request).df
    if bars.empty:
        return bars

    if isinstance(bars.index, pd.MultiIndex):
        bars = bars.xs(symbol, level="symbol")

    return bars.tail(LOOKBACK_DAYS)


def evaluate(bars: pd.DataFrame) -> dict:
    """Trend-following strategy with an RSI overbought/oversold filter.

    BUY:  EMA(9) > EMA(21) AND RSI(14) < 70
          (uptrend, not yet overbought)
    SELL: EMA(9) < EMA(21) AND RSI(14) > 30
          (downtrend, not yet oversold)
    HOLD: everything else (e.g. trend and momentum disagree, or RSI is
          in extreme territory that vetoes entering the prevailing trend)

    Returns a dict with the latest close, the three indicator values, the
    decision string, and the number of bars analyzed.
    """
    close = bars["close"]
    rsi = ta.rsi(close, length=RSI_PERIOD).iloc[-1]
    ema_fast = ta.ema(close, length=EMA_FAST).iloc[-1]
    ema_slow = ta.ema(close, length=EMA_SLOW).iloc[-1]

    if pd.isna(rsi) or pd.isna(ema_fast) or pd.isna(ema_slow):
        raise ValueError("Indicators returned NaN — not enough bars to evaluate.")

    if ema_fast > ema_slow and rsi < 70:
        decision = "BUY"
    elif ema_fast < ema_slow and rsi > 30:
        decision = "SELL"
    else:
        decision = "HOLD"

    return {
        "close": float(close.iloc[-1]),
        "rsi": float(rsi),
        "ema_fast": float(ema_fast),
        "ema_slow": float(ema_slow),
        "decision": decision,
        "bars_analyzed": len(bars),
    }
