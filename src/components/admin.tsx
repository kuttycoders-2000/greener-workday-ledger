import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Download, FileText, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isActiveChallenge, useAdminDashboard, useFactors, useRewards, type AdminDashboard } from "@/lib/data";
import { exportBrsrPdf, exportCsv } from "@/lib/report";
import { iso } from "@/lib/emissions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function useDash() {
  return useAdminDashboard();
}

export function DashState({ q }: { q: ReturnType<typeof useAdminDashboard> }) {
  if (q.isLoading) return <div className="grid h-64 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (q.error) return <div className="card-surface p-6 text-sm text-destructive">Could not load company data. {(q.error as Error).message}</div>;
  return null;
}

export function PageHeader({ title, sub, d }: { title: string; sub?: string; d?: AdminDashboard }) {
  const { data: f } = useFactors();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{d?.company?.name}</p>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {sub && <p className="text-muted-foreground">{sub}</p>}
      </div>
      {d && (
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 gap-2 rounded-xl" onClick={() => exportCsv(d)}><Download className="size-4" /> Export CSV</Button>
          <Button
            className="h-11 gap-2 rounded-xl"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try { await exportBrsrPdf(d, (f?.rows ?? []).map((r) => ({ mode: r.mode, label: r.label, factor: Number(r.factor) }))); }
              catch { toast.error("Could not build the PDF"); }
              finally { setBusy(false); }
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} Export BRSR report (PDF)
          </Button>
        </div>
      )}
    </div>
  );
}

