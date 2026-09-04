import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEXT_PAGES, TYPOGRAPHY_DEFAULT, IMAGE_PAGES } from "./site-text";
import { LINKABLE_TABLES, MODULE_ICONS, normalizeDefinition, slugify } from "./modules";

/* ------------------------------------------------------------------ */
/* DodriAI — assistant qui pilote et développe le site via l'API       */
/* ------------------------------------------------------------------ */

export type DodriAttachment = {
  name: string;
  mime: string;
  /** data URL (images) ou texte brut (fichiers texte) */
  data: string;
};
export type DodriMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: DodriAttachment[];
};
export type DodriReply = { reply: string; actions: string[]; images?: string[] };

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const IMAGE_MODEL = "google/gemini-2.5-flash-image-preview";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_pages",
      description: "Liste les pages du site, leurs clés de texte et leurs emplacements d'images.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_page_texts",
      description: "Retourne les textes actuels (valeur + style) d'une page.",
      parameters: {
        type: "object",
        properties: { pageSlug: { type: "string" } },
        required: ["pageSlug"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_texts",
      description:
        "Met à jour un ou plusieurs textes du site. Le style est optionnel (font: display|body|mono, size ex '3rem', weight, color hex, align, transform, letterSpacing, lineHeight, offsetX, offsetY, hidden).",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pageSlug: { type: "string" },
                textKey: { type: "string" },
                value: { type: "string" },
                style: { type: "object", additionalProperties: true },
              },
              required: ["pageSlug", "textKey"],
              additionalProperties: false,
            },
          },
        },
        required: ["items"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_typography",
      description: "Change la typographie globale du site (police des titres, police du corps, échelle).",
      parameters: {
        type: "object",
        properties: {
          fontDisplay: { type: "string" },
          fontBody: { type: "string" },
          scale: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  },
  /* ---------------- Images ---------------- */
  {
    type: "function",
    function: {
      name: "generate_image",
      description:
        "Génère une image par IA (photoréaliste, cinématique, dark premium) à partir d'un prompt en anglais détaillé, l'enregistre dans la médiathèque et peut l'appliquer directement : à un emplacement d'image d'une page (pageSlug + imageKey, voir list_pages) ou à un produit (productId). Retourne l'URL.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Description détaillée en anglais" },
          pageSlug: { type: "string" },
          imageKey: { type: "string" },
          productId: { type: "string" },
          fileName: { type: "string" },
        },
        required: ["prompt"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_image",
      description:
        "Applique une URL d'image existante à un emplacement de page (pageSlug + imageKey) ou à un produit (productId).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          pageSlug: { type: "string" },
          imageKey: { type: "string" },
          productId: { type: "string" },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  /* ---------------- Produits ---------------- */
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Liste les produits (avec leur pôle/service, prix, stock, statut, image).",
      parameters: {
        type: "object",
        properties: { categorySlug: { type: "string" } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_product",
      description: "Crée (sans id) ou met à jour (avec id) un produit.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          categorySlug: { type: "string" },
          slug: { type: "string" },
          name: { type: "string" },
          tagline: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          currency: { type: "string" },
          stockQuantity: { type: "number" },
          badge: { type: "string" },
          imageUrl: { type: "string" },
          status: { type: "string", enum: ["draft", "published"] },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_product",
      description: "Supprime un produit par son id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  /* ---------------- Moteur de modules ---------------- */
  {
    type: "function",
    function: {
      name: "list_modules",
      description:
        "Liste les modules (fonctionnalités) du Back Office créés par DodriAI, avec leur définition, ainsi que les tables existantes qu'on peut brancher.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "create_module",
      description:
        "Crée une nouvelle fonctionnalité/module complet dans le Back Office (apparaît automatiquement dans le menu, avec tableau/kanban/cartes, formulaire, recherche, KPIs, actions, export). source_kind='table' pour brancher une table existante (ex: contact_messages pour un système de Messages, site_visits pour les visiteurs), 'dynamic' pour une nouvelle structure libre de données.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "identifiant url, ex: messages, tickets, leads" },
          name: { type: "string" },
          icon: { type: "string", enum: [...MODULE_ICONS] },
          color: { type: "string", description: "couleur hex, ex #8B3DFF" },
          description: { type: "string" },
          source_kind: { type: "string", enum: ["dynamic", "table"] },
          source_table: { type: "string", enum: Object.keys(LINKABLE_TABLES) },
          definition: {
            type: "object",
            description:
              "{ fields:[{key,label,type(text|textarea|richtext|number|currency|boolean|date|datetime|select|multiselect|email|phone|url|tags),required,options:[{value,label,color}],showInList,searchable,width}], statuses:[{value,label,color}], statusField, titleField, subtitleField, kpis:[{key,label,type(count|sum|avg),field,filter:{field,value},format}], actions:[{label,setStatus,href,color}], defaultSort:{field,dir}, defaultView(table|kanban|cards), allowCreate, allowDelete, emptyText }",
            additionalProperties: true,
          },
          status: { type: "string", enum: ["draft", "published"] },
        },
        required: ["slug", "name", "definition"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_module",
      description:
        "Met à jour un module existant (nom, icône, couleur, description, définition complète ou partielle, statut). La définition fournie remplace l'ancienne : renvoie toujours la définition complète.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          icon: { type: "string" },
          color: { type: "string" },
          description: { type: "string" },
          definition: { type: "object", additionalProperties: true },
          status: { type: "string", enum: ["draft", "published", "archived"] },
        },
        required: ["slug"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_module",
      description: "Supprime définitivement un module et ses enregistrements dynamiques.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_records",
      description: "Liste les enregistrements d'un module (max 50).",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" }, limit: { type: "number" } },
        required: ["slug"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_record",
      description:
        "Crée (sans id) ou met à jour (avec id) un enregistrement d'un module. `data` contient les champs définis par le module.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          id: { type: "string" },
          data: { type: "object", additionalProperties: true },
          status: { type: "string" },
        },
        required: ["slug", "data"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_record",
      description: "Supprime un enregistrement d'un module par id.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" }, id: { type: "string" } },
        required: ["slug", "id"],
        additionalProperties: false,
      },
    },
  },
  /* ---------------- Analytics ---------------- */
  {
    type: "function",
    function: {
      name: "get_visitor_stats",
      description:
        "Statistiques des visiteurs du site : en ligne maintenant, aujourd'hui, ce mois, total, par mois (12 derniers), par pays, par appareil, pages les plus vues.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_stats",
      description:
        "Compteurs globaux du Back Office : messages de contact (par statut), produits, projets, articles, modules, visiteurs.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  /* ---------------- Pages / projets générés (code) ---------------- */
  {
    type: "function",
    function: {
      name: "list_custom_pages",
      description: "Liste les pages/mini-projets créés par DodriAI (publiés sur /p/<slug>).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "upsert_custom_page",
      description:
        "Crée ou met à jour une page web complète codée par DodriAI (landing page, mini-projet, formulaire, page événement, calculateur…). Fournis du HTML (corps de page, sans <html>/<head>) et du CSS. Peut inclure du JavaScript inline. La page est publiée sur /p/<slug> avec le thème sombre DODRICOM.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          html: { type: "string" },
          css: { type: "string" },
          status: { type: "string", enum: ["draft", "published", "archived"] },
        },
        required: ["slug", "title", "html"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_custom_page",
      description: "Supprime une page créée par DodriAI.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
        additionalProperties: false,
      },
    },
  },
  /* ---------------- Raccourcis ---------------- */
  {
    type: "function",
    function: {
      name: "save_prompt_shortcut",
      description:
        "Enregistre un raccourci (titre court + prompt complet) dans le panneau Suggestions de DodriAI pour le réutiliser en un clic.",
      parameters: {
        type: "object",
        properties: { title: { type: "string" }, prompt: { type: "string" } },
        required: ["title", "prompt"],
        additionalProperties: false,
      },
    },
  },
] as const;

const SYSTEM = `Tu es DodriAI, l'assistant d'administration ET de développement du Back Office DODRICOM (agence: domotique, digital, réseaux, IA, COM, events). Tu es l'équivalent interne de Lovable : tu construis, tu développes et tu pilotes le site.

Capacités réelles (via outils) :
1. CMS : textes, styles, typographie, images de chaque page (list_pages donne les clés de textes ET les emplacements d'images).
2. Images : generate_image crée des visuels IA (prompts en anglais, style dark premium cinématique, néons violet/bleu) et les applique directement à une page ou un produit.
3. Catalogue produits : création/édition/suppression, images.
4. Moteur de modules : create_module crée une vraie fonctionnalité du Back Office (menu, tableau/kanban/cartes, formulaire, recherche, KPIs, actions, export CSV).
   - "Professionnaliser Messages" : source_kind="table", source_table="contact_messages", slug "messages", statuts new/read/replied/archived (couleurs), KPIs (nouveaux, total, répondus), actions (Répondre → href "mailto:{{email}}?subject=Re: {{subject}}", Marquer lu → setStatus "read", Archiver → setStatus "archived"). Le formulaire Contact du site public alimente automatiquement cette table.
   - Visiteurs : source_table="site_visits" pour un journal détaillé ; get_visitor_stats pour les chiffres (en ligne, par mois, total, pays).
   - Nouvelle fonctionnalité (tickets, leads, devis, planning, RH, inventaire…) : source_kind="dynamic" avec définition riche.
5. Génération de code : upsert_custom_page publie de vraies pages web codées par toi (HTML/CSS/JS) sur /p/<slug> — landing pages, formulaires, calculateurs, pages événement, mini-applications. Quand l'utilisateur demande du code à copier (composant React, SQL, script…), écris-le dans ta réponse dans un bloc \`\`\`.
6. Analytics : get_visitor_stats, get_dashboard_stats.
7. Raccourcis : save_prompt_shortcut enregistre un prompt fréquent sous un titre court.

Règles :
- Réponds toujours dans la langue de l'utilisateur (français ou arabe).
- Avant de modifier un texte ou une image, récupère les clés avec list_pages / get_page_texts pour ne jamais inventer une clé.
- Avant de modifier un module, appelle list_modules.
- Applique directement les demandes claires (pas de confirmation inutile), puis résume en quelques phrases ce que tu as changé/créé, avec les liens utiles (/admin/m/<slug>, /p/<slug>).
- Quand l'utilisateur joint une image, analyse-la (contenu, style, texte) et utilise-la pour guider ta réponse ou tes prompts d'images.
- Conçois toujours des résultats complets et professionnels, comme un développeur senior.
- Ne divulgue jamais de clés d'API ni de détails techniques d'infrastructure.
- Reste concis, professionnel et orienté action.`;

type SB = {
  from: (t: string) => any;
  rpc: (n: string, a?: unknown) => any;
  storage: any;
};

type Ctx = { supabase: SB; userId: string; apiKey: string; images: string[] };

/* ---------------- Helpers ---------------- */

async function assignImage(supabase: SB, url: string, args: Record<string, any>, actions: string[]) {
  if (args["pageSlug"] && args["imageKey"]) {
    const { error } = await supabase
      .from("content_images")
      .upsert(
        { page_slug: args["pageSlug"], image_key: args["imageKey"], url },
        { onConflict: "page_slug,image_key" },
      );
    if (error) return { error: error.message };
    actions.push(`Image appliquée : ${args["pageSlug"]}.${args["imageKey"]}`);
  }
  if (args["productId"]) {
    const { error } = await supabase.from("products").update({ image_url: url }).eq("id", args["productId"]);
    if (error) return { error: error.message };
    actions.push("Image produit mise à jour");
  }
  return null;
}

async function generateImage(ctx: Ctx, args: Record<string, any>, actions: string[]) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${ctx.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [
        {
          role: "user",
          content: `${args["prompt"]}. Ultra realistic, cinematic lighting, dark premium atmosphere, violet and blue neon accents, 8k, no text, no watermark.`,
        },
      ],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("DodriAI image error", res.status, t);
    return { error: res.status === 402 ? "Crédits IA épuisés" : "Génération d'image indisponible" };
  }
  const json: any = await res.json();
  const dataUrl: string | undefined = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!dataUrl) return { error: "Aucune image renvoyée par le modèle" };

  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return { error: "Format d'image inattendu" };
  const mime = m[1];
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const base = slugify(String(args["fileName"] ?? args["prompt"]).slice(0, 40)) || "image";
  const path = `ai/${Date.now()}-${base}.${ext}`;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const up = await supabaseAdmin.storage.from("cms").upload(path, bytes, { contentType: mime, upsert: true });
  if (up.error) return { error: up.error.message };
  const signed = await supabaseAdmin.storage.from("cms").createSignedUrl(path, 60 * 60 * 24 * 3650);
  const url = signed.data?.signedUrl;
  if (!url) return { error: signed.error?.message ?? "URL introuvable" };

  await supabaseAdmin.from("media_assets").insert({
    bucket: "cms",
    path,
    public_url: url,
    file_name: `${base}.${ext}`,
    mime_type: mime,
    size_bytes: bytes.byteLength,
    folder: "ai",
    alt_text: String(args["prompt"]).slice(0, 200),
    uploaded_by: ctx.userId,
  });

  actions.push(`Image générée : ${base}.${ext}`);
  ctx.images.push(url);
  const assignErr = await assignImage(ctx.supabase, url, args, actions);
  if (assignErr) return { url, ...assignErr };
  return { ok: true, url };
}

async function visitorStats(supabase: SB) {
  const now = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const yearAgo = new Date();
  yearAgo.setUTCMonth(yearAgo.getUTCMonth() - 11, 1);
  yearAgo.setUTCHours(0, 0, 0, 0);

  const count = async (col: string, since?: string) => {
    let q = supabase.from("site_visits").select("id", { count: "exact", head: true });
    if (since) q = q.gte(col, since);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [online, today, month, total] = await Promise.all([
    count("last_seen_at", iso(now - 5 * 60 * 1000)),
    count("created_at", dayStart.toISOString()),
    count("created_at", monthStart.toISOString()),
    count("created_at"),
  ]);

  const { data: rows } = await supabase
    .from("site_visits")
    .select("created_at, country, device, first_path, last_path, page_views")
    .gte("created_at", yearAgo.toISOString())
    .limit(5000);

  const byMonth: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byPage: Record<string, number> = {};
  let pageViews = 0;
  for (const r of rows ?? []) {
    const k = String(r.created_at).slice(0, 7);
    byMonth[k] = (byMonth[k] ?? 0) + 1;
    const c = r.country || "Inconnu";
    byCountry[c] = (byCountry[c] ?? 0) + 1;
    const d = r.device || "desktop";
    byDevice[d] = (byDevice[d] ?? 0) + 1;
    const p = r.first_path || "/";
    byPage[p] = (byPage[p] ?? 0) + 1;
    pageViews += Number(r.page_views ?? 1);
  }
  const sortTop = (o: Record<string, number>, n = 10) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, value]) => ({ key, value }));

  return {
    online,
    today,
    thisMonth: month,
    total,
    pageViewsLast12Months: pageViews,
    byMonth: Object.entries(byMonth)
      .sort()
      .map(([month, visitors]) => ({ month, visitors })),
    byCountry: sortTop(byCountry, 15),
    byDevice: sortTop(byDevice, 5),
    topPages: sortTop(byPage, 10),
  };
}

