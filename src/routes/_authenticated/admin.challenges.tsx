import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isActiveChallenge, useRewards } from "@/lib/data";
import { AssignRewardDialog, DashState, DemoFooter, NewChallengeDialog, PageHeader, useDash } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/challenges")({
  head: () => ({ meta: [{ title: "Challenges and rewards — EcoTrack admin" }, { name: "description", content: "Create challenges and rewards for employees." }] }),
  component: Challenges,
});

function Challenges() {
  const q = useDash();
  const { data: rewards } = useRewards();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [assign, setAssign] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [kind, setKind] = useState("voucher");
  if (!q.data) return <DashState q={q} />;
  const d = q.data;

  const addReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: cid } = await supabase.rpc("my_company_id");
    const { error } = await supabase.from("rewards").insert({ company_id: cid as string, name: name.trim(), description: desc.trim() || null, kind });
    if (error) return toast.error("Could not add reward");
    toast.success("Reward added");
    setName(""); setDesc("");
    qc.invalidateQueries({ queryKey: ["rewards"] });
  };
  const delReward = async (id: string) => {
    const { error } = await supabase.from("rewards").delete().eq("id", id);
    if (error) return toast.error("Could not delete");
    qc.invalidateQueries({ queryKey: ["rewards"] });
  };

  return (
    <div className="fade-up">
      <PageHeader title="Challenges and rewards" d={d} />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Challenges</h2>
            <Button className="h-11 gap-1 rounded-xl" onClick={() => setOpen(true)}><Plus className="size-4" /> New challenge</Button>
          </div>
          <ul className="mt-4 grid gap-3">
            {d.challenges.map((c) => (
              <li key={c.id} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{c.name}</p>
                  {isActiveChallenge(c) && <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-semibold text-amber-foreground">Live</span>}
                </div>
                <p className="text-sm text-muted-foreground">{c.start_date} to {c.end_date} · {c.description}</p>
                <div className="mt-3 flex justify-between text-sm"><span>Participation</span><span>{c.participants} of {d.employees}</span></div>
                <Progress value={d.employees ? (c.participants / d.employees) * 100 : 0} className="mt-1 h-2" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm">Reward: {c.reward ?? "None"}</span>
                  <Button variant="outline" className="h-11 rounded-xl" onClick={() => setAssign(c.id)}>Assign reward</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Rewards</h2>
          <p className="text-sm text-muted-foreground">Employees see these in their Rewards page.</p>
          <ul className="mt-4 divide-y">
            {(rewards ?? []).map((r) => (
              <li key={r.id} className="flex min-h-14 items-center justify-between gap-2 py-2">
                <div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
                <Button variant="ghost" size="icon" className="size-11" aria-label={`Delete ${r.name}`} onClick={() => delReward(r.id)}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
          <form onSubmit={addReward} className="mt-4 grid gap-2 border-t pt-4">
            <Input required maxLength={80} placeholder="Reward name" className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
            <Input maxLength={200} placeholder="Description" className="h-11 rounded-xl" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leave">Extra leave</SelectItem><SelectItem value="voucher">Voucher</SelectItem><SelectItem value="tree">Tree planting</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-11 rounded-xl">Add reward</Button>
          </form>
        </section>
      </div>
      <NewChallengeDialog open={open} onOpenChange={setOpen} />
      <AssignRewardDialog challengeId={assign} onClose={() => setAssign(null)} />
      <DemoFooter d={d} />
    </div>
  );
}
