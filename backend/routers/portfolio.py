from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.auth import get_current_user
from services.database import (
    get_portfolio, set_balance, get_holdings, upsert_holding,
    add_trade, get_trades, clear_portfolio,
)
from services.market_data import get_stock_data

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


class TradeRequest(BaseModel):
    symbol: str
    shares: float


@router.get("")
def portfolio(user=Depends(get_current_user)):
    user_id = str(user.id)
    data = get_portfolio(user_id)
    holdings = get_holdings(user_id)

    enriched = []
    for h in holdings:
        stock = get_stock_data(h["symbol"])
        if stock:
            shares = float(h["shares"])
            avg_cost = float(h["avg_cost"])
            value = round(shares * stock["price"], 2)
            gain_loss = round((stock["price"] - avg_cost) * shares, 2)
            gain_pct = round(((stock["price"] - avg_cost) / avg_cost) * 100, 2) if avg_cost else 0
            enriched.append({
                "symbol": h["symbol"],
                "shares": shares,
                "avg_cost": avg_cost,
                "price": stock["price"],
                "change_pct": stock["change_pct"],
                "value": value,
                "gain_loss": gain_loss,
                "gain_pct": gain_pct,
            })

    invested = sum(h["value"] for h in enriched)
    return {
        "balance": float(data["balance"]),
        "holdings": enriched,
        "invested": round(invested, 2),
        "total_value": round(float(data["balance"]) + invested, 2),
    }


@router.post("/buy")
def buy(req: TradeRequest, user=Depends(get_current_user)):
    user_id = str(user.id)
    symbol = req.symbol.upper()
    shares = req.shares

    if shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be greater than zero")

    stock = get_stock_data(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")

    price = stock["price"]
    cost = round(shares * price, 2)

    portfolio_data = get_portfolio(user_id)
    balance = float(portfolio_data["balance"])

    if balance < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient funds — need ${cost:.2f}, have ${balance:.2f}")

    current = next((h for h in get_holdings(user_id) if h["symbol"] == symbol), None)
    if current:
        total_shares = float(current["shares"]) + shares
        new_avg = round((float(current["shares"]) * float(current["avg_cost"]) + shares * price) / total_shares, 2)
    else:
        total_shares = shares
        new_avg = round(price, 2)

    set_balance(user_id, round(balance - cost, 2))
    upsert_holding(user_id, symbol, total_shares, new_avg)
    add_trade(user_id, symbol, "buy", shares, price)

    return {"symbol": symbol, "shares": shares, "price": price, "total": cost, "balance": round(balance - cost, 2)}


@router.post("/sell")
def sell(req: TradeRequest, user=Depends(get_current_user)):
    user_id = str(user.id)
    symbol = req.symbol.upper()
    shares = req.shares

    if shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be greater than zero")

    stock = get_stock_data(symbol)
    if not stock:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")

    current = next((h for h in get_holdings(user_id) if h["symbol"] == symbol), None)
    owned = float(current["shares"]) if current else 0
    if owned < shares:
        raise HTTPException(status_code=400, detail=f"Not enough shares — own {owned:.4f}, selling {shares:.4f}")

    price = stock["price"]
    proceeds = round(shares * price, 2)

    portfolio_data = get_portfolio(user_id)
    balance = float(portfolio_data["balance"])
    new_shares = round(owned - shares, 6)

    set_balance(user_id, round(balance + proceeds, 2))
    upsert_holding(user_id, symbol, new_shares, float(current["avg_cost"]))
    add_trade(user_id, symbol, "sell", shares, price)

    return {"symbol": symbol, "shares": shares, "price": price, "total": proceeds, "balance": round(balance + proceeds, 2)}


@router.post("/reset")
def reset(user=Depends(get_current_user)):
    clear_portfolio(str(user.id))
    return {"balance": 100000.00, "message": "Portfolio reset to $100,000"}


@router.get("/history")
def history(user=Depends(get_current_user)):
    return get_trades(str(user.id))
