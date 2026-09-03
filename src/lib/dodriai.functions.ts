import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEXT_PAGES, TYPOGRAPHY_DEFAULT } from "./site-text";
import { LINKABLE_TABLES, MODULE_ICONS, normalizeDefinition, slugify } from "./modules";

/* ------------------------------------------------------------------ */
/* DodriAI — assistant qui pilote le site (CMS + produits) via l'API   */
/* ------------------------------------------------------------------ */

export type DodriMessage = { role: "user" | "assistant"; content: string };
export type DodriReply = { reply: string; actions: string[] };

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_pages",
      description: "Liste les pages du site et les clés de texte disponibles pour chacune.",
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
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Liste les produits (avec leur pôle/service, prix, stock, statut).",
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
  /* ---------------- Moteur de modules (création de fonctionnalités) ---------------- */
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
        "Crée une nouvelle fonctionnalité/module complet dans le Back Office (apparaît automatiquement dans le menu, avec tableau/kanban/cartes, formulaire, recherche, KPIs, actions, export). source_kind='table' pour brancher une table existante (ex: contact_messages pour un système de Messages), 'dynamic' pour une nouvelle structure libre de données.",
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
] as const;

const SYSTEM = `Tu es DodriAI, l'assistant d'administration et de développement du Back Office DODRICOM (agence: domotique, digital, réseaux, IA, COM, events).
Tu pilotes réellement le site via des outils: textes du site (CMS), styles, typographie, catalogue produits, ET tu peux CRÉER DE NOUVELLES FONCTIONNALITÉS grâce au moteur de modules.

Moteur de modules :
- create_module crée une vraie fonctionnalité dans le Back Office : elle apparaît dans le menu latéral, avec vue tableau / kanban / cartes, formulaire de saisie, recherche, filtres par statut, KPIs, actions rapides et export CSV.
- Pour "professionnaliser Messages" (ou tout système lié à des données existantes) : utilise source_kind="table" + source_table="contact_messages" avec slug "messages", des statuts (new/read/replied/archived avec couleurs), des KPIs (nouveaux, total, répondus), des actions (Répondre → href "mailto:{{email}}?subject=Re: {{subject}}", Marquer lu → setStatus "read", Archiver → setStatus "archived"), defaultView "kanban" ou "table".
- Pour une nouvelle fonctionnalité (tickets, leads, devis, planning, RH, inventaire…) : source_kind="dynamic" avec une définition riche et réfléchie (champs pertinents, statuts, KPIs, actions).
- Conçois toujours des modules complets et professionnels, comme le ferait un développeur senior. Publie-les (status "published") sauf demande contraire.
- Après création, indique le lien : /admin/m/<slug>.

Règles:
- Réponds toujours dans la langue de l'utilisateur (français ou arabe).
- Avant de modifier un texte, récupère les clés avec list_pages / get_page_texts pour ne jamais inventer une clé.
- Avant de modifier un module, appelle list_modules pour connaître sa définition actuelle.
- Applique directement les demandes claires (pas de confirmation inutile), puis résume en quelques phrases ce que tu as changé/créé.
- Ne divulgue jamais de clés d'API ni de détails techniques d'infrastructure.
- Reste concis, professionnel et orienté action.`;

type SB = { from: (t: string) => any; rpc: (n: string, a?: unknown) => any };

async function runTool(
  supabase: SB,
  name: string,
  args: Record<string, any>,
  actions: string[],
): Promise<unknown> {
  switch (name) {
    case "list_pages":
      return TEXT_PAGES.map((p) => ({
        pageSlug: p.slug,
        name: p.name,
        keys: p.fields.map((f) => ({ key: f.key, label: f.label, default: f.def })),
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

    case "list_products": {
      const { data: cats } = await supabase.from("service_categories").select("id, slug, name");
      const bySlug = new Map((cats ?? []).map((c: any) => [c.slug, c.id]));
      const byId = new Map((cats ?? []).map((c: any) => [c.id, c.slug]));
      let q = supabase
        .from("products")
        .select("id, category_id, slug, name, tagline, price, currency, stock_quantity, badge, status")
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
      row["slug"] =
        args["slug"] ??
        (args["name"]
          ? String(args["name"])
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : undefined);
      if (!row["slug"]) delete row["slug"];
      for (const [k, col] of [
        ["tagline", "tagline"],
        ["description", "description"],
        ["price", "price"],
        ["currency", "currency"],
        ["stockQuantity", "stock_quantity"],
        ["badge", "badge"],
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
      if (error) return { error: error.message };
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

    default:
      return { error: "Outil inconnu" };
  }
}

export const dodriAiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: DodriMessage[] }) => {
    if (!input || !Array.isArray(input.messages)) throw new Error("messages requis");
    return { messages: input.messages.slice(-20) };
  })
  .handler(async ({ data, context }): Promise<DodriReply> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { reply: "DodriAI n'est pas configuré (clé API manquante).", actions: [] };

    const supabase = context.supabase as unknown as SB;

    // Autorisation : réservé aux administrateurs
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isSuper } = await supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isAdmin && !isSuper) {
      return { reply: "Accès refusé : DodriAI est réservé aux administrateurs.", actions: [] };
    }

    const messages: any[] = [
      { role: "system", content: SYSTEM },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const actions: string[] = [];

    for (let step = 0; step < 8; step++) {
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
        return { reply: msg.content ?? "", actions };
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
          result = await runTool(supabase, call.function?.name, parsed, actions);
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

    return { reply: "Traitement interrompu (trop d'étapes).", actions };
  });
