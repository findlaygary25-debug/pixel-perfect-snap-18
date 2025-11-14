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
      affiliate_tiers: {
        Row: {
          enabled: boolean
          level: number
          percent: number
        }
        Insert: {
          enabled?: boolean
          level: number
          percent: number
        }
        Update: {
          enabled?: boolean
          level?: number
          percent?: number
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          id: number
          kind: string
          meta: Json | null
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          kind: string
          meta?: Json | null
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          kind?: string
          meta?: Json | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_connections: {
        Row: {
          created_at: string
          encrypted_access_token: string | null
          encrypted_refresh_token: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          last_rotation_at: string | null
          platform: string
          token_created_at: string | null
          token_expires_in: number | null
          token_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_access_token?: string | null
          encrypted_refresh_token?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_rotation_at?: string | null
          platform: string
          token_created_at?: string | null
          token_expires_in?: number | null
          token_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_access_token?: string | null
          encrypted_refresh_token?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_rotation_at?: string | null
          platform?: string
          token_created_at?: string | null
          token_expires_in?: number | null
          token_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: number
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: never
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: never
          user_id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: number
          project_id: number
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          project_id: number
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          project_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: number
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: number
          referrer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          referrer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          referrer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          id: number
          project_id: number
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          id?: never
          project_id: number
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          id?: never
          project_id?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          amount: number
          awarded_at: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reward_type: string
          user_id: string
        }
        Insert: {
          amount: number
          awarded_at?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reward_type: string
          user_id: string
        }
        Update: {
          amount?: number
          awarded_at?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          affiliate_level: number
          consecutive_days: number
          created_at: string
          id: string
          last_login_date: string | null
          signup_bonus_claimed: boolean
          total_earned: number
          total_referrals: number
          total_uploads: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_level?: number
          consecutive_days?: number
          created_at?: string
          id?: string
          last_login_date?: string | null
          signup_bonus_claimed?: boolean
          total_earned?: number
          total_referrals?: number
          total_uploads?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_level?: number
          consecutive_days?: number
          created_at?: string
          id?: string
          last_login_date?: string | null
          signup_bonus_claimed?: boolean
          total_earned?: number
          total_referrals?: number
          total_uploads?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_publishes: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_url: string | null
          platform_video_id: string | null
          published_at: string | null
          status: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_url?: string | null
          platform_video_id?: string | null
          published_at?: string | null
          status?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_url?: string | null
          platform_video_id?: string | null
          published_at?: string | null
          status?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_publishes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          comment_count: number
          created_at: string
          description: string | null
          duration: number | null
          file_size: number | null
          id: string
          like_count: number
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          view_count: number
          visibility: string
        }
        Insert: {
          comment_count?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          like_count?: number
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          view_count?: number
          visibility?: string
        }
        Update: {
          comment_count?: number
          created_at?: string
          description?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          like_count?: number
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          view_count?: number
          visibility?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: never
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: never
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_coins: {
        Args: {
          p_amount: number
          p_description?: string
          p_metadata?: Json
          p_reward_type: string
          p_user_id: string
        }
        Returns: number
      }
      calculate_affiliate_tier: {
        Args: { p_referral_count: number }
        Returns: number
      }
      create_user_stats: {
        Args: {
          p_affiliate_level?: number
          p_signup_bonus_claimed?: boolean
          p_total_earned?: number
          p_total_referrals?: number
          p_total_uploads?: number
          p_user_id: string
        }
        Returns: string
      }
      decrypt_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      encrypt_token: {
        Args: { token: string }
        Returns: string
      }
      get_encryption_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_platform_tokens: {
        Args: { p_platform: string }
        Returns: {
          access_token: string
          expires_at: string
          id: string
          is_active: boolean
          platform: string
          refresh_token: string
        }[]
      }
      get_stale_connections: {
        Args: Record<PropertyKey, never>
        Returns: {
          days_since_rotation: number
          expires_soon: boolean
          id: string
          platform: string
        }[]
      }
      hash_token: {
        Args: { token: string }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      revoke_platform_connection: {
        Args: { p_platform: string }
        Returns: boolean
      }
      store_platform_connection: {
        Args: {
          p_expires_in?: number
          p_platform: string
          p_token_hash: string
        }
        Returns: string
      }
      store_platform_tokens: {
        Args: {
          p_access_token: string
          p_expires_in?: number
          p_platform: string
          p_refresh_token?: string
          p_user_id: string
        }
        Returns: string
      }
      tokens_need_rotation: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          platform: string
          token_age_days: number
        }[]
      }
      wallet_increment: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
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
