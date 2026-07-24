## Objectif

Refaire les 9 pages du site DODRICOM pour qu'elles correspondent exactement aux maquettes fournies (fond sombre #05060A, glow violet/bleu, glassmorphism, layouts identiques image par image).

## Livraison — dans l'ordre des images

**Batch 1 — Fondations & Accueil (image 1)**
- Simplifier la navbar (retirer SaaS du menu principal, conserver Accueil/À propos/Nos services/Réalisations/Blog/Contact + Demander un devis).
- Remplacer le Hero cinématique par un Hero statique : grande photo bâtiment DODRICOM en fond, titre "L'INNOVATION AU SERVICE DE / VOTRE PERFORMANCE", sous-titre, boutons "Découvrir nos services" + "Voir notre vidéo", stats 120+/250+/5+/24/7 avec icônes, indicateur "SCROLL POUR DÉCOUVRIR", rail flottant droit (téléphone / email / adresse).
- Générer l'image bâtiment DODRICOM en 8K.

**Batch 2 — À propos (image 2)**
- Fond image intérieur réception, titre "Présentation Commerciale" (gradient sur "Commerciale").
- 4 puces (solutions sur mesure, qualité, accompagnement, équipe experts).
- 3 cartes glass en bas : Notre mission / Notre vision — DODRICOM en chiffres (4 stats) — Nos valeurs (Innovation/Fiabilité/Engagement/Performance).

**Batch 3 — Services (images 3–8, une page par catégorie)**
- Créer un layout partagé `ServiceCategoryPage` avec :
  - Fond image contextuel + titre catégorie (DOMOTIQUE / DIGITAL / etc.).
  - Barre d'onglets glass au centre : 6 catégories (icône + label), onglet actif souligné violet.
  - Section "LES PRODUITS" : carrousel 6 cartes (photo, nom, description, prix DH), flèches ← →, indicateur "6/6".
  - Section "NOS PACKS" : 3 cartes packs (dont un badge POPULAIRE) + colonne bénéfices (5 points).
- Créer 6 routes : `/services/domotique`, `/services/digital`, `/services/reseaux`, `/services/ia`, `/services/communication`, `/services/events` avec le contenu exact des maquettes (produits + packs + prix).
- Remplacer la page `/services` actuelle par une redirection vers `/services/domotique` (ou un index avec les 6 tuiles).

**Batch 4 — Réalisations (image 9)**
- Hero réduit avec fond bureau néon "DODRICOM RÉALISATIONS".
- Barre de filtres (Tous / Domotique / Digital / Réseaux / IA / Communication / Evénements).
- Grille 4 colonnes de cartes projet (badge catégorie violet, image, titre, description, "Voir le projet →").
- Bannière CTA "Vous avez un projet ?" en bas.

**Batch 5 — Cohérence finale**
- Vérifier Blog, Contact, SaaS pour qu'ils partagent le même look (fond dark, glass, gradient violet/bleu, indicateur scroll).
- Conserver le bouton Connexion + Back Office existants.

## Détails techniques

- Tokens CSS existants (`--gradient-primary`, `--gradient-brand`, `glass`, `btn-gradient`) conservés.
- Images : `imagegen premium.gemini` en 1920×1080 pour chaque hero (bâtiment, réception, salon domotique, bureau digital, datacenter, labo IA, studio créa, scène event, bureau réalisations).
- Icônes : `lucide-react` (Home, Monitor, Network, BrainCircuit, MessageSquare, CalendarDays…).
- Animations : `framer-motion` déjà installé (fade/slide/scale léger sur l'apparition), pas de scroll cinématique.
- Routing TanStack : nouveau layout `src/routes/services.tsx` (Outlet + tabs) + 6 leaves `services.domotique.tsx` etc. avec `head()` unique.
- Données produits/packs typées dans `src/lib/services-data.ts`.

## Ce qui est hors scope

- Aucun changement au module Back Office `/admin`.
- Pas de refonte du système d'auth ni du LoginModal.
- Le scroll cinématique actuel est remplacé (l'image montre un hero statique) — je supprime `CinematicHero`.

Je livre batch par batch et vous montre le rendu entre chaque, pour ajuster avant de passer au suivant.