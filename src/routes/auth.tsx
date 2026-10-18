import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthPanel } from "@/components/AuthPanel";
import { Brand } from "@/components/Brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EcoTrack" },
      { name: "description", content: "Sign in to EcoTrack or try the demo employee and admin accounts." },
      { property: "og:title", content: "Sign in — EcoTrack" },
      { property: "og:description", content: "Sign in to track your commute footprint." },
    ],
  }),
  component: () => (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Link to="/"><Brand /></Link>
      <AuthPanel />
    </div>
  ),
});
