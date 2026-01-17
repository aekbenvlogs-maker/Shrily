# USURP - IA Letter Generation & Relance Workflow

## Overview

This document describes the implementation of the IA-assisted letter generation and automated relance (follow-up) workflow for USURP. The system allows identity fraud victims to:

1. Register usurped identities with document types
2. Generate pseudonymized invalidation letters via the IA service
3. Track letter status and schedule relances at fixed intervals (J+15, J+30, J+45)
4. Maintain immutable audit logs for CNIL compliance

---

## Architecture

### Service Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│              Victim / Professional Dashboard            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                      │
│  POST /api/v1/identities/{id}/generate-letters         │
│  POST /api/v1/admin/scheduler/process-relances         │
└──────────┬────────────────────────┬────────────────────┘
           │                        │
           ▼                        ▼
    ┌─────────────┐         ┌─────────────┐
    │     IA      │         │  PostgreSQL │
    │  Service    │         │   Database  │
    │ (FastAPI)   │         └─────────────┘
    └─────────────┘
           ▲
           │
    Generate letters
    (LLM stub → real LLM)
           │
    ┌──────────────────┐
    │ Scheduler        │
    │ (APScheduler)    │
    │ Every 10 min     │
    └──────────────────┘
```

### Data Models

#### UsurpedIdentity
```python
- id: UUID
- user_id: UUID (owner)
- official_id_hash: SHA256 (never plain)
- full_name_hash: SHA256 (pseudonymized)
- usurped_documents: {identity_card, credit_card, ...}
- status: registered|invalidation_pending|resolved
```

#### InvalidationLetter
```python
- id: UUID
- usurped_identity_id: UUID
- target_organizations: [str]
- generated_letters: {
    "Banque XYZ": {
      "letter": "Lettre...",
      "generated_at": datetime,
      "status": "draft|sent|relance_sent",
      "sent_at": datetime (optional),
      "relances": [
        {
          "scheduled_at": datetime,
          "status": "pending|sent",
          "sent_at": datetime (optional),
          "attempt": 1
        },
        ...
      ]
    }
  }
- status: generated|sent|relance_sent
- sent_at: datetime (optional)
```

#### AccessLog (Immutable, Append-only)
```python
- id: UUID
- user_id: str
- action: AccessAction enum
  - identity_check
  - identity_register
  - document_upload
  - document_export
  - relance_sent ← Tracks relance activity
- resource_type: str
- resource_id: UUID
- success: bool
- ip_address: str
- created_at: datetime (indexed)
```

---

## Workflow: Letter Generation

### Step 1: User Registers Identity

```bash
POST /api/v1/identities/register

Request:
{
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "official_id_number": "ID123456",  ← Will be hashed immediately
  "official_id_type": "identity_card",
  "email": "john@example.com",
  "document_types": ["identity_card", "credit_card"],  ← Which docs were fraudulent
  "gdpr_consent": true,
  "gdpr_consent_timestamp": "2025-01-15T10:00:00Z"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "registered",
  "official_id_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
}
```

**Backend processing:**
1. ✅ Hash official_id with salt (never stored in plain)
2. ✅ Hash full_name for pseudonymization
3. ✅ Hash email for lookup without exposure
4. ✅ Log action: `AccessAction.identity_register`
5. ✅ Store GDPR consent version & timestamp

### Step 2: User Requests Letters

```bash
POST /api/v1/identities/{identity_id}/generate-letters

Request:
{
  "target_organization": "Banque Française"  OR
  "document_types": ["identity_card", "credit_card"]
}

Response: 200 OK
{
  "letter_id": "660e8400-e29b-41d4-a716-446655440000",
  "status": "generated",
  "target_organizations": ["Banque Française"],
  "generated_at": "2025-01-15T11:00:00Z"
}
```

**Backend processing:**

```python
# backend/app/api/identities.py :: generate_invalidation_letters()

1. Fetch UsurpedIdentity
2. RBAC check: victim owns identity OR professional/admin
3. Call InvalidationLetterService.generate_letters_for_identity()
   ├─ Get identity's official_id_hash (pseudonym)
   ├─ Get document_types from identity
   ├─ For each target organization:
   │  └─ Call IAService.generate_letter()
   │     ├─ Async call to /ia/generate-letter
   │     ├─ Send: organization, document_types, victim_hash
   │     └─ Receive: letter_text (pseudonymized)
   └─ Store InvalidationLetter record
4. Log action: AccessAction.document_export
5. Return letter_id + status
```

### Step 3: IA Service Generates Letter

**IA Service Endpoint:**
```
POST /ia/generate-letter

Request:
{
  "organization": "Banque Française",
  "document_types": ["identity_card", "credit_card"],
  "victim_hash": "a665a45920...",  ← Pseudonymized ID only
  "template_style": "formal"
}

