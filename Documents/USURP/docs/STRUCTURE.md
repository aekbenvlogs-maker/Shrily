# USURP - Structure du Projet

```
USURP/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI factory
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication routes
│   │   │   ├── identities.py        # Identity registration routes
│   │   │   └── admin.py             # Admin routes
│   │   ├── models/
│   │   │   └── __init__.py          # SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── __init__.py          # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── user_service.py      # User business logic
│   │   │   ├── identity_service.py  # Identity business logic
│   │   │   └── audit_service.py     # Audit logging
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Settings
│   │   │   ├── security.py          # JWT, hashing, RBAC
│   │   │   └── constants.py         # App constants
│   │   ├── db/
│   │   │   ├── __init__.py          # Database connection
│   │   │   └── models.py            # Import marker
│   │   └── llm/
│   │       ├── __init__.py
│   │       └── orchestrator.py      # LLM orchestrator
│   ├── main.py                       # Entry point
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   ├── Dockerfile                    # Backend container
│   └── .gitignore
│
├── frontend/                         # React + TypeScript Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── RegisterIdentityPage.tsx
│   │   ├── components/
│   │   │   └── (future: reusable components)
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── store/
│   │   │   └── authStore.ts         # Auth state (Zustand)
│   │   ├── config/
│   │   │   └── api.ts               # Axios config
│   │   ├── App.tsx                  # Main app component
│   │   ├── index.tsx                # Entry point
│   │   └── index.css                # Global styles
│   ├── package.json
│   ├── .env.example
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── .gitignore
│
├── docker-compose.yml               # Multi-service orchestration
├── README.md                        # Project documentation
└── .gitignore
```

## 🔄 Data Flow

```
1. User Registration (Frontend)
   └─ POST /auth/register
      ├─ Password hash (bcrypt)
      ├─ Store User
      └─ Return user ID

2. Login (Frontend)
   └─ POST /auth/login
      ├─ Verify password
      ├─ Generate JWT (user_id + role)
      └─ Return token

3. Register Usurped Identity (Protected)
   └─ POST /identities/register (JWT required)
      ├─ Extract user_id from JWT
      ├─ Check duplicate (hash comparison)
      ├─ Hash official ID + full name
      ├─ Store UsurpedIdentity (pseudonymized)
      ├─ Audit log
      └─ Return identity

4. Audit Log (Immutable)
   └─ Append-only: user_id, action, resource, IP, timestamp
```

## 🔐 Security Checklist

- [x] Password hashing (bcrypt)
- [x] JWT token management
- [x] Role-based access control (RBAC)
- [x] HTTPS/TLS enforcement
- [x] Input validation (Pydantic)
- [x] SQL injection prevention (SQLAlchemy ORM)
- [x] CORS configuration
- [x] Audit logging
- [ ] Rate limiting (Phase 2)
- [ ] 2FA / MFA (Phase 2)
- [ ] Encryption at rest (Phase 2)

## 🚀 Next Steps

1. **Phase 1** (MVP - Current)
   - ✅ User authentication
   - ✅ Identity registration
   - ✅ GDPR compliance
   - ✅ Audit logging
   - ✅ Basic UI

2. **Phase 2**
   - [ ] LLM integration (document classification)
   - [ ] Email notifications
   - [ ] Payment processing
   - [ ] Letter generation
   - [ ] Rate limiting & 2FA

3. **Phase 3**
   - [ ] Professional dashboard
   - [ ] Legal document automation
   - [ ] Multi-language support
   - [ ] Mobile app (Flutter)
   - [ ] Scheduler service
