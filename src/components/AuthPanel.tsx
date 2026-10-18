import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoUser } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export async function homeForCurrentUser() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return "/auth" as const;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
  return (data ?? []).some((r) => r.role === "admin") ? ("/admin" as const) : ("/app" as const);
}

export function AuthPanel() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const demo = useServerFn(ensureDemoUser);

  const finish = async () => {
    qc.clear();
    navigate({ to: await homeForCurrentUser() });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("form");
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await finish();
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
        });
        if (error) throw error;
        setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const demoLogin = async (kind: "employee" | "admin") => {
    setBusy(kind);
    try {
      const creds = await demo({ data: { kind } });
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) throw error;
      await finish();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card-surface w-full p-6 fade-up">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Try the demo</p>
      <div className="mt-3 grid gap-2">
        <Button size="lg" className="h-12 justify-start gap-3 rounded-xl" onClick={() => demoLogin("employee")} disabled={!!busy}>
          {busy === "employee" ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
          Demo employee (Priya)
        </Button>
        <Button size="lg" variant="outline" className="h-12 justify-start gap-3 rounded-xl" onClick={() => demoLogin("admin")} disabled={!!busy}>
          {busy === "admin" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Demo admin
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> or use your work email <div className="h-px flex-1 bg-border" />
      </div>

      {sent ? (
        <div className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          Check your inbox to confirm <strong>{email}</strong>, then sign in.
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          {mode === "up" && (
            <div className="grid gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" className="h-11 rounded-xl" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" className="h-11 rounded-xl" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" minLength={6} className="h-11 rounded-xl" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" className="h-11 rounded-xl" disabled={!!busy}>
            {busy === "form" && <Loader2 className="size-4 animate-spin" />}
            {mode === "in" ? "Sign in" : "Create account"}
          </Button>
          <button type="button" className="h-11 text-sm text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
