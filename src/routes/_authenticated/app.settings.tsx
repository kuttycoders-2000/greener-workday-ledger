import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, LogOut, Radar, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { iso, type Mode } from "@/lib/emissions";
import { refreshAll } from "@/components/employee";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings and privacy — EcoTrack" }, { name: "description", content: "Control tracking, delete your data, and manage your account." }] }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const update = async (patch: { tracking_consent?: boolean; tracking_paused?: boolean }) => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (error) return toast.error("Could not update setting");
    refreshAll(qc);
  };

  const simulate = async () => {
    if (!profile) return;
    if (!profile.tracking_consent || profile.tracking_paused) return toast.error("Turn on automatic detection first");
    const modes: Mode[] = ["metro", "bus", "cab", "auto", "bike"];
    const mode = modes[Math.floor(Math.random() * modes.length)] ?? "metro";
    const km = Math.round(Number(profile.home_distance_km) * 2 * (0.85 + Math.random() * 0.3) * 10) / 10;
    const { error } = await supabase.from("trips").insert({ user_id: profile.id, date: iso(new Date()), mode, distance_km: km, status: "pending", source: "auto" });
    if (error) return toast.error("Could not simulate trip");
    refreshAll(qc);
    toast.success("Trip detected. Confirm it on Home.");
    navigate({ to: "/app" });
  };

  const deleteData = async () => {
    if (!profile) return;
    setBusy(true);
    const a = await supabase.from("trips").delete().eq("user_id", profile.id);
    const b = await supabase.from("office_habits").delete().eq("user_id", profile.id);
    setBusy(false);
    if (a.error || b.error) return toast.error("Could not delete all data");
    refreshAll(qc);
    toast.success("Your trip and habit data has been deleted");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="grid gap-4 pb-4 fade-up">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">{profile?.full_name} · {profile?.email}</p>

      <section className="card-surface divide-y">
        <div className="flex items-center justify-between gap-4 p-4">
          <div><p className="font-semibold">Automatic trip detection</p><p className="text-sm text-muted-foreground">Only you see trip details.</p></div>
          <Switch checked={!!profile?.tracking_consent} onCheckedChange={(v) => update({ tracking_consent: v })} aria-label="Automatic trip detection" />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div><p className="font-semibold">Pause tracking</p><p className="text-sm text-muted-foreground">Stops detection until you resume.</p></div>
          <Switch checked={!!profile?.tracking_paused} onCheckedChange={(v) => update({ tracking_paused: v })} aria-label="Pause tracking" />
        </div>
        <div className="p-4">
          <Button variant="outline" className="h-11 w-full gap-2 rounded-xl" onClick={simulate}><Radar className="size-4" /> Simulate auto-detected trip</Button>
        </div>
      </section>

      <section className="card-surface divide-y">
        <Link to="/app/rewards" className="flex min-h-14 items-center gap-3 px-4 font-medium"><Gift className="size-5 text-primary" /> Rewards and challenges</Link>
        <Link to="/app/onboarding" className="flex min-h-14 items-center gap-3 px-4 font-medium"><SlidersHorizontal className="size-5 text-primary" /> Update my baseline</Link>
      </section>

      <section className="card-surface grid gap-3 p-4">
        <div className="flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-5 shrink-0 text-primary" /> Under India's DPDP Act 2023 you can access, correct and erase your personal data at any time.</div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="h-11 gap-2 rounded-xl" disabled={busy}><Trash2 className="size-4" /> Delete my data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all your trips and habits?</AlertDialogTitle>
              <AlertDialogDescription>This permanently erases your travel history. Your account stays so you can start fresh.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteData}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <Button variant="ghost" className="h-11 gap-2" onClick={signOut}><LogOut className="size-4" /> Sign out</Button>
    </div>
  );
}
