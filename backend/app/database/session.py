from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

#conexiunea catre postgres
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
)

#sesiuni pt requests
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

#baza modelelor
class Base(DeclarativeBase):
    pass

#ofera sesiune endpointurilor
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()