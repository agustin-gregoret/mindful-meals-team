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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          published: boolean
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          created_at: string
          id: string
          nutritionist_id: string
          nutritionist_notes: string
          patient_id: string
          patient_notes: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          preferred_date: string | null
          preferred_time_note: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          type: Database["public"]["Enums"]["consultation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nutritionist_id: string
          nutritionist_notes?: string
          patient_id: string
          patient_notes?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          preferred_date?: string | null
          preferred_time_note?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          type?: Database["public"]["Enums"]["consultation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nutritionist_id?: string
          nutritionist_notes?: string
          patient_id?: string
          patient_notes?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          preferred_date?: string | null
          preferred_time_note?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          type?: Database["public"]["Enums"]["consultation_type"]
          updated_at?: string
        }
        Relationships: []
      }
      meal_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          meal_log_id: string
          patient_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          meal_log_id: string
          patient_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          meal_log_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_comments_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          feedback: Database["public"]["Enums"]["feedback_level"] | null
          feeling: string
          foods: string
          id: string
          log_date: string
          log_time: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string
          patient_id: string
          portions: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback?: Database["public"]["Enums"]["feedback_level"] | null
          feeling?: string
          foods: string
          id?: string
          log_date?: string
          log_time?: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string
          patient_id: string
          portions?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback?: Database["public"]["Enums"]["feedback_level"] | null
          feeling?: string
          foods?: string
          id?: string
          log_date?: string
          log_time?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string
          patient_id?: string
          portions?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_links: {
        Row: {
          created_at: string
          id: string
          nutritionist_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nutritionist_id: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nutritionist_id?: string
          patient_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          invite_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          invite_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          invite_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      generate_invite_code: { Args: never; Returns: string }
      grant_self_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_my_patient: { Args: { _patient_id: string }; Returns: boolean }
      link_to_nutritionist: { Args: { _code: string }; Returns: string }
      my_nutritionist_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "nutritionist" | "patient"
      consultation_status:
        | "solicitada"
        | "confirmada"
        | "realizada"
        | "cancelada"
      consultation_type: "inicial" | "seguimiento"
      feedback_level: "excelente" | "bien" | "a_mejorar"
      meal_type: "desayuno" | "almuerzo" | "merienda" | "cena" | "colacion"
      payment_status: "pendiente" | "pagado"
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
      app_role: ["nutritionist", "patient"],
      consultation_status: [
        "solicitada",
        "confirmada",
        "realizada",
        "cancelada",
      ],
      consultation_type: ["inicial", "seguimiento"],
      feedback_level: ["excelente", "bien", "a_mejorar"],
      meal_type: ["desayuno", "almuerzo", "merienda", "cena", "colacion"],
      payment_status: ["pendiente", "pagado"],
    },
  },
} as const
