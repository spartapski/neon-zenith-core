import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bot,
  Bookmark,
  BookmarkPlus,
  FileText,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  User2,
  Wand2,
  X,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  dodriAiChat,
  listDodriPrompts,
  saveDodriPrompt,
  deleteDodriPrompt,
  type DodriAttachment,
  type DodriMessage,
} from "@/lib/dodriai.functions";

export const Route = createFileRoute("/admin/dodriai")({
  component: DodriAiPage,
});

type Bubble = DodriMessage & { actions?: string[]; images?: string[] };

const DEFAULT_SUGGESTIONS: { title: string; prompt: string }[] = [
  { title: "Messages pro", prompt: "Transforme Messages en un vrai système professionnel : module branché sur contact_messages avec kanban (nouveau, lu, répondu, archivé), KPIs (nouveaux, ce mois, total), actions répondre par email, marquer lu, archiver, et export CSV." },
  { title: "Visiteurs", prompt: "Crée un module Visiteurs branché sur site_visits avec KPIs : visiteurs en ligne, visiteurs ce mois, total visiteurs, pays des visiteurs, et un tableau détaillé." },
  { title: "Tickets support", prompt: "Crée un module Tickets support avec priorités (basse, normale, haute, critique), statuts, SLA en heures, client, description et KPIs." },
  { title: "Devis", prompt: "Crée un module Devis avec client, lignes, montant total, statuts (brouillon, envoyé, accepté, refusé) et KPIs du chiffre d'affaires." },
  { title: "Image hero", prompt: "Génère une nouvelle image cinématique 8K pour le header de la page Services (bâtiment futuriste, néons violet/bleu) et applique-la." },
];

const MAX_FILE = 4 * 1024 * 1024;

function readFile(file: File): Promise<DodriAttachment> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Lecture impossible"));
    if (file.type.startsWith("image/")) {
      r.onload = () => resolve({ name: file.name, mime: file.type, data: String(r.result) });
      r.readAsDataURL(file);
    } else {
      r.onload = () => resolve({ name: file.name, mime: file.type || "text/plain", data: String(r.result) });
      r.readAsText(file);
    }
  });
}

