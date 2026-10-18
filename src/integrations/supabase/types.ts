export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      challenges: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          name: string
          reward: string | null
          start_date: string
          target_modes: string[]
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          name: string
          reward?: string | null
          start_date: string
          target_modes?: string[]
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          reward?: string | null
          start_date?: string
          target_modes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "challenges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
        }
        Relationships: []
      }
      emission_factors: {
        Row: {
          factor: number
          label: string
          mode: string
          sort: number
          updated_at: string
        }
        Insert: {
          factor: number
          label: string
          mode: string
          sort?: number
          updated_at?: string
        }
        Update: {
          factor?: number
          label?: string
          mode?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          invited_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      office_habits: {
        Row: {
          co2_saved_kg: number
          created_at: string
          date: string
          habit_type: string
          id: string
          user_id: string
        }
        Insert: {
          co2_saved_kg?: number
          created_at?: string
          date?: string
          habit_type: string
          id?: string
          user_id: string
        }
        Update: {
          co2_saved_kg?: number
          created_at?: string
          date?: string
          habit_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          baseline_kg_per_week: number | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string
          home_distance_km: number
          id: string
          location: string | null
          office_days_per_week: number
          onboarded: boolean
          team_id: string | null
          tracking_consent: boolean
          tracking_paused: boolean
          usual_mode: string
        }
        Insert: {
          baseline_kg_per_week?: number | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          home_distance_km?: number
          id: string
          location?: string | null
          office_days_per_week?: number
          onboarded?: boolean
          team_id?: string | null
          tracking_consent?: boolean
          tracking_paused?: boolean
          usual_mode?: string
        }
        Update: {
          baseline_kg_per_week?: number | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          home_distance_km?: number
          id?: string
          location?: string | null
          office_days_per_week?: number
          onboarded?: boolean
          team_id?: string | null
          tracking_consent?: boolean
          tracking_paused?: boolean
          usual_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          company_id: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          category: string
          co2_kg: number
          created_at: string
          date: string
          distance_km: number
          id: string
          mode: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          category?: string
          co2_kg?: number
          created_at?: string
          date?: string
          distance_km: number
          id?: string
          mode: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          co2_kg?: number
          created_at?: string
          date?: string
          distance_km?: number
          id?: string
          mode?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_mode_fkey"
            columns: ["mode"]
            isOneToOne: false
            referencedRelation: "emission_factors"
            referencedColumns: ["mode"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_dashboard: { Args: never; Returns: Json }
      employee_stats: {
        Args: { _company: string }
        Returns: {
          baseline: number
          full_name: string
          location: string
          pct: number
          recent_week: number
          team_id: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      leaderboard_people: {
        Args: never
        Returns: {
          is_me: boolean
          name: string
          pct: number
          rank: number
        }[]
      }
      leaderboard_teams: {
        Args: never
        Returns: {
          is_mine: boolean
          name: string
          pct: number
          people: number
          rank: number
        }[]
      }
      my_company_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee"],
    },
  },
} as const
