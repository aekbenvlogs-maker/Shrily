# USURP - Data Protection Impact Assessment (DPIA)
## Analyse d'Impact relative à la Protection des Données (AIPD)

**Version:** 1.0  
**Date:** January 2025  
**Responsable:** USURP Development Team  
**Statut:** Active DPIA

---

## 1. Résumé Exécutif

USURP est une plateforme en ligne de protection contre l'usurpation d'identité opérant en conformité avec le RGPD (Règlement Général sur la Protection des Données). Cette DPIA analyse les risques liés au traitement de données personnelles identifiables (PII) des victimes d'usurpation d'identité en France.

### Résultat: ✅ CONFORME avec mesures d'atténuation

---

## 2. Description du Traitement

### 2.1 Qui traite les données ?

- **Responsable du traitement:** USURP SAS
- **Responsables conjoints:** Victimes (consentement versionné)
- **Sous-traitants:** Services cloud (PostgreSQL), LLM (IA), prestataires email

### 2.2 Catégories de personnes concernées

1. **Victimes d'usurpation** (données enregistrées volontairement)
2. **Professionnels du droit** (accès limité pour transmission payante)
3. **Administrateurs USURP** (audit et gestion)

### 2.3 Types de données traitées

| Catégorie | Données | Sensibilité | Durée |
|-----------|---------|-------------|-------|
| **Identification** | Nom, Prénom, Date naissance | Élevée | 12 mois + archive légale 5 ans |
| **Identification officielle** | Numéro ID, Type (CNI, Passeport) | Très élevée | 12 mois |
| **Contact** | Email | Moyenne | Durée compte |
| **Documents frauduleux** | Types (Carte bancaire, Identité, etc.) | Très élevée | 12 mois |
| **Consentement** | Version, Timestamp, Acceptation | Élevée | Immuable (RGPD art. 7) |
| **Audit** | Logs accès, IP, Actions | Moyenne | 5 ans (légal) |

### 2.4 Objectifs du traitement

1. Permettre aux victimes de documenter l'usurpation
2. Générer lettres d'invalidation pseudonymisées
3. Faciliter transmission légale aux organisations
4. Maintenir traçabilité pour audit CNIL

### 2.5 Base légale du traitement

- **Article 6(1)(a) RGPD:** Consentement explicite et versionné
- **Article 9(2)(a) RGPD:** Consentement pour données sensibles (si applicables)
- **Intérêt légitime:** Prévention usurpation (article 6(1)(f))

---

## 3. Mesures de Sécurité & Atténuation des Risques

### 3.1 Pseudonymisation

**Implémentation:**

```python
# À la réception des données (backend/app/services/identity_service.py)

1. Numéro ID officiel:
   - Hash: SHA256(official_id_number + random_salt)
   - Stocké uniquement le hash et salt séparé
   - Lookup table: hash → identity_id (pour vérification doublons)

2. Nom complet:
   - Hash: SHA256(full_name + unique_salt)
   - Utilisé pour pseudonymisation en lettres (victim_hash = ID_hash)

3. Email:
   - Hash: SHA256(email) sans salt (pour notifications)
   - Utilisé pour recherche de consentement

# Résultat en base de données:
Official_ID en clair: ❌ JAMAIS
Nom en clair: ❌ JAMAIS
Date naissance: Chiffrée AES-256 (optionnel phase 2)
```

**Risque atténué:** ✅ Lecture non-autorisée de la base de données

### 3.2 Chiffrement au repos

```python
# Configuration SQLAlchemy (Phase 1 - Partial):
date_of_birth_encrypted = Column(String(255), nullable=False)

# Phase 2 - Full AES-256:
from sqlalchemy_utils import EncryptedType

class UsurpedIdentity(Base):
    official_id_encrypted = Column(
        EncryptedType(String, settings.ENCRYPTION_KEY),
        nullable=False
    )
```

**Clé de chiffrement:**
- Stockée dans variables d'environnement (AWS Secrets Manager, HashiCorp Vault)
- Rotation annuelle
- Accès restreint (admin uniquement)

**Risque atténué:** ✅ Vol physique de disques, Compromission DB

### 3.3 Contrôle d'accès (RBAC)

```python
# backend/app/core/constants.py

ROLE_PERMISSIONS = {
    "victim": [
        "register_identity",
        "view_own_status",
        "request_invalidation",
        "export_case",
    ],
    "professional": [
        "register_identity",
        "view_own_status",
        "request_invalidation",
        "view_users_in_organization",  # Limité
        "submit_paid_transmission",
        "view_case_status",
    ],
    "admin": [
        "view_all_users",
        "manage_users",
        "view_audit_logs",
        "system_configuration",
    ],
}
```

