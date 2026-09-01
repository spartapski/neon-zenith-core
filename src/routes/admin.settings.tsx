import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { AdminShell, Placeholder } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AdminShell title="Paramètres" breadcrumbs={[{ label: "Paramètres" }]}>
      <div className="glass relative mb-5 overflow-hidden p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.5)]">
            <Sparkles className="h-7 w-7 text-white" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-xl font-black tracking-wide text-white">
              DODRI<span className="gradient-text">AI</span>
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/60">
              Assistant IA connecté à l'API du site : modifiez les textes, les styles, la
              typographie et le catalogue produits par simple conversation — les changements
              s'appliquent en direct sur le Front Office.
            </p>
          </div>
          <Link
            to="/admin/dodriai"
            className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            Ouvrir DodriAI
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <Placeholder
        description="Branding, langues, devises, SMTP, API, sécurité, sauvegardes."
        bullets={[
          "Module intégré au Back Office DODRICOM",
          "Interface premium glassmorphism",
          "RBAC appliqué selon le rôle utilisateur",
          "Prêt à connecter aux données live",
          "Export PDF / Excel",
          "Multi-langue FR / EN / AR",
        ]}
      />
    </AdminShell>
  );
}
