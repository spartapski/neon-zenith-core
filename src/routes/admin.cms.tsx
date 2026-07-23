import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Placeholder } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/cms")({
  component: () => (
    <AdminShell title="Website Builder (CMS)" breadcrumbs={[{ label: "Website Builder (CMS)" }]}>
      <Placeholder
        description="Éditeur visuel pour modifier chaque page du site sans code."
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
  ),
});
