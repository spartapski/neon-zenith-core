import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import {
  Download,
  KanbanSquare,
  LayoutGrid,
  Loader2,
  Plus,
  Save,
  Search,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  normalizeDefinition,
  type AppModule,
  type ModuleDefinition,
  type ModuleField,
} from "@/lib/modules";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type Row = Record<string, any> & { id: string; created_at?: string };

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[color:var(--brand-violet)]/60";
const labelCls = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60";

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as any)[name] ?? Icons.Boxes;
  return <Cmp className={className} />;
}

function statusMeta(def: ModuleDefinition, value: unknown) {
  const s = def.statuses?.find((x) => x.value === value);
  return { label: s?.label ?? String(value ?? "—"), color: s?.color ?? "#8B3DFF" };
}

function fmt(field: ModuleField | undefined, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  switch (field?.type) {
    case "boolean":
      return v ? "Oui" : "Non";
    case "currency":
      return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(Number(v)) + " MAD";
    case "number":
      return new Intl.NumberFormat("fr-MA").format(Number(v));
    case "date":
      return new Date(String(v)).toLocaleDateString("fr-FR");
    case "datetime":
      return new Date(String(v)).toLocaleString("fr-FR");
    case "select":
      return field.options?.find((o) => o.value === v)?.label ?? String(v);
    case "multiselect":
    case "tags":
      return Array.isArray(v) ? v.join(", ") : String(v);
    default:
      return String(v);
  }
}

function interpolate(tpl: string, row: Row) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(row[k] ?? ""));
}