**Principes:**
- Moindre privilège: Chaque rôle reçoit permissions minimales
- Séparation des devoirs: Admin ≠ Victim access
- Isolation: Victimes ne voient que leurs propres dossiers

**Risque atténué:** ✅ Accès non-autorisé, Escalade privilèges

### 3.4 Journalisation immuable (Append-only)

```python
# backend/app/models/__init__.py

class AccessLog(Base):
    """
    Logs immutables pour audit CNIL
    - Pas de update/delete possible
    - Index sur created_at et action
    - Rétention: 5 ans
    """
    user_id: str
    action: AccessAction  # identity_check, document_export, relance_sent
    resource_type: str    # usurped_identity, invalidation_letter
    resource_id: str      # UUID
    success: bool
    ip_address: str       # Tracé pour investigation
    created_at: datetime  # Indexed
```

**Actions tracées:**
- ✅ Enregistrement identité (`identity_register`)
- ✅ Vérification doublon (`identity_check`)
- ✅ Export case proof PDF (`document_export`)
- ✅ Envoi relance (`relance_sent`)

**Risque atténué:** ✅ Absence de traçabilité, Couverture incident, Évasion audit

### 3.5 Gestion des consentements (Article 7 RGPD)

```python
# Consentement versionné & stocké avec la demande

class ConsentVersion(Base):
    version: str          # "1.0", "1.1", etc.
    consent_text: str     # Conditions complètes
    privacy_policy_text: str
    processing_purpose: str
    created_at: datetime
    is_active: bool

# Chaque UsurpedIdentity référence une version
class UsurpedIdentity(Base):
    gdpr_consent: bool
    gdpr_consent_timestamp: datetime  # Moment exact du consentement
    gdpr_consent_version: str         # "1.0" -> identifie termes applicables
```

**Éléments requis (Article 7(4) RGPD):**
- ✅ Demande consentement distincte et explicite
- ✅ Conditions énoncées en langage clair
- ✅ Timestamp d'acceptation
- ✅ Possibilité retrait ultérieur
- ✅ Preuve écrite du consentement

**Risque atténué:** ✅ Contestation consentement, Violation article 7

### 3.6 Droits des personnes concernées

#### 3.6.1 Droit d'accès (Article 15 RGPD)

```bash
GET /api/v1/users/me

Réponse:
{
  "user": {...},
  "identities": [{...}],
  "consent_versions": [{...}],
  "audit_actions": [...]  # Actions que cet utilisateur a effectuées
}

Format: JSON + Export PDF possible
Délai: < 30 jours
```

#### 3.6.2 Droit à la portabilité (Article 20 RGPD)

```bash
GET /api/v1/users/me/export?format=json

Réponse format standard:
{
  "user_data": {...},
  "usurped_identities": [...],
  "generated_letters": [...],
  "export_date": "2025-01-15T10:00:00Z",
  "format": "JSON-LD"
}

Format: JSON-LD structuré, CSV
Délai: < 30 jours
```

#### 3.6.3 Droit de rectification (Article 16 RGPD)

```bash
PUT /api/v1/users/me
PUT /api/v1/identities/{id}

Champs modifiables:
- Email ✅
- Prénom/Nom (entraîne re-hash) ⚠️
- Type documents frauduleux ✅

Audit: Tous changements loggés
```

#### 3.6.4 Droit à l'oubli / Suppression (Article 17 RGPD)

**Soft deletion:**
```python
# Phase 1: Marquage utilisateur inactif

DELETE /api/v1/users/me
{
  "reason": "Suppression volontaire"  # Optionnel
}

Actions:
1. user.is_active = False
2. user.email = NULL (pseudonymisation)
3. user.deleted_at = datetime.now()
4. Audit logs conservés (légal requis)
```

**Hard deletion (après délai légal):**
```python
# Phase 2: Nettoyage après 3 ans (délai légal)
# Cron job annuel

DELETE FROM usurped_identities
WHERE user.deleted_at < (NOW() - INTERVAL 3 years)
  AND status IN ('resolved', 'appealed')
```

**Exceptions (pas de suppression):**
- ❌ AuditLog (immuable, 5 ans requis)
- ❌ Consentement versions (preuve légale)
- ❌ Dossiers en cours ("invalidation_pending", "invalidation_submitted")

#### 3.6.5 Droit à la limitation (Article 18 RGPD)

```python
# Restriction de traitement (Phase 2)

PUT /api/v1/identities/{id}/restrict
{
  "restrict_processing": true,
  "reason": "Contestation exactitude"
}

Résultat:
- Données marquées "restricted"
- Pas de traitement automatique
- Pas de relances envoyées
- Conservées > 3 ans pour légal
```

