import os

from alpaca.trading.client import TradingClient
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("APCA_API_KEY_ID")
secret_key = os.getenv("APCA_API_SECRET_KEY")

if not api_key or not secret_key:
    raise SystemExit(
        "Missing API credentials. Copy .env.example to .env and fill in "
        "APCA_API_KEY_ID and APCA_API_SECRET_KEY."
    )

client = TradingClient(api_key, secret_key, paper=True)
account = client.get_account()

print(f"Cash:            ${account.cash}")
print(f"Portfolio value: ${account.portfolio_value}")
