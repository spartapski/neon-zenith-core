import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleIcon, ModuleRenderer } from "@/components/admin/ModuleRenderer";
import type { AppModule } from "@/lib/modules";

export const Route = createFileRoute("/admin/m/$slug")({
  component: DynamicModulePage,
});

export function useAppModule(slug: string) {
  return useQuery({
    queryKey: ["app-module", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_modules")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as AppModule | null) ?? null;
    },
  });
}

export function ModuleNotFound({ slug }: { slug: string }) {
  return (
    <div className="glass p-8 text-center">
      <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--gradient-brand)] shadow-[0_0_30px_rgba(139,61,255,0.45)]">
        <Sparkles className="h-7 w-7 text-white" />
      </span>
      <h2 className="text-lg font-bold text-white">Module « {slug} » non configuré</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
        Demandez à DodriAI de créer ou professionnaliser ce module : il apparaîtra ici automatiquement
        avec ses tableaux, formulaires, KPIs et actions.
      </p>
      <Link
        to="/admin/dodriai"
        className="btn-gradient mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
      >
        <Sparkles className="h-4 w-4" />
        Ouvrir DodriAI
      </Link>
    </div>
  );
}

function DynamicModulePage() {
  const { slug } = Route.useParams();
  const { data: mod, isLoading } = useAppModule(slug);

  return (
    <AdminShell
      title={mod?.name ?? slug}
      breadcrumbs={[{ label: "Modules" }, { label: mod?.name ?? slug }]}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : !mod ? (
        <ModuleNotFound slug={slug} />
      ) : (
        <>
          {mod.description && (
            <div className="mb-5 flex items-center gap-3 text-sm text-white/60">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl"
                style={{ background: `${mod.color}22`, color: mod.color }}
              >
                <ModuleIcon name={mod.icon} className="h-4 w-4" />
              </span>
              {mod.description}
            </div>
          )}
          <ModuleRenderer module={mod} />
        </>
      )}
    </AdminShell>
  );
}