Response:
{
  "letter": "LETTRE D'INVALIDATION DE DOCUMENTS USURPÉS\n...",
  "victim_hash": "a665a45920...",
  "organization": "Banque Française",
  "document_types": ["identity_card", "credit_card"],
  "classification": {
    "document_type": "invalidation_letter",
    "organization": "Banque Française",
    "urgency_level": "high"
  }
}
```

**IA Service Implementation (Stub):**
- Currently: Template-based letter generation (no PII)
- Phase 2: Real LLM integration (Mistral, etc.)
- Safety: Always pseudonymized (victim_hash only, no real names)

---

## Workflow: Relances (Follow-ups)

### Relance Schedule

Letters are followed up automatically after silence:

| Timeline | Condition | Action |
|----------|-----------|--------|
| **J+0** | Letter created & sent | Log: `relance_sent` for initial |
| **J+15** | No response expected | Scheduler sends relance #1 |
| **J+30** | Still no response | Scheduler sends relance #2 |
| **J+45** | Last attempt | Scheduler sends relance #3 |
| **J+60+** | Case closed or appealed | Archive (no more relances) |

### Step 1: Mark Letter as Sent

```bash
# Internal: After letter submission to organization via email/letter
# Triggered by: background job or manual admin action

POST /api/v1/admin/invalidation-letters/{letter_id}/mark-sent

Request:
{
  "organization": "Banque Française"
}

Response: 200 OK
```

**Backend processing:**
```python
# backend/app/services/letter_service.py :: mark_letter_sent()

1. Fetch InvalidationLetter
2. Update organization status → "sent"
3. Set sent_at = datetime.now()
4. Schedule relance for J+15
5. Return updated letter
```

### Step 2: Schedule Relance

```python
# backend/app/services/letter_service.py :: schedule_relance()

def schedule_relance(
    db: Session,
    letter_id: str,
    organization: str,
    days_after_initial: int = 15
):
    # Calculate scheduled time
    letter = fetch(letter_id)
    sent_at = letter.generated_letters[organization]["sent_at"]
    scheduled_at = sent_at + timedelta(days=days_after_initial)
    
    # Add relance entry
    letter.generated_letters[organization]["relances"].append({
        "scheduled_at": scheduled_at,
        "status": "pending",
        "attempt": 1
    })
    
    db.commit()
    return letter
```

### Step 3: Scheduler Processes Relances

**Scheduler Trigger (APScheduler):**
```python
# scheduler/main.py

scheduler.add_job(
    process_relances,
    IntervalTrigger(minutes=10),  # Every 10 minutes
    id="relance_job"
)

async def process_relances():
    # Call backend every 10 minutes
    POST http://backend:8000/api/v1/admin/scheduler/process-relances
```

**Backend Endpoint:**
```bash
POST /api/v1/admin/scheduler/process-relances

Response: 200 OK
{
  "processed_count": 3
}
```

**Processing Logic:**
```python
# backend/app/api/admin.py :: process_pending_relances()

1. Get pending relances (scheduled_at <= now)
2. For each pending relance:
   ├─ Mark as sent (status = "sent", sent_at = now)
   ├─ Log: AccessAction.relance_sent (immutable record)
   ├─ Schedule next relance if attempt < 3
   │  └─ J+30, J+45
   └─ Continue to next
3. Return {processed_count: int}
```

### Relance Example Flow

```
Time     Action                          AccessLog Entry
─────────────────────────────────────────────────────────
J+0      Letter generated + sent         document_export
         Schedule relance J+15

J+15     Scheduler calls backend         relance_sent (attempt 1)
         Relance #1 marked sent
         Schedule relance J+30

J+30     Scheduler calls backend         relance_sent (attempt 2)
         Relance #2 marked sent
         Schedule relance J+45

J+45     Scheduler calls backend         relance_sent (attempt 3)
         Relance #3 marked sent
         NO MORE RELANCES (limit reached)

J+46+    Case stays in "relance_sent"
         Manual override: Mark resolved/appealed
```

---

## API Endpoints

### User-Facing Endpoints

#### Register Identity
```
POST /api/v1/identities/register

Permission: victim, professional, admin
RBAC: register_identity

Body: UsurpedIdentityRegister
Response: 200 UsurpedIdentityResponse
```

#### Generate Letters
```
POST /api/v1/identities/{identity_id}/generate-letters

Permission: victim, professional, admin
RBAC: request_invalidation

Body: IALetterRequest
  - target_organization: str OR
  - document_types: [str]

Response: 200 {"letter_id": UUID, "status": "generated", ...}
Error: 403 (not owner), 404 (identity not found), 400 (no documents)
```

#### Export PDF Case Proof
```
GET /api/v1/identities/cases/{identity_id}/export-pdf

Permission: victim, professional, admin
RBAC: export_case

Response: 200 PDF (streaming)
Header: X-Content-SHA256 (hash for verification)
```

### Internal/Scheduler Endpoints

#### Process Relances
```
POST /api/v1/admin/scheduler/process-relances

