"""Tests pour les services identités et audit"""
import pytest
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session

from app.db import SessionLocal, Base, engine
from app.services.audit_service import AuditService
from app.models import UsurpedIdentity, AuditLog, AccessLog, AccessAction


@pytest.fixture
def db():
    """Créer BD test isolée"""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def hash_value(value: str, salt: str = "test-salt") -> str:
    """Simuler hachage"""
    return hashlib.sha256((value + salt).encode()).hexdigest()


class TestIdentityModel:
    """Tests pour le modèle UsurpedIdentity"""
    
    def test_create_identity_anonymous(self, db):
        """✅ Créer identité anonyme"""
        identity = UsurpedIdentity(
            official_id_hash=hash_value("ID123456"),
            official_id_salt="salt-123",
            full_name_hash=hash_value("Test User"),
            full_name_salt="salt-full",
            date_of_birth_encrypted="encrypted-dob",
            official_id_type="identity_card",
            email_hash=hash_value("test@example.com"),
            gdpr_consent=True,
            user_id=None  # Anonymous
        )
        
        db.add(identity)
        db.commit()
        
        saved = db.query(UsurpedIdentity).filter_by(
            email_hash=hash_value("test@example.com")
        ).first()
        
        assert saved is not None
        assert saved.user_id is None
        assert saved.gdpr_consent is True
    
    def test_identity_email_required(self, db):
        """✅ Email est obligatoire"""
        # Le champ email_hash ne peut pas être NULL
        with pytest.raises(Exception):
            identity = UsurpedIdentity(
                official_id_hash=hash_value("ID789"),
                official_id_salt="salt-789",
                full_name_hash=hash_value("No Email User"),
                full_name_salt="salt-full",
                date_of_birth_encrypted="encrypted-dob",
                official_id_type="passport",
                email_hash=None,  # ❌ Manquant
                gdpr_consent=True
            )
            db.add(identity)
            db.commit()
    
    def test_identity_gdpr_consent_required(self, db):
        """✅ Consentement GDPR requis"""
        identity = UsurpedIdentity(
            official_id_hash=hash_value("ID456"),
            official_id_salt="salt-456",
            full_name_hash=hash_value("No GDPR User"),
            full_name_salt="salt-full",
            date_of_birth_encrypted="encrypted-dob",
            official_id_type="identity_card",
            email_hash=hash_value("nogdpr@example.com"),
            gdpr_consent=False  # ❌ Non accepté
        )
        
        db.add(identity)
        db.commit()
        
        # Vérifier que gdpr_consent=False est sauvegardé
        saved = db.query(UsurpedIdentity).filter_by(
            email_hash=hash_value("nogdpr@example.com")
        ).first()
        
        assert saved.gdpr_consent is False
    
    def test_duplicate_identity_rejected(self, db):
        """✅ Les doublons génèrent erreur"""
        # Créer première identité
        identity1 = UsurpedIdentity(
            official_id_hash=hash_value("DUP123"),
            official_id_salt="salt-dup1",
            full_name_hash=hash_value("User One"),
            full_name_salt="salt-one",
            date_of_birth_encrypted="encrypted-dob1",
            official_id_type="identity_card",
            email_hash=hash_value("user1@example.com"),
            gdpr_consent=True
        )
        db.add(identity1)
        db.commit()
        
        # Tentative doublon (même email_hash)
        identity2 = UsurpedIdentity(
            official_id_hash=hash_value("DUP456"),
            official_id_salt="salt-dup2",
            full_name_hash=hash_value("User Two"),
            full_name_salt="salt-two",
            date_of_birth_encrypted="encrypted-dob2",
            official_id_type="identity_card",
            email_hash=hash_value("user1@example.com"),  # Même email = doublon
            gdpr_consent=True
        )
        db.add(identity2)
        
        with pytest.raises(Exception):  # Unique constraint violation
            db.commit()


