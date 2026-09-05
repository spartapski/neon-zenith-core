import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/* ---------------- Contact → Messages (Back Office) ---------------- */

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { name: string; email: string; phone?: string; subject?: string; message: string; company?: string }) => {
      const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
      const out = {
        full_name: s(input?.name, 120),
        email: s(input?.email, 160),
        phone: s(input?.phone, 40) || null,
        subject: s(input?.subject, 200) || null,
        company: s(input?.company, 120) || null,
        message: s(input?.message, 5000),
      };
      if (!out.full_name || !out.message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(out.email))
        throw new Error("Nom, email valide et message sont requis.");
      return out;
    },
  )
  .handler(async ({ data }) => {
    const { error } = await publicClient().from("contact_messages").insert(data);
    if (error) {
      console.error("submitContact", error.message);
      throw new Error("Impossible d'envoyer le message pour le moment.");
    }
    return { ok: true };
  });

/* ---------------- Suivi des visiteurs ---------------- */

function detectDevice(ua: string) {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string; path: string; referrer?: string }) => {
    const sessionId = String(input?.sessionId ?? "").slice(0, 80);
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(sessionId)) throw new Error("session invalide");
    return {
      sessionId,
      path: String(input?.path ?? "/").slice(0, 300),
      referrer: input?.referrer ? String(input.referrer).slice(0, 500) : null,
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ua = getRequestHeader("user-agent") ?? "";
    const country = getRequestHeader("cf-ipcountry") ?? null;
    const city = getRequestHeader("cf-ipcity") ?? null;

    const { data: existing } = await supabaseAdmin
      .from("site_visits")
      .select("id, page_views")
      .eq("session_id", data.sessionId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("site_visits")
        .update({ last_path: data.path, page_views: existing.page_views + 1, last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("site_visits").insert({
        session_id: data.sessionId,
        first_path: data.path,
        last_path: data.path,
        referrer: data.referrer,
        country,
        city,
        device: detectDevice(ua),
        user_agent: ua.slice(0, 300),
      });
    }
    return { ok: true };
  });

/* ---------------- Pages générées par DodriAI ---------------- */

export type CustomPageDTO = {
  slug: string;
  title: string;
  description: string | null;
  content_html: string;
  content_css: string;
};

export const getCustomPage = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input?.slug ?? "").slice(0, 120) }))
  .handler(async ({ data }): Promise<CustomPageDTO | null> => {
    const { data: page } = await publicClient()
      .from("custom_pages")
      .select("slug, title, description, content_html, content_css")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    return (page as CustomPageDTO | null) ?? null;
  });
