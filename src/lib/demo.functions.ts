import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO = {
  employee: { id: "11111111-1111-1111-1111-111111111111", email: "priya.demo@northwind.example", name: "Priya Sharma" },
  admin: { id: "22222222-2222-2222-2222-222222222222", email: "admin.demo@northwind.example", name: "Ananya Rao" },
} as const;
const DEMO_PASSWORD = "EcoTrack-Demo-2026";

/** Ensures the fixed demo accounts exist (they own seeded sample data) and returns their public demo credentials. */
export const ensureDemoUser = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ kind: z.enum(["employee", "admin"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const u = DEMO[data.kind];
    const { data: existing } = await supabaseAdmin.auth.admin.getUserById(u.id);
    if (!existing?.user) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        id: u.id, email: u.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: u.name },
      } as never);
      if (error) throw new Error("Could not prepare demo account");
    } else {
      await supabaseAdmin.auth.admin.updateUserById(u.id, { password: DEMO_PASSWORD });
    }
    return { email: u.email, password: DEMO_PASSWORD };
  });

export const inviteEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(255), redirectTo: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only company admins can invite");
    const { data: cid } = await context.supabase.rpc("my_company_id");
    const { error } = await context.supabase.from("invites").upsert(
      { company_id: cid as string, email: data.email.toLowerCase(), invited_by: context.userId },
      { onConflict: "company_id,email" },
    );
    if (error) throw new Error("Could not save invite");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: e2 } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo: data.redirectTo });
    return { emailed: !e2, note: e2 ? "Invite saved. They can sign up with this email to join your company." : "Invitation email sent." };
  });