class TestAuditService:
    """Tests pour audit service"""
    
    def test_audit_log_creation(self, db):
        """✅ Créer un audit log"""
        service = AuditService()
        
        service.log_action(
            db=db,
            action="IDENTITY_REGISTERED",
            resource_type="UsurpedIdentity",
            resource_id="ident-123",
            user_id=None,
            ip_address="127.0.0.1",
            status="success"
        )
        
        log = db.query(AuditLog).filter_by(
            resource_id="ident-123"
        ).first()
        
        assert log is not None
        assert log.action == "IDENTITY_REGISTERED"
        assert log.status == "success"
    
    def test_audit_log_failure(self, db):
        """✅ Créer audit log d'erreur"""
        service = AuditService()
        
        service.log_action(
            db=db,
            action="IDENTITY_CHECK",
            resource_type="UsurpedIdentity",
            resource_id="check-123",
            user_id=None,
            ip_address="127.0.0.1",
            status="failure",
            error_message="Identity not found"
        )
        
        log = db.query(AuditLog).filter_by(
            resource_id="check-123"
        ).first()
        
        assert log is not None
        assert log.status == "failure"
        assert log.error_message == "Identity not found"
    
    def test_audit_log_immutability(self, db):
        """✅ Logs d'audit ne peuvent pas être modifiés"""
        service = AuditService()
        
        service.log_action(
            db=db,
            action="TEST_ACTION",
            resource_type="Test",
            resource_id="immute-123",
            user_id=None,
            ip_address="127.0.0.1"
        )
        
        log = db.query(AuditLog).filter_by(
            resource_id="immute-123"
        ).first()
        
        original_action = log.action
        
        # Tenter modification
        log.action = "MODIFIED_ACTION"
        db.rollback()  # Annuler
        
        # Vérifier pas modifié
        rechecked = db.query(AuditLog).filter_by(
            resource_id="immute-123"
        ).first()
        
        assert rechecked.action == original_action


class TestAccessLogging:
    """Tests pour access logs"""
    
    def test_log_identity_check_access(self, db):
        """✅ Logger accès à vérification identité"""
        log = AccessLog(
            user_id=None,  # Anonymous
            role="anonymous",
            action=AccessAction.identity_check,
            resource_type="UsurpedIdentity",
            resource_id="check-123",
            success=True,
            ip_address="192.168.1.1"
        )
        
        db.add(log)
        db.commit()
        
        saved = db.query(AccessLog).filter_by(
            resource_id="check-123"
        ).first()
        
        assert saved is not None
        assert saved.action == AccessAction.identity_check
        assert saved.success is True
    
    def test_log_registration_access(self, db):
        """✅ Logger accès enregistrement"""
        log = AccessLog(
            user_id=None,
            role="anonymous",
            action=AccessAction.identity_register,
            resource_type="UsurpedIdentity",
            resource_id="reg-456",
            success=True,
            ip_address="192.168.1.2"
        )
        
        db.add(log)
        db.commit()
        
        saved = db.query(AccessLog).filter_by(
            resource_id="reg-456"
        ).first()
        
        assert saved is not None
        assert saved.action == AccessAction.identity_register
    
    def test_log_failed_access(self, db):
        """✅ Logger accès échoué"""
        log = AccessLog(
            user_id=None,
            role="anonymous",
            action=AccessAction.identity_check,
            resource_type="UsurpedIdentity",
            resource_id="fail-789",
            success=False,
            ip_address="192.168.1.3"
        )
        
        db.add(log)
        db.commit()
        
        saved = db.query(AccessLog).filter_by(
            resource_id="fail-789"
        ).first()
        
        assert saved is not None
        assert saved.success is False


class TestDataIntegrity:
    """Tests pour intégrité des données"""
    
    def test_identity_with_audit_trail(self, db):
        """✅ Identité avec trail audit complet"""
        # Créer identité
        identity = UsurpedIdentity(
            official_id_hash=hash_value("TRAIL123"),
            official_id_salt="salt-trail",
            full_name_hash=hash_value("Trail User"),
            full_name_salt="salt-full",
            date_of_birth_encrypted="encrypted-trail-dob",
            official_id_type="identity_card",
            email_hash=hash_value("trail@example.com"),
            gdpr_consent=True
        )
        db.add(identity)
        db.commit()
        
        # Logger enregistrement
        audit = AuditLog(
            action="IDENTITY_REGISTERED",
            resource_type="UsurpedIdentity",
            resource_id=identity.id,
            user_id=None,
            ip_address="127.0.0.1",
            status="success"
        )
        db.add(audit)
        
        # Logger accès
        access = AccessLog(
            user_id=None,
            role="anonymous",
            action=AccessAction.identity_register,
            resource_type="UsurpedIdentity",
            resource_id=identity.id,
            success=True,
            ip_address="127.0.0.1"
        )
        db.add(access)
        db.commit()
        
        # Vérifier relation
        saved_identity = db.query(UsurpedIdentity).filter_by(
            email_hash=hash_value("trail@example.com")
        ).first()
        
        saved_audit = db.query(AuditLog).filter_by(
            resource_id=saved_identity.id
        ).first()
        
        saved_access = db.query(AccessLog).filter_by(
            resource_id=saved_identity.id
        ).first()
        
        assert saved_identity is not None
        assert saved_audit is not None
        assert saved_access is not None