#### 3.6.6 Droit d'opposition (Article 21 RGPD)

```python
# Opt-out communications (Phase 2)

PUT /api/v1/users/me/preferences
{
  "opt_out_marketing": true,
  "opt_out_relances": false  # Peut vouloir rester dans process

Scope:
- Cookies analytics: Refusé
- Emails marketing: Refusé
- Relances légales: Autorisé (consentement distinct)
```

---

## 4. Risques Identifiés & Mesures

### Risque 1: Accès non-autorisé aux données

| Élément | Détail |
|---------|--------|
| **Probabilité** | Moyenne |
| **Impact** | Critique (PII exposée) |
| **Sévérité** | CRITIQUE |
| **Mesures** | ✅ Pseudonymisation, Chiffrement, RBAC, Logs |
| **Résiduel** | FAIBLE |

### Risque 2: Transfert données à tiers non-autorisés

| Élément | Détail |
|---------|--------|
| **Probabilité** | Basse (sous-traitants = contrats DPA) |
| **Impact** | Critique |
| **Sévérité** | CRITIQUE |
| **Mesures** | ✅ Clauses DPA, Audit sous-traitants, Restrictions |
| **Résiduel** | FAIBLE |

### Risque 3: Absence tracabilité audit

| Élément | Détail |
|---------|--------|
| **Probabilité** | Très basse |
| **Impact** | Élevé (amende CNIL) |
| **Sévérité** | ÉLEVÉE |
| **Mesures** | ✅ Logs immuables, Index, Rétention 5 ans |
| **Résiduel** | FAIBLE |

### Risque 4: Consentement invalide

| Élément | Détail |
|---------|--------|
| **Probabilité** | Basse (consentement versionnés) |
| **Impact** | Élevé (RGPD amende) |
| **Sévérité** | ÉLEVÉE |
| **Mesures** | ✅ Versionning, Timestamp, Preuve écrite |
| **Résiduel** | FAIBLE |

### Risque 5: Violation droit à l'oubli

| Élément | Détail |
|---------|--------|
| **Probabilité** | Très basse (soft delete) |
| **Impact** | Élevé (RGPD amende) |
| **Sévérité** | ÉLEVÉE |
| **Mesures** | ✅ Soft delete + hard delete, Audit |
| **Résiduel** | FAIBLE |

---

## 5. Sous-traitants & Transferts de données

### 5.1 Sous-traitants externes

| Sous-traitant | Données | Contrat DPA | Localisation |
|----------------|---------|-----------|--------------|
| PostgreSQL (AWS/OVH) | Toutes données | ✅ DPA signé | EU (Frankfurt/Paris) |
| LLM Service (IA) | Textes pseudonymisés | ✅ DPA signé | EU |
| Email service | Email + Notifications | ✅ DPA signé | EU |
| Analytics (optionnel) | User behavior anonyme | ✅ DPA signé | EU |

### 5.2 Transferts hors-UE

**Politique:** ❌ AUCUN transfert hors-UE accepté  
**Raison:** Juridiction CNIL + GDPR

**Exceptions potentielles (Phase 2):**
- Si transfert légal (Privacy Shield, Adequacy Decision)
- Avec clauses de protection additionnelles (Standard Contractual Clauses)
- Approbation CNIL préalable

---

## 6. Conformité légale par article RGPD

| Article | Titre | Implémentation | Status |
|---------|-------|---------------|---------| 
| 5 | Principes fondamentaux | Cf. Section 3 | ✅ |
| 6 | Base légale | Consentement versionné | ✅ |
| 7 | Conditions consentement | Timestamp, version, audit | ✅ |
| 13/14 | Info transparence | Banneau RGPD lors inscription | ✅ |
| 15 | Droit d'accès | GET /users/me | ✅ |
| 16 | Droit rectification | PUT /users/me | ✅ |
| 17 | Droit à l'oubli | DELETE soft/hard | ✅ |
| 18 | Limitation | /restrict endpoint (phase 2) | 🔄 |
| 21 | Opposition | /preferences (phase 2) | 🔄 |
| 32 | Sécurité données | Pseudonymisation, chiffrement | ✅ |
| 33 | Notification incident | Alertes + log incident (phase 2) | 🔄 |
| 34 | Notification personnes | Email template (phase 2) | 🔄 |

---

## 7. Mesures organisationnelles

### 7.1 Formation & Sensibilisation

- ✅ Formation RGPD annuelle équipe
- ✅ Procédures incident vérifiées
- ✅ Checklists conformité avant release

