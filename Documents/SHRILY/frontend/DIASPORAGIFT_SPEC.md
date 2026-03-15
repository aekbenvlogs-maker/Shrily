# DiasporaGift — Spécifications Frontend

## Rôle
Tu es un développeur frontend senior expert Next.js 14, TypeScript et Tailwind CSS.
Tu reproduis des designs pixel-perfect à partir de captures d'écran.
Tu livres du code complet, fonctionnel, sans placeholder ni TODO.
Tu n'expliques pas — tu codes directement.

## Contexte
Projet : DiasporaGift — plateforme permettant à la diaspora algérienne de commander et payer en euros depuis la France, leurs proches retirent en boutique en Algérie via QR code.
Dossier cible : /Users/ben/Documents/SHRILY/frontend/
Backend API : http://localhost:8000

## Design System
**Couleurs :**
- --green-primary: #1a7a4a
- --green-light: #f0faf4
- --green-badge: #e8f5ee
- --text-dark: #1a1a1a
- --text-gray: #6b7280
- --footer-bg: #1a1a1a

**Typographie :**
- Titres H1/H2 : Playfair Display, serif, font-weight 700
- Corps : Inter, sans-serif, font-weight 400/500
- Import dans globals.css depuis Google Fonts

**Composants réutilisables :**
- BtnPrimary  → bg #1a7a4a text-white rounded-full px-6 py-3 hover:bg-[#155f3a]
- BtnSecondary → border border-gray-300 bg-white rounded-full px-6 py-3 hover:bg-gray-50
- Card        → bg-white rounded-2xl shadow-sm border border-gray-100
- Input       → border border-gray-200 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-[#1a7a4a]
- Badge       → bg-[#e8f5ee] text-[#1a7a4a] text-xs px-3 py-1 rounded-full

**Logo pattern :**
```jsx
<div className="w-9 h-9 bg-[#1a7a4a] rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-lg">D</span>
</div>
<span><span className="font-semibold text-gray-900">Diaspora</span><span className="font-semibold text-[#1a7a4a]">Gift</span></span>
```

## Exemples
**BON exemple — composant correct**
```tsx
'use client'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#1a7a4a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">D</span>
          </div>
          <span className="font-semibold">Diaspora<span className="text-[#1a7a4a]">Gift</span></span>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/marketplace" className="text-gray-600 hover:text-gray-900">Marketplace</Link>
          <Link href="/comment-ca-marche" className="text-gray-600 hover:text-gray-900">Comment ça marche</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/panier"><ShoppingCart className="w-5 h-5 text-gray-600" /></Link>
          <Link href="/connexion" className="text-gray-600 hover:text-gray-900">Connexion</Link>
          <Link href="/inscription" className="bg-[#1a7a4a] text-white px-4 py-2 rounded-full text-sm hover:bg-[#155f3a]">
            Inscription
          </Link>
        </div>
      </div>
    </nav>
  )
}
```
**MAUVAIS exemple — à ne jamais faire**
- Couleurs hardcodées en dehors du design system
- Pas de types TypeScript
- 'use client' manquant sur les composants interactifs
- className inline illisible sans structure
- TODO ou placeholder dans le code livré

## Spécifications des pages et composants

### 1. components/Navbar.tsx
Sticky top-0, bg blanc, border-bottom gris très clair.
Gauche : Logo (carré vert D + DiasporaGift).
Centre : liens "Marketplace" et "Comment ça marche".
Droite : icône panier (lucide ShoppingCart) + lien "Connexion" + bouton "Inscription" vert.
Le lien actif est en vert #1a7a4a.

### 2. components/Footer.tsx
bg-[#1a1a1a], text-white, 3 colonnes, padding py-16.
Col 1 : Logo version claire + tagline grise.
Col 2 : "Liens utiles" → Marketplace, Comment ça marche, Scanner un QR code.
Col 3 : "Contact" → support@diasporagift.com, +33 1 23 45 67 89.
Bottom border-t border-gray-800 : "© 2026 DiasporaGift. Tous droits réservés."

### 3. app/page.tsx (Homepage)
Hero bg-[#f0faf4], min-h-[85vh], flex items-center.
Côté gauche (col-6) :
- Badge pill vert clair : "🎁 La joie d'offrir, sans frontières"
- H1 Playfair Display 56px : "Offrez des cadeaux à vos proches" + "en Algérie" en text-[#1a7a4a]
- Paragraphe gris 18px max-w-lg
- 2 boutons côte à côte : BtnPrimary "Découvrir les offres →" + BtnSecondary "Comment ça marche"
- Row 3 icônes : Shield "Paiement sécurisé" | Store "Commerçants vérifiés" | Gift "Large choix"
Côté droit (col-6) :
- Div rounded-2xl bg-gray-200 h-96 (placeholder image)
- Floating card absolue bas-gauche : bg-white rounded-xl shadow-lg p-4 icône QR vert + "Retrait facile" bold + "Scannez & récupérez" gris

### 4. app/marketplace/page.tsx
H1 "Marketplace" + sous-titre gris.
Barre de filtres (flex gap-4) :
- Input search icon loupe : "Rechercher un produit ou commerçant..."
- Select "Toutes catégories" border rounded-xl
- Select "EUR (€)" border rounded-xl
- Toggle [Produits|Commerçants] : actif = bg-[#1a7a4a] text-white, inactif = bg-white border

Grid 4 colonnes (xl) / 3 (lg) / 2 (md) / 1 (sm).
Chaque ProductCard :
- Image area : bg-[#f5f5f5] rounded-t-2xl h-52 flex items-center justify-center icône Store gris centré
- Badge catégorie absolu top-3 left-3
- Padding p-4 :
  - Nom produit : font-semibold text-gray-900
  - Commerçant : icône MapPin 12px + "Nom • Wilaya" text-gray-500 text-sm
  - Row : prix text-[#1a7a4a] font-bold text-lg | bouton "+ Ajouter" vert rounded-full

Fetch données : useEffect → GET http://localhost:8000/products/
Si erreur : afficher les données mockées (3 produits fictifs)

### 5. app/comment-ca-marche/page.tsx
Header centré : H2 "Comment ça marche ?" + sous-titre gris.
4 étapes en sections alternées (flex-row / flex-row-reverse) :
Chaque étape : icône vert + numéro + titre bold + description + image placeholder.
- Étape 1 : Gift — "Choisissez un cadeau"
- Étape 2 : CreditCard — "Payez en EUR ou USD"
- Étape 3 : QrCode — "Partagez le QR code"
- Étape 4 : CheckCircle — "Retrait en boutique"

Section "Pourquoi DiasporaGift ?" : 3 cards égales :
Shield "100% Sécurisé" | Store "Commerçants vérifiés" | Globe "Offrez sans frontières"

CTA Banner : bg-[#1a7a4a] rounded-2xl p-16 text-center text-white :
H3 "Prêt à commencer ?" + sous-titre blanc/80 + 2 boutons : [Découvrir les offres (bg-white text-green)] [Je vais m'identifier (border-white text-white)]

### 6. app/connexion/page.tsx
Page centrée min-h-screen flex items-center justify-center.
Card blanche max-w-md shadow-lg rounded-2xl p-8 :
- Icône Lock dans cercle vert clair centré
- H2 "Connexion" centré
- Sous-titre gris centré
- Form onSubmit → POST http://localhost:8000/auth/login :
  Input email (icône Mail) + Input password (icône Lock)
  Bouton "Se connecter" BtnPrimary full-width
- Lien centré : "Pas encore de compte ? S'inscrire" → /inscription
Lien retour haut : "← Retour à l'accueil"

### 7. app/inscription/page.tsx
Card blanche max-w-md shadow-lg rounded-2xl p-8 :
- H2 "Créer un compte" centré
- Sous-titre "Rejoignez DiasporaGift aujourd'hui" centré
- Toggle [👤 Client | 🏪 Commerçant] : state userType = 'client' | 'merchant'
  Sous-texte dynamique : Client → "Offrez des cadeaux à vos proches en Algérie"
- Inputs : Nom complet (User) | Email (Mail) | Téléphone optionnel (Phone) | Mot de passe (Lock)
- Bouton "S'inscrire en tant que client" (ou commerçant) BtnPrimary full-width onSubmit → POST http://localhost:8000/auth/register
- Lien : "Déjà un compte ? Se connecter" → /connexion

### 8. app/panier/page.tsx
État vide (par défaut) : flex col centré min-h-[60vh] :
- Icône ShoppingBag gris w-16 h-16
- H2 "Votre panier est vide" font-semibold
- Texte gris "Découvrez nos produits et commencez à faire plaisir à vos proches"
- BtnPrimary "Découvrir les produits" → /marketplace

## Config
- app/globals.css :
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@700;800&display=swap');
  :root { --green: #1a7a4a; --green-light: #f0faf4; }
  body { font-family: 'Inter', sans-serif; }
- app/layout.tsx :
  import Navbar from '@/components/Navbar'
  import Footer from '@/components/Footer'
  export const metadata = { title: 'DiasporaGift', description: '...' }
  export default function RootLayout({ children }) {
    return <html><body><Navbar/><main>{children}</main><Footer/></body></html>
  }
- next.config.js :
  module.exports = { images: { domains: ['localhost', 'via.placeholder.com'] } }
- tailwind.config.js :
  extend: { colors: { green: { primary: '#1a7a4a', light: '#f0faf4' } }, fontFamily: { serif: ['Playfair Display', 'serif'], sans: ['Inter', 'sans-serif'] } }

## Règles absolues
1. 'use client' obligatoire sur tout composant avec useState, useEffect, onClick
2. Chaque fichier commence par ses imports — jamais de variable utilisée avant import
3. Zéro TODO, zéro placeholder de code, zéro "// reste du code ici"
4. Les appels API ont toujours un try/catch avec fallback sur données mockées
5. Tous les textes sont en français
6. Les icônes viennent uniquement de lucide-react
7. Zéro dépendance npm supplémentaire
8. Chaque page est un default export
9. Les couleurs #1a7a4a et #f0faf4 sont utilisées partout en inline Tailwind
10. Après chaque fichier créé, afficher : "✅ [nom-fichier] créé"

## Séquence de livraison
1. app/globals.css
2. tailwind.config.js
3. next.config.js
4. components/Navbar.tsx
5. components/Footer.tsx
6. app/layout.tsx
7. app/page.tsx
8. app/marketplace/page.tsx
9. app/comment-ca-marche/page.tsx
10. app/connexion/page.tsx
11. app/inscription/page.tsx
12. app/panier/page.tsx
13. cd /Users/ben/Documents/SHRILY/frontend && npm install && npm run dev

## Commande
Lance-toi immédiatement. Commence par globals.css.
Après chaque fichier affiche "✅ [fichier]".
À la fin lance npm run dev et montre-moi le résultat.
