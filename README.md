# GhostTrade

This repository is being restructured. It now holds two projects:

## `bot/` — Alpaca trading bot (work in progress)

The active project: an [Alpaca](https://alpaca.markets)-based trading bot.
It currently contains a hello-world script that connects to a paper account
and prints its balances. Strategy logic is not built yet.

See [bot/README.md](bot/README.md) for setup and how to run it.

## `legacy/` — paper-trading web app (archived)

The original GhostTrade: a paper-trading web app where you track stocks,
explore the market, and practice buying and selling with a simulated
$100,000 portfolio. Built with a React + Vite frontend, a FastAPI backend,
and Supabase for auth and storage.

This app is archived and no longer actively developed, but it still runs
from inside `legacy/`. See [legacy/SETUP.md](legacy/SETUP.md) to run it and
[legacy/CODEBASE.md](legacy/CODEBASE.md) for an architecture overview.
