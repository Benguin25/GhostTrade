import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# --- Portfolio helpers ---

def get_portfolio(user_id: str) -> dict:
    result = supabase.table("portfolio").select("balance").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    insert = supabase.table("portfolio").insert({"user_id": user_id, "balance": 100000.00}).execute()
    return insert.data[0]


def set_balance(user_id: str, balance: float):
    supabase.table("portfolio").update({"balance": round(balance, 2)}).eq("user_id", user_id).execute()


def get_holdings(user_id: str) -> list:
    result = supabase.table("holdings").select("symbol, shares, avg_cost").eq("user_id", user_id).execute()
    return result.data


def upsert_holding(user_id: str, symbol: str, shares: float, avg_cost: float):
    if shares <= 0:
        supabase.table("holdings").delete().eq("user_id", user_id).eq("symbol", symbol).execute()
    else:
        supabase.table("holdings").upsert(
            {"user_id": user_id, "symbol": symbol, "shares": round(shares, 6), "avg_cost": round(avg_cost, 2)},
            on_conflict="user_id,symbol",
        ).execute()


def add_trade(user_id: str, symbol: str, action: str, shares: float, price: float):
    supabase.table("trades").insert({
        "user_id": user_id,
        "symbol": symbol,
        "action": action,
        "shares": round(shares, 6),
        "price": round(price, 2),
        "total": round(shares * price, 2),
    }).execute()


def get_trades(user_id: str) -> list:
    result = (
        supabase.table("trades")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return result.data


def clear_portfolio(user_id: str):
    supabase.table("holdings").delete().eq("user_id", user_id).execute()
    supabase.table("trades").delete().eq("user_id", user_id).execute()
    supabase.table("portfolio").update({"balance": 100000.00}).eq("user_id", user_id).execute()
