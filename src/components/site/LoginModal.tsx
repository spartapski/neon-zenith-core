import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, Shield, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { loginWithPassword, signUpWithPassword, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const res =
      mode === "signin"
        ? await loginWithPassword(email, password)
        : await signUpWithPassword(email, password, displayName || undefined);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (mode === "signup") {
      setInfo("Compte créé. Vérifiez votre email pour confirmer si nécessaire.");
      setMode("signin");
      return;
    }
    onClose();
    navigate({ to: "/admin" });
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    const res = await loginWithGoogle();
    if (!res.ok) {
      setLoading(false);
      setError(res.error ?? "Google sign-in a échoué.");
    }
    // On success the page redirects; keep loading state.
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative w-full max-w-md"
          >
            {/* Neon border glow */}
            <div
              aria-hidden
              className="absolute -inset-[1.5px] rounded-3xl opacity-90 blur-[2px]"
              style={{ background: "var(--gradient-brand)" }}
            />
            <div className="glass-strong relative overflow-hidden rounded-3xl border border-white/10 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ background: "var(--gradient-primary)" }}
              />
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative mb-6 flex flex-col items-center text-center">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.55)]">
                  <Shield className="h-6 w-6 text-white" />
                </span>
                <h2 id="login-title" className="text-2xl font-bold text-white">
                  Secure Back Office Access
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  {mode === "signin"
                    ? "Sign in to access the administration platform."
                    : "Create your DODRICOM administrator account."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="relative mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08] disabled:opacity-60"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.5 14.7 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c6.9 0 9.4-4.8 9.4-7.3 0-.5 0-.9-.1-1.3H12z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                or email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={submit} className="relative space-y-4">
                {mode === "signup" && (
                  <Field
                    icon={<Shield className="h-4 w-4" />}
                    label="Nom affiché"
                  >
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
                      placeholder="Driss Admin"
                      maxLength={80}
                    />
                  </Field>
                )}
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                >
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    placeholder="you@dodricom.com"
                  />
                </Field>

                <Field
                  icon={<Lock className="h-4 w-4" />}
                  label="Mot de passe"
                  right={
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="text-white/50 hover:text-white"
                      aria-label={show ? "Masquer" : "Afficher"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                >
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    placeholder="••••••"
                  />
                </Field>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex cursor-pointer items-center gap-2 text-white/70">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 accent-[color:var(--brand-violet)]"
                    />
                    Se souvenir de moi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signin" ? "signup" : "signin");
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-white/60 hover:text-white"
                  >
                    {mode === "signin" ? "Créer un compte" : "J'ai déjà un compte"}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {info}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Connexion…
                      </>
                    ) : (
                      mode === "signin" ? "Sign In" : "Créer le compte"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost-glow inline-flex flex-1 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon,
  label,
  right,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
        {label}
      </span>
      <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-[color:var(--brand-violet)]/60 focus-within:shadow-[0_0_0_3px_rgba(139,61,255,0.2)]">
        <span className="text-white/50">{icon}</span>
        {children}
        {right}
      </span>
    </label>
  );
}