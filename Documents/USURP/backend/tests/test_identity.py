def register_user(client, email="user@example.com", password="password123"):
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "John",
            "last_name": "Doe",
            "role": "victim",
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


def login_user(client, email="user@example.com", password="password123"):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_register_login_and_register_identity(client):
    register_user(client)
    token = login_user(client)

    payload = {
        "full_name": "John Doe",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "official_id_number": "ID123456",
        "official_id_type": "identity_card",
        "email": "user@example.com",
        "document_types": ["identity_card"],
        "gdpr_consent": True,
        "gdpr_consent_timestamp": "2024-01-01T00:00:00Z",
    }

    res = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "registered"
    assert "id" in body


def test_identity_check_found(client):
    register_user(client)
    token = login_user(client)

    # register identity
    payload = {
        "full_name": "John Doe",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "official_id_number": "ID123456",
        "official_id_type": "identity_card",
        "email": "user@example.com",
        "document_types": ["identity_card"],
        "gdpr_consent": True,
        "gdpr_consent_timestamp": "2024-01-01T00:00:00Z",
    }
    res = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text

    # check
    res = client.post(
        "/api/v1/identities/check",
        json={"identity_number": "ID123456"},
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["found"] is True


def test_identity_check_not_found(client):
    register_user(client)
    token = login_user(client)

    res = client.post(
        "/api/v1/identities/check",
        json={"identity_number": "UNKNOWN"},
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["found"] is False


def test_protected_endpoint_requires_auth(client):
    res = client.post(
        "/api/v1/identities/check",
        json={"identity_number": "ANY"},
    )
    assert res.status_code == 403
    assert "Not authenticated" in res.text or "Forbidden" in res.text


def test_duplicate_identity_conflict(client):
    register_user(client)
    token = login_user(client)

    payload = {
        "full_name": "Jane Roe",
        "first_name": "Jane",
        "last_name": "Roe",
        "date_of_birth": "1990-01-01",
        "official_id_number": "DUPLICATE123",
        "official_id_type": "identity_card",
        "email": "jane@example.com",
        "document_types": ["identity_card"],
        "gdpr_consent": True,
        "gdpr_consent_timestamp": "2024-01-01T00:00:00Z",
    }

    r1 = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(token),
    )
    assert r1.status_code == 200, r1.text

    r2 = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(token),
    )
    assert r2.status_code == 409


def test_jwt_contains_role_and_exp(client):
    import jwt
    register_user(client, email="claims@example.com")
    token = login_user(client, email="claims@example.com")

    # Decode token using test secret from conftest
    payload = jwt.decode(token, "test-secret-key", algorithms=["HS256"])
    assert "role" in payload
    assert payload["role"] in {"victim", "professional", "admin"}
    assert "exp" in payload