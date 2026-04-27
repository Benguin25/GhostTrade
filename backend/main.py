from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


app.include_router(stocks.router)
app.include_router(watchlist.router)
app.include_router(portfolio.router)


@app.get("/")
def root():
    return {"message": "Ghost Trade API is running"}
