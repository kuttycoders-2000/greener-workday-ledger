import { createFileRoute } from "@tanstack/react-router";
import { ChallengeCard, DashState, DemoFooter, Kpis, LocationList, PageHeader, SourcesChart, TeamTable, TrendChart, useDash } from "@/components/admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Overview — EcoTrack admin" }, { name: "description", content: "Company Scope 3 overview." }] }),
  component: Overview,
});

function Overview() {
  const q = useDash();
  if (!q.data) return <DashState q={q} />;
  const d = q.data;
  return (
    <div className="fade-up">
      <PageHeader title="Overview" d={d} />
      <div className="grid gap-4">
        <Kpis d={d} />
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <TrendChart d={d} />
          <SourcesChart d={d} />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <TeamTable d={d} />
          <div className="grid gap-4">
            <ChallengeCard d={d} />
            <LocationList d={d} />
          </div>
        </div>
      </div>
      <DemoFooter d={d} />
    </div>
  );
}
