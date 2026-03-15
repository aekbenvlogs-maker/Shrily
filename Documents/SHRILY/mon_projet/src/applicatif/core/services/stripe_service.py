"""Service métier pour l'intégration Stripe."""

from __future__ import annotations


class StripeService:
    """Service pour la logique Stripe, avec idempotence sur les paiements."""

    @staticmethod
    def process_payment_event(db, order_repo, order_id: int, event_id: str) -> bool:
        """
        Traite un paiement Stripe de façon idempotente et atomique.
        - Vérifie si l'event Stripe a déjà été traité (via event_id stocké sur la commande)
        - Si non, marque la commande comme payée et stocke l'event_id
        - Retourne True si paiement traité, False si déjà traité
        """
        try:
            with db.begin():
                order = order_repo.get(order_id)
                if not order:
                    return False
                if getattr(order, "stripe_event_id", None) == event_id:
                    return False  # déjà traité
                order.stripe_event_id = event_id
                order.paid = True
                order_repo.update(order)
            return True
        except Exception:
            db.rollback()
            return False
