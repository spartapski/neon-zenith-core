import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, Sparkles, User2, Wand2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { dodriAiChat, type DodriMessage } from "@/lib/dodriai.functions";

export const Route = createFileRoute("/admin/dodriai")({
  component: DodriAiPage,
});

type Bubble = DodriMessage & { actions?: string[] };

const SUGGESTIONS = [
  "Change le titre principal de l'accueil",
  "Mets la police des titres en Sora et l'échelle à 1.05",
  "Liste les produits du pôle domotique",
  "Ajoute un produit « Caméra 4K » à 2 490 MAD, stock 12",
];

function DodriAiPage() {
  const queryClient = useQueryClient();
  const send = useServerFn(dodriAiChat);
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function submit(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    const next: Bubble[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await send({
        data: { messages: next.map(({ role, content: c }) => ({ role, content: c })) },
      });
      setMessages([...next, { role: "assistant", content: res.reply, actions: res.actions }]);
      if (res.actions.length) {
        queryClient.invalidateQueries({ queryKey: ["site-texts"] });
        queryClient.invalidateQueries();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title="DodriAI"
      breadcrumbs={[{ label: "Paramètres", to: "/admin/settings" }, { label: "DodriAI" }]}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Chat */}
        <div className="glass flex h-[calc(100vh-260px)] min-h-[520px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gradient-brand)] shadow-[0_0_22px_rgba(139,61,255,0.5)]">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-display text-sm font-black tracking-wide text-white">
                DODRI<span className="gradient-text">AI</span>
              </p>
              <p className="text-[11px] text-white/50">
                Pilotage du site par IA — textes, styles, typographie, produits
              </p>
            </div>
            <span className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-wider text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              En ligne
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
            {messages.length === 0 && (
              <div className="mx-auto max-w-md py-10 text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.45)]">
                  <Bot className="h-7 w-7 text-white" />
                </span>
                <h2 className="text-lg font-bold text-white">Bonjour 👋</h2>
                <p className="mt-2 text-sm text-white/60">
                  Demandez-moi de modifier n'importe quel texte, style ou produit du site. J'applique
                  les changements en direct.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                    m.role === "user"
                      ? "border border-white/10 bg-white/[0.06]"
                      : "bg-[var(--gradient-brand)]"
                  }`}
                >
                  {m.role === "user" ? (
                    <User2 className="h-4 w-4 text-white/70" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                </span>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "border border-white/10 bg-white/[0.06] text-white"
                      : "border border-[color:var(--brand-violet)]/25 bg-[color:var(--brand-violet)]/[0.08] text-white/90"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.actions && m.actions.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-white/10 pt-3">
                      {m.actions.map((a, k) => (
                        <li key={k} className="flex items-start gap-2 text-[11px] text-emerald-300">
                          <Wand2 className="mt-0.5 h-3 w-3 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                DodriAI travaille…
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-2 border-t border-white/5 px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Décrivez la modification à apporter au site…"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-white/40 outline-none focus:border-[color:var(--brand-violet)]/60"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Envoyer
            </button>
          </form>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          <div className="glass p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Suggestions
            </p>
            <div className="mt-3 space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/75 transition hover:border-[color:var(--brand-violet)]/50 hover:text-white disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="glass p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Capacités
            </p>
            <ul className="mt-3 space-y-2 text-xs text-white/70">
              {[
                "Modifier tous les textes du site (CMS)",
                "Ajuster styles, couleurs et positions",
                "Changer la typographie globale",
                "Créer, modifier et supprimer des produits",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-violet)]" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] text-white/40">
              Réservé aux administrateurs. Chaque action est appliquée en direct sur le Front Office.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
