# Architecture - Fiches Annonce

## 🎯 Objectif
Section dédiée pour ouvrir, analyser et extraire les données des annonces immobilières directement depuis le SaaS.

---

## 🏗️ Architecture Technique

### 1. **Composants React**
```
components/
├── FichesAnnoncesModule.tsx          # Container principal
├── WebViewFrame.tsx                  # Gestion webview/iframe sécurisé
├── PropertyDataExtractor.tsx         # Parser visuel
└── FicheCard.tsx                    # Affichage fiche
```

### 2. **Services d'Extraction**
```
services/
├── propertyExtractorService.ts       # Logique DOM parsing + regex
├── webFrameService.ts                # Gestion iframe/CSP
└── annoncePersistenceService.ts      # localStorage/IndexedDB
```

### 3. **Types & Structures**
```
types.ts (ajouts)
├── interface AnnonceFiche {
│   id: string
│   url: string
│   ville: string
│   secteur?: string
│   prix?: number
│   surface?: number
│   source: 'leboncoin' | 'notaires' | 'agence'
│   contenuHTML?: string
│   extractedAt: Date
│   metadata?: Record<string, any>
│ }
```

### 4. **Flux de Données**
```
URL Annonce
    ↓
[WebViewFrame] → Charge iframe
    ↓
[DOM disponible] → Trigger extraction
    ↓
[PropertyExtractorService] → Parse + regex
    ↓
[AnnonceFiche] → Stockage localStorage
    ↓
[FichesAnnoncesModule] → Affichage
```

---

## 🔒 Considérations Sécurité

### CSP (Content Security Policy)
- Iframe sandbox attributes: `allow-same-origin allow-scripts`
- Pas d'accès au localStorage depuis l'iframe
- Proxy les requêtes si nécessaire

### XSS Protection
- Pas d'innerHTML brut → utiliser textContent/sanitize
- DOMParser pour parsing sûr
- Valider les URLs avant iframe

### Conformité
- Pas de scraping agressif (throttle)
- Respect robots.txt (côté UX)
- Conditions d'utilisation (ToS)

---

## 📊 Données Extraites

### Priorité P0 (Tout site)
- `ville` - Regex: code postal 5 chiffres + nom
- `secteur` - Chercher: "quartier", "secteur", "zone"

### Priorité P1 (Leboncoin spécifique)
- Sélecteurs CSS ciblés
- Fallback à regex générique

### Priorité P2 (Futur)
- Prix, surfaces, zonage PLU
- Images miniature
- Contact vendeur

---

## 🛠️ Implémentation par Priorité

### Phase 1 (MVP - Aujourd'hui)
✅ Webview iframe sécurisé
✅ Extraction ville + secteur (regex robuste)
✅ Affichage fiche simple
✅ Stockage localStorage

### Phase 2 (Enhancement)
⏳ Multi-plateforme (Notaires, SeLoger)
⏳ Analyse DOM dynamique (JavaScript-rendered)
⏳ Export données (CSV/JSON)

### Phase 3 (Intégration)
⏳ Lier aux analyses PLU
⏳ Intégration montage financier
⏳ Historique extractions

---

## ⚠️ Limitations & Edge Cases

| Cas | Solution |
|-----|----------|
| Site bloque iframe | Fallback navigateur externe |
| Contenu lazy-loaded | Attendre MutationObserver |
| Plusieurs adresses | Extraction all → choix utilisateur |
| Pas de ville visible | Mode manuel + save vide |
| Structure HTML change | Heuristiques + ML futur |

---

## 📐 Structure Storage

```javascript
// localStorage: 'marchand_fiches_annonces'
[
  {
    id: "lbc_3087362860",
    url: "https://www.leboncoin.fr/vi/3087362860.htm",
    ville: "Nancy (54000)",
    secteur: "Centre-Ville",
    prix: null,
    surface: null,
    source: "leboncoin",
    extractedAt: "2025-12-18T13:00:00Z",
    metadata: {
      domStrategy: "css_selector",
      fallbackUsed: false
    }
  }
]
```

---

## 🎨 UX Flow

```
1. Utilisateur clique "Voir fiche" sur vignette
   ↓
2. Webview s'ouvre (modal/sidebar)
   ↓
3. Iframe charge l'annonce
   ↓
4. Extraction automatique lancée
   ↓
5. Données affichées à côté (ville, secteur)
   ↓
6. Utilisateur peut:
   - [Enregistrer] → localStorage
   - [Analyser] → Route PLU/Financière
   - [Modifier] → Edit manuel
   - [Fermer] → Back
```
