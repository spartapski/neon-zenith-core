import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TEXT_PAGES, TYPOGRAPHY_DEFAULT } from "./site-text";

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
] as const;

const SYSTEM = `Tu es DodriAI, l'assistant d'administration du site DODRICOM (agence: domotique, digital, réseaux, IA, COM, events).
Tu pilotes réellement le site via des outils: textes du site (CMS), styles, typographie et catalogue produits.
Règles:
- Réponds toujours dans la langue de l'utilisateur (français ou arabe).
- Avant de modifier un texte, récupère les clés avec list_pages / get_page_texts pour ne jamais inventer une clé.
- Applique directement les demandes claires (pas de confirmation inutile), puis résume en une ou deux phrases ce que tu as changé.
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
