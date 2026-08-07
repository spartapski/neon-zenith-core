import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type SiteTextRow = { pageSlug: string; textKey: string; value: string };

export const getSiteTexts = createServerFn({ method: "GET" }).handler(async (): Promise<SiteTextRow[]> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const supabase = createClient<Database>(url, key, {
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

  const { data } = await supabase.from("content_texts").select("page_slug, text_key, value");
  return (data ?? []).map((r) => ({ pageSlug: r.page_slug, textKey: r.text_key, value: r.value }));
});