export function Kpis({ d }: { d: AdminDashboard }) {
  const change = d.baseline_week_kg > 0 ? ((d.recent_week_kg - d.baseline_week_kg) / d.baseline_week_kg) * 100 : 0;
  const avg = d.active > 0 ? d.recent_week_kg / d.active : 0;
  const cards = [
    { label: "Total employee emissions", value: `${(d.total_kg / 1000).toFixed(1)}`, unit: "t CO2e", note: "Scope 3 categories 6 and 7 · 12 weeks", dark: true },
    { label: "Change vs baseline", value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`, unit: "", note: "Last 4 weeks vs summed baselines" },
    { label: "Active employees", value: `${d.active}`, unit: `of ${d.employees}`, note: "", progress: d.employees ? (d.active / d.employees) * 100 : 0 },
    { label: "Avg per active employee", value: avg.toFixed(1), unit: "kg / week", note: "Commute, last 4 weeks" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className={c.dark ? "rounded-[18px] bg-forest p-5 text-forest-foreground" : "card-surface p-5"}>
          <p className={`text-sm ${c.dark ? "opacity-80" : "text-muted-foreground"}`}>{c.label}</p>
          <p className="mt-2 font-display text-4xl font-semibold">{c.value} <span className="text-base font-medium">{c.unit}</span></p>
          {c.progress !== undefined && <Progress value={c.progress} className="mt-3 h-2" />}
          {c.note && <p className={`mt-2 text-xs ${c.dark ? "opacity-70" : "text-muted-foreground"}`}>{c.note}</p>}
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ d }: { d: AdminDashboard }) {
  const data = d.weekly.map((w) => ({ week: new Date(w.week).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), t: Math.round(w.kg / 10) / 100 }));
  return (
    <div className="card-surface p-5">
      <h2 className="text-lg font-semibold">Weekly emissions trend</h2>
      <p className="text-sm text-muted-foreground">t CO2e per week, 12 weeks. Current week is partial.</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
            <Area type="monotone" dataKey="t" name="t CO2e" stroke="var(--primary)" strokeWidth={2.5} fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SourcesChart({ d }: { d: AdminDashboard }) {
  const data = [
    ...d.sources.filter((s) => s.kg > 0).map((s) => ({ source: s.source, t: Math.round(s.kg / 10) / 100 })),
    { source: "Office habits (saved)", t: -Math.round(d.habits_saved_kg / 10) / 100 },
  ];
  return (
    <div className="card-surface p-5">
      <h2 className="text-lg font-semibold">Emissions by source</h2>
      <p className="text-sm text-muted-foreground">t CO2e, 12 weeks</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="source" tickLine={false} axisLine={false} fontSize={12} width={130} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
            <Bar dataKey="t" name="t CO2e" fill="var(--primary)" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TeamTable({ d }: { d: AdminDashboard }) {
  const maxAbs = Math.max(1, ...d.teams.map((t) => Math.abs(t.pct)));
  return (
    <div className="card-surface overflow-x-auto p-5">
      <h2 className="text-lg font-semibold">Team improvement</h2>
      <p className="text-sm text-muted-foreground">{d.hidden_teams > 0 ? `${d.hidden_teams} team(s) under 5 people hidden for privacy.` : "All teams shown."}</p>
      <table className="mt-4 w-full min-w-[520px] text-sm">
        <thead className="text-left text-muted-foreground">
          <tr><th className="pb-2 font-medium">Rank</th><th className="pb-2 font-medium">Team</th><th className="pb-2 font-medium">People</th><th className="pb-2 font-medium">t CO2e</th><th className="pb-2 font-medium">% change</th></tr>
        </thead>
        <tbody className="divide-y">
          {d.teams.map((t, i) => (
            <tr key={t.name} className="h-12">
              <td className="font-display font-semibold text-primary">{i + 1}</td>
              <td className="font-medium">{t.name}</td>
              <td>{t.people}</td>
              <td>{Number(t.t).toFixed(2)}</td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${t.pct <= 0 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${(Math.abs(t.pct) / maxAbs) * 100}%` }} />
                  </div>
                  <span className="w-14 font-semibold">{t.pct > 0 ? "+" : ""}{t.pct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LocationList({ d }: { d: AdminDashboard }) {
  return (
    <div className="card-surface p-5">
      <h2 className="text-lg font-semibold">By location</h2>
      <ul className="mt-3 divide-y">
        {d.locations.map((l) => (
          <li key={l.name} className="flex h-14 items-center justify-between">
            <div><p className="font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.people} people</p></div>
            <div className="text-right"><p className="font-semibold">{Number(l.t).toFixed(2)} t</p><p className={`text-xs ${l.pct <= 0 ? "text-primary" : "text-destructive"}`}>{l.pct > 0 ? "+" : ""}{l.pct}%</p></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChallengeCard({ d }: { d: AdminDashboard }) {
  const [newOpen, setNewOpen] = useState(false);
  const [assign, setAssign] = useState<string | null>(null);
  const live = d.challenges.find(isActiveChallenge) ?? d.challenges[0];
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Challenge</h2>
        {live && isActiveChallenge(live) && <span className="rounded-full bg-amber px-2.5 py-0.5 text-xs font-semibold text-amber-foreground">Live</span>}
      </div>
      {live ? (
        <>
          <p className="mt-2 font-display text-2xl font-semibold">{live.name}</p>
          <p className="text-sm text-muted-foreground">{live.description}</p>
          <div className="mt-4 flex justify-between text-sm"><span>Participation</span><span className="font-semibold">{live.participants} of {d.employees}</span></div>
          <Progress value={d.employees ? (live.participants / d.employees) * 100 : 0} className="mt-2 h-2" />
          <p className="mt-3 text-sm">Reward: <span className="font-medium">{live.reward ?? "Not assigned"}</span></p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No challenges yet.</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 rounded-xl" disabled={!live} onClick={() => live && setAssign(live.id)}>Assign reward</Button>
        <Button className="h-11 gap-1 rounded-xl" onClick={() => setNewOpen(true)}><Plus className="size-4" /> New challenge</Button>
      </div>
      <NewChallengeDialog open={newOpen} onOpenChange={setNewOpen} />
      <AssignRewardDialog challengeId={assign} onClose={() => setAssign(null)} />
    </div>
  );
}

export function NewChallengeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { data: rewards } = useRewards();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState(iso(new Date()));
  const [end, setEnd] = useState(iso(new Date(Date.now() + 30 * 864e5)));
  const [mode, setMode] = useState("metro");
  const [reward, setReward] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim() || end < start) return toast.error("Add a name and a valid date range");
    setBusy(true);
    const { data: cid } = await supabase.rpc("my_company_id");
    const modes = mode === "low" ? ["metro", "bus", "walk", "cycle"] : [mode];
    const { error } = await supabase.from("challenges").insert({
      company_id: cid as string, name: name.trim(), description: desc.trim() || null, start_date: start, end_date: end, reward: reward || null, target_modes: modes,
    });
    setBusy(false);
    if (error) return toast.error("Could not create challenge");
    toast.success("Challenge created");
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["challenges"] });
    setName(""); setDesc("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>New challenge</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="cn">Name</Label><Input id="cn" maxLength={80} className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bike to Work Week" /></div>
          <div className="grid gap-1.5"><Label htmlFor="cd">Description</Label><Input id="cd" maxLength={200} className="h-11 rounded-xl" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="cs">Start</Label><Input id="cs" type="date" className="h-11 rounded-xl" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="ce">End</Label><Input id="ce" type="date" className="h-11 rounded-xl" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5">
            <Label>Counts trips by</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="metro">Metro</SelectItem><SelectItem value="bus">Bus</SelectItem><SelectItem value="cycle">Cycle</SelectItem>
                <SelectItem value="walk">Walk</SelectItem><SelectItem value="low">Any low-carbon mode</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Reward</Label>
            <Select value={reward} onValueChange={setReward}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Choose a reward" /></SelectTrigger>
              <SelectContent>{(rewards ?? []).map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button className="h-11 rounded-xl" disabled={busy} onClick={save}>{busy && <Loader2 className="size-4 animate-spin" />} Create challenge</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignRewardDialog({ challengeId, onClose }: { challengeId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: rewards } = useRewards();
  const [reward, setReward] = useState("");
  const save = async () => {
    if (!challengeId || !reward) return;
    const { error } = await supabase.from("challenges").update({ reward }).eq("id", challengeId);
    if (error) return toast.error("Could not assign reward");
    toast.success("Reward assigned");
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["challenges"] });
    onClose();
  };
  return (
    <Dialog open={!!challengeId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>Assign reward</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          {(rewards ?? []).map((r) => (
            <button key={r.id} onClick={() => setReward(r.name)} className={`min-h-14 rounded-xl border p-3 text-left ${reward === r.name ? "border-primary bg-secondary" : "bg-card"}`}>
              <p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.description}</p>
            </button>
          ))}
        </div>
        <DialogFooter><Button className="h-11 rounded-xl" disabled={!reward} onClick={save}>Assign</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DemoFooter({ d }: { d: AdminDashboard }) {
  if (!d.company?.is_demo) return null;
  return <p className="mt-8 text-center text-xs text-muted-foreground">Sample data for demo</p>;
}
