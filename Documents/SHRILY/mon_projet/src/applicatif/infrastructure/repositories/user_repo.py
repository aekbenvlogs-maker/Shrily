from __future__ import annotations

from sqlalchemy.orm import Session

from ...core.models import User

"""Repository CRUD pour les utilisateurs (diaspora, commerçants, admin).

Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

__all__ = ["UserRepository"]


class UserRepository:
    """Accès DB pour User.

    Fournit les opérations CRUD pour les utilisateurs.
    """

    def __init__(self, db: Session) -> None:
        """Initialise le repository avec une session DB.

        Args:
            db: Session SQLAlchemy.
        """
        self.db = db

    def get(self, user_id: int) -> User | None:
        """Récupère un utilisateur par son ID.

        Args:
            user_id: Identifiant de l'utilisateur.

        Returns:
            User ou None.
        """
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        """Récupère un utilisateur par email.

        Args:
            email: Email de l'utilisateur.

        Returns:
            User ou None.
        """
        return self.db.query(User).filter(User.email == email).first()

    def create(self, user: User) -> User:
        """Crée un nouvel utilisateur.

        Args:
            user: Instance de User à ajouter.

        Returns:
            User créé.
        """
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list(self, skip: int = 0, limit: int = 100) -> list[User]:
        """Liste les utilisateurs avec pagination.

        Args:
            skip: Décalage de pagination.
            limit: Nombre maximum de résultats.

        Returns:
            Liste d'utilisateurs.
        """
        return self.db.query(User).offset(skip).limit(limit).all()

    def update(self, user: User) -> User:
        """Met à jour un utilisateur existant.

        Args:
            user: Instance de User à mettre à jour.

        Returns:
            User mis à jour.
        """
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        """Supprime un utilisateur de la base de données.

        Args:
            user: Instance de User à supprimer.
        """
        self.db.delete(user)
        self.db.commit()
