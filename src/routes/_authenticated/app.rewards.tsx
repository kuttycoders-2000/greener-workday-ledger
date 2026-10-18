import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Gift, Ticket, TreePine } from "lucide-react";
import { isActiveChallenge, useChallenges, useRewards } from "@/lib/data";
import { StateBox } from "@/components/employee";

export const Route = createFileRoute("/_authenticated/app/rewards")({
  head: () => ({ meta: [{ title: "Rewards — EcoTrack" }, { name: "description", content: "Challenges and rewards from your company." }] }),
  component: Rewards,
});

const icon = (k: string) => (k === "leave" ? CalendarDays : k === "tree" ? TreePine : Ticket);

function Rewards() {
  const { data: rewards, isLoading } = useRewards();
  const { data: challenges } = useChallenges();
  return (
    <div className="grid gap-4 pb-4 fade-up">
      <h1 className="text-3xl font-semibold">Rewards</h1>
      <h2 className="text-lg font-semibold">Challenges</h2>
      {(challenges ?? []).length === 0 ? <StateBox>No challenges yet.</StateBox> : (
        <ul className="grid gap-2">
          {challenges!.map((c) => (
            <li key={c.id} className="card-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{c.name}</p>
                {isActiveChallenge(c) && <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-semibold text-amber-foreground">Live</span>}
              </div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              {c.reward && <p className="mt-2 flex items-center gap-1.5 text-sm text-primary"><Gift className="size-4" /> {c.reward}</p>}
            </li>
          ))}
        </ul>
      )}
      <h2 className="text-lg font-semibold">Available rewards</h2>
      {isLoading ? null : (rewards ?? []).length === 0 ? <StateBox>No rewards yet.</StateBox> : (
        <ul className="grid gap-2">
          {rewards!.map((r) => {
            const I = icon(r.kind);
            return (
              <li key={r.id} className="card-surface flex items-center gap-3 p-4">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><I className="size-5" /></span>
                <div><p className="font-semibold">{r.name}</p><p className="text-sm text-muted-foreground">{r.description}</p></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
