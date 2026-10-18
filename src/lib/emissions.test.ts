import { describe, expect, it } from "vitest";
import { baselineKgPerWeek, co2For, DEFAULT_FACTORS, recommend } from "./emissions";

describe("emission engine", () => {
  it("co2 = distance x factor (car 10 km = 1.7 kg)", () => {
    expect(co2For("car", 10, DEFAULT_FACTORS)).toBe(1.7);
  });
  it("metro factor is 0.04", () => {
    expect(co2For("metro", 100, DEFAULT_FACTORS)).toBe(4);
  });
  it("baseline: 12 km by car, 4 days = 16.32 kg/week", () => {
    expect(baselineKgPerWeek(12, 4, "car", DEFAULT_FACTORS)).toBe(16.32);
  });
  it("recommends a switch away from the biggest source", () => {
    const trips = Array.from({ length: 8 }, () => ({ date: "2026-10-01", mode: "car", distance_km: 24, co2_kg: 4.08 }));
    const tip = recommend(trips, DEFAULT_FACTORS, 12);
    // 24 km x (0.17 - 0.04) x 2 days x 4.33 = 27.0 kg
    expect(tip.savingKg).toBe(27);
    expect(tip.body).toContain("metro");
  });
});
