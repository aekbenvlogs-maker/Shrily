"""Repository CRUD pour les commandes.
Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

from collections.abc import Sequence

from applicatif.core.models import Order
from sqlalchemy.orm import Session

__all__ = ["OrderRepository"]


class OrderRepository:
    """Accès DB pour Order."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, order_id: int) -> Order | None:
        return self.db.query(Order).filter(Order.id == order_id).first()

    def list(self, skip: int = 0, limit: int = 100) -> Sequence[Order]:
        return self.db.query(Order).offset(skip).limit(limit).all()

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order) -> Order:
        self.db.commit()
        self.db.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        self.db.delete(order)
        self.db.commit()
