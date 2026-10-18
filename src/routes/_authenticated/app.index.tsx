import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from "recharts";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Flame, Lightbulb, Loader2, Radar, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFactors, useMyHabits, useMyTrips, useProfile } from "@/lib/data";
import { co2For, fmtKg, iso, MODE_LABEL, modeIcon, recommend, type Mode } from "@/lib/emissions";
import { ModeGrid, refreshAll, StateBox } from "@/components/employee";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Home — EcoTrack" }, { name: "description", content: "Your weekly commute footprint, streak and personalised tip." }] }),
  component: Home,
});

function Home() {
  const { data: profile } = useProfile();
  const { data: trips, isLoading, error } = useMyTrips(90);
  const { data: habits } = useMyHabits();
  const { data: factors } = useFactors();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: string; mode: Mode; km: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const confirmed = (trips ?? []).filter((t) => t.status === "confirmed");
    const byDay = new Map<string, number>();
    for (const t of confirmed) byDay.set(t.date, (byDay.get(t.date) ?? 0) + Number(t.co2_kg));
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = iso(d);
      return { key, label: d.toLocaleDateString("en-IN", { weekday: "narrow" }), kg: Math.round((byDay.get(key) ?? 0) * 100) / 100, today: i === 6 };
    });
    const weekKg = days.reduce((s, d) => s + d.kg, 0);
    const baseline = Number(profile?.baseline_kg_per_week ?? 0);
    const pct = baseline > 0 ? ((weekKg - baseline) / baseline) * 100 : 0;
    const dailyBase = baseline / Math.max(1, profile?.office_days_per_week ?? 5);
    const tripDays = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    let streak = 0;
    for (const [, kg] of tripDays) {
      if (kg < dailyBase * 0.85) streak++;
      else break;
    }
    const monthStart = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    let saved = 0;
    for (const [d, kg] of tripDays) if (d >= monthStart) saved += Math.max(0, dailyBase - kg);
    saved += (habits ?? []).reduce((s, h) => s + Number(h.co2_saved_kg), 0);
    const since = iso(new Date(Date.now() - 28 * 864e5));
    const tip = recommend(confirmed.filter((t) => t.date >= since), factors?.map ?? {}, Number(profile?.home_distance_km ?? 10));
    const pending = (trips ?? []).filter((t) => t.status === "pending");
    return { days, weekKg, baseline, pct, streak, saved, tip, pending };
  }, [trips, habits, profile, factors]);

  const confirm = async (id: string, patch?: { mode: Mode; distance_km: number }) => {
    setBusy(true);
    const { error } = await supabase.from("trips").update({ status: "confirmed", ...(patch ?? {}) }).eq("id", id);
    setBusy(false);
    if (error) return toast.error("Could not update trip");
    toast.success("Trip confirmed");
    setEditing(null);
    refreshAll(qc);
  };

  if (isLoading) return <div className="grid h-64 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (error) return <StateBox>Could not load your trips. Pull to refresh or try again.</StateBox>;

  const first = profile?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const below = stats.pct <= 0;

  return (
    <div className="grid gap-4 pb-4 fade-up">
      <div>
        <p className="text-muted-foreground">{greet},</p>
        <h1 className="text-3xl font-semibold">{first}</h1>
      </div>

      <section className="rounded-[18px] bg-forest p-5 text-forest-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">This week</p>
            <p className="font-display text-5xl font-semibold leading-none">{fmtKg(stats.weekKg)}<span className="ml-1 text-lg font-medium">kg CO2e</span></p>
          </div>
          {stats.baseline > 0 && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${below ? "bg-leaf text-secondary-foreground" : "bg-amber text-amber-foreground"}`}>
              {below ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
              {Math.abs(Math.round(stats.pct))}% {below ? "below" : "above"} baseline
            </span>
          )}
        </div>
        <div className="mt-4 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.days}>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 12, opacity: 0.7 }} />
              <Bar dataKey="kg" radius={[6, 6, 6, 6]} isAnimationActive>
                {stats.days.map((d) => (
                  <Cell key={d.key} fill={d.today ? "var(--amber)" : "var(--leaf)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-xs opacity-70">Your baseline: {fmtKg(stats.baseline)} kg / week</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-surface p-4">
          <Flame className="size-5 text-amber" />
          <p className="mt-2 font-display text-3xl font-semibold">{stats.streak}</p>
          <p className="text-sm text-muted-foreground">low-carbon day streak</p>
        </div>
        <div className="card-surface p-4">
          <Sprout className="size-5 text-primary" />
          <p className="mt-2 font-display text-3xl font-semibold">{fmtKg(stats.saved)}<span className="text-base"> kg</span></p>
          <p className="text-sm text-muted-foreground">saved this month</p>
        </div>
      </div>

      {stats.pending.map((t) => {
        const Icon = modeIcon(t.mode);
        return (
          <section key={t.id} className="card-surface border-primary/40 p-4 fade-up">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Radar className="size-4" /> Trip detected</div>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" /></span>
              <div className="flex-1">
                <p className="font-semibold first-letter:uppercase">{MODE_LABEL[t.mode as Mode]} · {Number(t.distance_km)} km</p>
                <p className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} · {fmtKg(Number(t.co2_kg))} kg CO2e</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button className="h-11 rounded-xl" disabled={busy} onClick={() => confirm(t.id)}>Looks right</Button>
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setEditing({ id: t.id, mode: t.mode as Mode, km: Number(t.distance_km) })}>Edit</Button>
            </div>
          </section>
        );
      })}

      <section className="card-surface flex gap-3 bg-secondary p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">{stats.tip.title}</p>
          <p className="text-sm text-secondary-foreground">{stats.tip.body}</p>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent trips</h2>
          <Link to="/app/log" className="text-sm font-medium text-primary">Log trip</Link>
        </div>
        {(trips ?? []).filter((t) => t.status === "confirmed").length === 0 ? (
          <StateBox>No trips yet. Log your first commute to see your footprint.</StateBox>
        ) : (
          <ul className="card-surface divide-y">
            {(trips ?? []).filter((t) => t.status === "confirmed").slice(0, 5).map((t) => {
              const Icon = modeIcon(t.mode);
              return (
                <li key={t.id} className="flex items-center gap-3 p-3">
                  <Icon className="size-5 text-muted-foreground" />
                  <span className="flex-1 text-sm first-letter:uppercase">{MODE_LABEL[t.mode as Mode]} · {Number(t.distance_km)} km</span>
                  <span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  <span className="w-16 text-right text-sm font-semibold">{fmtKg(Number(t.co2_kg))} kg</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-[400px] rounded-2xl">
          <DialogHeader><DialogTitle>Edit detected trip</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <ModeGrid value={editing.mode} onChange={(m) => setEditing({ ...editing, mode: m })} />
              <div className="grid gap-1.5">
                <Label htmlFor="ekm">Distance (km)</Label>
                <Input id="ekm" type="number" min={0} step="0.1" className="h-11 rounded-xl" value={editing.km} onChange={(e) => setEditing({ ...editing, km: Number(e.target.value) })} />
              </div>
              <p className="text-sm text-muted-foreground">{fmtKg(co2For(editing.mode, editing.km, factors?.map ?? {}))} kg CO2e</p>
            </div>
          )}
          <DialogFooter>
            <Button className="h-11 w-full rounded-xl" disabled={busy || !editing || editing.km <= 0} onClick={() => editing && confirm(editing.id, { mode: editing.mode, distance_km: editing.km })}>
              Save and confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