async function runTool(
  ctx: Ctx,
  name: string,
  args: Record<string, any>,
  actions: string[],
): Promise<unknown> {
  const { supabase } = ctx;
  switch (name) {
    case "list_pages":
      return TEXT_PAGES.map((p) => ({
        pageSlug: p.slug,
        name: p.name,
        keys: p.fields.map((f) => ({ key: f.key, label: f.label, default: f.def })),
        images: (IMAGE_PAGES.find((ip) => ip.slug === p.slug)?.images ?? []).map((i: any) => ({
          imageKey: i.key,
          label: i.label,
        })),
      }));

    case "get_page_texts": {
      const page = TEXT_PAGES.find((p) => p.slug === args["pageSlug"]);
      if (!page) return { error: "Page inconnue" };
      const { data } = await supabase
        .from("content_texts")
        .select("text_key, value, style")
        .eq("page_slug", page.slug);
      const rows = new Map<string, any>((data ?? []).map((r: any) => [r.text_key as string, r]));
      return page.fields.map((f) => ({
        key: f.key,
        label: f.label,
        value: rows.get(f.key)?.value ?? f.def,
        style: rows.get(f.key)?.style ?? {},
      }));
    }

    case "update_texts": {
      const items = (args["items"] ?? []) as any[];
      const payload = items.map((i) => ({
        page_slug: i.pageSlug,
        text_key: i.textKey,
        value: i.value ?? "",
        ...(i.style ? { style: i.style } : {}),
      }));
      const { error } = await supabase
        .from("content_texts")
        .upsert(payload, { onConflict: "page_slug,text_key" });
      if (error) return { error: error.message };
      for (const i of items) actions.push(`Texte mis à jour : ${i.pageSlug}.${i.textKey}`);
      return { ok: true, updated: payload.length };
    }

    case "set_typography": {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "typography")
        .maybeSingle();
      const next = { ...TYPOGRAPHY_DEFAULT, ...((data?.value as object) ?? {}) } as Record<string, unknown>;
      for (const k of ["fontDisplay", "fontBody", "scale"]) {
        if (args[k] !== undefined) next[k] = args[k];
      }
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "typography", value: next }, { onConflict: "key" });
      if (error) return { error: error.message };
      actions.push("Typographie du site mise à jour");
      return { ok: true, typography: next };
    }

    case "generate_image":
      return generateImage(ctx, args, actions);

    case "set_image": {
      const err = await assignImage(supabase, String(args["url"]), args, actions);
      return err ?? { ok: true };
    }

    case "list_products": {
      const { data: cats } = await supabase.from("service_categories").select("id, slug, name");
      const bySlug = new Map((cats ?? []).map((c: any) => [c.slug, c.id]));
      const byId = new Map((cats ?? []).map((c: any) => [c.id, c.slug]));
      let q = supabase
        .from("products")
        .select("id, category_id, slug, name, tagline, price, currency, stock_quantity, badge, status, image_url")
        .order("sort_order");
      if (args["categorySlug"]) q = q.eq("category_id", bySlug.get(args["categorySlug"]) ?? "");
      const { data, error } = await q;
      if (error) return { error: error.message };
      return (data ?? []).map((p: any) => ({ ...p, categorySlug: byId.get(p.category_id) ?? null }));
    }

    case "upsert_product": {
      let categoryId: string | null = null;
      if (args["categorySlug"]) {
        const { data: cat } = await supabase
          .from("service_categories")
          .select("id")
          .eq("slug", args["categorySlug"])
          .maybeSingle();
        categoryId = cat?.id ?? null;
      }
      const row: Record<string, unknown> = {};
      if (args["id"]) row["id"] = args["id"];
      if (categoryId) row["category_id"] = categoryId;
      if (args["name"]) row["name"] = args["name"];
      row["slug"] = args["slug"] ?? (args["name"] ? slugify(String(args["name"])) : undefined);
      if (!row["slug"]) delete row["slug"];
      for (const [k, col] of [
        ["tagline", "tagline"],
        ["description", "description"],
        ["price", "price"],
        ["currency", "currency"],
        ["stockQuantity", "stock_quantity"],
        ["badge", "badge"],
        ["imageUrl", "image_url"],
        ["status", "status"],
      ] as const) {
        if (args[k] !== undefined) row[col] = args[k];
      }
      const { data, error } = await supabase
        .from("products")
        .upsert(row, { onConflict: "id" })
        .select("id, name")
        .maybeSingle();
      if (error) return { error: error.message };
      actions.push(`Produit enregistré : ${data?.name ?? row["name"] ?? ""}`);
      return { ok: true, product: data };
    }

    case "delete_product": {
      const { error } = await supabase.from("products").delete().eq("id", args["id"]);
      if (error) return { error: error.message };
      actions.push("Produit supprimé");
      return { ok: true };
    }

    /* ---------------- Modules ---------------- */
    case "list_modules": {
      const { data, error } = await supabase
        .from("app_modules")
        .select("id, slug, name, icon, color, description, source_kind, source_table, definition, status, sort_order")
        .order("sort_order");
      if (error) return { error: error.message };
      return {
        modules: data ?? [],
        linkableTables: Object.entries(LINKABLE_TABLES).map(([k, v]) => ({
          table: k,
          label: v.label,
          columns: v.columns,
        })),
      };
    }

    case "create_module": {
      const slug = slugify(String(args["slug"] || args["name"] || ""));
      if (!slug) return { error: "slug requis" };
      const kind = args["source_kind"] === "table" ? "table" : "dynamic";
      const table = kind === "table" ? args["source_table"] : null;
      if (kind === "table" && !LINKABLE_TABLES[table]) return { error: "Table non autorisée" };
      const { data: maxRow } = await supabase
        .from("app_modules")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data, error } = await supabase
        .from("app_modules")
        .insert({
          slug,
          name: args["name"],
          icon: MODULE_ICONS.includes(args["icon"]) ? args["icon"] : "Boxes",
          color: args["color"] ?? "#8B3DFF",
          description: args["description"] ?? null,
          source_kind: kind,
          source_table: table,
          definition: normalizeDefinition(args["definition"]),
          status: args["status"] ?? "published",
          sort_order: (maxRow?.sort_order ?? 0) + 1,
        })
        .select("id, slug, name")
        .maybeSingle();
      if (error) {
        if (String(error.message).includes("duplicate")) {
          return { error: `Le module "${slug}" existe déjà : utilise update_module.` };
        }
        return { error: error.message };
      }
      actions.push(`Module créé : ${data?.name ?? args["name"]} → /admin/m/${slug}`);
      return { ok: true, module: data, url: `/admin/m/${slug}` };
    }

    case "update_module": {
      const patch: Record<string, unknown> = {};
      for (const k of ["name", "icon", "color", "description", "status"]) {
        if (args[k] !== undefined) patch[k] = args[k];
      }
      if (args["definition"]) patch["definition"] = normalizeDefinition(args["definition"]);
      const { data, error } = await supabase
        .from("app_modules")
        .update(patch)
        .eq("slug", args["slug"])
        .select("id, slug, name")
        .maybeSingle();
      if (error) return { error: error.message };
      if (!data) return { error: "Module introuvable" };
      actions.push(`Module mis à jour : ${data.name}`);
      return { ok: true, module: data };
    }

    case "delete_module": {
      const { error } = await supabase.from("app_modules").delete().eq("slug", args["slug"]);
      if (error) return { error: error.message };
      actions.push(`Module supprimé : ${args["slug"]}`);
      return { ok: true };
    }

    case "list_records":
    case "upsert_record":
    case "delete_record": {
      const { data: mod } = await supabase
        .from("app_modules")
        .select("id, slug, source_kind, source_table")
        .eq("slug", args["slug"])
        .maybeSingle();
      if (!mod) return { error: "Module introuvable" };
      const limit = Math.min(Number(args["limit"] ?? 50), 50);

      if (mod.source_kind === "table") {
        const t = mod.source_table as string;
        if (!LINKABLE_TABLES[t]) return { error: "Table non autorisée" };
        if (name === "list_records") {
          const { data, error } = await supabase
            .from(t)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);
          return error ? { error: error.message } : data;
        }
        if (name === "delete_record") {
          const { error } = await supabase.from(t).delete().eq("id", args["id"]);
          if (error) return { error: error.message };
          actions.push("Enregistrement supprimé");
          return { ok: true };
        }
        const row = { ...(args["data"] ?? {}) } as Record<string, unknown>;
        if (args["status"]) row["status"] = args["status"];
        if (args["id"]) row["id"] = args["id"];
        const { data, error } = await supabase.from(t).upsert(row).select("id").maybeSingle();
        if (error) return { error: error.message };
        actions.push("Enregistrement enregistré");
        return { ok: true, record: data };
      }

      if (name === "list_records") {
        const { data, error } = await supabase
          .from("app_records")
          .select("id, data, status, created_at")
          .eq("module_id", mod.id)
          .order("created_at", { ascending: false })
          .limit(limit);
        return error ? { error: error.message } : data;
      }
      if (name === "delete_record") {
        const { error } = await supabase.from("app_records").delete().eq("id", args["id"]);
        if (error) return { error: error.message };
        actions.push("Enregistrement supprimé");
        return { ok: true };
      }
      const row: Record<string, unknown> = {
        module_id: mod.id,
        data: args["data"] ?? {},
        status: args["status"] ?? (args["data"]?.status ?? null),
      };
      if (args["id"]) row["id"] = args["id"];
      const { data, error } = await supabase
        .from("app_records")
        .upsert(row, { onConflict: "id" })
        .select("id")
        .maybeSingle();
      if (error) return { error: error.message };
      actions.push("Enregistrement enregistré");
      return { ok: true, record: data };
    }

    /* ---------------- Analytics ---------------- */
    case "get_visitor_stats":
      return visitorStats(supabase);

    case "get_dashboard_stats": {
      const c = async (t: string, filter?: [string, string]) => {
        let q = supabase.from(t).select("id", { count: "exact", head: true });
        if (filter) q = q.eq(filter[0], filter[1]);
        const { count } = await q;
        return count ?? 0;
      };
      const [msgNew, msgRead, msgReplied, msgArchived, products, projects, posts, modules] =
        await Promise.all([
          c("contact_messages", ["status", "new"]),
          c("contact_messages", ["status", "read"]),
          c("contact_messages", ["status", "replied"]),
          c("contact_messages", ["status", "archived"]),
          c("products"),
          c("projects"),
          c("blog_posts"),
          c("app_modules"),
        ]);
      const visitors = await visitorStats(supabase);
      return {
        messages: { new: msgNew, read: msgRead, replied: msgReplied, archived: msgArchived },
        products,
        projects,
        blogPosts: posts,
        modules,
        visitors: { online: visitors.online, thisMonth: visitors.thisMonth, total: visitors.total },
      };
    }

    /* ---------------- Pages générées ---------------- */
    case "list_custom_pages": {
      const { data, error } = await supabase
        .from("custom_pages")
        .select("slug, title, description, status, updated_at")
        .order("updated_at", { ascending: false });
      return error ? { error: error.message } : (data ?? []).map((p: any) => ({ ...p, url: `/p/${p.slug}` }));
    }

    case "upsert_custom_page": {
      const slug = slugify(String(args["slug"] || args["title"]));
      if (!slug) return { error: "slug requis" };
      const { error } = await supabase.from("custom_pages").upsert(
        {
          slug,
          title: args["title"],
          description: args["description"] ?? null,
          content_html: String(args["html"] ?? ""),
          content_css: String(args["css"] ?? ""),
          status: args["status"] ?? "published",
          created_by: ctx.userId,
        },
        { onConflict: "slug" },
      );
      if (error) return { error: error.message };
      actions.push(`Page publiée : ${args["title"]} → /p/${slug}`);
      return { ok: true, url: `/p/${slug}` };
    }

    case "delete_custom_page": {
      const { error } = await supabase.from("custom_pages").delete().eq("slug", args["slug"]);
      if (error) return { error: error.message };
      actions.push(`Page supprimée : ${args["slug"]}`);
      return { ok: true };
    }

    case "save_prompt_shortcut": {
      const { error } = await supabase
        .from("dodriai_prompts")
        .insert({ title: args["title"], prompt: args["prompt"], created_by: ctx.userId });
      if (error) return { error: error.message };
      actions.push(`Raccourci enregistré : ${args["title"]}`);
      return { ok: true };
    }

    default:
      return { error: "Outil inconnu" };
  }
}

