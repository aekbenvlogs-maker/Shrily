"""Endpoint pour générer une image QR code PNG."""

from __future__ import annotations

import io
from uuid import UUID

import qrcode
from fastapi import APIRouter, HTTPException, Path, Response

from ..core.services.qr_service import QRService

router = APIRouter(tags=["qr"])


@router.get("/qr/generate/{order_id}")
def generate_qr(order_id: UUID = Path(..., description="Order UUID")):
    """Génère une image PNG pour un QR code sécurisé lié à une commande."""
    token = QRService.create_qr_token(str(order_id))
    img = qrcode.make(token)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png")
