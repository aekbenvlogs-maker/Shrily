"""Tests pour enregistrement utilisateur anonyme"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import create_app
from app.models import UsurpedIdentity, AuditLog
from app.db import get_db


@pytest.fixture
def app():
    """Créer app avec override BD"""
    from app.db import Base, engine, SessionLocal
    
    # Créer tables test
    Base.metadata.create_all(bind=engine)
    
    app = create_app()
    
    def override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture
def client(app):
    """Client de test"""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Session BD de test"""
    from app.db import SessionLocal
    
    session = SessionLocal()
    yield session
    session.close()


class TestAnonymousRegistration:
    """Tests pour enregistrement anonyme"""
    
    def test_anonymous_user_can_register(self, client, db_session):
        """✅ Un utilisateur anonyme peut enregistrer une identité"""
        payload = {
            "official_id_number": "ANON123456",
            "full_name": "Jane Doe",
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "official_id_type": "identity_card",
            "email": "jane@example.com",
            "gdpr_consent": True
        }
        
        response = client.post("/api/v1/identities/register", json=payload)
        
        assert response.status_code == 200, f"Status: {response.status_code}, Body: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["user_id"] is None  # Anonymous
        assert data["status"] == "registered"
    
    def test_duplicate_identity_rejected(self, client):
        """✅ Les doublons sont détectés"""
        payload = {
            "official_id_number": "DUP123",
            "full_name": "Test User",
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "1985-06-15",
            "official_id_type": "passport",
            "email": "test@example.com",
            "gdpr_consent": True
        }
        
        # Première enregistrement
        response1 = client.post("/api/v1/identities/register", json=payload)
        assert response1.status_code == 200
        
        # Tentative doublon
        response2 = client.post("/api/v1/identities/register", json=payload)
        assert response2.status_code == 409  # Conflict
    
    def test_identity_check_not_found(self, client):
        """✅ Vérification d'identité inexistante"""
        response = client.post(
            "/api/v1/identities/check",
            json={"identity_number": "NONEXISTENT123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is False
    
    def test_identity_check_found(self, client):
        """✅ Vérification d'identité existante"""
        # Créer une identité
        payload = {
            "official_id_number": "MATCH123",
            "full_name": "Match User",
            "first_name": "Match",
            "last_name": "User",
            "date_of_birth": "1980-03-20",
            "official_id_type": "identity_card",
            "email": "match@example.com",
            "gdpr_consent": True
        }
        
        create_response = client.post("/api/v1/identities/register", json=payload)
        assert create_response.status_code == 200
        
        # Vérifier
        check_response = client.post(
            "/api/v1/identities/check",
            json={"identity_number": "MATCH123"}
        )
        
        assert check_response.status_code == 200
        data = check_response.json()
        assert data["found"] is True
    
    def test_gdpr_consent_required(self, client):
        """✅ Le consentement GDPR est requis"""
        payload = {
            "official_id_number": "NOGDPR123",
            "full_name": "No GDPR User",
            "first_name": "No",
            "last_name": "GDPR",
            "date_of_birth": "1992-07-22",
            "official_id_type": "identity_card",
            "email": "nogdpr@example.com",
            "gdpr_consent": False  # ❌ Non accepté
        }
        
        response = client.post("/api/v1/identities/register", json=payload)
        
        # Doit être rejeté
        assert response.status_code in [400, 422, 403]
    
    def test_identity_requires_email(self, client):
        """✅ L'email est requis"""
        payload = {
            "official_id_number": "EMAIL123",
            "full_name": "Email User",
            "first_name": "Email",
            "last_name": "User",
            "date_of_birth": "1988-12-10",
            "official_id_type": "identity_card",
            # Pas d'email
            "gdpr_consent": True
        }
        
        response = client.post("/api/v1/identities/register", json=payload)
        assert response.status_code in [400, 422]
    
    def test_identity_valid_date_of_birth(self, client):
        """✅ La date de naissance valide est requise"""
        payload = {
            "official_id_number": "DOB123",
            "full_name": "DOB User",
            "first_name": "DOB",
            "last_name": "User",
            "date_of_birth": "invalid-date",
            "official_id_type": "identity_card",
            "email": "dob@example.com",
            "gdpr_consent": True
        }
        
        response = client.post("/api/v1/identities/register", json=payload)
        assert response.status_code in [400, 422]