/** Pour les modules dynamiques, les champs vivent dans `data`, le statut dans `status`. */
function readField(mod: AppModule, row: Row, key: string) {
  if (mod.source_kind === "table") return row[key];
  if (key === mod.definition.statusField) return row.status ?? row.data?.[key];
  return row.data?.[key];
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

export function ModuleRenderer({ module: raw }: { module: AppModule }) {
  const mod = useMemo<AppModule>(
    () => ({ ...raw, definition: normalizeDefinition(raw.definition) }),
    [raw],
  );
  const def = mod.definition;
  const qc = useQueryClient();
  const { user } = useAuth();
  const table = mod.source_kind === "table" && mod.source_table ? mod.source_table : "app_records";
  const statusField = def.statusField ?? "status";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban" | "cards">(def.defaultView ?? "table");
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setView(def.defaultView ?? "table"), [def.defaultView]);

  const queryKey = ["module-rows", mod.id, table];
  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = (supabase.from(table as any) as any).select("*");
      if (mod.source_kind !== "table") q = q.eq("module_id", mod.id);
      const sort = def.defaultSort;
      if (sort && mod.source_kind === "table") q = q.order(sort.field, { ascending: sort.dir === "asc" });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const listFields = useMemo(() => {
    const marked = def.fields.filter((f) => f.showInList);
    return (marked.length ? marked : def.fields.slice(0, 4)).filter((f) => f.key !== statusField);
  }, [def.fields, statusField]);

  const titleField = def.titleField ?? def.fields[0]?.key;
  const subtitleField = def.subtitleField;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const searchable = def.fields.filter((f) => f.searchable !== false);
    return rows.filter((r) => {
      if (statusFilter !== "all" && readField(mod, r, statusField) !== statusFilter) return false;
      if (!q) return true;
      return searchable.some((f) =>
        String(readField(mod, r, f.key) ?? "")
          .toLowerCase()
          .includes(q),
      );
    });
  }, [rows, search, statusFilter, def.fields, mod, statusField]);

  const kpis = useMemo(() => {
    const list = def.kpis?.length
      ? def.kpis
      : [{ key: "total", label: "Total", type: "count" as const }];
    return list.map((k) => {
      const subset = k.filter
        ? rows.filter((r) => readField(mod, r, k.filter!.field) === k.filter!.value)
        : rows;
      let value = 0;
      if (k.type === "count") value = subset.length;
      else {
        const nums = subset.map((r) => Number(readField(mod, r, k.field ?? "")) || 0);
        const sum = nums.reduce((a, b) => a + b, 0);
        value = k.type === "sum" ? sum : nums.length ? sum / nums.length : 0;
      }
      const text =
        k.format === "currency"
          ? new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value) + " MAD"
          : k.format === "percent"
            ? `${Math.round(value)}%`
            : new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 1 }).format(value);
      return { ...k, text };
    });
  }, [def.kpis, rows, mod]);

  /* ---------------- CRUD ---------------- */

  function newRow(): Row {
    const data: Record<string, unknown> = {};
    for (const f of def.fields) if (f.default !== undefined) data[f.key] = f.default;
    const firstStatus = def.statuses?.[0]?.value;
    if (mod.source_kind === "table") {
      return { id: "", ...data, ...(firstStatus ? { [statusField]: firstStatus } : {}) };
    }
    return { id: "", data, status: firstStatus ?? null };
  }

  function setField(row: Row, key: string, value: unknown): Row {
    if (mod.source_kind === "table") return { ...row, [key]: value };
    if (key === statusField) return { ...row, status: value };
    return { ...row, data: { ...(row.data ?? {}), [key]: value } };
  }

  async function save(row: Row) {
    setSaving(true);
    setError(null);
    try {
      const missing = def.fields.filter(
        (f) => f.required && (readField(mod, row, f.key) === undefined || readField(mod, row, f.key) === ""),
      );
      if (missing.length) throw new Error(`Champs requis : ${missing.map((m) => m.label).join(", ")}`);

      const isNew = !row.id;
      let payload: Record<string, unknown>;
      if (mod.source_kind === "table") {
        payload = { ...row };
        delete payload.id;
        delete payload.created_at;
        delete payload.updated_at;
        // n'envoyer que les colonnes connues
        const known = new Set([...def.fields.map((f) => f.key), statusField]);
        for (const k of Object.keys(payload)) if (!known.has(k)) delete payload[k];
      } else {
        payload = {
          module_id: mod.id,
          data: row.data ?? {},
          status: row.status ?? null,
          updated_by: user?.id ?? null,
          ...(isNew ? { created_by: user?.id ?? null } : {}),
        };
      }
      const tbl = supabase.from(table as any) as any;
      const { error } = isNew ? await tbl.insert(payload) : await tbl.update(payload).eq("id", row.id);
      if (error) throw error;
      setEditing(null);
      qc.invalidateQueries({ queryKey });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm("Supprimer cet enregistrement ?")) return;
    const { error } = await (supabase.from(table as any) as any).delete().eq("id", row.id);
    if (error) setError(error.message);
    else {
      setEditing(null);
      qc.invalidateQueries({ queryKey });
    }
  }

  async function quickStatus(row: Row, value: string) {
    const payload = mod.source_kind === "table" ? { [statusField]: value } : { status: value };
    const { error } = await (supabase.from(table as any) as any).update(payload).eq("id", row.id);
    if (error) setError(error.message);
    else qc.invalidateQueries({ queryKey });
  }

  function exportCsv() {
    const cols = def.fields;
    const head = cols.map((c) => c.label).join(";");
    const lines = filtered.map((r) =>
      cols.map((c) => `"${String(readField(mod, r, c.key) ?? "").replace(/"/g, '""')}"`).join(";"),
    );
    const blob = new Blob(["\uFEFF" + [head, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${mod.slug}.csv`;
    a.click();
  }

  /* ---------------- Rendu ---------------- */

  return (
    <div className="space-y-5">
      {/* En-tête module */}
      <div className="glass relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
          style={{ background: mod.color }}
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: `${mod.color}22`, boxShadow: `0 0 24px ${mod.color}55` }}
          >
            <ModuleIcon name={mod.icon} className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Module généré par DodriAI
            </p>
            {mod.description && <p className="mt-1 text-sm text-white/65">{mod.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:text-white">
              <Download className="mr-1.5 inline h-3.5 w-3.5" />
              CSV
            </button>
            {def.allowCreate !== false && (
              <button
                onClick={() => setEditing(newRow())}
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Nouveau
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.key} className="glass p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">{k.label}</p>
            <p className="mt-1.5 text-2xl font-bold text-white">{k.text}</p>
          </div>
        ))}
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className={`${inputCls} pl-9`}
          />
        </div>
        {def.statuses && def.statuses.length > 0 && (
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {[{ value: "all", label: "Tous" }, ...def.statuses].map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === s.value ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(
            [
              ["table", Table2],
              ["kanban", KanbanSquare],
              ["cards", LayoutGrid],
            ] as const
          ).map(([v, I]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg p-1.5 ${view === v ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
              aria-label={v}
            >
              <I className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-10 text-center text-sm text-white/50">
          {def.emptyText ?? "Aucun enregistrement pour le moment."}
        </div>
      ) : view === "table" ? (
        <div className="glass overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-[11px] uppercase tracking-wider text-white/45">
                {listFields.map((f) => (
                  <th key={f.key} className="px-4 py-3 font-semibold">{f.label}</th>
                ))}
                {def.statuses && <th className="px-4 py-3 font-semibold">Statut</th>}
                <th className="px-4 py-3 font-semibold">Créé</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = statusMeta(def, readField(mod, r, statusField));
                return (
                  <tr
                    key={r.id}
                    onClick={() => setEditing(r)}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
                  >
                    {listFields.map((f) => (
                      <td key={f.key} className="max-w-[280px] truncate px-4 py-3 text-white/85">
                        {fmt(f, readField(mod, r, f.key))}
                      </td>
                    ))}
                    {def.statuses && (
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: `${st.color}22`, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-white/45">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : view === "kanban" && def.statuses?.length ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {def.statuses.map((s) => {
            const col = filtered.filter((r) => readField(mod, r, statusField) === s.value);
            return (
              <div key={s.value} className="w-[280px] shrink-0">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color ?? "#8B3DFF" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{s.label}</p>
                  <span className="ml-auto text-xs text-white/40">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((r) => (
                    <RecordCard key={r.id} mod={mod} row={r} titleField={titleField} subtitleField={subtitleField} onOpen={() => setEditing(r)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RecordCard key={r.id} mod={mod} row={r} titleField={titleField} subtitleField={subtitleField} onOpen={() => setEditing(r)} />
          ))}
        </div>
      )}

      {/* Drawer édition */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div
            className="glass h-full w-full max-w-xl overflow-y-auto rounded-none border-l border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">
                {editing.id ? "Modifier" : "Nouveau"} — {mod.name}
              </h3>
              <button onClick={() => setEditing(null)} className="ml-auto rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {def.statuses && def.statuses.length > 0 && (
              <div className="mb-5">
                <label className={labelCls}>Statut</label>
                <div className="flex flex-wrap gap-1.5">
                  {def.statuses.map((s) => {
                    const active = readField(mod, editing, statusField) === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setEditing(setField(editing, statusField, s.value))}
                        className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                        style={{
                          borderColor: active ? s.color ?? "#8B3DFF" : "rgba(255,255,255,0.1)",
                          background: active ? `${s.color ?? "#8B3DFF"}22` : "transparent",
                          color: active ? s.color ?? "#8B3DFF" : "rgba(255,255,255,0.6)",
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {def.fields
                .filter((f) => f.key !== statusField)
                .map((f) => (
                  <div key={f.key} className={f.width === "half" ? "" : "sm:col-span-2"}>
                    <label className={labelCls}>
                      {f.label}
                      {f.required && <span className="text-rose-400"> *</span>}
                    </label>
                    <FieldInput
                      field={f}
                      value={readField(mod, editing, f.key)}
                      onChange={(v) => setEditing(setField(editing, f.key, v))}
                    />
                    {f.help && <p className="mt-1 text-[11px] text-white/40">{f.help}</p>}
                  </div>
                ))}
            </div>

            {def.actions && def.actions.length > 0 && editing.id && (
              <div className="mt-5 flex flex-wrap gap-2">
                {def.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => {
                      if (a.href) window.open(interpolate(a.href, flatten(mod, editing)), "_blank");
                      if (a.setStatus) quickStatus(editing, a.setStatus).then(() => setEditing(setField(editing, statusField, a.setStatus)));
                    }}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{ borderColor: `${a.color ?? "#8B3DFF"}66`, color: a.color ?? "#c4b5fd" }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5">
              <button
                onClick={() => save(editing)}
                disabled={saving}
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer
              </button>
              {editing.id && def.allowDelete !== false && (
                <button
                  onClick={() => remove(editing)}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function flatten(mod: AppModule, row: Row): Row {
  return mod.source_kind === "table" ? row : { ...row, ...(row.data ?? {}) };
}

function RecordCard({
  mod,
  row,
  titleField,
  subtitleField,
  onOpen,
}: {
  mod: AppModule;
  row: Row;
  titleField?: string;
  subtitleField?: string;
  onOpen: () => void;
}) {
  const def = mod.definition;
  const st = statusMeta(def, readField(mod, row, def.statusField ?? "status"));
  const tf = def.fields.find((f) => f.key === titleField);
  const sf = def.fields.find((f) => f.key === subtitleField);
  return (
    <button onClick={onOpen} className="glass w-full p-4 text-left transition hover:border-white/20">
      <div className="flex items-start gap-2">
        <p className="flex-1 truncate text-sm font-semibold text-white">
          {fmt(tf, readField(mod, row, titleField ?? ""))}
        </p>
        {def.statuses && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${st.color}22`, color: st.color }}>
            {st.label}
          </span>
        )}
      </div>
      {sf && <p className="mt-1 line-clamp-2 text-xs text-white/55">{fmt(sf, readField(mod, row, sf.key))}</p>}
      <p className="mt-2 text-[10px] text-white/35">
        {row.created_at ? new Date(row.created_at).toLocaleString("fr-FR") : ""}
      </p>
    </button>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ModuleField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const ro = field.readOnly;
  switch (field.type) {
    case "textarea":
    case "richtext":
      return (
        <textarea
          rows={field.type === "richtext" ? 8 : 4}
          value={(value as string) ?? ""}
          readOnly={ro}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "number":
    case "currency":
      return (
        <input
          type="number"
          step="any"
          value={value === null || value === undefined ? "" : String(value)}
          readOnly={ro}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={inputCls}
        />
      );
    case "boolean":
      return (
        <button
          type="button"
          disabled={ro}
          onClick={() => onChange(!value)}
          className={`relative h-7 w-12 rounded-full transition ${value ? "bg-[color:var(--brand-violet)]" : "bg-white/15"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? "left-6" : "left-1"}`} />
        </button>
      );
    case "date":
      return (
        <input type="date" value={value ? String(value).slice(0, 10) : ""} readOnly={ro} onChange={(e) => onChange(e.target.value || null)} className={inputCls} />
      );
    case "datetime":
      return (
        <input
          type="datetime-local"
          value={value ? new Date(String(value)).toISOString().slice(0, 16) : ""}
          readOnly={ro}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
          className={inputCls}
        />
      );
    case "select":
      return (
        <select value={(value as string) ?? ""} disabled={ro} onChange={(e) => onChange(e.target.value || null)} className={inputCls}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    case "multiselect": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((o) => {
            const on = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}
                className={`rounded-full border px-3 py-1 text-xs ${on ? "border-[color:var(--brand-violet)] bg-[color:var(--brand-violet)]/20 text-white" : "border-white/10 text-white/60"}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "tags":
      return (
        <input
          value={Array.isArray(value) ? (value as string[]).join(", ") : ""}
          readOnly={ro}
          placeholder="tag1, tag2"
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          className={inputCls}
        />
      );
    default:
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "phone" ? "tel" : "text"}
          value={(value as string) ?? ""}
          readOnly={ro}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
  }
}
