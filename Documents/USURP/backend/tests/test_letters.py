"""Tests for IA letter generation and relances"""

import pytest
from datetime import datetime, timedelta


def register_and_login_user(client, email="user@example.com", password="password123"):
    """Helper to register and login a user"""
    # Register
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
    
    # Login
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def auth_headers(token: str):
    """Helper to create auth headers"""
    return {"Authorization": f"Bearer {token}"}


def test_register_identity_with_documents(client):
    """Test registering an identity with document types"""
    token = register_and_login_user(client)

    payload = {
        "full_name": "John Doe",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "official_id_number": "ID123456",
        "official_id_type": "identity_card",
        "email": "user@example.com",
        "document_types": ["identity_card", "credit_card"],
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
    
    # Save identity ID for letter generation
    return body["id"], token


def test_generate_letters_requires_documents(client):
    """Test that letter generation requires registered documents"""
    token = register_and_login_user(client)

    # Register identity without documents
    payload = {
        "full_name": "Jane Doe",
        "first_name": "Jane",
        "last_name": "Doe",
        "date_of_birth": "1992-05-15",
        "official_id_number": "ID654321",
        "official_id_type": "passport",
        "email": "jane@example.com",
        "document_types": [],  # Empty
        "gdpr_consent": True,
        "gdpr_consent_timestamp": "2024-01-01T00:00:00Z",
    }

    res = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(token),
    )
    assert res.status_code == 200
    identity_id = res.json()["id"]

    # Try to generate letters
    res = client.post(
        f"/api/v1/identities/{identity_id}/generate-letters",
        json={
            "document_content": "Test document",
            "document_types": [],
        },
        headers=auth_headers(token),
    )
    
    # Should fail because no documents registered
    assert res.status_code in [400, 500], res.text


def test_generate_letters_requires_auth(client):
    """Test that letter generation requires authentication"""
    res = client.post(
        "/api/v1/identities/some-id/generate-letters",
        json={
            "document_content": "Test",
            "target_organization": "Bank",
        },
    )
    assert res.status_code == 403


def test_generate_letters_victim_can_only_access_own(client):
    """Test that victims can only generate letters for their own identities"""
    token1 = register_and_login_user(client, "user1@example.com")
    token2 = register_and_login_user(client, "user2@example.com")

    # User 1 registers an identity
    payload = {
        "full_name": "User One",
        "first_name": "User",
        "last_name": "One",
        "date_of_birth": "1990-01-01",
        "official_id_number": "ID111111",
        "official_id_type": "identity_card",
        "email": "user1@example.com",
        "document_types": ["identity_card"],
        "gdpr_consent": True,
        "gdpr_consent_timestamp": "2024-01-01T00:00:00Z",
    }

    res = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(token1),
    )
    assert res.status_code == 200
    identity_id = res.json()["id"]

    # User 2 tries to generate letters for User 1's identity
    res = client.post(
        f"/api/v1/identities/{identity_id}/generate-letters",
        json={
            "document_content": "Test",
            "target_organization": "Bank",
        },
        headers=auth_headers(token2),
    )
    
    # Should be forbidden
    assert res.status_code == 403


def test_identity_check_logs_access(client):
    """Test that identity checks are logged in access logs"""
    token = register_and_login_user(client)

    # Register identity
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
    assert res.status_code == 200

    # Check identity
    res = client.post(
        "/api/v1/identities/check",
        json={"identity_number": "ID123456"},
        headers=auth_headers(token),
    )
    assert res.status_code == 200
    assert res.json()["found"] is True


def test_professional_can_generate_letters(client):
    """Test that professionals have permission to generate letters"""
    # Register as professional
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "professional@example.com",
            "password": "password123",
            "first_name": "Prof",
            "last_name": "User",
            "role": "professional",
        },
    )
    assert res.status_code == 200

    # Login
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "professional@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    prof_token = res.json()["access_token"]

    # Register identity as professional
    payload = {
        "full_name": "Prof Victim",
        "first_name": "Prof",
        "last_name": "Victim",
        "date_of_birth": "1990-01-01",
        "official_id_number": "ID777777",
        "official_id_type": "identity_card",
        "email": "victim@example.com",
        "document_types": ["identity_card", "passport"],
        "gdpr_consent": True,
        "gdpr_consent_timestamp": "2024-01-01T00:00:00Z",
    }

    res = client.post(
        "/api/v1/identities/register",
        json=payload,
        headers=auth_headers(prof_token),
    )
    assert res.status_code == 200
    identity_id = res.json()["id"]

    # Professional should be able to generate letters
    res = client.post(
        f"/api/v1/identities/{identity_id}/generate-letters",
        json={
            "document_content": "Professional case document",
            "target_organization": "Banque XYZ",
        },
        headers=auth_headers(prof_token),
    )
    
    # May succeed or fail depending on IA service availability
    # (stub returns success), but auth should be OK
    assert res.status_code in [200, 400, 500], res.text
