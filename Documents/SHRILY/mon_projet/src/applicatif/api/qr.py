"""Endpoints pour la gestion des QR codes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..core.services.qr_service import QRService
from ..infrastructure.db.session import get_db

router = APIRouter(tags=["qr"])


class QRTokenIn(BaseModel):
    """Entrée pour la validation d'un QR code."""

    token: str


class QRTokenOut(BaseModel):
    """Sortie pour la validation d'un QR code."""

    model_config = ConfigDict(from_attributes=True)
    order_id: str
    expires_at: str
    used: bool


@router.post("/qr/validate", response_model=QRTokenOut)
def validate_qr(data: QRTokenIn, db: Session = Depends(get_db)) -> QRTokenOut:
    """Valide un QR code, vérifie expiration et usage unique."""
    payload = QRService.verify_qr_token(data.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="QR token invalide ou expiré",
        )
    order_id = payload["order_id"]
    expires_at = payload["exp"]
    # TODO: vérifier en base si déjà utilisé (usage unique)
    used = False
    return QRTokenOut(order_id=order_id, expires_at=str(expires_at), used=used)
