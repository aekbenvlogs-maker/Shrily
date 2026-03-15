"""Repository CRUD pour les utilisateurs (diaspora, commerçants, admin).
Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

from collections.abc import Sequence

from applicatif.core.models import User
from sqlalchemy.orm import Session

__all__ = ["UserRepository"]


class UserRepository:
    """Accès DB pour User."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def list(self, skip: int = 0, limit: int = 100) -> Sequence[User]:
        return self.db.query(User).offset(skip).limit(limit).all()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
