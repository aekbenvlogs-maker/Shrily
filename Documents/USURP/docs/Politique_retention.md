# 🗑️ POLITIQUE DE RÉTENTION DES DONNÉES

**USURP - Système de gestion d'usurpation d'identité**  
**Version** : 1.0  
**Date** : 11 janvier 2026

---

## 1. PRINCIPES GÉNÉRAUX

### Base juridique
- **RGPD Article 5.1.e** : Limitation de la conservation
- **Code civil Article 2224** : Prescription quinquennale
- **Code de procédure civile Article 748-1** : Conservation des pièces

### Règle d'or
> **Les données ne sont conservées que le temps strictement nécessaire aux finalités poursuivies.**

---

## 2. DURÉES DE CONSERVATION PAR TYPE

### 2.1 Données d'identité (dossiers actifs)

| Type de données | Durée active | Durée archive | Suppression |
|-----------------|--------------|---------------|-------------|
| Identité victime | Durée du dossier | 5 ans | Définitive après 5 ans |
| Documents frauduleux | Durée du dossier | 5 ans | Définitive après 5 ans |
| Courriers générés | Durée du dossier | 10 ans* | Définitive après 10 ans |
| Preuves judiciaires | Durée procédure | 10 ans* | Définitive après 10 ans |

\* _Si procédure judiciaire en cours : conservation jusqu'à clôture + 10 ans_

### 2.2 Logs d'accès (traçabilité)

| Type | Durée | Base légale |
|------|-------|-------------|
| Logs d'accès utilisateur | **5 ans** | RGPD Article 30 |
| Logs d'audit système | **5 ans** | RGPD Article 30 |
| Logs de sécurité | **5 ans** | RGPD Article 32 |

⚠️ **Append-only** : Aucune suppression avant terme

### 2.3 Données techniques

| Type | Durée | Justification |
|------|-------|---------------|
| Sessions JWT | 24 heures | Expiration automatique |
| Tokens refresh | 30 jours | Expiration automatique |
| Cache applicatif | 1 heure | Volatile |
| Backups chiffrés | 90 jours | Restauration en cas d'incident |

### 2.4 Données IA

| Type | Durée | Justification |
|------|-------|---------------|
| Prompts générés | 5 ans | Preuve judiciaire |
| Outputs LLM | 5 ans | Preuve judiciaire |
| Hash du prompt | **Permanent** | Preuve d'intégrité |

### 2.5 Preuves cryptographiques

| Type | Durée | Base légale |
|------|-------|-------------|
| Hash SHA256 documents | **10 ans** | Code civil Art. 1379 |
| Chaîne de preuves | **10 ans** | Code civil Art. 1379 |
| Horodatages UTC | **10 ans** | Règlement eIDAS |
| Certificats de preuve | **10 ans** | Code civil Art. 1366 |

---

## 3. CYCLES DE VIE DES DONNÉES

### Phase 1 : Données actives (base principale)
- **Durée** : Tant que le dossier est ouvert
- **Accès** : Complet (selon rôles RBAC)
- **Localisation** : Base PostgreSQL principale

### Phase 2 : Données archivées (base archive)
- **Durée** : 5 ans après clôture du dossier
- **Accès** : Lecture seule (admin + juridique)
- **Localisation** : Base archive chiffrée

### Phase 3 : Suppression définitive
- **Méthode** : 
  - Suppression logique (soft delete)
  - Effacement cryptographique (clés)
  - Purge physique après 6 mois
- **Traçabilité** : Log de suppression permanent

---

## 4. EXCEPTIONS À LA SUPPRESSION

### Conservation prolongée autorisée
1. **Procédure judiciaire en cours**
   - Durée : Jusqu'à clôture + 10 ans
   - Base légale : Code de procédure civile

2. **Réquisition judiciaire**
   - Durée : Selon ordonnance du juge
   - Base légale : Code de procédure pénale

3. **Litige avec l'utilisateur**
   - Durée : Jusqu'à résolution + 5 ans
   - Base légale : Prescription civile

4. **Obligation légale**
   - Durée : Selon texte applicable
   - Exemples : Archives publiques, intérêt historique

---

## 5. PROCESSUS TECHNIQUES

### 5.1 Archivage automatique

```sql
-- Déclenchement quotidien (CRON)
UPDATE identities 
SET status = 'archived', archived_at = NOW()
WHERE status = 'closed' 
  AND closed_at < NOW() - INTERVAL '5 years';
```

### 5.2 Suppression automatique

```sql
-- Déclenchement hebdomadaire (CRON)
DELETE FROM identities 
WHERE status = 'archived' 
  AND archived_at < NOW() - INTERVAL '10 years'
  AND NOT EXISTS (
    SELECT 1 FROM legal_holds 
    WHERE identity_id = identities.id
  );
```

### 5.3 Soft delete (suppression logique)

```python
# Toujours préférer le soft delete
identity.deleted_at = datetime.utcnow()
identity.status = "deleted"
db.commit()

# Jamais de DELETE direct
# db.delete(identity)  ❌
```

---

## 6. DROITS DES UTILISATEURS

### Droit à l'effacement (RGPD Article 17)

✅ **Accordé si** :
- Données non nécessaires
- Retrait du consentement
- Opposition légitime

❌ **Refusé si** :
- Obligation légale de conservation
- Procédure judiciaire en cours
- Intérêt public (archives)

### Procédure
1. Demande via formulaire web
2. Vérification identité
3. Analyse légale (DPO)
4. Exécution sous 1 mois
5. Confirmation écrite

---

## 7. SANCTIONS

### Non-conformité interne
- Alerte automatique (CRON)
- Notification DPO
- Rapport trimestriel

### Sanctions CNIL possibles
- Rappel à l'ordre
- Mise en demeure
- Amende : jusqu'à 20M€ ou 4% CA mondial

---

## 8. AUDIT ET CONTRÔLE

### Revue annuelle
- ✅ Vérification des durées de conservation
- ✅ Analyse des données obsolètes
- ✅ Test des processus d'archivage
- ✅ Mise à jour de la politique

### Outils de monitoring
```sql
-- Rapport mensuel des données à archiver
SELECT 
  COUNT(*) as total,
  status,
  MIN(closed_at) as oldest
FROM identities
WHERE status = 'closed' 
  AND closed_at < NOW() - INTERVAL '5 years'
GROUP BY status;
```

---

## 9. CONTACT

**Questions sur la rétention** : [DPO email]  
**Demande d'effacement** : [GDPR request form]  
**Urgence sécurité** : [Security contact]

---

**Approuvé par** : [DPO]  
**Date d'application** : 11 janvier 2026  
**Prochaine révision** : 11 janvier 2027
