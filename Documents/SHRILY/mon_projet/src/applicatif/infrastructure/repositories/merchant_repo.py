from __future__ import annotations

from sqlalchemy.orm import Session

from ...core.models import Merchant

"""Repository CRUD pour les commerçants.

Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

__all__ = ["MerchantRepository"]


class MerchantRepository:
    """Accès DB pour Merchant.

    Fournit les opérations CRUD pour les commerçants.
    """

    def __init__(self, db: Session) -> None:
        """Initialise le repository avec une session DB.

        Args:
            db: Session SQLAlchemy.
        """
        self.db = db

    def get(self, merchant_id: int) -> Merchant | None:
        """Récupère un commerçant par son ID.

        Args:
            merchant_id: Identifiant du commerçant.

        Returns:
            Merchant ou None.
        """
        return self.db.query(Merchant).filter(Merchant.id == merchant_id).first()

    def list(self, skip: int = 0, limit: int = 100) -> list[Merchant]:
        """Liste les commerçants avec pagination.

        Args:
            skip: Décalage de pagination.
            limit: Nombre maximum de résultats.

        Returns:
            Liste de commerçants.
        """
        return self.db.query(Merchant).offset(skip).limit(limit).all()

    def create(self, merchant: Merchant) -> Merchant:
        """Crée un nouveau commerçant.

        Args:
            merchant: Instance de Merchant à ajouter.

        Returns:
            Merchant créé.
        """
        self.db.add(merchant)
        self.db.commit()
        self.db.refresh(merchant)
        return merchant

    def update(self, merchant: Merchant) -> Merchant:
        """Met à jour un commerçant existant.

        Args:
            merchant: Instance de Merchant à mettre à jour.

        Returns:
            Merchant mis à jour.
        """
        self.db.commit()
        self.db.refresh(merchant)
        return merchant

    def delete(self, merchant: Merchant) -> None:
        """Supprime un commerçant de la base de données.

        Args:
            merchant: Instance de Merchant à supprimer.
        """
        self.db.delete(merchant)
        self.db.commit()