function DodriAiPage() {
  const queryClient = useQueryClient();
  const send = useServerFn(dodriAiChat);
  const fetchPrompts = useServerFn(listDodriPrompts);
  const savePrompt = useServerFn(saveDodriPrompt);
  const removePrompt = useServerFn(deleteDodriPrompt);

  const [messages, setMessages] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<DodriAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [savePromptText, setSavePromptText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);

  const { data: prompts = [] } = useQuery({ queryKey: ["dodri-prompts"], queryFn: () => fetchPrompts() });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function submit(text: string, files: DodriAttachment[] = attachments) {
    const content = text.trim();
    if ((!content && !files.length) || busy) return;
    setError(null);
    const next: Bubble[] = [...messages, { role: "user", content: content || "(pièce jointe)", attachments: files }];
    setMessages(next);
    setInput("");
    setAttachments([]);
    setBusy(true);
    try {
      const res = await send({
        data: { messages: next.map(({ role, content: c, attachments: a }) => ({ role, content: c, attachments: a })) },
      });
      setMessages([...next, { role: "assistant", content: res.reply, actions: res.actions, images: res.images }]);
      if (res.actions.length) queryClient.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setBusy(false);
    }
  }

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const out: DodriAttachment[] = [];
    for (const f of Array.from(list).slice(0, 4)) {
      if (f.size > MAX_FILE) {
        setError(`« ${f.name} » dépasse 4 Mo`);
        continue;
      }
      try {
        out.push(await readFile(f));
      } catch {
        setError(`Impossible de lire « ${f.name} »`);
      }
    }
    setAttachments((a) => [...a, ...out].slice(0, 4));
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("La dictée vocale n'est pas disponible dans ce navigateur.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.continuous = true;
    let base = input;
    rec.onresult = (ev: any) => {
      let txt = "";
      for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      setInput((base ? base + " " : "") + txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function doSavePrompt() {
    if (!saveTitle.trim() || !savePromptText.trim()) return;
    try {
      await savePrompt({ data: { title: saveTitle, prompt: savePromptText } });
      setSaveOpen(false);
      setSaveTitle("");
      setSavePromptText("");
      queryClient.invalidateQueries({ queryKey: ["dodri-prompts"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <AdminShell
      title="DodriAI"
      breadcrumbs={[{ label: "Paramètres", to: "/admin/settings" }, { label: "DodriAI" }]}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Chat */}
        <div className="glass flex h-[calc(100vh-260px)] min-h-[560px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--gradient-brand)] shadow-[0_0_22px_rgba(139,61,255,0.5)]">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-display text-sm font-black tracking-wide text-white">
                DODRI<span className="gradient-text">AI</span>
              </p>
              <p className="text-[11px] text-white/50">
                Textes, images, produits, modules, pages, statistiques — développement piloté par IA
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
                  Décrivez ce que vous voulez construire ou modifier. Vous pouvez joindre des images ou
                  fichiers, ou dicter votre demande.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                    m.role === "user" ? "border border-white/10 bg-white/[0.06]" : "bg-[var(--gradient-brand)]"
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
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((a, k) =>
                        a.mime.startsWith("image/") ? (
                          <img key={k} src={a.data} alt={a.name} className="h-20 w-20 rounded-lg object-cover" />
                        ) : (
                          <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px]">
                            <FileText className="h-3 w-3" /> {a.name}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                  {m.images && m.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {m.images.map((src, k) => (
                        <a key={k} href={src} target="_blank" rel="noreferrer">
                          <img src={src} alt="Image générée par DodriAI" className="w-full rounded-xl object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
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
                  {m.role === "user" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSavePromptText(m.content);
                        setSaveTitle("");
                        setSaveOpen(true);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white"
                    >
                      <BookmarkPlus className="h-3 w-3" /> Enregistrer comme raccourci
                    </button>
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
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
            )}
            <div ref={endRef} />
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-white/5 px-4 py-2">
              {attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] text-white/80">
                  {a.mime.startsWith("image/") ? (
                    <img src={a.data} alt="" className="h-6 w-6 rounded object-cover" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {a.name}
                  <button type="button" onClick={() => setAttachments((l) => l.filter((_, k) => k !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-2 border-t border-white/5 px-4 py-3"
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.csv,.json,.html,.css,.js,.ts,.tsx,.sql"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Joindre une image ou un fichier"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleVoice}
              title="Dicter"
              className={`grid h-11 w-11 place-items-center rounded-xl border ${
                listening
                  ? "border-rose-400/50 bg-rose-500/20 text-rose-200 animate-pulse"
                  : "border-white/10 bg-white/[0.04] text-white/70 hover:text-white"
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Je vous écoute…" : "Décrivez la modification ou la fonctionnalité à créer…"}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder-white/40 outline-none focus:border-[color:var(--brand-violet)]/60"
            />
            <button
              type="submit"
              disabled={busy || (!input.trim() && !attachments.length)}
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Mes raccourcis</p>
              <button
                type="button"
                onClick={() => {
                  setSavePromptText(input);
                  setSaveOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-[color:var(--brand-violet)] hover:text-white"
              >
                <BookmarkPlus className="h-3.5 w-3.5" /> Nouveau
              </button>
            </div>
            {saveOpen && (
              <div className="mt-3 space-y-2 rounded-xl border border-[color:var(--brand-violet)]/30 bg-[color:var(--brand-violet)]/[0.08] p-3">
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Titre court (ex : Messages pro)"
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs text-white outline-none"
                />
                <textarea
                  value={savePromptText}
                  onChange={(e) => setSavePromptText(e.target.value)}
                  rows={4}
                  placeholder="Prompt complet…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white outline-none"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={doSavePrompt} className="btn-gradient rounded-lg px-3 py-1.5 text-xs font-semibold">
                    Enregistrer
                  </button>
                  <button type="button" onClick={() => setSaveOpen(false)} className="rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white">
                    Annuler
                  </button>
                </div>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {prompts.length === 0 && (
                <p className="text-[11px] text-white/40">
                  Aucun raccourci. Enregistrez vos prompts fréquents : seul le titre s'affiche, le prompt complet est envoyé au clic.
                </p>
              )}
              {prompts.map((p) => (
                <div key={p.id} className="group flex items-center gap-1">
                  <button
                    onClick={() => submit(p.prompt, [])}
                    disabled={busy}
                    title={p.prompt}
                    className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/80 transition hover:border-[color:var(--brand-violet)]/50 hover:text-white disabled:opacity-40"
                  >
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-violet)]" />
                    <span className="truncate">{p.title}</span>
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={async () => {
                      await removePrompt({ data: { id: p.id } });
                      queryClient.invalidateQueries({ queryKey: ["dodri-prompts"] });
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-white/30 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Suggestions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEFAULT_SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => submit(s.prompt, [])}
                  disabled={busy}
                  title={s.prompt}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/75 transition hover:border-[color:var(--brand-violet)]/50 hover:text-white disabled:opacity-40"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Capacités</p>
            <ul className="mt-3 space-y-2 text-xs text-white/70">
              {[
                "Textes, styles, typographie et images du site",
                "Génération d'images IA appliquées au site",
                "Produits, stock et catalogue par service",
                "Nouveaux modules Back Office (Messages, Tickets, Devis, Leads…)",
                "Pages et mini-projets publiés sur /p/<slug>",
                "Statistiques : visiteurs en ligne, par mois, total, pays",
                "Analyse d'images et de fichiers joints, dictée vocale",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <ImagePlus className="mt-0.5 hidden h-3 w-3" />
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-violet)]" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
