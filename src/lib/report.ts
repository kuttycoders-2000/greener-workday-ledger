import type { AdminDashboard } from "./data";

const t = (kg: number) => (kg / 1000).toFixed(2);

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(d: AdminDashboard) {
  const rows: (string | number)[][] = [
    ["Section", "Item", "Value", "Unit"],
    ["Totals", "Total employee emissions (12 weeks)", t(d.total_kg), "t CO2e"],
    ["Totals", "Scope 3 Cat. 6 Business travel", t(d.cat6_kg), "t CO2e"],
    ["Totals", "Scope 3 Cat. 7 Employee commuting", t(d.cat7_kg), "t CO2e"],
    ["Totals", "Active employees", `${d.active} of ${d.employees}`, ""],
    ...d.weekly.map((w) => ["Weekly trend", w.week, (w.kg / 1000).toFixed(3), "t CO2e"]),
    ...d.sources.map((s) => ["By source", s.source, t(s.kg), "t CO2e"]),
    ...d.teams.map((x) => ["Team", `${x.name} (${x.people} people)`, `${x.t} t; ${x.pct}% vs baseline`, ""]),
    ...d.locations.map((x) => ["Location", `${x.name} (${x.people} people)`, `${x.t} t; ${x.pct}% vs baseline`, ""]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  download(`ecotrack-scope3-${new Date().toISOString().slice(0, 10)}.csv`, new Blob([csv], { type: "text/csv" }));
}

type FactorRow = { mode: string; label: string; factor: number };

export async function exportBrsrPdf(d: AdminDashboard, factors: FactorRow[]) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const forest: [number, number, number] = [18, 38, 30];
  const green: [number, number, number] = [31, 122, 77];
  const amber: [number, number, number] = [242, 184, 75];
  const company = d.company?.name ?? "Company";
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Cover
  doc.setFillColor(...forest);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...green);
  doc.circle(W - 60, 120, 140, "F");
  doc.setTextColor(220, 239, 227);
  doc.setFontSize(12);
  doc.text("ECOTRACK · BRSR PRINCIPLE 6 DISCLOSURE", 56, 90);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(34);
  doc.text("Scope 3 Employee", 56, 300);
  doc.text("Emissions Report", 56, 342);
  doc.setFontSize(14);
  doc.text("GHG Protocol Category 6 (Business travel) and Category 7 (Employee commuting)", 56, 380, { maxWidth: W - 112 });
  doc.setFontSize(18);
  doc.text(company, 56, 470);
  doc.setFontSize(12);
  doc.setTextColor(220, 239, 227);
  doc.text(`Reporting window: last 12 weeks · Generated ${date}`, 56, 494);
  if (d.company?.is_demo) {
    doc.setTextColor(...amber);
    doc.text("Sample data for demo", 56, H - 60);
  }

  // Summary
  doc.addPage();
  const header = (title: string) => {
    doc.setFillColor(...green);
    doc.rect(0, 0, W, 6, "F");
    doc.setTextColor(...forest);
    doc.setFontSize(20);
    doc.text(title, 48, 60);
    doc.setFontSize(9);
    doc.setTextColor(110, 120, 115);
    doc.text(`${company} · EcoTrack BRSR report · ${date}`, 48, H - 30);
  };
  header("1. Summary");
  const change = d.baseline_week_kg > 0 ? ((d.recent_week_kg - d.baseline_week_kg) / d.baseline_week_kg) * 100 : 0;
  const kpis = [
    ["Total", `${t(d.total_kg)} t CO2e`],
    ["Category 6", `${t(d.cat6_kg)} t CO2e`],
    ["Category 7", `${t(d.cat7_kg)} t CO2e`],
    ["vs baseline", `${change.toFixed(1)}%`],
  ];
  kpis.forEach(([k, v], i) => {
    const x = 48 + i * ((W - 96) / 4);
    doc.setFillColor(220, 239, 227);
    doc.roundedRect(x, 85, (W - 96) / 4 - 10, 70, 10, 10, "F");
    doc.setTextColor(...forest);
    doc.setFontSize(9);
    doc.text(k ?? "", x + 12, 105);
    doc.setFontSize(14);
    doc.text(v ?? "", x + 12, 135);
  });

  // Weekly chart
  doc.setFontSize(12);
  doc.text("Weekly emissions trend (kg CO2e)", 48, 190);
  const cx = 48, cy = 205, cw = W - 96, ch = 150;
  const max = Math.max(1, ...d.weekly.map((w) => w.kg));
  const bw = cw / d.weekly.length;
  d.weekly.forEach((w, i) => {
    const h = (w.kg / max) * (ch - 20);
    doc.setFillColor(...(i === d.weekly.length - 1 ? amber : green));
    doc.roundedRect(cx + i * bw + 6, cy + ch - h, bw - 12, h, 3, 3, "F");
    doc.setFontSize(7);
    doc.setTextColor(110, 120, 115);
    doc.text(new Date(w.week).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), cx + i * bw + bw / 2, cy + ch + 12, { align: "center" });
  });

  // Sources bars
  doc.setFontSize(12);
  doc.setTextColor(...forest);
  doc.text("Emissions by source", 48, 410);
  const smax = Math.max(1, ...d.sources.map((s) => s.kg));
  d.sources.forEach((s, i) => {
    const y = 425 + i * 22;
    doc.setFontSize(9);
    doc.setTextColor(...forest);
    doc.text(s.source, 48, y + 10);
    doc.setFillColor(...green);
    doc.roundedRect(150, y, Math.max(2, ((W - 260) * s.kg) / smax), 12, 3, 3, "F");
    doc.text(`${t(s.kg)} t`, W - 48, y + 10, { align: "right" });
  });

  autoTable(doc, {
    startY: 440 + d.sources.length * 22,
    head: [["Team", "People", "t CO2e", "% vs baseline"]],
    body: d.teams.map((x) => [x.name, x.people, x.t.toFixed(2), `${x.pct}%`]),
    headStyles: { fillColor: forest },
    margin: { left: 48, right: 48 },
    styles: { fontSize: 9 },
  });

  // Methodology
  doc.addPage();
  header("2. Methodology");
  doc.setFontSize(10);
  doc.setTextColor(40, 50, 45);
  const para = [
    "Boundary: Scope 3 emissions from employee commuting (GHG Protocol Category 7) and business travel (Category 6) for employees of the reporting entity who use EcoTrack.",
    "Activity data: trips are logged by employees or auto-detected and confirmed by them. Each trip records the mode and distance in passenger-km. Unconfirmed detections are excluded.",
    "Calculation: CO2e (kg) = distance (passenger-km) x mode emission factor (kg CO2e per passenger-km). Flights are classified as Category 6; all other modes as Category 7.",
    "Baseline: each employee sets a personal baseline (usual mode, home-office distance, office days per week). Change vs baseline compares the trailing 4-week weekly average to the summed baselines.",
    "Privacy: in line with the DPDP Act 2023, results are reported only at team and company level. Teams with fewer than 5 people are suppressed. No individual trip data appears in this report.",
    "Limitations: emission factors are placeholders and should be replaced with India GHG Program / CEA grid-based values before external assurance.",
  ];
  let y = 95;
  for (const p of para) {
    const lines = doc.splitTextToSize(p, W - 96);
    doc.text(lines, 48, y);
    y += lines.length * 14 + 10;
  }

  doc.setFontSize(14);
  doc.setTextColor(...forest);
  doc.text("3. Emission factors used", 48, y + 20);
  autoTable(doc, {
    startY: y + 32,
    head: [["Mode", "kg CO2e per passenger-km", "Scope 3 category"]],
    body: factors.map((f) => [f.label, Number(f.factor).toFixed(3), f.mode === "flight" ? "6 – Business travel" : "7 – Employee commuting"]),
    headStyles: { fillColor: green },
    margin: { left: 48, right: 48 },
    styles: { fontSize: 9 },
  });
  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(9);
  doc.setTextColor(150, 100, 20);
  doc.text("Note: factors are placeholders to be replaced with India GHG Program / CEA values.", 48, endY + 20);

  doc.save(`ecotrack-brsr-${new Date().toISOString().slice(0, 10)}.pdf`);
}
