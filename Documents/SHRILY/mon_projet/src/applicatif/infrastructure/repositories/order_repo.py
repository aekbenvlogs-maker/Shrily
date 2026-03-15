from __future__ import annotations

from sqlalchemy.orm import Session

from ...core.models import Order

"""Repository CRUD pour les commandes.

Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

__all__ = ["OrderRepository"]


class OrderRepository:
    """Accès DB pour Order.

    Fournit les opérations CRUD pour les commandes.
    """

    def __init__(self, db: Session) -> None:
        """Initialise le repository avec une session DB.

        Args:
            db: Session SQLAlchemy.
        """
        self.db = db

    def get(self, order_id: int) -> Order | None:
        """Récupère une commande par son ID.

        Args:
            order_id: Identifiant de la commande.

        Returns:
            Order ou None.
        """
        return self.db.query(Order).filter(Order.id == order_id).first()

    def list(self, skip: int = 0, limit: int = 100) -> list[Order]:
        """Liste les commandes avec pagination.

        Args:
            skip: Décalage de pagination.
            limit: Nombre maximum de résultats.

        Returns:
            Liste de commandes.
        """
        return self.db.query(Order).offset(skip).limit(limit).all()

    def create(self, order: Order) -> Order:
        """Crée une nouvelle commande.

        Args:
            order: Instance de Order à ajouter.

        Returns:
            Order créé.
        """
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order) -> Order:
        """Met à jour une commande existante.

        Args:
            order: Instance de Order à mettre à jour.

        Returns:
            Order mis à jour.
        """
        self.db.commit()
        self.db.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        """Supprime une commande de la base de données.

        Args:
            order: Instance de Order à supprimer.
        """
        self.db.delete(order)
        self.db.commit()
