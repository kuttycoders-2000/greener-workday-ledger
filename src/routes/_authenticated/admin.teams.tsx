import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { DashState, DemoFooter, PageHeader, TeamTable, useDash } from "@/components/admin";
import { inviteEmployee } from "@/lib/demo.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/teams")({
  head: () => ({ meta: [{ title: "Teams — EcoTrack admin" }, { name: "description", content: "Team-level emissions and invites." }] }),
  component: Teams,
});

function Teams() {
  const q = useDash();
  const invite = useServerFn(inviteEmployee);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  if (!q.data) return <DashState q={q} />;
  const d = q.data;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await invite({ data: { email, redirectTo: window.location.origin + "/auth" } });
      toast.success(r.note);
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Teams" sub="Ranked by reduction versus combined baselines." d={d} />
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <TeamTable d={d} />
        <form onSubmit={send} className="card-surface grid h-fit gap-3 p-5">
          <h2 className="text-lg font-semibold">Invite employees</h2>
          <p className="text-sm text-muted-foreground">They join {d.company?.name} when they sign up with this work email.</p>
          <Input type="email" required maxLength={255} placeholder="name@company.com" className="h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="h-11 gap-2 rounded-xl" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Send invite</Button>
        </form>
      </div>
      <DemoFooter d={d} />
    </div>
  );
}
