from fastapi import APIRouter, Depends, HTTPException, status
from services.database import supabase
from services.auth import get_current_user
from services.market_data import get_stock_data

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("")
def get_watchlist(user=Depends(get_current_user)):
    rows = (
        supabase.table("watchlist")
        .select("symbol, starred, added_at")
        .eq("user_id", str(user.id))
        .order("starred", desc=True)
        .order("added_at")
        .execute()
    )
    results = []
    for row in rows.data:
        data = get_stock_data(row["symbol"])
        if data:
            data["starred"] = row["starred"]
            results.append(data)
    return results


@router.post("/{symbol}", status_code=status.HTTP_201_CREATED)
def add_to_watchlist(symbol: str, user=Depends(get_current_user)):
    symbol = symbol.upper()
    data = get_stock_data(symbol)
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found or unavailable")
    try:
        result = (
            supabase.table("watchlist")
            .insert({"user_id": str(user.id), "symbol": symbol})
            .execute()
        )
        row = result.data[0] if result.data else {}
        data["starred"] = row.get("starred", False)
        return data
    except Exception as e:
        msg = str(e).lower()
        if "duplicate" in msg or "unique" in msg or "23505" in msg:
            raise HTTPException(status_code=409, detail="Symbol already in watchlist")
        raise HTTPException(status_code=500, detail="Failed to add symbol")


@router.delete("/{symbol}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_watchlist(symbol: str, user=Depends(get_current_user)):
    symbol = symbol.upper()
    supabase.table("watchlist").delete().eq("user_id", str(user.id)).eq("symbol", symbol).execute()


@router.patch("/{symbol}/star")
def toggle_star(symbol: str, user=Depends(get_current_user)):
    symbol = symbol.upper()
    row = (
        supabase.table("watchlist")
        .select("starred")
        .eq("user_id", str(user.id))
        .eq("symbol", symbol)
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=404, detail="Symbol not in watchlist")
    new_starred = not row.data[0]["starred"]
    supabase.table("watchlist").update({"starred": new_starred}).eq("user_id", str(user.id)).eq("symbol", symbol).execute()
    return {"symbol": symbol, "starred": new_starred}
