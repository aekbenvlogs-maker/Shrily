"""
Endpoints pour la gestion des commerçants.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..infrastructure.db.session import get_db
from ..infrastructure.repositories.merchant_repo import MerchantRepository

router = APIRouter(tags=["merchants"])


class MerchantOut(BaseModel):
    """Modèle de sortie pour un commerçant."""

    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    category: str
    address: str
    wilaya: str
    logo_url: str | None
    phone: str | None
    is_active: bool


@router.get("/merchants/", response_model=list[MerchantOut])
def list_merchants(db: Session = Depends(get_db)) -> list[MerchantOut]:
    """Liste tous les commerçants disponibles."""
    merchants = MerchantRepository.list_all(db)
    return [MerchantOut.model_validate(m) for m in merchants]