/* ---------------- Conversion des messages (pièces jointes) ---------------- */

function toModelMessage(m: DodriMessage) {
  if (m.role !== "user" || !m.attachments?.length) return { role: m.role, content: m.content };
  const parts: any[] = [];
  let text = m.content;
  for (const a of m.attachments) {
    if (a.mime.startsWith("image/") && a.data.startsWith("data:")) {
      parts.push({ type: "image_url", image_url: { url: a.data } });
    } else {
      text += `\n\n--- Pièce jointe: ${a.name} (${a.mime}) ---\n${a.data.slice(0, 20000)}\n--- fin ---`;
    }
  }
  parts.unshift({ type: "text", text });
  return { role: "user", content: parts };
}

async function requireAdmin(supabase: SB, userId: string) {
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
  ]);
  return Boolean(isAdmin || isSuper);
}

/* ---------------- Server functions ---------------- */

export const dodriAiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: DodriMessage[] }) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("messages requis");
    // Les pièces jointes ne sont conservées que sur le dernier message utilisateur (poids)
    const msgs = input.messages.slice(-20);
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === "user");
    const keepIdx = lastUserIdx === -1 ? -1 : msgs.length - 1 - lastUserIdx;
    return {
      messages: msgs.map((m, i) => ({
        role: m.role,
        content: String(m.content ?? ""),
        attachments: i === keepIdx ? (m.attachments ?? []).slice(0, 4) : undefined,
      })),
    };
  })
  .handler(async ({ data, context }): Promise<DodriReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { reply: "DodriAI n'est pas configuré (clé API manquante).", actions: [] };

    const supabase = context.supabase as unknown as SB;
    if (!(await requireAdmin(supabase, context.userId))) {
      return { reply: "Accès refusé : DodriAI est réservé aux administrateurs.", actions: [] };
    }

    const messages: any[] = [{ role: "system", content: SYSTEM }, ...data.messages.map(toModelMessage)];
    const actions: string[] = [];
    const ctx: Ctx = { supabase, userId: context.userId, apiKey, images: [] };

    for (let step = 0; step < 10; step++) {
      const res = await fetch(GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, tool_choice: "auto" }),
      });

      if (res.status === 429)
        return { reply: "Limite de requêtes atteinte. Réessayez dans quelques instants.", actions };
      if (res.status === 402)
        return { reply: "Crédits IA épuisés. Rechargez l'espace de travail pour continuer.", actions };
      if (!res.ok) {
        const t = await res.text();
        console.error("DodriAI gateway error", res.status, t);
        return { reply: "DodriAI est momentanément indisponible.", actions };
      }

      const json: any = await res.json();
      const msg = json.choices?.[0]?.message;
      if (!msg) return { reply: "Réponse vide du modèle.", actions };
      messages.push(msg);

      const calls = msg.tool_calls ?? [];
      if (!calls.length) {
        return { reply: msg.content ?? "", actions, images: ctx.images };
      }

      for (const call of calls) {
        let parsed: Record<string, any> = {};
        try {
          parsed = JSON.parse(call.function?.arguments || "{}");
        } catch {
          parsed = {};
        }
        let result: unknown;
        try {
          result = await runTool(ctx, call.function?.name, parsed, actions);
        } catch (e) {
          result = { error: e instanceof Error ? e.message : String(e) };
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result).slice(0, 12000),
        });
      }
    }

    return { reply: "Traitement interrompu (trop d'étapes).", actions, images: ctx.images };
  });

/* ---------------- Raccourcis de prompts ---------------- */

export type DodriPrompt = { id: string; title: string; prompt: string; sort_order: number };

export const listDodriPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DodriPrompt[]> => {
    const { data } = await (context.supabase as unknown as SB)
      .from("dodriai_prompts")
      .select("id, title, prompt, sort_order")
      .order("sort_order")
      .order("created_at");
    return (data ?? []) as DodriPrompt[];
  });

export const saveDodriPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; title: string; prompt: string }) => {
    if (!input?.title?.trim() || !input?.prompt?.trim()) throw new Error("Titre et prompt requis");
    return { id: input.id, title: input.title.trim().slice(0, 80), prompt: input.prompt.trim() };
  })
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as unknown as SB;
    const row: Record<string, unknown> = { title: data.title, prompt: data.prompt, created_by: context.userId };
    if (data.id) row["id"] = data.id;
    const { error } = await supabase.from("dodriai_prompts").upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDodriPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id requis");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as unknown as SB)
      .from("dodriai_prompts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
