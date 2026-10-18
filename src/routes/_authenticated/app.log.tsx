import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Home as HomeIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFactors, useProfile } from "@/lib/data";
import { co2For, fmtKg, HABITS, iso, type Mode } from "@/lib/emissions";
import { Chip, ModeGrid, refreshAll } from "@/components/employee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/app/log")({
  head: () => ({ meta: [{ title: "Log a trip — EcoTrack" }, { name: "description", content: "Log a commute and see its CO2e instantly." }] }),
  component: LogTrip,
});

function LogTrip() {
  const { data: profile } = useProfile();
  const { data: factors } = useFactors();
  const [mode, setMode] = useState<Mode>("metro");
  const [km, setKm] = useState<string>("");
  const [dateKind, setDateKind] = useState<"today" | "yesterday" | "pick">("today");
  const [picked, setPicked] = useState(iso(new Date()));
  const [habits, setHabits] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const dist = Number(km) || 0;
  const f = factors?.map ?? {};
  const kg = co2For(mode, dist, f);
  const carKg = co2For("car", dist, f);
  const diff = carKg - kg;
  const date = dateKind === "today" ? iso(new Date()) : dateKind === "yesterday" ? iso(new Date(Date.now() - 864e5)) : picked;

  const save = async () => {
    if (!profile || dist <= 0) return;
    setSaving(true);
    const { error } = await supabase.from("trips").insert({ user_id: profile.id, date, mode, distance_km: dist });
    let err = error;
    if (!err && habits.length) {
      const { error: e2 } = await supabase.from("office_habits").insert(
        habits.map((h) => ({ user_id: profile.id, date, habit_type: h, co2_saved_kg: HABITS.find((x) => x.key === h)?.kg ?? 0 })),
      );
      err = e2;
    }
    setSaving(false);
    if (err) return toast.error("Could not save trip. Please try again.");
    toast.success(`Saved · ${fmtKg(kg)} kg CO2e`);
    refreshAll(qc);
    navigate({ to: "/app" });
  };

  return (
    <div className="grid gap-5 pb-4 fade-up">
      <h1 className="text-3xl font-semibold">Log a trip</h1>
      <ModeGrid value={mode} onChange={setMode} />

      <section className="grid gap-2">
        <label htmlFor="km" className="text-sm font-semibold">Distance (km)</label>
        <div className="flex gap-2">
          <Input id="km" inputMode="decimal" type="number" min={0} step="0.1" placeholder="0" className="h-12 rounded-xl text-lg" value={km} onChange={(e) => setKm(e.target.value)} />
          <Button type="button" variant="outline" className="h-12 shrink-0 gap-2 rounded-xl" onClick={() => setKm(String(Number(profile?.home_distance_km ?? 0) * 2))}>
            <HomeIcon className="size-4" /> Home to office
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">The shortcut fills your round trip ({Number(profile?.home_distance_km ?? 0) * 2} km).</p>
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-semibold">Date</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={dateKind === "today"} onClick={() => setDateKind("today")}>Today</Chip>
          <Chip active={dateKind === "yesterday"} onClick={() => setDateKind("yesterday")}>Yesterday</Chip>
          <Chip active={dateKind === "pick"} onClick={() => setDateKind("pick")}>Pick date</Chip>
        </div>
        {dateKind === "pick" && (
          <Input type="date" max={iso(new Date())} className="h-11 rounded-xl" value={picked} onChange={(e) => setPicked(e.target.value)} aria-label="Trip date" />
        )}
      </section>

      <section className="rounded-[18px] bg-forest p-5 text-forest-foreground" aria-live="polite">
        <p className="text-sm opacity-80">This trip</p>
        <p className="font-display text-5xl font-semibold">{fmtKg(kg)}<span className="ml-1 text-lg font-medium">kg CO2e</span></p>
        <p className="mt-1 text-sm">
          {dist <= 0 ? "Enter a distance to see the impact." : mode === "car" ? "Same as driving alone." : diff > 0 ? <><span className="font-semibold text-amber">{fmtKg(diff)} kg less</span> than by car</> : `${fmtKg(-diff)} kg more than by car`}
        </p>
      </section>

      <section className="grid gap-2">
        <p className="text-sm font-semibold">Office check-in <span className="font-normal text-muted-foreground">(optional)</span></p>
        <div className="flex flex-wrap gap-2">
          {HABITS.map((h) => (
            <Chip key={h.key} active={habits.includes(h.key)} onClick={() => setHabits((s) => (s.includes(h.key) ? s.filter((x) => x !== h.key) : [...s, h.key]))}>
              {h.label}
            </Chip>
          ))}
        </div>
      </section>

      <Button size="lg" className="h-12 rounded-xl" disabled={saving || dist <= 0} onClick={save}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save trip
      </Button>
    </div>
  );
}
