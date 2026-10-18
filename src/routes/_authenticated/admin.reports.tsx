import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFactors } from "@/lib/data";
import { DashState, DemoFooter, PageHeader, useDash } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "BRSR reports — EcoTrack admin" }, { name: "description", content: "Export BRSR-format Scope 3 reports and manage emission factors." }] }),
  component: Reports,
});

function Reports() {
  const q = useDash();
  const { data: f } = useFactors();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, string>>({});
  if (!q.data) return <DashState q={q} />;
  const d = q.data;

  const save = async (mode: string) => {
    const v = Number(edits[mode]);
    if (!(v >= 0 && v < 5)) return toast.error("Enter a factor between 0 and 5");
    const { error } = await supabase.from("emission_factors").update({ factor: v }).eq("mode", mode);
    if (error) return toast.error("Could not update factor");
    toast.success("Factor updated. New trips use it.");
    qc.invalidateQueries({ queryKey: ["factors"] });
  };

  return (
    <div className="fade-up">
      <PageHeader title="BRSR reports" sub="Principle 6 · Scope 3 categories 6 and 7" d={d} />
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Category split (12 weeks)</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-4"><dt className="text-sm">Cat. 6 Business travel</dt><dd className="font-display text-3xl font-semibold">{(d.cat6_kg / 1000).toFixed(2)} t</dd></div>
            <div className="rounded-xl bg-secondary p-4"><dt className="text-sm">Cat. 7 Employee commuting</dt><dd className="font-display text-3xl font-semibold">{(d.cat7_kg / 1000).toFixed(2)} t</dd></div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">CO2e = distance (passenger-km) x emission factor. Flights are reported as category 6; every other mode as category 7. Unconfirmed auto-detected trips are excluded.</p>
        </section>
        <section className="card-surface p-5">
          <h2 className="text-lg font-semibold">Emission factors</h2>
          <p className="mt-1 flex gap-2 rounded-xl bg-amber/25 p-3 text-sm"><Info className="size-4 shrink-0" /> Factors are placeholders to be replaced with India GHG Program / CEA values.</p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="pb-2 font-medium">Mode</th><th className="pb-2 font-medium">kg CO2e / p-km</th><th /></tr></thead>
            <tbody className="divide-y">
              {(f?.rows ?? []).map((r) => (
                <tr key={r.mode} className="h-14">
                  <td className="font-medium">{r.label}</td>
                  <td><Input type="number" step="0.001" min={0} className="h-11 w-28 rounded-xl" value={edits[r.mode] ?? String(r.factor)} onChange={(e) => setEdits({ ...edits, [r.mode]: e.target.value })} aria-label={`${r.label} factor`} /></td>
                  <td className="text-right">{edits[r.mode] !== undefined && Number(edits[r.mode]) !== Number(r.factor) && <Button className="h-11 rounded-xl" onClick={() => save(r.mode)}>Save</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <DemoFooter d={d} />
    </div>
  );
}
