from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.database import supabase
from services.auth import get_current_user
from services.market_data import get_stock_data

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


class TradeRequest(BaseModel):
    symbol: str
    shares: float


def _get_or_create_portfolio(user_id: str) -> dict:
    result = supabase.table("portfolio").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    new = supabase.table("portfolio").insert({"user_id": user_id, "cash_balance": 100000}).execute()
    return new.data[0]


@router.get("")
def get_portfolio(user=Depends(get_current_user)):
    user_id = str(user.id)
    portfolio = _get_or_create_portfolio(user_id)
    cash = float(portfolio["cash_balance"])

    rows = supabase.table("positions").select("*").eq("user_id", user_id).execute()

    positions = []
    total_cost_basis = 0.0
    total_current_value = 0.0

    for pos in rows.data:
        data = get_stock_data(pos["symbol"])
        avg_cost = float(pos["avg_cost"])
        current_price = data["price"] if data else avg_cost
        shares = float(pos["shares"])
        current_value = shares * current_price
        cost_basis = shares * avg_cost
        gain_loss = current_value - cost_basis
        gain_loss_pct = (gain_loss / cost_basis * 100) if cost_basis > 0 else 0.0

        total_cost_basis += cost_basis
        total_current_value += current_value

        positions.append({
            "symbol": pos["symbol"],
            "shares": round(shares, 6),
            "avg_cost": round(avg_cost, 2),
            "current_price": round(current_price, 2),
            "current_value": round(current_value, 2),
            "gain_loss": round(gain_loss, 2),
            "gain_loss_pct": round(gain_loss_pct, 2),
        })

    total_value = cash + total_current_value
    total_gain_loss = total_current_value - total_cost_basis

    return {
        "cash": round(cash, 2),
        "total_value": round(total_value, 2),
        "total_gain_loss": round(total_gain_loss, 2),
        "positions": positions,
    }


@router.post("/buy")
def buy_stock(req: TradeRequest, user=Depends(get_current_user)):
    user_id = str(user.id)
    symbol = req.symbol.upper()
    shares = float(req.shares)

    if shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be positive")

    data = get_stock_data(symbol)
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")

    price = data["price"]
    total = round(price * shares, 2)

    portfolio = _get_or_create_portfolio(user_id)
    cash = float(portfolio["cash_balance"])

    if cash < total:
        raise HTTPException(status_code=400, detail="Insufficient cash balance")

    new_cash = round(cash - total, 2)
    supabase.table("portfolio").update({"cash_balance": new_cash}).eq("user_id", user_id).execute()

    existing = supabase.table("positions").select("*").eq("user_id", user_id).eq("symbol", symbol).execute()
    if existing.data:
        pos = existing.data[0]
        old_shares = float(pos["shares"])
        old_avg = float(pos["avg_cost"])
        new_shares = old_shares + shares
        new_avg = (old_shares * old_avg + shares * price) / new_shares
        supabase.table("positions").update({
            "shares": round(new_shares, 10),
            "avg_cost": round(new_avg, 6),
        }).eq("user_id", user_id).eq("symbol", symbol).execute()
    else:
        supabase.table("positions").insert({
            "user_id": user_id,
            "symbol": symbol,
            "shares": round(shares, 10),
            "avg_cost": round(price, 6),
        }).execute()

    supabase.table("trades").insert({
        "user_id": user_id,
        "symbol": symbol,
        "action": "buy",
        "shares": shares,
        "price": round(price, 2),
        "total": total,
        "executed_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"symbol": symbol, "shares": shares, "price": price, "total": total, "cash": new_cash}


@router.post("/sell")
def sell_stock(req: TradeRequest, user=Depends(get_current_user)):
    user_id = str(user.id)
    symbol = req.symbol.upper()
    shares = float(req.shares)

    if shares <= 0:
        raise HTTPException(status_code=400, detail="Shares must be positive")

    existing = supabase.table("positions").select("*").eq("user_id", user_id).eq("symbol", symbol).execute()
    if not existing.data:
        raise HTTPException(status_code=400, detail="No position in this stock")

    pos = existing.data[0]
    held = float(pos["shares"])

    if shares > held + 1e-9:
        raise HTTPException(status_code=400, detail=f"Cannot sell more shares than held ({round(held, 6)})")

    data = get_stock_data(symbol)
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")

    price = data["price"]
    total = round(price * shares, 2)

    portfolio = _get_or_create_portfolio(user_id)
    cash = float(portfolio["cash_balance"])
    new_cash = round(cash + total, 2)

    supabase.table("portfolio").update({"cash_balance": new_cash}).eq("user_id", user_id).execute()

    new_shares = held - shares
    if new_shares < 1e-9:
        supabase.table("positions").delete().eq("user_id", user_id).eq("symbol", symbol).execute()
    else:
        supabase.table("positions").update({"shares": round(new_shares, 10)}).eq("user_id", user_id).eq("symbol", symbol).execute()

    supabase.table("trades").insert({
        "user_id": user_id,
        "symbol": symbol,
        "action": "sell",
        "shares": shares,
        "price": round(price, 2),
        "total": total,
        "executed_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"symbol": symbol, "shares": shares, "price": price, "total": total, "cash": new_cash}


@router.get("/trades")
def get_trades(user=Depends(get_current_user)):
    user_id = str(user.id)
    result = (
        supabase.table("trades")
        .select("*")
        .eq("user_id", user_id)
        .order("executed_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data
