from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stocks
from routers import watchlist
from routers import portfolio

app = FastAPI(title="Ghost Trade API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(watchlist.router)
app.include_router(portfolio.router)


@app.get("/")
def root():
    return {"message": "Ghost Trade API is running"}
