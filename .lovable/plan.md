## Objectif

Transformer DODRICOM en CMS complet : chaque contenu visible sur le site (pages, services, produits, packs, projets, blog, témoignages, partenaires, contact, SEO, médias) est stocké dans la base Lovable Cloud et éditable depuis le Back Office par le rôle approprié. Zéro contenu en dur.

Photos produits : je génère un premier lot IA (remplaçables via l'uploader du CMS ensuite).

## Architecture

```text
Front (routes publiques)  ──►  server functions (createServerFn) ──►  Postgres (Lovable Cloud)
                                                                         ▲
Back Office /admin       ──►  server functions (auth + RBAC)  ──────────┘
                                                          + Storage (buckets: products, projects, media, hero)
```

- Auth : Lovable Cloud (email/password + Google). Table `user_roles` (super_admin / admin / commercial / editor) + `has_role()` security-definer.
- Storage : buckets publics `media` (générique), `products`, `projects`, `hero`. Uploader dans le CMS.
- RLS : lecture publique sur les tables de contenu quand `visible=true` ; écritures réservées aux rôles autorisés.
- SEO : chaque route charge son `head()` depuis la DB (title/desc/OG).

## Livraison en 4 batchs (validation entre chaque)

### Batch A — Fondations Cloud + Auth

1. Activer Lovable Cloud.
2. Remplacer `AUTH_CREDENTIALS` en dur par Supabase Auth (email/password + Google). Migrer le `LoginModal` → email/password. Garder l'identité "DRISS" via un compte seed (`driss@dodricom.com` / mot de passe fourni au 1er login).
3. Migrations : `app_role` enum, `user_roles`, `has_role()`, `profiles` (nom, avatar, rôle).
4. Middleware `requireSupabaseAuth` + `requireRole('super_admin'|'admin'|…)` sur les server fns.
5. Storage buckets : `media`, `products`, `projects`, `hero` (public read).

### Batch B — Schéma contenu + seed

Tables (toutes avec `visible`, `sort_order`, `created_at`, `updated_at`, RLS lecture publique si `visible=true`, écritures par rôle) :

- `site_settings` (singleton : coordonnées, réseaux, horaires, Google Maps URL, WhatsApp).
- `pages` (home, about — blocs JSONB : hero, sections, stats, valeurs, mission, vision).
- `services` (nom, slug, description, cover, background, icon, couleur, SEO).
- `product_categories` (rattachées à un service).
- `products` (name, slug, short/long desc, images JSONB, category_id, brand, price, sale_price, stock, spec_sheet_pdf, featured, SEO).
- `packages` (name, image, price, old_price, advantages JSONB, included_products, service_id).
- `projects` (title, description, client, category, images, gallery, video, date, techs, SEO).
- `blog_posts` (title, slug, cover, excerpt, content markdown, categories, tags, published_at, author_id, SEO).
- `testimonials`, `partners`.
- `contact_messages`, `quote_requests` (créés depuis le front, lus depuis le Back).
- `media_assets` (index de Storage : url, folder, alt, size, mime).
- `activity_log` (audit : user_id, action, table, record_id, before/after JSONB).

Seed : reprendre le contenu actuel des pages (services, packs, produits, réalisations, blog, témoignages) pour ne pas casser le front.

Server fns publiques (SSR-safe, publishable key) : `getPage(slug)`, `listServices`, `getService(slug)`, `listProductsByService`, `getProduct(slug)`, `listPackages`, `listProjects`, `listBlogPosts`, `getBlogPost(slug)`, `listTestimonials`, `listPartners`, `getSiteSettings`.

### Batch C — Front Office branché DB

- Réécrire `routes/index.tsx`, `a-propos.tsx`, `services.*.tsx`, `realisations.tsx`, `blog.tsx`, `contact.tsx`, `saas.tsx` pour charger via `ensureQueryData` → server fn publique. Aucun tableau en dur.
- Cartes produits redesignées façon "Apple Store" : grande image DB, nom, description, prix, catégorie, boutons "En savoir plus" + "Demander un devis". Hover : scale 1.05, glow, élévation.
- Nouvelle route `/services/$service/products/$product` pour la page produit détaillée (galerie, spécifications, PDF, produits liés, bouton devis).
- Formulaire contact & devis → insert dans `contact_messages` / `quote_requests` + notification admin.
- `head()` par route lit `page.seo` depuis DB (fallback si vide).

### Batch D — Back Office CMS complet

Sidebar existante enrichie avec section **Website CMS** :

- Dashboard CMS (compteurs contenu, dernières modifs, activity log).
- Pages (éditeur blocs : Home, About — champs typés).
- Services (CRUD, réordonnancement drag).
- Catégories produits (CRUD).
- Produits (CRUD complet : upload image principale + galerie via Storage, PDF, prix, stock, visibilité, duplicate, réordonnancement, filtres par service).
- Packs (CRUD).
- Projets (CRUD + galerie).
- Blog (CRUD, éditeur markdown, planification `published_at`).
- Témoignages, Partenaires (CRUD).
- Contact (édition `site_settings` : téléphone, mail, adresse, Maps, WhatsApp, horaires, réseaux).
- SEO (par route : title, description, keywords, OG image, canonical).
- Médiathèque (parcours des buckets, upload, dossiers, alt, suppression).
- Settings (utilisateurs, rôles — super_admin uniquement).
- Recherche globale (produits, projets, articles, messages).
- Activity log (feed + filtres).
- Notifications (nouveau devis / message).

RBAC appliqué : `commercial` gère Produits/Packs/Projets/Blog/Médias/Prix/Services (pas Settings/Users). `editor` : textes uniquement. `admin` : tout sauf Settings système. `super_admin` : tout.

## Détails techniques

- Server fns dans `src/lib/*.functions.ts` (client-safe), helpers admin dans `*.server.ts` (jamais importés depuis un route/component).
- `requireSupabaseAuth` + wrapper `requireRole()` qui utilise `has_role()`.
- Storage : upload direct depuis le CMS (client browser + publishable key + RLS storage policies par rôle).
- Génération images produits Batch C : premium.gemini par catégorie (cameras, serrures, switches, etc.), remplacées via CMS ensuite.
- Cache : TanStack Query côté client, `router.invalidate()` après mutation.
- Migrations SQL séparées par domaine (auth, content, storage-policies), grants explicites (`authenticated`, `service_role`, `anon` sur les lectures publiques).

## Hors scope

- Recherche full-text (Postgres FTS pourra venir en polish).
- Versioning de contenu / brouillons multiples (juste `visible=true/false`).
- Migration vers Laravel/MySQL : on reste sur Lovable Cloud (Postgres) — équivalent fonctionnel demandé.
- Multi-langue (FR uniquement pour ce cycle).
- Refonte du CinematicHero (reporté au chantier "Hero" qu'on fera après).

## Ordre de livraison

Batch A → validation login/rôles → Batch B (schéma + seed) → validation données visibles en DB → Batch C (front branché + nouvelles cartes produits) → validation visuelle → Batch D (CMS complet éditeur). Vous validez entre chaque batch avant que je passe au suivant.
