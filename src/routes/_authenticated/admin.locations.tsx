import { createFileRoute } from "@tanstack/react-router";
import { DashState, DemoFooter, LocationList, PageHeader, useDash } from "@/components/admin";

export const Route = createFileRoute("/_authenticated/admin/locations")({
  head: () => ({ meta: [{ title: "Locations — EcoTrack admin" }, { name: "description", content: "Emissions by office location." }] }),
  component: Locations,
});

function Locations() {
  const q = useDash();
  if (!q.data) return <DashState q={q} />;
  return (
    <div className="fade-up">
      <PageHeader title="Locations" sub="Offices with fewer than 5 tracked people are hidden." d={q.data} />
      <div className="max-w-2xl"><LocationList d={q.data} /></div>
      <DemoFooter d={q.data} />
    </div>
  );
}
