"""Tests unitaires du service QRService.

Respecte mypy strict, ruff, pytest.
"""

from datetime import datetime

import pytest
from sqlalchemy.orm import Session

from core.models import Order, OrderStatus
from core.services.qr_service import QRService


@pytest.fixture
def order(db_session: Session) -> Order:
    """Créer un Order prêt à l'emploi pour les tests QRService."""
    order = Order(
        user_id=1,
        merchant_id=1,
        beneficiary_name="Ali",
        beneficiary_phone="+213600000000",
        status=OrderStatus.READY,
        total_eur_cents=1000,
        service_fee_cents=100,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order


def test_generate_token(db_session: Session, order: Order):
    """Génère un token QR pour une commande."""
    qr_service = QRService(db_session)
    qr_token = qr_service.generate_token(order)
    assert qr_token.order_id == order.id
    assert qr_token.token
    assert qr_token.expires_at > datetime.utcnow()
    assert not qr_token.used
