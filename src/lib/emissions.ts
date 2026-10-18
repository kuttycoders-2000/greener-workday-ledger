import { Bike, Bus, Car, CarTaxiFront, Caravan, Footprints, Motorbike, Plane, TrainFront, type LucideIcon } from "lucide-react";

export type Mode = "walk" | "cycle" | "metro" | "bus" | "auto" | "bike" | "car" | "cab" | "flight";

export const MODES: { mode: Mode; label: string; icon: LucideIcon }[] = [
  { mode: "walk", label: "Walk", icon: Footprints },
  { mode: "cycle", label: "Cycle", icon: Bike },
  { mode: "metro", label: "Metro", icon: TrainFront },
  { mode: "bus", label: "Bus", icon: Bus },
  { mode: "auto", label: "Auto", icon: Caravan },
  { mode: "bike", label: "Bike", icon: Motorbike },
  { mode: "car", label: "Car", icon: Car },
  { mode: "cab", label: "Cab", icon: CarTaxiFront },
];

export const MODE_LABEL: Record<Mode, string> = {
  walk: "walking", cycle: "cycling", metro: "metro", bus: "bus", auto: "auto-rickshaw",
  bike: "two-wheeler", car: "car", cab: "cab", flight: "flight",
};

export const modeIcon = (m: string): LucideIcon =>
  m === "flight" ? Plane : MODES.find((x) => x.mode === m)?.icon ?? Car;

/** Placeholder India-oriented factors, kg CO2e per passenger-km. Live values come from the editable table. */
export const DEFAULT_FACTORS: Record<Mode, number> = {
  walk: 0, cycle: 0, metro: 0.04, bus: 0.08, auto: 0.1, bike: 0.05, car: 0.17, cab: 0.19, flight: 0.15,
};

export const LOW_CARBON: Mode[] = ["walk", "cycle", "metro", "bus"];

export type Factors = Record<string, number>;

export function co2For(mode: string, km: number, factors: Factors) {
  return Math.round(km * (factors[mode] ?? 0) * 1000) / 1000;
}

/** Weekly baseline = round trip distance x office days x factor of usual mode. */
export function baselineKgPerWeek(distanceKm: number, officeDays: number, mode: string, factors: Factors) {
  return Math.round(distanceKm * 2 * officeDays * (factors[mode] ?? 0) * 100) / 100;
}

export type TripLite = { date: string; mode: string; distance_km: number; co2_kg: number };

export type Tip = { title: string; body: string; savingKg: number };

const WEEKS_PER_MONTH = 4.33;

/** Rule-based recommendation: biggest source -> switch with the highest realistic monthly saving. */
export function recommend(trips: TripLite[], factors: Factors, homeKm: number): Tip {
  const bySrc = new Map<string, { kg: number; km: number; n: number }>();
  for (const t of trips) {
    if (t.mode === "flight") continue;
    const s = bySrc.get(t.mode) ?? { kg: 0, km: 0, n: 0 };
    s.kg += Number(t.co2_kg); s.km += Number(t.distance_km); s.n += 1;
    bySrc.set(t.mode, s);
  }
  const top = [...bySrc.entries()].sort((a, b) => b[1].kg - a[1].kg)[0];
  if (!top || top[1].kg < 0.5 || LOW_CARBON.includes(top[0] as Mode)) {
    return {
      title: "You are already travelling light",
      body: "Keep it up. Switching the AC off when you leave and skipping printing adds about 2 kg of savings a month.",
      savingKg: 2,
    };
  }
  const [src, s] = top;
  const tripKm = s.km / s.n || homeKm * 2;
  const oneWay = tripKm / 2;
  const candidates: Mode[] = ["metro", "bus"];
  if (oneWay <= 8) candidates.push("cycle");
  if (oneWay <= 2) candidates.push("walk");
  const days = 2;
  let best = { mode: "metro" as Mode, saving: 0 };
  for (const alt of candidates) {
    const saving = tripKm * ((factors[src] ?? 0) - (factors[alt] ?? 0)) * days * WEEKS_PER_MONTH;
    if (saving > best.saving) best = { mode: alt, saving };
  }
  const saving = Math.round(best.saving * 10) / 10;
  const verb = best.mode === "walk" ? "Walking" : best.mode === "cycle" ? "Cycling" : `Taking the ${MODE_LABEL[best.mode]}`;
  return {
    title: `Your biggest source is ${MODE_LABEL[src as Mode] ?? src} travel`,
    body: `${verb} ${days} days a week instead saves about ${saving} kg CO2e a month.`,
    savingKg: saving,
  };
}

export const HABITS = [
  { key: "ac_off", label: "AC off when leaving", kg: 0.5 },
  { key: "lights_off", label: "Lights off", kg: 0.1 },
  { key: "no_printing", label: "No printing", kg: 0.05 },
  { key: "zero_food_waste", label: "Zero food waste", kg: 0.3 },
] as const;

export const fmtKg = (n: number) => (Math.abs(n) >= 100 ? Math.round(n).toLocaleString("en-IN") : (Math.round(n * 10) / 10).toString());
export const iso = (d: Date) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
