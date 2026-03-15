"""Repository CRUD pour les commerçants.
Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

from collections.abc import Sequence

from applicatif.core.models import Merchant
from sqlalchemy.orm import Session

__all__ = ["MerchantRepository"]


class MerchantRepository:
    """Accès DB pour Merchant."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, merchant_id: int) -> Merchant | None:
        return self.db.query(Merchant).filter(Merchant.id == merchant_id).first()

    def list(self, skip: int = 0, limit: int = 100) -> Sequence[Merchant]:
        return self.db.query(Merchant).offset(skip).limit(limit).all()

    def create(self, merchant: Merchant) -> Merchant:
        self.db.add(merchant)
        self.db.commit()
        self.db.refresh(merchant)
        return merchant

    def update(self, merchant: Merchant) -> Merchant:
        self.db.commit()
        self.db.refresh(merchant)
        return merchant

    def delete(self, merchant: Merchant) -> None:
        self.db.delete(merchant)
        self.db.commit()
