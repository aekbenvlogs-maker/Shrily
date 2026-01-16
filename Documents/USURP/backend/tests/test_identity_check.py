import pytest
from fastapi.testclient import TestClient


def test_identity_check_not_found(client: TestClient, victim_token):
    response = client.post(
        "/api/v1/identities/check",
        headers={"Authorization": f"Bearer {victim_token}"},
        json={"identity_number": "FAKE123456"},
    )
    assert response.status_code == 200
    assert response.json() == {"found": False}


def test_identity_check_found(
    client: TestClient,
    victim_token,
    create_usurped_identity,
):
    response = client.post(
        "/api/v1/identities/check",
        headers={"Authorization": f"Bearer {victim_token}"},
        json={"identity_number": create_usurped_identity.raw_identity},
    )
    assert response.status_code == 200
    assert response.json()["found"] is True


def test_identity_check_forbidden(client: TestClient, basic_user_token):
    response = client.post(
        "/api/v1/identities/check",
        headers={"Authorization": f"Bearer {basic_user_token}"},
        json={"identity_number": "123456"},
    )
    assert response.status_code == 403
