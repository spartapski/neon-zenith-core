import { createFileRoute } from "@tanstack/react-router";
import { ensureAdminAccount } from "@/lib/bootstrap-admin.functions";

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async () => Response.json(await ensureAdminAccount()),
    },
  },
});