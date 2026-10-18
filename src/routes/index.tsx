import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Lock, Route as RouteIcon } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoTrack — Scope 3 commute and travel tracking for Indian workplaces" },
      { name: "description", content: "Employees log commutes in seconds. Companies get GHG Protocol category 6 and 7 data in BRSR format, privacy-first." },
      { property: "og:title", content: "EcoTrack — workplace carbon footprint tracker" },
      { property: "og:description", content: "Commute, business travel and office habits turned into BRSR-ready Scope 3 data." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-20">
        <div className="fade-up">
          <Brand />
          <h1 className="mt-10 text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Your commute, measured.<br />
            <span className="text-primary">Your company's Scope 3, solved.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            EcoTrack turns daily commutes, business travel and office habits into CO2e data, and gives sustainability teams
            GHG Protocol category 6 and 7 numbers in India's BRSR format.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { i: RouteIcon, t: "Log in 5 seconds", d: "Or confirm auto-detected trips" },
              { i: BarChart3, t: "BRSR-ready reports", d: "CSV and PDF exports" },
              { i: Lock, t: "Private by design", d: "Admins see teams, never people" },
            ].map(({ i: I, t, d }) => (
              <li key={t} className="card-surface p-4">
                <I className="size-5 text-primary" />
                <p className="mt-3 font-semibold">{t}</p>
                <p className="text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-md">
          <AuthPanel />
        </div>
      </div>
    </div>
  );
}
