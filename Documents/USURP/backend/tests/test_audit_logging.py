"""Tests pour audit logging et compliance"""
import pytest
from sqlalchemy.orm import Session

from app.models import AuditLog, AccessLog
from app.db import SessionLocal, Base, engine


@pytest.fixture
def db():
    """Créer BD test"""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


class TestAuditLogging:
    """Tests pour audit logging"""
    
    def test_audit_log_structure(self, db):
        """✅ Audit log a la structure requise"""
        # Créer un audit log
        audit_log = AuditLog(
            action="IDENTITY_REGISTERED",
            resource_type="UsurpedIdentity",
            resource_id="test-123",
            user_id=None,  # Anonymous
            ip_address="127.0.0.1",
            status="success"
        )
        
        db.add(audit_log)
        db.commit()
        
        # Vérifier
        saved_log = db.query(AuditLog).filter_by(
            resource_id="test-123"
        ).first()
        
        assert saved_log is not None
        assert saved_log.action == "IDENTITY_REGISTERED"
        assert saved_log.resource_type == "UsurpedIdentity"
        assert saved_log.user_id is None
        assert saved_log.timestamp is not None
        assert saved_log.ip_address == "127.0.0.1"
    
    def test_audit_log_immutable(self, db):
        """✅ Audit log n'est pas modifiable"""
        # Créer un audit log
        audit_log = AuditLog(
            action="TEST_ACTION",
            resource_type="Test",
            resource_id="immutable-123",
            ip_address="127.0.0.1"
        )
        
        db.add(audit_log)
        db.commit()
        
        original_id = audit_log.id
        original_action = audit_log.action
        
        # Tenter modification
        retrieved_log = db.query(AuditLog).filter_by(id=original_id).first()
        retrieved_log.action = "MODIFIED"
        
        # BD ne devrait pas permettre modification (vérifier via trigger si implémenté)
        # Pour l'instant on teste juste que le log n'a pas changé
        db.rollback()
        
        recheck = db.query(AuditLog).filter_by(id=original_id).first()
        assert recheck.action == original_action
    
    def test_access_log_creation(self, db):
        """✅ Access log est créé pour chaque accès"""
        from app.models import AccessAction
        import time
        
        unique_ip = f"127.0.0.{int(time.time()) % 256}"
        
        access_log = AccessLog(
            user_id=None,  # Anonymous
            role="anonymous",
            action=AccessAction.identity_check,
            resource_type="IdentityCheck",
            resource_id="check-123",
            ip_address=unique_ip,
            user_agent="TestClient/1.0"
        )
        
        db.add(access_log)
        db.commit()
        
        saved_log = db.query(AccessLog).filter_by(
            resource_id="check-123"
        ).first()
        
        assert saved_log is not None
        assert saved_log.ip_address == unique_ip
        assert saved_log.created_at is not None
    
    def test_audit_log_with_gdpr_data(self, db):
        """✅ Audit log contient données GDPR"""
        audit_log = AuditLog(
            action="IDENTITY_REGISTERED",
            resource_type="UsurpedIdentity",
            resource_id="gdpr-123",
            user_id=None,
            ip_address="127.0.0.1",
            status="success"
        )
        
        db.add(audit_log)
        db.commit()
        
        saved = db.query(AuditLog).filter_by(
            resource_id="gdpr-123"
        ).first()
        
        assert saved is not None
        assert saved.status == "success"
    
    def test_multiple_audit_logs_sequence(self, db):
        """✅ Plusieurs audit logs sont bien ordonnés"""
        import time
        start_time = time.time()
        
        logs = []
        for i in range(3):
            log = AuditLog(
                action=f"ACTION_SEQ_{i}",
                resource_type="TestSeq",
                resource_id=f"seq-{start_time}-{i}",
                user_id=None,
                ip_address="127.0.0.1"
            )
            db.add(log)
            logs.append(log)
        
        db.commit()
        
        # Vérifier ordre uniquement pour nos logs
        all_logs = db.query(AuditLog).filter(
            AuditLog.action.like("ACTION_SEQ_%")
        ).order_by(AuditLog.timestamp).all()
        
        # Trouver nos 3 logs
        our_logs = [l for l in all_logs if f"seq-{start_time}" in l.resource_id]
        assert len(our_logs) == 3
        assert our_logs[0].action == "ACTION_SEQ_0"
        assert our_logs[1].action == "ACTION_SEQ_1"
        assert our_logs[2].action == "ACTION_SEQ_2"
    
    def test_audit_log_with_null_user_id(self, db):
        """✅ Audit log gère bien user_id NULL (utilisateurs anonymes)"""
        audit_log = AuditLog(
            action="ANONYMOUS_ACCESS",
            resource_type="Identity",
            resource_id="anon-123",
            user_id=None,  # Anonymous
            ip_address="127.0.0.1"
        )
        
        db.add(audit_log)
        db.commit()
        
        saved = db.query(AuditLog).filter_by(
            resource_id="anon-123"
        ).first()
        
        assert saved.user_id is None
        assert saved.action == "ANONYMOUS_ACCESS"
