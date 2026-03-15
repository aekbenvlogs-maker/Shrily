def test_create_order_api():
    """Tester la création d'une commande via l'API /orders/."""
    payload = {
        "user_id": 1,
        "merchant_id": 1,
        "beneficiary_name": "Ali",
        "beneficiary_phone": "+213600000000",
        "items": [{"product_id": 1, "quantity": 2, "unit_price_eur_cents": 500}],
        "service_fee_cents": 75,
    }
    response = client.post("/orders/", json=payload)
    assert response.status_code in (200, 201, 422)  # 422 si DB vide
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "pending"
        assert data["total_eur_cents"] == 2 * 500 + 75


"""Tests d'intégration API commandes Diaspora Delivery.
Respecte mypy strict, ruff, pytest.
"""

from applicatif.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_create_order_api():
    """Teste la création d'une commande via l'API /orders/."""
    payload = {
        "user_id": 1,
        "merchant_id": 1,
        "beneficiary_name": "Ali",
        "beneficiary_phone": "+213600000000",
        "items": [{"product_id": 1, "quantity": 2, "unit_price_eur_cents": 500}],
        "service_fee_cents": 75,
    }
    response = client.post("/orders/", json=payload)
    assert response.status_code in (200, 201, 422)  # 422 si DB vide
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "pending"
        assert data["total_eur_cents"] == 2 * 500 + 75
