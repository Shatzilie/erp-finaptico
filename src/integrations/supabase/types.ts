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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          data_summary: Json | null
          deleted_at: string | null
          details: Json | null
          execution_time_ms: number | null
          id: string
          ip_address: unknown
          resource_type: string
          status_code: number | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          data_summary?: Json | null
          deleted_at?: string | null
          details?: Json | null
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown
          resource_type: string
          status_code?: number | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          data_summary?: Json | null
          deleted_at?: string | null
          details?: Json | null
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown
          resource_type?: string
          status_code?: number | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          read_by: string[] | null
          sender_id: string
          task_id: string | null
          tenant_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read_by?: string[] | null
          sender_id: string
          task_id?: string | null
          tenant_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read_by?: string[] | null
          sender_id?: string
          task_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      odoo_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          data: Json
          expires_at: string
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odoo_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_employees: {
        Row: {
          base_salary: number | null
          contract_end_date: string | null
          contract_start_date: string
          created_at: string | null
          employee_name: string
          employee_nif: string
          employee_type: string
          id: string
          irpf_percentage: number | null
          is_active: boolean | null
          notes: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          base_salary?: number | null
          contract_end_date?: string | null
          contract_start_date: string
          created_at?: string | null
          employee_name: string
          employee_nif: string
          employee_type: string
          id?: string
          irpf_percentage?: number | null
          is_active?: boolean | null
          notes?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          base_salary?: number | null
          contract_end_date?: string | null
          contract_start_date?: string
          created_at?: string | null
          employee_name?: string
          employee_nif?: string
          employee_type?: string
          id?: string
          irpf_percentage?: number | null
          is_active?: boolean | null
          notes?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_payslips: {
        Row: {
          base_salary: number
          bonuses: number | null
          created_at: string | null
          employee_id: string
          gross_salary: number
          id: string
          irpf_amount: number
          net_salary: number
          notes: string | null
          overtime: number | null
          payment_date: string | null
          payment_status: string | null
          period_month: number
          period_year: number
          ss_employee: number
          ss_employer: number
          tenant_id: string
          total_cost: number
          updated_at: string | null
        }
        Insert: {
          base_salary: number
          bonuses?: number | null
          created_at?: string | null
          employee_id: string
          gross_salary: number
          id?: string
          irpf_amount: number
          net_salary: number
          notes?: string | null
          overtime?: number | null
          payment_date?: string | null
          payment_status?: string | null
          period_month: number
          period_year: number
          ss_employee: number
          ss_employer: number
          tenant_id: string
          total_cost: number
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          bonuses?: number | null
          created_at?: string | null
          employee_id?: string
          gross_salary?: number
          id?: string
          irpf_amount?: number
          net_salary?: number
          notes?: string | null
          overtime?: number | null
          payment_date?: string | null
          payment_status?: string | null
          period_month?: number
          period_year?: number
          ss_employee?: number
          ss_employer?: number
          tenant_id?: string
          total_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "payroll_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payslips_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          last_request_at: string | null
          request_count: number | null
          updated_at: string | null
          user_id: string
          window_minutes: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          last_request_at?: string | null
          request_count?: number | null
          updated_at?: string | null
          user_id: string
          window_minutes?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          last_request_at?: string | null
          request_count?: number | null
          updated_at?: string | null
          user_id?: string
          window_minutes?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          error_text: string | null
          finished_at: string | null
          id: string
          provider: string
          started_at: string
          stats: Json | null
          status: string
          tenant_id: string
        }
        Insert: {
          error_text?: string | null
          finished_at?: string | null
          id?: string
          provider: string
          started_at?: string
          stats?: Json | null
          status?: string
          tenant_id: string
        }
        Update: {
          error_text?: string | null
          finished_at?: string | null
          id?: string
          provider?: string
          started_at?: string
          stats?: Json | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          metadata: Json | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          metadata?: Json | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string
          source: string
          status: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          source: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          source?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_features: {
        Row: {
          show_advisory: boolean
          show_calendar: boolean
          show_company: boolean
          show_dashboard: boolean
          show_docs: boolean
          show_expenses: boolean
          show_invoicing: boolean
          show_irpf: boolean
          show_is: boolean
          show_treasury: boolean
          show_vat: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          show_advisory?: boolean
          show_calendar?: boolean
          show_company?: boolean
          show_dashboard?: boolean
          show_docs?: boolean
          show_expenses?: boolean
          show_invoicing?: boolean
          show_irpf?: boolean
          show_is?: boolean
          show_treasury?: boolean
          show_vat?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          show_advisory?: boolean
          show_calendar?: boolean
          show_company?: boolean
          show_dashboard?: boolean
          show_docs?: boolean
          show_expenses?: boolean
          show_invoicing?: boolean
          show_irpf?: boolean
          show_is?: boolean
          show_treasury?: boolean
          show_vat?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_odoo_config: {
        Row: {
          bank_journal_ids: number[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          odoo_base_url: string
          odoo_company_id: number
          odoo_db: string
          odoo_password_vault_key: string | null
          odoo_username: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          bank_journal_ids?: number[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          odoo_base_url: string
          odoo_company_id: number
          odoo_db: string
          odoo_password_vault_key?: string | null
          odoo_username: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_journal_ids?: number[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          odoo_base_url?: string
          odoo_company_id?: number
          odoo_db?: string
          odoo_password_vault_key?: string | null
          odoo_username?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_odoo_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          company_legal_name: string | null
          company_logo_url: string | null
          company_tax_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          name: string
          odoo_company_id: number
          slug: string
        }
        Insert: {
          company_legal_name?: string | null
          company_logo_url?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          odoo_company_id: number
          slug: string
        }
        Update: {
          company_legal_name?: string | null
          company_logo_url?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          odoo_company_id?: number
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          is_superadmin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          is_superadmin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          is_superadmin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_tenant_access: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenant_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_data: {
        Row: {
          computed_at: string
          freshness_seconds: number
          id: string
          key: string
          payload: Json
          tenant_id: string
        }
        Insert: {
          computed_at?: string
          freshness_seconds?: number
          id?: string
          key: string
          payload: Json
          tenant_id: string
        }
        Update: {
          computed_at?: string
          freshness_seconds?: number
          id?: string
          key?: string
          payload?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_actions_by_type_24h: {
        Row: {
          action: string | null
          last_occurrence: string | null
          total_count: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      v_endpoint_performance_24h: {
        Row: {
          avg_ms: number | null
          endpoint: string | null
          max_ms: number | null
          min_ms: number | null
          p95_ms: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      v_sync_stats_7d: {
        Row: {
          avg_duration_seconds: number | null
          failed_syncs: number | null
          last_sync: string | null
          successful_syncs: number | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_slug: string | null
          total_syncs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_limit?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: {
          allowed: boolean
          limit_value: number
          remaining: number
          reset_at: string
        }[]
      }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      cleanup_old_audit_logs: {
        Args: never
        Returns: {
          deleted_count: number
          oldest_remaining_date: string
        }[]
      }
      cleanup_old_rate_limits: {
        Args: { p_days_old?: number }
        Returns: number
      }
      get_current_rate_limits: {
        Args: never
        Returns: {
          email: string
          endpoint: string
          request_count: number
          requests_remaining: number
          status: string
          user_id: string
          window_end: string
          window_start: string
        }[]
      }
      get_modelo_111: {
        Args: { p_quarter: number; p_tenant_id: string; p_year: number }
        Returns: Json
      }
      get_odoo_config_decrypted: {
        Args: { p_tenant_id: string }
        Returns: {
          bank_journal_ids: number[]
          company_id: number
          odoo_db: string
          odoo_password: string
          odoo_url: string
          odoo_username: string
          tenant_id: string
          tenant_name: string
          tenant_slug: string
        }[]
      }
      get_rate_limit_exceeded_7d: {
        Args: never
        Returns: {
          email: string
          endpoint: string
          exceeded_count: number
          last_occurrence: string
          user_id: string
        }[]
      }
      get_rate_limit_stats: {
        Args: { p_user_id?: string }
        Returns: {
          current_count: number
          endpoint: string
          is_near_limit: boolean
          last_request_at: string
          user_id: string
          window_start: string
        }[]
      }
      get_user_activity_24h: {
        Args: never
        Returns: {
          email: string
          first_access: string
          last_access: string
          rate_limit_hits: number
          total_requests: number
          unique_endpoints: number
          user_id: string
        }[]
      }
      get_user_tenant: { Args: { p_user_id: string }; Returns: string }
      get_user_tenant_slug: { Args: { p_user_id: string }; Returns: string }
      log_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource: string
          p_tenant_id: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      soft_delete_old_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      user_has_tenant_access:
        | { Args: { p_tenant_id: string }; Returns: boolean }
        | { Args: { p_tenant_id: string; p_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
