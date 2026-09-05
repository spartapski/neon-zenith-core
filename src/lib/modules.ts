/* ------------------------------------------------------------------ */
/* Moteur de modules dynamiques — types partagés (client + serveur)   */
/* ------------------------------------------------------------------ */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "currency"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "email"
  | "phone"
  | "url"
  | "tags";

export type ModuleField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string; color?: string }[];
  /** Affiché dans le tableau (défaut : les 4 premiers champs). */
  showInList?: boolean;
  /** Utilisé par la recherche plein texte. */
  searchable?: boolean;
  /** Lecture seule dans le formulaire. */
  readOnly?: boolean;
  default?: unknown;
  width?: "full" | "half";
};

export type ModuleStatus = { value: string; label: string; color?: string };

export type ModuleKpi = {
  key: string;
  label: string;
  type: "count" | "sum" | "avg";
  field?: string;
  /** Filtre simple : { field: "status", value: "new" } */
  filter?: { field: string; value: unknown };
  format?: "number" | "currency" | "percent";
};

export type ModuleAction = {
  label: string;
  /** Change le statut de l'enregistrement. */
  setStatus?: string;
  /** Ouvre un lien externe (mailto:, tel:, https://) — {{field}} est interpolé. */
  href?: string;
  color?: string;
};

export type ModuleDefinition = {
  fields: ModuleField[];
  statuses?: ModuleStatus[];
  /** Colonne/clé contenant le statut (défaut "status"). */
  statusField?: string;
  titleField?: string;
  subtitleField?: string;
  kpis?: ModuleKpi[];
  actions?: ModuleAction[];
  defaultSort?: { field: string; dir: "asc" | "desc" };
  emptyText?: string;
  /** Autoriser la création manuelle (défaut true). */
  allowCreate?: boolean;
  allowDelete?: boolean;
  /** Vue par défaut : table | kanban | cards */
  defaultView?: "table" | "kanban" | "cards";
};

export type AppModule = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  source_kind: "dynamic" | "table";
  source_table: string | null;
  definition: ModuleDefinition;
  status: "draft" | "published" | "archived";
  sort_order: number;
};

/** Tables existantes que DodriAI peut brancher à un module (source_kind = "table"). */
export const LINKABLE_TABLES: Record<
  string,
  { label: string; columns: { key: string; type: FieldType; label: string; options?: string[] }[] }
