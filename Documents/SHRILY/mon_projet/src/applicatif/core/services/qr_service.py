"""Service métier pour la gestion des QR codes."""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt

QR_SECRET_KEY = os.getenv("QR_SECRET_KEY", "dev-qr-secret-change-in-prod")
QR_ALGORITHM = "HS256"
QR_TOKEN_EXPIRE_MINUTES = int(os.getenv("QR_TOKEN_EXPIRE_MINUTES", "15"))


class QRService:
    """Service pour la logique QR code (génération et validation sécurisées)."""

    @staticmethod
    def create_qr_token(order_id: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=QR_TOKEN_EXPIRE_MINUTES)
        to_encode = {
            "order_id": order_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "qr",
        }
        return jwt.encode(to_encode, QR_SECRET_KEY, algorithm=QR_ALGORITHM)

    @staticmethod
    def verify_qr_token(token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, QR_SECRET_KEY, algorithms=[QR_ALGORITHM])
            if payload.get("type") != "qr":
                return None
            # TODO: vérifier usage unique (en base)
            return payload
        except JWTError:
            return None
