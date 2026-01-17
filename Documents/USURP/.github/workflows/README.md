# 📋 GitHub Actions Workflows - Guide

Ce dossier contient tous les workflows GitHub Actions pour USURP.

---

## 🔐 Déclaration RGPD

**Les pipelines CI/CD n'utilisent ni ne traitent de données personnelles.**

Tous les workflows respectent les principes RGPD :
- ✅ Données de test fictives uniquement
- ✅ Aucun accès à la base de production
- ✅ Secrets gérés via GitHub Secrets
- ✅ Logs désensibilisés
- ✅ Artefacts conservation limitée (7 jours)

Documentation complète : [docs/CI_CD_RGPD.md](../../docs/CI_CD_RGPD.md)

---

## 📁 Structure

```
.github/workflows/
├── ci.yml                  # Pipeline principal (tests, build, qualité)
├── security-scan.yml       # Scan quotidien de sécurité
├── deploy-staging.yml      # (À créer) Déploiement staging
├── deploy-prod.yml         # (À créer) Déploiement production
└── README.md              # Ce fichier
```

---

## 🚀 Workflows Disponibles

### 1. `ci.yml` - Pipeline Principal

**Déclencheurs** :
- Push sur `main` ou `develop`
- Pull Request vers `main` ou `develop`
- Manuel (`workflow_dispatch`)

**Jobs** :
1. **Security Checks** (🔒)
   - Scan secrets exposés (TruffleHog)
   - Détection données personnelles
   - Patterns RGPD interdits

2. **Test Backend** (🧪)
   - PostgreSQL + Redis (conteneurs)
   - Pytest + coverage
   - Données fictives uniquement

3. **Test Frontend** (🧪)
   - Jest + React Testing Library
   - Coverage report

4. **Test E2E** (🎭)
   - Playwright (données anonymisées)
   - Artefacts retention 7 jours

5. **Code Quality** (📊)
   - Ruff (Python)
   - Black (formatter)
   - ESLint (JavaScript/TypeScript)

6. **Build** (🏗️)
   - Docker backend
   - Build frontend
   - Scan artefacts (aucun secret)

7. **Vulnerability Scan** (🛡️)
   - Trivy
   - SARIF upload GitHub Security

8. **RGPD Audit** (📋)
   - Vérification docs RGPD
   - Absence références production

**Durée moyenne** : 12-15 minutes

---

### 2. `security-scan.yml` - Scan de Sécurité

**Déclencheurs** :
- Quotidien à 3h00 UTC (`cron`)
- Manuel (`workflow_dispatch`)

**Jobs** :
1. **Dependency Review** - Vulnérabilités dépendances
2. **Secret Scanning** - TruffleHog full history
3. **CodeQL Analysis** - SAST (Python + JavaScript)
4. **Container Scan** - Trivy images Docker
5. **RGPD Compliance** - Vérification tracking/cookies
6. **License Compliance** - Audit licences

**Durée moyenne** : 20-25 minutes

---

## 🔑 Secrets Requis

Configurés dans `Settings → Secrets and variables → Actions` :

### Development
- `DEV_DATABASE_URL`
- `DEV_REDIS_URL`
- `DEV_SECRET_KEY`

### Staging (À configurer)
- `STAGING_DATABASE_URL`
- `STAGING_REDIS_URL`
- `STAGING_SECRET_KEY`
- `STAGING_DEPLOY_KEY`

### Production (À configurer)
- `PROD_DATABASE_URL`
- `PROD_REDIS_URL`
- `PROD_SECRET_KEY`
- `PROD_DEPLOY_KEY`
- `SENTRY_DSN`

⚠️ **IMPORTANT** : Rotation mensuelle obligatoire (voir [SECRETS_MANAGEMENT.md](../../SECRETS_MANAGEMENT.md))

---

## 📊 Variables d'Environnement

### Publiques (dans workflows)
```yaml
PYTHON_VERSION: '3.11'
NODE_VERSION: '18'
TEST_DATABASE: 'usurp_test'
TEST_USER: 'test_user'
DO_NOT_TRACK: '1'
```

### Interdites ❌
- Emails réels (`*@gmail.com`, `*@yahoo.fr`)
- Numéros de téléphone réels
- Données de production
- Secrets en clair

---

## 🧪 Tester les Workflows Localement

### Act (GitHub Actions local runner)

```bash
# Installer Act
brew install act  # macOS
# ou
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Tester le workflow CI
act push -W .github/workflows/ci.yml

# Tester un job spécifique
act -j test-backend

# Avec secrets locaux
act --secret-file .secrets
```

### Validation Pre-commit

```bash
# Vérifier syntaxe YAML
yamllint .github/workflows/*.yml

# Vérifier absence de secrets
trufflehog filesystem .github/workflows/

# Vérifier patterns RGPD
grep -rE "@gmail\.com|@yahoo\.fr" .github/workflows/
```

---

## 📈 Métriques & Monitoring

### GitHub Actions Insights

Accessible via : `Actions → [Workflow] → Analytics`

**Métriques suivies** :
- ⏱️ Durée d'exécution (objectif < 15 min)
- ✅ Taux de succès (objectif > 95%)
- 🔄 Fréquence des runs
- 💰 Consommation minutes (budget 2000 min/mois)

### Alertes Configurées

- ❌ Échec du workflow (notification Slack)
- 🔴 Vulnérabilité critique détectée (email DPO + RSSI)
- ⚠️ Pattern RGPD détecté (bloque PR)
- 🔒 Secret exposé (bloque run + alerte immédiate)

---

## 🛠️ Maintenance

### Checklist Mensuelle

- [ ] Mettre à jour les Actions (renovate bot)
- [ ] Rotation des secrets
- [ ] Vérifier consommation minutes GitHub
- [ ] Revue des logs d'échecs
- [ ] Test des procédures de rollback

### Checklist Trimestrielle (RGPD)

- [ ] Audit complet workflows
- [ ] Vérification accès (RBAC)
- [ ] Test détection données personnelles
- [ ] Revue documentation conformité
- [ ] Update DPA GitHub si nécessaire

---

## 🚨 Dépannage

### Échec du Security Check

```bash
# Localement : rechercher patterns interdits
grep -rE "@gmail\.com|@yahoo\.fr" . --exclude-dir=node_modules

# Vérifier secrets exposés
trufflehog filesystem . --json
```

### Échec des Tests

```bash
# Backend
cd backend
pytest tests/ -v --tb=short

# Frontend
cd frontend
npm test
```

### Build Docker échoue

```bash
# Tester localement
cd backend
docker build -t usurp-backend:test .

# Vérifier logs
docker logs <container_id>
```

---

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Act - Local Testing](https://github.com/nektos/act)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [Trivy](https://github.com/aquasecurity/trivy)
- [CodeQL](https://codeql.github.com/)

---

## 📞 Support

**Questions CI/CD** : devops@usurp.fr  
**Incidents sécurité** : security@usurp.fr  
**Conformité RGPD** : dpo@usurp.fr

---

**Dernière mise à jour** : 17 janvier 2026  
**Version** : 1.0
