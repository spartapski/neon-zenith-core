import { createServerFn } from "@tanstack/react-start";

/** One-off helper: ensures the fixed admin account exists. */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "admin@dodricom.com";
  const password = "DRISS";

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Driss Admin" },
  });

  let userId = created?.user?.id ?? null;
  if (error && !userId) {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === email);
    if (!existing) return { ok: false, error: error.message };
    userId = existing.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  }

  if (userId) {
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });
  }
  return { ok: true, userId };
});