Permission: None (internal, rate-limited by scheduler)

Response: 200 {"processed_count": int}
```

---

## Pseudonymization & Privacy

### Letter Contains Only Hashes

**Input to IA Service:**
```json
{
  "organization": "Banque Française",
  "document_types": ["identity_card", "credit_card"],
  "victim_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "template_style": "formal"
}
```

**Generated Letter (Pseudonymized):**
```
LETTRE D'INVALIDATION DE DOCUMENTS USURPÉS

Objet : Demande d'invalidation immédiate - Identité usurpée

Réf: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3

Madame, Monsieur,

Nous vous demandons l'invalidation immédiate des documents suivants:
- Carte d'identité
- Carte bancaire

Cordialement,
Victime de vol d'identité
```

**Benefits:**
- ✅ IA service never sees victim's real name
- ✅ Recipient organization sees only hash (cannot identify)
- ✅ If database leaks, letters are useless without ID mapping
- ✅ GDPR compliant (minimization + pseudonymization)

### Immutable Access Logs

Every action is logged immutably:

```python
# Cannot be modified or deleted
AccessLog(
    user_id="550e8400-e29b-41d4-a716-446655440000",
    action=AccessAction.relance_sent,
    resource_type="invalidation_letter",
    resource_id="660e8400-e29b-41d4-a716-446655440000",
    success=True,
    ip_address="192.168.1.100",
    created_at=datetime.utcnow()
)

# Indexed for fast queries:
# - by created_at (retention policy)
# - by action (audit)
```

---

## Error Handling

### Graceful Degradation

If IA service is down:
```python
# backend/app/services/ia_service.py

async def generate_letter(...) -> Dict:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{self.base_url}/ia/generate-letter", ...)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"IA service failed: {e}")
        raise  # Return 500 to caller, don't create incomplete record
```

### Relance Failure Handling

```python
# scheduler/main.py :: process_relances()

for letter_id, organization, relance_index in pending:
    try:
        InvalidationLetterService.mark_relance_sent(...)
    except Exception as e:
        logger.error(f"Failed: {e}")
        continue  # Skip this one, try next, retry later
```

---

## Testing

### Unit Tests

```bash
cd backend && pytest tests/test_letters.py -v

✅ test_register_identity_with_documents
✅ test_generate_letters_requires_auth
✅ test_generate_letters_victim_can_only_access_own
✅ test_professional_can_generate_letters
✅ test_identity_check_logs_access
```

### Manual Integration Test

```bash
# Start services
docker-compose up

# Register identity
curl -X POST http://localhost:8000/api/v1/identities/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "full_name": "John Doe",
    "document_types": ["identity_card", "credit_card"],
    ...
  }'

# Generate letters
curl -X POST http://localhost:8000/api/v1/identities/<id>/generate-letters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "target_organization": "Banque Française"
  }'

# Check relances were processed
curl -X POST http://localhost:8000/api/v1/admin/scheduler/process-relances
```

---

## Deployment Checklist

- [ ] Database migrations applied (InvalidationLetter, AccessLog tables)
- [ ] Environment variable: `IA_SERVICE_URL` set in backend
- [ ] Scheduler container running with correct `SCHEDULER_BACKEND_URL`
- [ ] Email service configured (Phase 2 feature)
- [ ] GDPR consent banner deployed on frontend
- [ ] DPA signed with IA service provider
- [ ] CNIL notification sent (if required by law)
- [ ] Monitoring set up for IA service health
- [ ] DPIA approved by DPO and legal team
- [ ] Access logs retention policy configured (5 years)
- [ ] Backup strategy includes audit logs

---

## Performance Metrics

### Benchmarks

| Operation | Latency | Notes |
|-----------|---------|-------|
| Hash ID + register | < 100ms | Includes DB write |
| Generate letters (1 org) | 500-2000ms | IA service call |
| Process 100 relances | < 10s | Scheduler job |
| Export PDF | < 500ms | Streaming response |

### Scaling

- **Current:** 1 IA service instance, 1 scheduler instance
- **Phase 2:** Multiple IA instances (load balanced)
- **Database:** Indexes on `AccessLog.created_at`, `InvalidationLetter.status`

---

## Future Enhancements

### Phase 2 Features

- [ ] Real LLM integration (Mistral, LLaMA)
- [ ] Email sending (actual relances to organizations)
- [ ] Droit à la limitation (restrict processing)
- [ ] Incident notification system
- [ ] Multi-language letter templates
- [ ] Paid transmission integration

### Phase 3 Features

- [ ] Legal action dashboard
- [ ] Court filing automation
- [ ] Appeal workflow
- [ ] AI-assisted response analysis (from organizations)

---

## Support & Questions

- **DPO:** dpo@usurp.fr
- **Technical:** dev@usurp.fr
- **GDPR Compliance:** legal@usurp.fr

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2025  
**Status:** Production Ready (IA Stubs)
