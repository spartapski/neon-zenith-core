import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, RotateCcw, Save, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { TEXT_PAGES } from "@/lib/site-text";

export const Route = createFileRoute("/admin/cms")({
  component: CmsPage,
});

function CmsPage() {
  const queryClient = useQueryClient();
  const [activeSlug, setActiveSlug] = useState(TEXT_PAGES[0]!.slug);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const page = TEXT_PAGES.find((p) => p.slug === activeSlug)!;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase
      .from("content_texts")
      .select("page_slug, text_key, value")
      .then(({ data, error: err }) => {
        if (!alive) return;
        if (err) setError(err.message);
        const map: Record<string, string> = {};
        for (const row of data ?? []) map[`${row.page_slug}.${row.text_key}`] = row.value;
        setValues(map);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const fields = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return page.fields;
    return page.fields.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.def.toLowerCase().includes(q) ||
        (values[`${page.slug}.${f.key}`] ?? "").toLowerCase().includes(q),
    );
  }, [page, search, values]);

  const current = (key: string) => values[`${page.slug}.${key}`] ?? "";

  const setValue = (key: string, value: string) => {
    setSaved(false);
    setValues((prev) => ({ ...prev, [`${page.slug}.${key}`]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const rows = page.fields.map((f) => ({
      page_slug: page.slug,
      text_key: f.key,
      value: current(f.key) || f.def,
    }));
    const { error: err } = await supabase
      .from("content_texts")
      .upsert(rows, { onConflict: "page_slug,text_key" });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
    await queryClient.invalidateQueries({ queryKey: ["site-texts"] });
  };

  const resetPage = () => {
    setSaved(false);
    setValues((prev) => {
      const next = { ...prev };
      for (const f of page.fields) next[`${page.slug}.${f.key}`] = f.def;
      return next;
    });
  };

  return (
    <AdminShell title="Website Builder (CMS)" breadcrumbs={[{ label: "Website Builder (CMS)" }]}>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Pages list */}
        <aside className="glass h-fit p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Pages du site
          </p>
          <div className="space-y-1">
            {TEXT_PAGES.map((p) => (
              <button
                key={p.slug}
                onClick={() => {
                  setActiveSlug(p.slug);
                  setSaved(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  p.slug === activeSlug
                    ? "bg-white/[0.08] text-white"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-[10px] text-white/35">{p.fields.length}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <section className="glass p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{page.name}</h2>
              <p className="text-xs text-white/50">
                Modifiez les textes ci-dessous puis enregistrez — la page {page.route} sera mise à jour.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetPage}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saved ? "Enregistré" : "Enregistrer"}
              </button>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un texte…"
              className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-white/50">Chargement des textes…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/60">
                    {f.label}
                  </span>
                  {f.multiline ? (
                    <textarea
                      rows={4}
                      value={current(f.key) || f.def}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60"
                    />
                  ) : (
                    <input
                      value={current(f.key) || f.def}
                      onChange={(e) => setValue(f.key, e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60"
                    />
                  )}
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
