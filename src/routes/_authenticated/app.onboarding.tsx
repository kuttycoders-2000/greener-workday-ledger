import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFactors, useProfile } from "@/lib/data";
import { baselineKgPerWeek, fmtKg, type Mode } from "@/lib/emissions";
import { Chip, ModeGrid, refreshAll } from "@/components/employee";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  head: () => ({ meta: [{ title: "Set your baseline — EcoTrack" }, { name: "description", content: "A 30-second survey to set your personal commute baseline." }] }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile } = useProfile();
  const { data: factors } = useFactors();
  const [mode, setMode] = useState<Mode>("car");
  const [km, setKm] = useState(10);
  const [days, setDays] = useState(5);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!profile) return;
    setMode(profile.usual_mode as Mode);
    setKm(Number(profile.home_distance_km));
    setDays(profile.office_days_per_week);
    setConsent(profile.tracking_consent);
  }, [profile]);

  const baseline = baselineKgPerWeek(km, days, mode, factors?.map ?? {});

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ usual_mode: mode, home_distance_km: km, office_days_per_week: days, tracking_consent: consent, baseline_kg_per_week: baseline, onboarded: true })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error("Could not save your baseline");
    refreshAll(qc);
    toast.success("Baseline saved");
    navigate({ to: "/app" });
  };

  return (
    <div className="grid gap-6 py-6 fade-up">
      <Brand />
      <div>
        <h1 className="text-3xl font-semibold">Set your baseline</h1>
        <p className="mt-1 text-muted-foreground">Three quick questions. We compare you only with yourself.</p>
      </div>
      <section className="grid gap-3">
        <h2 className="text-base font-semibold">How do you usually get to the office?</h2>
        <ModeGrid value={mode} onChange={setMode} />
      </section>
      <section className="card-surface grid gap-4 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Home to office</h2>
          <span className="font-display text-2xl font-semibold">{km} km</span>
        </div>
        <Slider min={1} max={60} step={1} value={[km]} onValueChange={(v) => setKm(v[0] ?? km)} aria-label="Home to office distance in km" />
      </section>
      <section className="grid gap-3">
        <h2 className="text-base font-semibold">Office days per week</h2>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <Chip key={d} active={days === d} onClick={() => setDays(d)}>{d}</Chip>
          ))}
        </div>
      </section>
      <section className="card-surface grid gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Automatic trip detection</h2>
            <p className="mt-1 text-sm text-muted-foreground">Only you see your trip details. Your company sees team totals, never individuals.</p>
          </div>
          <Switch checked={consent} onCheckedChange={setConsent} aria-label="Allow automatic trip detection" />
        </div>
        <div className="flex gap-2 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">
          <ShieldCheck className="size-4 shrink-0" />
          <span>Processed under India's Digital Personal Data Protection (DPDP) Act 2023. You can pause tracking or delete your data any time in Settings.</span>
        </div>
      </section>
      <div className="rounded-2xl bg-forest p-5 text-forest-foreground">
        <p className="text-sm opacity-80">Your personal baseline</p>
        <p className="font-display text-4xl font-semibold">{fmtKg(baseline)} <span className="text-lg font-medium">kg CO2e / week</span></p>
      </div>
      <Button size="lg" className="h-12 rounded-xl" onClick={save} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />} Save and continue
      </Button>
    </div>
  );
}
