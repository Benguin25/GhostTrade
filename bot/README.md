# GhostTrade Bot

An Alpaca-based trading bot (work in progress). This directory currently
contains only a hello-world script that connects to your Alpaca **paper**
account and prints its balances.

## Prerequisites

- Python 3.11+
- An [Alpaca](https://alpaca.markets) account with paper-trading API keys

## Setup

From inside this `bot/` directory:

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your credentials
cp .env.example .env
```

Edit `.env` and fill in your paper-trading keys (from the Alpaca dashboard):

```
APCA_API_KEY_ID=your-key-id
APCA_API_SECRET_KEY=your-secret-key
```

## Run

```bash
python hello.py
```

You should see your paper account's cash and portfolio value printed:

```
Cash:            $100000
Portfolio value: $100000
```
