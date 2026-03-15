"""Tests unitaires du service OrderService.

Respecte mypy strict, ruff, pytest.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from core.models import Order, OrderStatus
from core.services.order_service import OrderService
from core.services.qr_service import QRService
from core.services.sms_service import SMSService
from core.services.stripe_service import StripeService


class DummySMS(SMSService):
    """Dummy SMSService pour tests unitaires."""

    def notify_merchant_new_order(self, order: Order) -> None:
        """Simule la notification d'une nouvelle commande au commerçant."""
        pass

    def notify_beneficiary_ready(self, order: Order, qr_token) -> None:
        """Simule la notification au bénéficiaire que la commande est prête."""
        pass


class DummyQR(QRService):
    """Dummy QRService pour tests unitaires."""

    def __init__(self, db: Session) -> None:
        """Initialise le dummy QRService."""
        pass

    def generate_token(self, order: Order):
        """Simule la génération d'un token QR."""

        class QR:
            token = "dummy"
            expires_at = datetime.utcnow()
            used = False

        return QR()

    def validate_token(self, token: str):
        """Simule la validation d'un token QR."""
        return None

    def mark_used(self, qr_token):
        """Simule le marquage d'un token QR comme utilisé."""
        pass


class DummyStripe(StripeService):
    """Dummy StripeService pour tests unitaires."""

    def create_checkout_session(self, order: Order) -> str:
        """Simule la création d'une session Stripe Checkout."""
        return "https://stripe.test/session"

    def capture_payment(self, order: Order) -> None:
        """Simule la capture d'un paiement Stripe."""
        pass

    def refund_payment(self, order: Order) -> None:
        """Simule le remboursement d'un paiement Stripe."""
        pass


def test_create_order(monkeypatch, db_session: Session):
    """Crée une commande via OrderService."""
    service = OrderService(db_session, DummySMS(), DummyQR(db_session), DummyStripe())
    order = service.create_order(
        user_id=1,
        merchant_id=1,
        beneficiary_name="Ali",
        beneficiary_phone="+213600000000",
        items=[{"product_id": 1, "quantity": 2, "unit_price_eur_cents": 500}],
        service_fee_cents=75,
    )
    assert order.status == OrderStatus.PENDING
    assert order.total_eur_cents == 2 * 500 + 75
    assert order.beneficiary_name == "Ali"
