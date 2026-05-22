from fastapi import APIRouter, HTTPException
from services.market_data import get_stock_data, get_stocks_summary

router = APIRouter(prefix="/stocks", tags=["stocks"])

DISCOVER_CATEGORIES = {
    "Technology": [
        ("AAPL", "Apple"), ("MSFT", "Microsoft"), ("GOOGL", "Alphabet"),
        ("NVDA", "NVIDIA"), ("META", "Meta"), ("AMZN", "Amazon"),
        ("TSLA", "Tesla"), ("AMD", "AMD"),
    ],
    "Finance": [
        ("JPM", "JPMorgan Chase"), ("V", "Visa"), ("BAC", "Bank of America"),
        ("GS", "Goldman Sachs"), ("MA", "Mastercard"),
    ],
    "Healthcare": [
        ("UNH", "UnitedHealth"), ("JNJ", "Johnson & Johnson"), ("PFE", "Pfizer"),
    ],
    "Consumer": [
        ("WMT", "Walmart"), ("COST", "Costco"), ("MCD", "McDonald's"),
        ("SBUX", "Starbucks"), ("NKE", "Nike"),
    ],
    "Energy": [
        ("XOM", "ExxonMobil"), ("CVX", "Chevron"),
    ],
    "Canadian": [
        ("SHOP.TO", "Shopify"), ("RY.TO", "Royal Bank"),
        ("TD.TO", "TD Bank"), ("ENB.TO", "Enbridge"),
    ],
}


@router.get("/discover")
def discover():
    all_symbols = [sym for stocks in DISCOVER_CATEGORIES.values() for sym, _ in stocks]
    name_map = {sym: name for stocks in DISCOVER_CATEGORIES.values() for sym, name in stocks}

    prices = get_stocks_summary(all_symbols)
    price_map = {p["symbol"]: p for p in prices}

    categories = []
    for cat_name, stocks in DISCOVER_CATEGORIES.items():
        cat_stocks = []
        for symbol, _ in stocks:
            if symbol in price_map:
                entry = price_map[symbol].copy()
                entry["name"] = name_map[symbol]
                cat_stocks.append(entry)
        if cat_stocks:
            categories.append({"name": cat_name, "stocks": cat_stocks})

    return {"categories": categories}


@router.get("/{symbol}")
def get_stock(symbol: str):
    data = get_stock_data(symbol.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found or unavailable")
    return data
