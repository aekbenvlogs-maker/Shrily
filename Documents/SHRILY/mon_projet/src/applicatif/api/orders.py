"""Endpoints pour la gestion des commandes."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..core.models import OrderStatus
from ..infrastructure.db.session import get_db
from ..infrastructure.repositories.order_repo import OrderRepository

router = APIRouter(tags=["orders"])


class OrderItemIn(BaseModel):
    """Article d'une commande (entrée)."""

    product_id: UUID
    quantity: int
    unit_price_eur_cents: int


class OrderCreateIn(BaseModel):
    """Requête de création de commande."""

    user_id: UUID
    merchant_id: UUID
    beneficiary_name: str
    beneficiary_phone: str
    items: list[OrderItemIn]
    service_fee_cents: int


class OrderOut(BaseModel):
    """Modèle de sortie pour une commande."""

    model_config = ConfigDict(from_attributes=True)
    id: UUID
    status: OrderStatus
    total_eur_cents: int
    service_fee_cents: int


@router.post("/orders/", response_model=OrderOut)
def create_order(data: OrderCreateIn, db: Session = Depends(get_db)) -> OrderOut:
    """Crée une nouvelle commande."""
    order = OrderRepository.create(db, data)
    return OrderOut.model_validate(order)


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: UUID, db: Session = Depends(get_db)) -> OrderOut:
    """Retourne une commande par son ID."""
    order = OrderRepository.get_by_id(db, order_id)
    if not order:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Order not found")
    return OrderOut.model_validate(order)
