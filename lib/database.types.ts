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
      activity_log: {
        Row: {
          acting_as_id: string | null
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          feature: string
          id: string
          outcome: string
          summary: string
        }
        Insert: {
          acting_as_id?: string | null
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          feature: string
          id?: string
          outcome: string
          summary: string
        }
        Update: {
          acting_as_id?: string | null
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          feature?: string
          id?: string
          outcome?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_acting_as_id_fkey"
            columns: ["acting_as_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_leaders: {
        Row: {
          created_at: string
          group_id: string
          profile_id: string
          role: Database["public"]["Enums"]["group_role"]
        }
        Insert: {
          created_at?: string
          group_id: string
          profile_id: string
          role: Database["public"]["Enums"]["group_role"]
        }
        Update: {
          created_at?: string
          group_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["group_role"]
        }
        Relationships: [
          {
            foreignKeyName: "group_leaders_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_leaders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          frequency: Database["public"]["Enums"]["group_frequency"] | null
          id: string
          name: string
          photo_path: string | null
          status: Database["public"]["Enums"]["group_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["group_frequency"] | null
          id?: string
          name: string
          photo_path?: string | null
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          frequency?: Database["public"]["Enums"]["group_frequency"] | null
          id?: string
          name?: string
          photo_path?: string | null
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          id: string
          is_admin: boolean
          mobile: string | null
          name: string
          serving_since: string | null
          show_salutations: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          mobile?: string | null
          name: string
          serving_since?: string | null
          show_salutations?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          mobile?: string | null
          name?: string
          serving_since?: string | null
          show_salutations?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          activity: string | null
          attendees: number | null
          cancelled_at: string | null
          comments: string | null
          contact_mode: Database["public"]["Enums"]["contact_mode"] | null
          created_at: string
          expense_amount: number | null
          expense_details: string | null
          filed_by: string
          first_timers: number | null
          goals: string | null
          group_id: string
          id: string
          location: string | null
          person_name: string | null
          photo_paths: string[]
          report_date: string
          summary: string | null
          type: Database["public"]["Enums"]["report_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          activity?: string | null
          attendees?: number | null
          cancelled_at?: string | null
          comments?: string | null
          contact_mode?: Database["public"]["Enums"]["contact_mode"] | null
          created_at?: string
          expense_amount?: number | null
          expense_details?: string | null
          filed_by: string
          first_timers?: number | null
          goals?: string | null
          group_id: string
          id?: string
          location?: string | null
          person_name?: string | null
          photo_paths?: string[]
          report_date: string
          summary?: string | null
          type: Database["public"]["Enums"]["report_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          activity?: string | null
          attendees?: number | null
          cancelled_at?: string | null
          comments?: string | null
          contact_mode?: Database["public"]["Enums"]["contact_mode"] | null
          created_at?: string
          expense_amount?: number | null
          expense_details?: string | null
          filed_by?: string
          first_timers?: number | null
          goals?: string | null
          group_id?: string
          id?: string
          location?: string | null
          person_name?: string | null
          photo_paths?: string[]
          report_date?: string
          summary?: string | null
          type?: Database["public"]["Enums"]["report_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_filed_by_fkey"
            columns: ["filed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_leader_details: { Args: { target_id: string }; Returns: boolean }
      can_edit_report: {
        Args: {
          p_group_id: string
          p_report_id: string
          p_type: Database["public"]["Enums"]["report_type"]
        }
        Returns: boolean
      }
      current_profile_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_group_member: { Args: { group_id: string }; Returns: boolean }
      report_is_latest: { Args: { p_report_id: string }; Returns: boolean }
      report_type_summaries: { Args: { p_group_id?: string }; Returns: Json }
      set_show_salutations: { Args: { show: boolean }; Returns: undefined }
      storage_group_id: { Args: { object_name: string }; Returns: string }
    }
    Enums: {
      contact_mode: "call" | "text" | "in-person"
      group_frequency: "monthly" | "every-2-months"
      group_role: "leader" | "asst-leader"
      group_status: "active" | "closed"
      report_type: "fellowship" | "follow-up" | "next-fellowship"
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
      contact_mode: ["call", "text", "in-person"],
      group_frequency: ["monthly", "every-2-months"],
      group_role: ["leader", "asst-leader"],
      group_status: ["active", "closed"],
      report_type: ["fellowship", "follow-up", "next-fellowship"],
    },
  },
} as const
