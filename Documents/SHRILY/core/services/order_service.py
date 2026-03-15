"""Service métier pour la gestion des commandes Diaspora Delivery.

Respecte mypy strict, ruff, SQLAlchemy 2.x.
"""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy.orm import Session

from core.models import Order, OrderItem, OrderStatus, QRToken
from core.services.qr_service import QRService
from core.services.sms_service import SMSService
from core.services.stripe_service import StripeService
from infrastructure.repositories.order_repo import OrderRepository

__all__ = ["OrderService"]


class OrderService:
    """Logique métier pour la gestion des commandes."""

    def __init__(
        self,
        db: Session,
        sms_service: SMSService,
        qr_service: QRService,
        stripe_service: StripeService,
    ) -> None:
        """Initialise le service avec DB et dépendances externes."""
        self.db = db
        self.order_repo = OrderRepository(db)
        self.sms_service = sms_service
        self.qr_service = qr_service
        self.stripe_service = stripe_service

    def create_order(
        self,
        user_id: int,
        merchant_id: int,
        beneficiary_name: str,
        beneficiary_phone: str,
        items: Sequence[dict],
        service_fee_cents: int,
    ) -> Order:
        """Crée une commande PENDING, notifie le commerçant."""
        order = Order(
            user_id=user_id,
            merchant_id=merchant_id,
            beneficiary_name=beneficiary_name,
            beneficiary_phone=beneficiary_phone,
            status=OrderStatus.PENDING,
            total_eur_cents=sum(
                item["unit_price_eur_cents"] * item["quantity"] for item in items
            )
            + service_fee_cents,
            service_fee_cents=service_fee_cents,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(order)
        self.db.flush()
        for item in items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price_eur_cents=item["unit_price_eur_cents"],
            )
            self.db.add(order_item)
        self.db.commit()
        self.db.refresh(order)
        self.sms_service.notify_merchant_new_order(order)
        return order

    def mark_ready(self, order: Order) -> Order:
        """Passer la commande à READY, générer un QR et notifier le bénéficiaire."""
        order.status = OrderStatus.READY
        order.updated_at = datetime.utcnow()
        qr_token = self.qr_service.generate_token(order)
        self.db.add(qr_token)
        self.db.commit()
        self.db.refresh(order)
        self.sms_service.notify_beneficiary_ready(order, qr_token)
        return order

    def complete_order(self, order: Order) -> Order:
        """Passer la commande à COMPLETED et libérer le paiement Stripe."""
        order.status = OrderStatus.COMPLETED
        order.completed_at = datetime.utcnow()
        order.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(order)
        self.stripe_service.capture_payment(order)
        return order

    def expire_order(self, order: Order) -> Order:
        """Passer la commande à EXPIRED et rembourser Stripe."""
        order.status = OrderStatus.EXPIRED
        order.expired_at = datetime.utcnow()
        order.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(order)
        self.stripe_service.refund_payment(order)
        return order

    def check_expired_orders(self) -> None:
        """Expire les commandes dont le QR a >48h."""
        now = datetime.utcnow()
        expired_orders = (
            self.db.query(Order)
            .join(QRToken)
            .filter(
                Order.status == OrderStatus.READY,
                QRToken.expires_at < now,
                QRToken.used.is_(False),
            )
            .all()
        )
        for order in expired_orders:
            self.expire_order(order)
