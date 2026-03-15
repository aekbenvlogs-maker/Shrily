"""Service métier pour l'envoi de SMS (Twilio).
Respecte mypy strict, ruff.
"""

from core.models import Order, QRToken

__all__ = ["SMSService"]


class SMSService:
    """Gestion des notifications SMS (Twilio)."""

    def notify_merchant_new_order(self, order: Order) -> None:
        """Envoie un SMS au commerçant à la création de commande."""
        # TODO: Intégration Twilio
        raise NotImplementedError

    def notify_beneficiary_ready(self, order: Order, qr_token: QRToken) -> None:
        """Envoie un SMS au bénéficiaire avec le QR code."""
        # TODO: Intégration Twilio
        raise NotImplementedError
