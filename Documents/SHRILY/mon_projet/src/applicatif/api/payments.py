"""Endpoints de paiement Stripe."""

from __future__ import annotations

import os

import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["payments"])

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "sk_test_...")
stripe.api_key = STRIPE_SECRET_KEY


class CheckoutSessionRequest(BaseModel):
    """Requête de création de session Stripe Checkout."""

    line_items: list[dict]
    success_url: str
    cancel_url: str


@router.post("/payments/create-checkout-session/")
def create_checkout_session(data: CheckoutSessionRequest):
    """Crée une session Stripe Checkout et retourne l'URL."""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=data.line_items,
            mode="payment",
            success_url=data.success_url,
            cancel_url=data.cancel_url,
        )
        return {"id": session.id, "url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