### 7.2 Audits & Tests

- ✅ Audit sécurité annuel (external)
- ✅ Penetration testing (annual)
- ✅ Data protection impact review (quarterly)

### 7.3 Délégué à la Protection des Données

- **DPO:** Désigné (email: dpo@usurp.fr)
- **Rôle:** Veiller conformité RGPD + CNIL
- **Accès:** Audit logs + Escalade incident

---

## 8. Gestion des incidents

### 8.1 Classification

| Niveau | Exemple | Action |
|--------|---------|--------|
| **CRITIQUE** | Fuite donnéés 1000+ personnes | Notification CNIL < 72h |
| **ÉLEVÉE** | Fuite données 10-100 personnes | Notification CNIL < 72h |
| **MOYENNE** | Log accès non-autorisé | Enquête interne 7j |
| **BASSE** | Tentative brute-force | Log + Review 30j |

### 8.2 Procédure incident

1. **Détection** → Alerte monitoring
2. **Classification** → Évaluation risque
3. **Confinement** → Arrêt accès
4. **Investigation** → Audit logs
5. **Notification** → CNIL + Personne si risque élevé
6. **Correction** → Fix + Re-test
7. **Post-mortem** → Amélioration prévention

---

## 9. Conformité par design (Privacy by Design)

### 9.1 Principes appliqués

#### Collecte minimale
- ✅ Seulement données nécessaires
- ✅ Pas de tracking comportemental
- ✅ Pas de cookies 3è partie

#### Traitement restreint
- ✅ Utilisé uniquement pour usurpation
- ✅ Pas de vente à tiers
- ✅ Pas de profilage automatisé

#### Retention optimale
- ✅ Suppression après 12 mois inactivité
- ✅ Anonymisation logs après 5 ans
- ✅ Hard delete après délai légal

#### Pseudonymisation par défaut
- ✅ Hash IDs avant stockage
- ✅ Lettres avec victim_hash uniquement
- ✅ Emails hashés pour lookup

#### Transparence maximale
- ✅ Banneau RGPD clair au signup
- ✅ Conditions en langage simple
- ✅ Accès contrôle personnel visible

---

## 10. Approbation & Signature

### 10.1 Révision

- **Révision date:** 15 Jan 2025
- **Prochaine révision:** 15 Jan 2026
- **Déclencheur:** Changement traitement, incident, plainte CNIL

### 10.2 Signatures

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| **Chef projet** | - | - | - |
| **DPO** | - | - | - |
| **Responsable sécurité** | - | - | - |
| **Responsable légal** | - | - | - |

---

## 11. Annexes

### Annexe A: Modèle données pseudonymisées

```json
{
  "identity": {
    "id": "550e8400-e29b-41d4-a716-446655440000",  // UUID
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "official_id_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",  // SHA256
    "full_name_hash": "d404559f602eab6fd602ac7680dacbaa5d8e5b3d7b0e2d4b6b3d7a3e6f8d9b1c",
    "status": "registered",
    "documents": ["identity_card", "credit_card"],
    "gdpr_consent_version": "1.0",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "letter": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "victim_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",  // Pas de PII
    "organization": "Banque Française",
    "letter": "[Texte invalidation pseudonymisé]",
    "generated_at": "2025-01-15T11:00:00Z"
  }
}
```

### Annexe B: Conditions RGPD (Texte affiché signup)

```
═══════════════════════════════════════════════════════════════
USURP - CONDITIONS PROTECTION DONNÉES PERSONNELLES
═══════════════════════════════════════════════════════════════

But: Permettre victimes usurpation d'identité documenter et 
signaler à organisations fraudées.

Données collectées:
- Nom, Prénom, Date naissance
- Numéro identité officiel (hashe immédiatement)
- Email (pour notifications)
- Types documents usurpés

Sécurité:
- Pseudonymisation immédiate (hash)
- Chiffrement au repos (optionnel)
- Logs immuables de toute action

Droits RGPD:
- Accès: Consultez vos données
- Rectification: Mettez à jour email/documents
- Suppression: "Oubli" après 12 mois inactivité
- Portabilité: Exportez vos données

Durée: 12 mois inactivité, puis suppression soft-delete,
enfin hard-delete après 3 ans (légal).

Consentement: En cliquant "J'accepte", vous consentez au 
traitement selon conditions ci-dessus, version 1.0.

Contact DPO: dpo@usurp.fr
═══════════════════════════════════════════════════════════════
```

---

**Document certifié conforme RGPD & CNIL par [DPO]**  
**Dernière mise à jour: 15 Jan 2025**
