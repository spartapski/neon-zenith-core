import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, Placeholder } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/crm")({
  component: () => (
    <AdminShell title="Commercial (CRM)" breadcrumbs={[{ label: "Commercial (CRM)" }]}>
      <Placeholder
        description="CRM inspiré de Salesforce, HubSpot et Odoo — pipeline, prospects, prévisions."
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
