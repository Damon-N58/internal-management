export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      company: {
        Row: {
          id: string
          name: string
          health_score: number
          priority: number
          status: string
          contract_end_date: string | null
          primary_csm: string
          implementation_lead: string
          second_lead: string | null
          third_lead: string | null
          current_objectives: string | null
          external_blockers: string | null
          internal_blockers: string | null
          future_work: string | null
          last_activity_at: string | null
          conversation_volume: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          health_score?: number
          priority?: number
          status: string
          contract_end_date?: string | null
          primary_csm: string
          implementation_lead: string
          second_lead?: string | null
          third_lead?: string | null
          current_objectives?: string | null
          external_blockers?: string | null
          internal_blockers?: string | null
          future_work?: string | null
          last_activity_at?: string | null
          conversation_volume?: number | null
        }
        Update: Partial<Database["public"]["Tables"]["company"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "technical_vault_company_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "technical_vault"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "activity_log"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ticket_company_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "ticket"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deadline_company_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "deadline"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "blocker_company_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "blocker"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "knowledge_base_entry_company_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_entry"
            referencedColumns: ["company_id"]
          },
        ]
      }
      technical_vault: {
        Row: {
          id: string
          company_id: string
          ftp_info: string | null
          api_keys: string | null
          ssh_config: string | null
          other_secrets: string | null
        }
        Insert: {
          id?: string
          company_id: string
          ftp_info?: string | null
          api_keys?: string | null
          ssh_config?: string | null
          other_secrets?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["technical_vault"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "technical_vault_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      product_change_request: {
        Row: {
          id: string
          issue: string
          description: string
          location: string
          priority: number
          requested_by: string
          assigned_to: string | null
          status: string
          deadline: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          issue: string
          description: string
          location: string
          priority?: number
          requested_by: string
          assigned_to?: string | null
          status: string
          deadline?: string | null
          completed_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["product_change_request"]["Insert"]>
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          content: string
          type: string
          company_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          type: string
          company_id: string
        }
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket: {
        Row: {
          id: string
          title: string
          status: string
          company_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          status: string
          company_id: string
        }
        Update: Partial<Database["public"]["Tables"]["ticket"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "ticket_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline: {
        Row: {
          id: string
          description: string
          due_date: string
          company_id: string
        }
        Insert: {
          id?: string
          description: string
          due_date: string
          company_id: string
        }
        Update: Partial<Database["public"]["Tables"]["deadline"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "deadline_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      blocker: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          status: string
          owner: string
          resolution_deadline: string | null
          escalation_level: number
          company_id: string
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          status?: string
          owner: string
          resolution_deadline?: string | null
          escalation_level?: number
          company_id: string
          resolved_at?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["blocker"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "blocker_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_entry: {
        Row: {
          id: string
          title: string
          content: string | null
          url: string | null
          type: string
          company_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          url?: string | null
          type: string
          company_id: string
        }
        Update: Partial<Database["public"]["Tables"]["knowledge_base_entry"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "knowledge_base_entry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      notification: {
        Row: {
          id: string
          type: string
          message: string
          priority: number
          is_read: boolean
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          message: string
          priority?: number
          is_read?: boolean
          company_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["notification"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "notification_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      health_score_log: {
        Row: {
          id: string
          company_id: string
          score: number
          breakdown: Json
          calculated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          score: number
          breakdown: Json
        }
        Update: Partial<Database["public"]["Tables"]["health_score_log"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "health_score_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
