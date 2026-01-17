# 📋 REGISTRE DES TRAITEMENTS RGPD

**Organisme** : USURP - Système de gestion d'usurpation d'identité  
**Responsable de traitement** : [À COMPLÉTER]  
**DPO** : [À COMPLÉTER]  
**Date** : 11 janvier 2026

---

## TRAITEMENT N°1 : Gestion des identités usurpées

### 1. Finalités
- Enregistrement des déclarations d'usurpation d'identité
- Génération automatisée de courriers juridiques
- Production de preuves électroniques horodatées
- Suivi administratif des dossiers

### 2. Base juridique
- **RGPD Article 6.1.c** : Obligation légale (assistance aux victimes)
- **RGPD Article 9.2.f** : Constatation, exercice ou défense de droits en justice
- **Code pénal Article 226-4-1** : Usurpation d'identité

### 3. Catégories de données traitées
#### Données pseudonymisées
- ✅ Hash SHA256 de l'identité victime (hash_only)
- ✅ Métadonnées de dossier (référence, dates, statut)
- ✅ Documents frauduleux (types, organisations concernées)

#### Données personnelles minimales
- Identité victime : nom, prénom, date de naissance
- Coordonnées : adresse, email, téléphone
- Documents d'identité : numéros (stockés chiffrés)

#### Données techniques
- Logs d'accès (IP hashée, User-Agent hashé)
- Horodatages UTC
- Hash des documents générés

### 4. Catégories de personnes concernées
- Victimes d'usurpation d'identité
- Professionnels du droit (avocats, experts)
- Agents administratifs
- Magistrats

### 5. Destinataires
- **Internes** : Administrateurs système, support
- **Externes** : 
  - Avocats mandatés
  - Autorités judiciaires (sur réquisition)
  - CNIL (sur demande)

### 6. Durées de conservation
| Données | Durée | Base légale |
|---------|-------|-------------|
| Dossiers actifs | Durée nécessaire + 5 ans | Prescription civile |
| Logs d'accès | 5 ans | RGPD Article 30 |
| Preuves judiciaires | 10 ans | Code civil Art. 1379 |
| Données archivées | Sur demande judiciaire uniquement | - |

### 7. Mesures de sécurité
- ✅ Chiffrement AES-256 au repos
- ✅ TLS 1.3 en transit
- ✅ Pseudonymisation par hash SHA256
- ✅ Logs append-only immuables
- ✅ Authentification JWT + RBAC
- ✅ Chaînage cryptographique des preuves
- ✅ Backup chiffrés quotidiens
- ✅ Cloisonnement des données par rôle

### 8. Transferts hors UE
❌ **Aucun transfert hors UE**

---

## TRAITEMENT N°2 : Génération de courriers par IA

### 1. Finalités
- Assistance automatisée à la rédaction juridique
- Génération de courriers types conformes RGPD
- Utilisation de LLM local (Mistral 7B)

### 2. Base juridique
- **RGPD Article 6.1.f** : Intérêt légitime (assistance aux victimes)

### 3. Données traitées
- ✅ Hash SHA256 uniquement (pas de PII dans le LLM)
- ✅ Types de documents frauduleux
- ✅ Noms d'organisations (publics)

