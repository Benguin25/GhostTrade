from fastapi import APIRouter, HTTPException
from services.market_data import get_stock_data

router = APIRouter(prefix="/stocks", tags=["stocks"])

WATCHLIST = ["SHOP.TO", "RY.TO", "AAPL", "TSLA"]


@router.get("/watchlist")
def get_watchlist():
    results = []
    for symbol in WATCHLIST:
        data = get_stock_data(symbol)
        if data:
            results.append(data)
    return results


@router.get("/{symbol}")
def get_stock(symbol: str):
    data = get_stock_data(symbol.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found or unavailable")
    return data
