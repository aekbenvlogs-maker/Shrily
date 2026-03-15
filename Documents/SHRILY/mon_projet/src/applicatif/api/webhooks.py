"""Endpoints pour la gestion des webhooks externes (Stripe, etc)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.services.stripe_service import StripeService
from ..infrastructure.db.session import get_db
from ..infrastructure.repositories.order_repo import OrderRepository

router = APIRouter(tags=["webhooks"])


# Modèle Pydantic pour le webhook Stripe
class StripeWebhookMetadata(BaseModel):
    order_id: str = Field(..., description="Order UUID")


class StripeWebhookDataObject(BaseModel):
    metadata: StripeWebhookMetadata


class StripeWebhookData(BaseModel):
    object: StripeWebhookDataObject


class StripeWebhookPayload(BaseModel):
    id: str
    type: str
    data: StripeWebhookData


@router.post("/webhooks/stripe")
async def stripe_webhook(
    payload: StripeWebhookPayload, db: Session = Depends(get_db)
) -> dict:
    """Réception d'un webhook Stripe avec idempotence sur le paiement."""
    event_id = payload.id
    order_id = payload.data.object.metadata.order_id
    if not (event_id and order_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Event ou order_id manquant"
        )
    order_repo = OrderRepository(db)
    processed = StripeService.process_payment_event(db, order_repo, order_id, event_id)
    if processed:
        return {"status": "payment_processed", "order_id": order_id}
    else:
        return {"status": "already_processed", "order_id": order_id}
