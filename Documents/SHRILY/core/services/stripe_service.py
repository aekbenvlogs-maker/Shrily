"""Service métier pour l'intégration Stripe Checkout.
Respecte mypy strict, ruff.
"""

from core.models import Order

__all__ = ["StripeService"]


class StripeService:
    """Gestion du paiement Stripe Checkout."""

    def create_checkout_session(self, order: Order) -> str:
        """Crée une session Stripe Checkout et retourne l'URL."""
        # TODO: Intégration stripe.checkout.Session.create
        raise NotImplementedError

    def capture_payment(self, order: Order) -> None:
        """Libère le paiement Stripe (après scan QR)."""
        # TODO: Intégration stripe.PaymentIntent.capture
        raise NotImplementedError

    def refund_payment(self, order: Order) -> None:
        """Rembourse la commande (si EXPIRED)."""
        # TODO: Intégration stripe.Refund.create
        raise NotImplementedError
