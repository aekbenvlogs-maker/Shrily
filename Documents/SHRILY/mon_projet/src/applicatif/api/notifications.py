"""
Endpoints pour les notifications commerçants.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.models import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


# Pydantic model for Notification response
class NotificationOut(BaseModel):
    """Modèle de sortie pour une notification."""

    model_config = ConfigDict(from_attributes=True)
    id: UUID
    merchant_id: UUID
    message: str
    read: bool
    created_at: datetime


@router.get("/merchant/{merchant_id}", response_model=list[NotificationOut])
def get_merchant_notifications(merchant_id: UUID, db: Session = Depends(get_db)):
    """Retourne les notifications d'un commerçant."""
    notifications = (
        db.query(Notification)
        .filter(Notification.merchant_id == merchant_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [NotificationOut.model_validate(n) for n in notifications]
