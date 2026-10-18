import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { Home, Loader2, PlusCircle, Settings, Trophy } from "lucide-react";
import { useProfile } from "@/lib/data";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "EcoTrack — My footprint" }, { name: "description", content: "Your personal commute footprint." }] }),
  component: AppLayout,
});

function AppLayout() {
  const { data: profile, isLoading, error } = useProfile();
  const loc = useLocation();
  const onOnboarding = loc.pathname.startsWith("/app/onboarding");

  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
    );
  if (error || !profile)
    return <div className="grid min-h-screen place-items-center p-6 text-center text-sm text-muted-foreground">Could not load your profile. Please refresh.</div>;
  if (!profile.onboarded && !onOnboarding) return <Navigate to="/app/onboarding" />;

  const tabs = [
    { to: "/app", label: "Home", icon: Home, exact: true },
    { to: "/app/log", label: "Log trip", icon: PlusCircle },
    { to: "/app/ranks", label: "Ranks", icon: Trophy },
  ] as const;

  return (
    <div className="mx-auto min-h-screen max-w-[430px] pb-28">
      {!onOnboarding && (
        <header className="flex h-16 items-center justify-between px-5">
          <Brand />
          <Link to="/app/settings" aria-label="Settings and privacy" className="grid size-11 place-items-center rounded-full border bg-card">
            <Settings className="size-5" />
          </Link>
        </header>
      )}
      <main className="px-5">
        <Outlet />
      </main>
      {!onOnboarding && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur">
          <div className="mx-auto grid max-w-[430px] grid-cols-3 pb-[env(safe-area-inset-bottom)]">
            {tabs.map(({ to, label, icon: Icon, ...rest }) => {
              const active = "exact" in rest ? loc.pathname === to || loc.pathname === to + "/" : loc.pathname.startsWith(to);
              return (
                <Link key={to} to={to} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
