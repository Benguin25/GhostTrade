import yfinance as yf


def get_stock_data(symbol: str) -> dict | None:
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1mo")

        if hist.empty:
            return None

        fast_info = ticker.fast_info
        current_price = fast_info.last_price or float(hist["Close"].iloc[-1])
        prev_close = fast_info.previous_close or float(hist["Close"].iloc[-2])

        change_pct = ((current_price - prev_close) / prev_close) * 100 if prev_close else 0.0

        history = [
            {"date": str(idx.date()), "close": round(float(row["Close"]), 2)}
            for idx, row in hist.iterrows()
        ]

        return {
            "symbol": symbol,
            "price": round(float(current_price), 2),
            "change_pct": round(float(change_pct), 2),
            "history": history,
        }
    except Exception:
        return None
