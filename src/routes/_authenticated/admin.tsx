import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, LayoutDashboard, Loader2, LogOut, MapPin, ShieldCheck, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/lib/data";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Company dashboard — EcoTrack" }, { name: "description", content: "Scope 3 categories 6 and 7, team aggregates and BRSR exports." }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/teams", label: "Teams", icon: Users },
  { to: "/admin/locations", label: "Locations", icon: MapPin },
  { to: "/admin/challenges", label: "Challenges and rewards", icon: Trophy },
  { to: "/admin/reports", label: "BRSR reports", icon: FileText },
] as const;

function AdminLayout() {
  const { data: roles, isLoading } = useRoles();
  const loc = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!roles?.includes("admin"))
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-muted-foreground">The company dashboard is available to sustainability and HR admins.</p>
          <Button asChild className="mt-4 h-11 rounded-xl"><Link to="/app">Go to my footprint</Link></Button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-b bg-sidebar p-5 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <Brand />
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map(({ to, label, icon: Icon, ...rest }) => {
            const active = "exact" in rest ? loc.pathname === to || loc.pathname === to + "/" : loc.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-medium", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted")}>
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden rounded-2xl bg-forest p-4 text-sm text-forest-foreground lg:block">
          <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" /> Privacy by design</p>
          <p className="mt-1 opacity-80">You see team and company totals only. Individual trips are never visible, and teams under 5 people are hidden.</p>
        </div>
        <Button variant="ghost" className="hidden h-11 justify-start gap-2 lg:flex" onClick={signOut}><LogOut className="size-4" /> Sign out</Button>
      </aside>
      <main className="min-w-0 flex-1 p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
