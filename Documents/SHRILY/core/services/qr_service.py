"""Service métier pour la génération et validation de QR code de retrait.

Respecte mypy strict, ruff.
"""

import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from core.models import Order, QRToken

__all__ = ["QRService"]


class QRService:
    """Gestion des QR codes de retrait (génération, validation, expiration)."""

    def __init__(self, db: Session) -> None:
        """Initialise le service QR avec la session DB."""
        self.db = db

    def generate_token(self, order: Order) -> QRToken:
        """Génère un QRToken unique, expire dans 48h."""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=48)
        qr_token = QRToken(
            order_id=order.id,
            token=token,
            expires_at=expires_at,
            used=False,
        )
        self.db.add(qr_token)
        self.db.commit()
        self.db.refresh(qr_token)
        return qr_token

    def validate_token(self, token: str) -> QRToken | None:
        """Retourne le QRToken s'il est valide (non expiré, non utilisé)."""
        qr_token = (
            self.db.query(QRToken)
            .filter(
                QRToken.token == token,
                QRToken.expires_at > datetime.utcnow(),
                QRToken.used.is_(False),
            )
            .first()
        )
        return qr_token

    def mark_used(self, qr_token: QRToken) -> None:
        """Marque le QRToken comme utilisé."""
        qr_token.used = True
        self.db.commit()
        self.db.refresh(qr_token)