### 4. Mesures spécifiques IA
- ✅ LLM offline (aucune donnée envoyée à l'extérieur)
- ✅ Prompt scellé cryptographiquement (hash SHA256)
- ✅ Détection PII en sortie (blocage si PII détectée)
- ✅ Outputs avec placeholders uniquement
- ✅ Audit trail de toutes les générations

### 5. Durée de conservation
- Prompts/outputs : 5 ans (preuve judiciaire)
- Hash du prompt : Permanent (preuve d'intégrité)

---

## TRAITEMENT N°3 : Journal d'accès

### 1. Finalités
- Traçabilité des accès aux données personnelles
- Détection d'accès non autorisés
- Preuve de conformité RGPD

### 2. Base juridique
- **RGPD Article 30** : Registre des activités de traitement

### 3. Données traitées
- ID utilisateur (UUID)
- Rôle (victim, professional, admin, judge)
- Action (GET, POST, DELETE)
- Ressource accédée (path)
- IP hashée (SHA256)
- User-Agent hashé (SHA256)
- Timestamp UTC

### 4. Mesures spécifiques
- ✅ Append-only (aucune modification possible)
- ✅ Pseudonymisation systématique (IP/UA hashés)
- ✅ Constraint SQL empêchant UPDATE/DELETE

### 5. Durée de conservation
- **5 ans** (obligation légale)

---

## DROITS DES PERSONNES

### Droits exercables
- ✅ **Droit d'accès** (Article 15)
- ✅ **Droit de rectification** (Article 16)
- ✅ **Droit à l'effacement** (Article 17) - Sauf obligation légale
- ✅ **Droit à la limitation** (Article 18)
- ✅ **Droit à la portabilité** (Article 20)
- ✅ **Droit d'opposition** (Article 21) - Sauf intérêt légitime

### Modalités d'exercice
- Email : [À COMPLÉTER]
- Formulaire web : /api/gdpr/request
- Délai de réponse : 1 mois maximum

---

## ANALYSE D'IMPACT (DPIA)

✅ **DPIA réalisée** : Voir fichier DPIA.md  
Date : 11 janvier 2026  
Résultat : Risques maîtrisés avec mesures de sécurité renforcées

---

## TRAITEMENT N°5 : CI/CD - Intégration et Déploiement Continus

### 1. Finalités
- Construction, test et déploiement automatisés de l'application
- Contrôle qualité du code (tests, sécurité, conformité)
- Versioning et traçabilité des déploiements

### 2. Base juridique
- **RGPD Article 6.1.f** : Intérêt légitime (sécurité et qualité technique)

### 3. Catégories de données traitées
#### Données techniques uniquement
- ✅ Code source (versioning)
- ✅ Logs de build (désensibilisés)
- ✅ Métriques de tests
- ✅ Résultats scans de sécurité

#### Données INTERDITES ❌
- ❌ Aucune donnée personnelle réelle
- ❌ Aucune donnée de production
- ❌ Tests avec données fictives uniquement

### 4. Catégories de personnes concernées
- **Aucune** : Les workflows CI/CD n'utilisent ni ne traitent de données à caractère personnel

### 5. Destinataires
- **Internes** : Équipe DevOps, développeurs
- **Sous-traitant** : GitHub Inc. (Microsoft) - hébergement CI/CD

### 6. Transfert hors UE
- **Destination** : Runners GitHub (multi-région) ou self-hosted (France)
- **Garanties** : DPA GitHub signé, Clauses Contractuelles Types, ISO 27001, SOC 2 Type II

### 7. Durée de conservation
- **Artefacts de build** : 7 jours
- **Logs GitHub Actions** : 90 jours
- **Code source** : Durée de vie du projet

### 8. Mesures de sécurité
- ✅ Chiffrement transit (TLS 1.3)
- ✅ Secrets chiffrés au repos (AES-256)
- ✅ Permissions minimales (RBAC)
- ✅ Scan automatique secrets/vulnérabilités
- ✅ Audit trail complet
- ✅ Séparation stricte dev/staging/prod

### 9. Droits des personnes
- Non applicable (aucune donnée personnelle traitée)

### 10. Analyse d'impact
- **Risque** : Faible (pas de données personnelles)
- **DPIA** : Non requise (traitement technique uniquement)

**Documentation** : [CI_CD_RGPD.md](CI_CD_RGPD.md)

---

## SOUS-TRAITANTS

| Sous-traitant | Traitement | Localisation | Garanties |
|---------------|------------|--------------|-----------|
| GitHub Inc. (Microsoft) | CI/CD, versioning code | UE/Multi-région | DPA signé, ISO 27001, SOC 2 |
| [Hébergeur] | Infrastructure | UE | Clause RGPD |
| [Backup] | Sauvegardes | UE | Chiffrement E2E |

---

## VIOLATIONS DE DONNÉES

### Procédure
1. Détection via logs d'accès
2. Notification DPO : < 24h
3. Notification CNIL : < 72h (si risque élevé)
4. Notification personnes concernées : Sans délai (si risque élevé)

### Contact
- CNIL : https://www.cnil.fr/
- Téléphone : 01 53 73 22 22

---

**Dernière mise à jour** : 17 janvier 2026  
**Prochaine révision** : 17 janvier 2027
