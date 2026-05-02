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
      accounts: {
        Row: {
          account_number: string
          available_cents: number
          created_at: string
          currency: string
          held_cents: number
          id: string
          nickname: string
          owner_id: string
          status: Database["public"]["Enums"]["account_status"]
        }
        Insert: {
          account_number: string
          available_cents?: number
          created_at?: string
          currency?: string
          held_cents?: number
          id?: string
          nickname: string
          owner_id: string
          status?: Database["public"]["Enums"]["account_status"]
        }
        Update: {
          account_number?: string
          available_cents?: number
          created_at?: string
          currency?: string
          held_cents?: number
          id?: string
          nickname?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["account_status"]
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      bank_instruments: {
        Row: {
          beneficiary: string
          code: string
          created_at: string
          currency: string
          expiry_date: string | null
          face_value_cents: number
          id: string
          issue_date: string
          issued_by: string | null
          notes: string | null
          owner_id: string
          reference: string
          status: Database["public"]["Enums"]["instrument_status"]
          updated_at: string
        }
        Insert: {
          beneficiary: string
          code: string
          created_at?: string
          currency?: string
          expiry_date?: string | null
          face_value_cents: number
          id?: string
          issue_date?: string
          issued_by?: string | null
          notes?: string | null
          owner_id: string
          reference?: string
          status?: Database["public"]["Enums"]["instrument_status"]
          updated_at?: string
        }
        Update: {
          beneficiary?: string
          code?: string
          created_at?: string
          currency?: string
          expiry_date?: string | null
          face_value_cents?: number
          id?: string
          issue_date?: string
          issued_by?: string | null
          notes?: string | null
          owner_id?: string
          reference?: string
          status?: Database["public"]["Enums"]["instrument_status"]
          updated_at?: string
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          bank_name: string
          country: string
          created_at: string
          iban: string
          id: string
          name: string
          owner_id: string
          swift: string
        }
        Insert: {
          bank_name: string
          country?: string
          created_at?: string
          iban: string
          id?: string
          name: string
          owner_id: string
          swift: string
        }
        Update: {
          bank_name?: string
          country?: string
          created_at?: string
          iban?: string
          id?: string
          name?: string
          owner_id?: string
          swift?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount_cents: number
          balance_after_cents: number
          direction: string
          id: string
          posted_at: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          balance_after_cents: number
          direction: string
          id?: string
          posted_at?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          balance_after_cents?: number
          direction?: string
          id?: string
          posted_at?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          account_id: string
          amount_cents: number
          applicant_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          interest_rate: number
          notes: string | null
          purpose: string
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          updated_at: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          applicant_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          interest_rate?: number
          notes?: string | null
          purpose: string
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          interest_rate?: number
          notes?: string | null
          purpose?: string
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      otp_challenges: {
        Row: {
          code: string
          consumed: boolean
          created_at: string
          expires_at: string
          id: string
          purpose: Database["public"]["Enums"]["otp_purpose"]
          ref_id: string | null
          user_id: string
        }
        Insert: {
          code: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          purpose: Database["public"]["Enums"]["otp_purpose"]
          ref_id?: string | null
          user_id: string
        }
        Update: {
          code?: string
          consumed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: Database["public"]["Enums"]["otp_purpose"]
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone_masked: string
          rm_name: string
          tier: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          phone_masked?: string
          rm_name?: string
          tier?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone_masked?: string
          rm_name?: string
          tier?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          author_id: string
          author_role: Database["public"]["Enums"]["app_role"]
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          author_role?: Database["public"]["Enums"]["app_role"]
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          author_role?: Database["public"]["Enums"]["app_role"]
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          owner_id: string
          priority: string
          reference: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          owner_id: string
          priority?: string
          reference?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          owner_id?: string
          priority?: string
          reference?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          approved_at?: string | null
          approved_by?: string | null
          beneficiary_id?: string | null
          created_at?: string
          currency?: string
          from_account_id: string
          id?: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo?: string | null
          reference?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          to_account_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          beneficiary_id?: string | null
          created_at?: string
          currency?: string
          from_account_id?: string
          id?: string
          initiator_id?: string
          kind?: Database["public"]["Enums"]["txn_kind"]
          memo?: string | null
          reference?: string
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          to_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
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
      admin_credit_account: {
        Args: { _account: string; _amount_cents: number; _memo?: string }
        Returns: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_decide_loan: {
        Args: { _approve: boolean; _loan: string; _notes?: string }
        Returns: {
          account_id: string
          amount_cents: number
          applicant_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          interest_rate: number
          notes: string | null
          purpose: string
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "loan_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_disburse_loan: {
        Args: { _loan: string }
        Returns: {
          account_id: string
          amount_cents: number
          applicant_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          interest_rate: number
          notes: string | null
          purpose: string
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "loan_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_issue_instrument: {
        Args: {
          _beneficiary: string
          _code: string
          _currency?: string
          _expiry?: string
          _face_value_cents: number
          _notes?: string
          _owner: string
        }
        Returns: {
          beneficiary: string
          code: string
          created_at: string
          currency: string
          expiry_date: string | null
          face_value_cents: number
          id: string
          issue_date: string
          issued_by: string | null
          notes: string | null
          owner_id: string
          reference: string
          status: Database["public"]["Enums"]["instrument_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bank_instruments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_place_hold: {
        Args: { _account: string; _amount_cents: number; _memo?: string }
        Returns: {
          account_number: string
          available_cents: number
          created_at: string
          currency: string
          held_cents: number
          id: string
          nickname: string
          owner_id: string
          status: Database["public"]["Enums"]["account_status"]
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_release_hold: {
        Args: { _account: string; _amount_cents: number; _memo?: string }
        Returns: {
          account_number: string
          available_cents: number
          created_at: string
          currency: string
          held_cents: number
          id: string
          nickname: string
          owner_id: string
          status: Database["public"]["Enums"]["account_status"]
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_ticket_status: {
        Args: {
          _status: Database["public"]["Enums"]["ticket_status"]
          _ticket: string
        }
        Returns: {
          body: string
          category: string
          created_at: string
          id: string
          owner_id: string
          priority: string
          reference: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_transfer: {
        Args: { _txn: string }
        Returns: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_transfer: {
        Args: { _txn: string }
        Returns: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_transfer_otp: {
        Args: { _code: string; _otp_id: string; _txn: string }
        Returns: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_otp: {
        Args: {
          _purpose: Database["public"]["Enums"]["otp_purpose"]
          _ref?: string
        }
        Returns: {
          code: string
          expires_at: string
          id: string
        }[]
      }
      post_support_message: {
        Args: { _body: string; _ticket: string }
        Returns: {
          author_id: string
          author_role: Database["public"]["Enums"]["app_role"]
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        SetofOptions: {
          from: "*"
          to: "support_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      promote_demo_admin: { Args: never; Returns: boolean }
      reject_transfer: {
        Args: { _reason: string; _txn: string }
        Returns: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_loan_application: {
        Args: {
          _account: string
          _amount_cents: number
          _purpose: string
          _rate?: number
          _term_months: number
        }
        Returns: {
          account_id: string
          amount_cents: number
          applicant_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          interest_rate: number
          notes: string | null
          purpose: string
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "loan_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_support_ticket: {
        Args: {
          _body: string
          _category?: string
          _priority?: string
          _subject: string
        }
        Returns: {
          body: string
          category: string
          created_at: string
          id: string
          owner_id: string
          priority: string
          reference: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_transfer: {
        Args: {
          _amount_cents: number
          _beneficiary?: string
          _from_account: string
          _kind: Database["public"]["Enums"]["txn_kind"]
          _memo?: string
          _to_account?: string
        }
        Returns: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          beneficiary_id: string | null
          created_at: string
          currency: string
          from_account_id: string
          id: string
          initiator_id: string
          kind: Database["public"]["Enums"]["txn_kind"]
          memo: string | null
          reference: string
          rejected_reason: string | null
          status: Database["public"]["Enums"]["txn_status"]
          to_account_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_otp: { Args: { _code: string; _id: string }; Returns: boolean }
    }
    Enums: {
      account_status: "active" | "frozen" | "closed"
      app_role: "admin" | "client" | "operator" | "auditor"
      instrument_status: "pending" | "active" | "expired" | "cancelled"
      loan_status: "pending" | "approved" | "rejected" | "disbursed" | "closed"
      otp_purpose: "login" | "transfer" | "sensitive"
      ticket_status:
        | "open"
        | "in_progress"
        | "awaiting_client"
        | "resolved"
        | "closed"
      txn_kind:
        | "internal_transfer"
        | "external_wire"
        | "withdrawal"
        | "deposit"
        | "fee"
        | "adjustment"
        | "loan_disbursement"
      txn_status:
        | "draft"
        | "awaiting_otp"
        | "awaiting_approval"
        | "approved"
        | "rejected"
        | "settled"
        | "failed"
        | "cancelled"
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
    Enums: {
      account_status: ["active", "frozen", "closed"],
      app_role: ["admin", "client", "operator", "auditor"],
      instrument_status: ["pending", "active", "expired", "cancelled"],
      loan_status: ["pending", "approved", "rejected", "disbursed", "closed"],
      otp_purpose: ["login", "transfer", "sensitive"],
      ticket_status: [
        "open",
        "in_progress",
        "awaiting_client",
        "resolved",
        "closed",
      ],
      txn_kind: [
        "internal_transfer",
        "external_wire",
        "withdrawal",
        "deposit",
        "fee",
        "adjustment",
        "loan_disbursement",
      ],
      txn_status: [
        "draft",
        "awaiting_otp",
        "awaiting_approval",
        "approved",
        "rejected",
        "settled",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
