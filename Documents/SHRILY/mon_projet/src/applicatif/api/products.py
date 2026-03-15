"""Endpoints pour la gestion des produits."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..infrastructure.db.session import get_db
from ..infrastructure.repositories.product_repo import ProductRepository

router = APIRouter(tags=["products"])


class ProductOut(BaseModel):
    """Modèle de sortie pour un produit."""

    model_config = ConfigDict(from_attributes=True)
    id: UUID
    merchant_id: UUID
    name: str
    description: str | None
    price_eur_cents: int
    image_url: str | None
    is_active: bool


@router.get("/products/merchant/{merchant_id}", response_model=list[ProductOut])
def list_products(merchant_id: UUID, db: Session = Depends(get_db)) -> list[ProductOut]:
    """Liste les produits d'un commerçant."""
    products = ProductRepository.list_by_merchant(db, merchant_id)
    return [ProductOut.model_validate(p) for p in products]