> = {
  contact_messages: {
    label: "Messages de contact",
    columns: [
      { key: "full_name", type: "text", label: "Nom complet" },
      { key: "email", type: "email", label: "Email" },
      { key: "phone", type: "phone", label: "Téléphone" },
      { key: "company", type: "text", label: "Société" },
      { key: "subject", type: "text", label: "Sujet" },
      { key: "message", type: "textarea", label: "Message" },
      { key: "service_interest", type: "text", label: "Service concerné" },
      {
        key: "status",
        type: "select",
        label: "Statut",
        options: ["new", "read", "replied", "archived"],
      },
    ],
  },
  testimonials: {
    label: "Témoignages",
    columns: [
      { key: "author_name", type: "text", label: "Auteur" },
      { key: "author_role", type: "text", label: "Fonction" },
      { key: "company", type: "text", label: "Société" },
      { key: "quote", type: "textarea", label: "Citation" },
      { key: "rating", type: "number", label: "Note" },
      { key: "status", type: "select", label: "Statut", options: ["draft", "published", "archived"] },
      { key: "sort_order", type: "number", label: "Ordre" },
    ],
  },
  partners: {
    label: "Partenaires",
    columns: [
      { key: "name", type: "text", label: "Nom" },
      { key: "logo_url", type: "url", label: "Logo" },
      { key: "website_url", type: "url", label: "Site web" },
      { key: "status", type: "select", label: "Statut", options: ["draft", "published", "archived"] },
      { key: "sort_order", type: "number", label: "Ordre" },
    ],
  },
  blog_posts: {
    label: "Articles de blog",
    columns: [
      { key: "title", type: "text", label: "Titre" },
      { key: "slug", type: "text", label: "Slug" },
      { key: "excerpt", type: "textarea", label: "Extrait" },
      { key: "content", type: "richtext", label: "Contenu" },
      { key: "category", type: "text", label: "Catégorie" },
      { key: "author_name", type: "text", label: "Auteur" },
      { key: "read_minutes", type: "number", label: "Lecture (min)" },
      { key: "published_at", type: "datetime", label: "Publié le" },
      { key: "status", type: "select", label: "Statut", options: ["draft", "published", "archived"] },
    ],
  },
  projects: {
    label: "Réalisations",
    columns: [
      { key: "title", type: "text", label: "Titre" },
      { key: "slug", type: "text", label: "Slug" },
      { key: "client", type: "text", label: "Client" },
      { key: "summary", type: "textarea", label: "Résumé" },
      { key: "year", type: "number", label: "Année" },
      { key: "location", type: "text", label: "Lieu" },
      { key: "is_featured", type: "boolean", label: "Mis en avant" },
      { key: "status", type: "select", label: "Statut", options: ["draft", "published", "archived"] },
    ],
  },
  packages: {
    label: "Packs / Offres",
    columns: [
      { key: "name", type: "text", label: "Nom" },
      { key: "slug", type: "text", label: "Slug" },
      { key: "description", type: "textarea", label: "Description" },
      { key: "price", type: "currency", label: "Prix" },
      { key: "currency", type: "text", label: "Devise" },
      { key: "billing_period", type: "text", label: "Période" },
      { key: "is_popular", type: "boolean", label: "Populaire" },
      { key: "status", type: "select", label: "Statut", options: ["draft", "published", "archived"] },
    ],
  },
  site_visits: {
    label: "Visiteurs du site",
    columns: [
      { key: "session_id", type: "text", label: "Session" },
      { key: "first_path", type: "text", label: "Page d'entrée" },
      { key: "last_path", type: "text", label: "Dernière page" },
      { key: "referrer", type: "url", label: "Provenance" },
      { key: "country", type: "text", label: "Pays" },
      { key: "city", type: "text", label: "Ville" },
      { key: "device", type: "select", label: "Appareil", options: ["desktop", "mobile", "tablet"] },
      { key: "page_views", type: "number", label: "Pages vues" },
      { key: "last_seen_at", type: "datetime", label: "Dernière activité" },
    ],
  },
  profiles: {
    label: "Utilisateurs",
    columns: [
      { key: "email", type: "email", label: "Email" },
      { key: "display_name", type: "text", label: "Nom affiché" },
    ],
  },
};

export const MODULE_ICONS = [
  "Boxes",
  "MessageSquare",
  "Inbox",
  "Users",
  "Briefcase",
  "Calendar",
  "ClipboardList",
  "FileText",
  "Wallet",
  "Receipt",
  "Ticket",
  "Truck",
  "Package",
  "Handshake",
  "Star",
  "Bell",
  "Megaphone",
  "Building2",
  "Wrench",
  "KanbanSquare",
  "BarChart3",
  "ShieldCheck",
  "Mail",
  "Phone",
  "Newspaper",
  "Image",
] as const;

export function normalizeDefinition(d: unknown): ModuleDefinition {
  const def = (d && typeof d === "object" ? d : {}) as Partial<ModuleDefinition>;
  const fields = Array.isArray(def.fields) ? def.fields : [];
  return {
    ...def,
    fields: fields
      .filter((f) => f && typeof f.key === "string")
      .map((f) => ({
        ...f,
        label: f.label ?? f.key,
        type: (f.type ?? "text") as FieldType,
      })),
    statusField: def.statusField ?? "status",
    allowCreate: def.allowCreate ?? true,
    allowDelete: def.allowDelete ?? true,
    defaultView: def.defaultView ?? "table",
  };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
