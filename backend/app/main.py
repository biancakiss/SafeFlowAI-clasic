from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.messages import router as messages_router
from app.database.session import Base, engine
from app.models.user import User  # noqa: F401
from app.api.risk import router as risk_router
from app.models.analysis import Analysis  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.transaction import Transaction  # noqa: F401
from app.api.analyses import router as analyses_router
from app.api.transaction import (router as transactions_router,)
from app.api.dashboard import router as dashboard_router
from app.api.notification import router as notifications_router
from app.api.urls import router as urls_router

#creaza tabelele predefinite in modelele sql alchemy
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="SafeFlow AI",
    lifespan=lifespan,
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(auth_router)
app.include_router(risk_router)
app.include_router(messages_router)
app.include_router(analyses_router)
app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(notifications_router)
app.include_router(urls_router)