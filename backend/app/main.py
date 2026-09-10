from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.database.session import Base, engine
from app.models.user import User  # noqa: F401
from app.api.risk import router as risk_router
from app.models.analysis import Analysis  # noqa: F401

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