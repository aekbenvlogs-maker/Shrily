from __future__ import annotations

"""Repository CRUD pour les produits.
Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""


from collections.abc import Sequence

from sqlalchemy.orm import Session

from ...core.models import Product

__all__ = ["ProductRepository"]


class ProductRepository:
    """Accès DB pour Product."""

    def __init__(self, db: Session) -> None:
        """Initialise le repository avec une session DB.

        Args:
            db: Session SQLAlchemy.
        """
        self.db = db

    def get_by_id(self, product_id: int) -> Product | None:
        """Récupère un produit par son ID.

        Args:
            product_id: Identifiant du produit.

        Returns:
            Product ou None.
        """
        return self.db.query(Product).filter(Product.id == product_id).first()

    def list_by_merchant(self, merchant_id: int) -> Sequence[Product]:
        """Liste les produits d'un commerçant.

        Args:
            merchant_id: Identifiant du commerçant.

        Returns:
            Séquence de produits.
        """
        return self.db.query(Product).filter(Product.merchant_id == merchant_id).all()

    def create(self, data: dict) -> Product:
        """Crée un nouveau produit.

        Args:
            data: Dictionnaire des champs du produit.

        Returns:
            Product créé.
        """
        product = Product(**data)
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product_id: int, data: dict) -> Product | None:
        """Met à jour un produit existant.

        Args:
            product_id: Identifiant du produit à mettre à jour.
            data: Dictionnaire des champs à mettre à jour.

        Returns:
            Product mis à jour ou None si non trouvé.
        """
        product = self.get_by_id(product_id)
        if not product:
            return None
        for key, value in data.items():
            setattr(product, key, value)
        self.db.commit()
        self.db.refresh(product)
        return product
