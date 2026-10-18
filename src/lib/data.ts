import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_FACTORS, iso, type Factors } from "./emissions";

export function useSessionUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase.from("profiles").select("*, teams(name)").eq("id", u.user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [] as string[];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      return (data ?? []).map((r) => r.role as string);
    },
  });
}

export function useFactors() {
  return useQuery({
    queryKey: ["factors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("emission_factors").select("*").order("sort");
      if (error) throw error;
      const map: Factors = { ...DEFAULT_FACTORS };
      for (const r of data ?? []) map[r.mode] = Number(r.factor);
      return { rows: data ?? [], map };
    },
  });
}

export function useMyTrips(days = 90) {
  return useQuery({
    queryKey: ["trips", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .gte("date", iso(since))
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(1);
      const { data, error } = await supabase.from("office_habits").select("*").gte("date", iso(since));
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("challenges").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRewards() {
  return useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rewards").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type AdminDashboard = {
  company: { name: string; is_demo: boolean } | null;
  total_kg: number; cat6_kg: number; cat7_kg: number;
  baseline_week_kg: number; recent_week_kg: number;
  employees: number; active: number; habits_saved_kg: number;
  weekly: { week: string; kg: number }[];
  sources: { source: string; kg: number }[];
  teams: { name: string; people: number; t: number; pct: number }[];
  hidden_teams: number;
  locations: { name: string; people: number; t: number; pct: number }[];
  challenges: { id: string; name: string; description: string | null; start_date: string; end_date: string; reward: string | null; participants: number }[];
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard");
      if (error) throw error;
      return data as unknown as AdminDashboard;
    },
  });
}

export const isActiveChallenge = (c: { start_date: string; end_date: string }) => {
  const today = iso(new Date());
  return c.start_date <= today && c.end_date >= today;
};
