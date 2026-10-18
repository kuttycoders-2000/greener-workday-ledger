import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Loader2, TrainFront } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isActiveChallenge, useChallenges } from "@/lib/data";
import { StateBox } from "@/components/employee";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/ranks")({
  head: () => ({ meta: [{ title: "Leaderboard — EcoTrack" }, { name: "description", content: "Ranked by reduction versus your own baseline." }] }),
  component: Ranks,
});

type Row = { rank: number; name: string; pct: number | null; me: boolean; people?: number };

function Ranks() {
  const [tab, setTab] = useState<"people" | "teams">("people");
  const { data: challenges } = useChallenges();
  const active = (challenges ?? []).find(isActiveChallenge);
  const q = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async (): Promise<Row[]> => {
      if (tab === "people") {
        const { data, error } = await supabase.rpc("leaderboard_people");
        if (error) throw error;
        return (data ?? []).map((r) => ({ rank: Number(r.rank), name: r.name, pct: r.pct === null ? null : Number(r.pct), me: !!r.is_me }));
      }
      const { data, error } = await supabase.rpc("leaderboard_teams");
      if (error) throw error;
      return (data ?? []).map((r) => ({ rank: Number(r.rank), name: r.name, pct: Number(r.pct), me: !!r.is_mine, people: Number(r.people) }));
    },
  });

  return (
    <div className="grid gap-4 pb-4 fade-up">
      <h1 className="text-3xl font-semibold">Leaderboard</h1>
      {active && (
        <div className="flex items-center gap-3 rounded-[18px] bg-amber p-4 text-amber-foreground">
          <TrainFront className="size-6 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{active.name} is live</p>
            <p className="text-sm">{active.description} · ends {new Date(active.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
          </div>
          <Link to="/app/rewards" aria-label="See rewards" className="grid size-11 place-items-center rounded-full bg-card/60"><Gift className="size-5" /></Link>
        </div>
      )}
      <div className="grid grid-cols-2 rounded-xl border bg-card p-1" role="tablist">
        {(["people", "teams"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-11 rounded-lg text-sm font-semibold capitalize", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Ranked by % reduction versus each person's own baseline, so everyone can win. {tab === "teams" && "Teams under 5 people are hidden."}</p>
      {q.isLoading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : q.error ? (
        <StateBox>Could not load the leaderboard.</StateBox>
      ) : !q.data?.length ? (
        <StateBox>No rankings yet.</StateBox>
      ) : (
        <ol className="card-surface divide-y overflow-hidden">
          {q.data.map((r) => (
            <li key={r.rank + r.name} className={cn("flex min-h-14 items-center gap-3 px-4", r.me && "bg-secondary")}>
              <span className={cn("w-7 font-display text-lg font-semibold", r.rank <= 3 ? "text-primary" : "text-muted-foreground")}>{r.rank}</span>
              <span className="flex-1 font-medium">
                {r.name}
                {r.me && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">You</span>}
                {r.people !== undefined && <span className="ml-2 text-xs text-muted-foreground">{r.people} people</span>}
              </span>
              <span className={cn("font-display font-semibold", (r.pct ?? 0) <= 0 ? "text-primary" : "text-destructive")}>
                {r.pct === null ? "–" : `${r.pct > 0 ? "+" : ""}${r.pct}%`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
