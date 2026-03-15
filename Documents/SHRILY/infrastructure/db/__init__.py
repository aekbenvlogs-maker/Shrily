"""Initialisation SQLAlchemy pour SHRILY.
Crée l'engine et la session locale.
"""

from config.settings import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from infrastructure.db.base import Base

__all__ = ["Base", "SessionLocal", "engine"]

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)
