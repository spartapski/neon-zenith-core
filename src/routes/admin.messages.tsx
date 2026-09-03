import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleRenderer } from "@/components/admin/ModuleRenderer";
import { ModuleNotFound, useAppModule } from "./admin.m.$slug";

export const Route = createFileRoute("/admin/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { data: mod, isLoading } = useAppModule("messages");
  return (
    <AdminShell title={mod?.name ?? "Messages"} breadcrumbs={[{ label: "Messages" }]}>
      {isLoading ? (
        <div className="flex items-center gap-2 text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : mod ? (
        <ModuleRenderer module={mod} />
      ) : (
        <ModuleNotFound slug="messages" />
      )}
    </AdminShell>
  );
}
