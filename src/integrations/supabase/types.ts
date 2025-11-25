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
      ad_commissions: {
        Row: {
          ad_id: string
          advertiser_id: string
          affiliate_id: string
          amount: number
          commission_rate: number
          created_at: string
          id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          ad_id: string
          advertiser_id: string
          affiliate_id: string
          amount: number
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          ad_id?: string
          advertiser_id?: string
          affiliate_id?: string
          amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_commissions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_bootstrap_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          token: string
          used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      admin_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean
          ending_sales_email: boolean
          ending_sales_in_app: boolean
          ending_sales_sms: boolean
          high_value_order_threshold: number | null
          high_value_orders_email: boolean
          high_value_orders_in_app: boolean
          high_value_orders_sms: boolean
          id: string
          in_app_enabled: boolean
          new_users_email: boolean
          new_users_in_app: boolean
          new_users_sms: boolean
          notification_email: string | null
          notification_phone: string | null
          pending_orders_email: boolean
          pending_orders_in_app: boolean
          pending_orders_sms: boolean
          sms_enabled: boolean
          system_errors_email: boolean
          system_errors_in_app: boolean
          system_errors_sms: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean
          ending_sales_email?: boolean
          ending_sales_in_app?: boolean
          ending_sales_sms?: boolean
          high_value_order_threshold?: number | null
          high_value_orders_email?: boolean
          high_value_orders_in_app?: boolean
          high_value_orders_sms?: boolean
          id?: string
          in_app_enabled?: boolean
          new_users_email?: boolean
          new_users_in_app?: boolean
          new_users_sms?: boolean
          notification_email?: string | null
          notification_phone?: string | null
          pending_orders_email?: boolean
          pending_orders_in_app?: boolean
          pending_orders_sms?: boolean
          sms_enabled?: boolean
          system_errors_email?: boolean
          system_errors_in_app?: boolean
          system_errors_sms?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean
          ending_sales_email?: boolean
          ending_sales_in_app?: boolean
          ending_sales_sms?: boolean
          high_value_order_threshold?: number | null
          high_value_orders_email?: boolean
          high_value_orders_in_app?: boolean
          high_value_orders_sms?: boolean
          id?: string
          in_app_enabled?: boolean
          new_users_email?: boolean
          new_users_in_app?: boolean
          new_users_sms?: boolean
          notification_email?: string | null
          notification_phone?: string | null
          pending_orders_email?: boolean
          pending_orders_in_app?: boolean
          pending_orders_sms?: boolean
          sms_enabled?: boolean
          system_errors_email?: boolean
          system_errors_in_app?: boolean
          system_errors_sms?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          advertiser_id: string
          amount_spent: number
          clicks: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          impressions: number
          media_type: string
          media_url: string
          referred_by: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          amount_spent: number
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number
          media_type?: string
          media_url: string
          referred_by?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          amount_spent?: number
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number
          media_type?: string
          media_url?: string
          referred_by?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          created_at: string
          id: string
          level: number
          sponsor_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          sponsor_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          sponsor_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_monitor_logs: {
        Row: {
          action_taken: string | null
          action_type: string
          auto_fixed: boolean | null
          created_at: string | null
          id: string
          issue_detected: string | null
          metadata: Json | null
          severity: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_taken?: string | null
          action_type: string
          auto_fixed?: boolean | null
          created_at?: string | null
          id?: string
          issue_detected?: string | null
          metadata?: Json | null
          severity?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_taken?: string | null
          action_type?: string
          auto_fixed?: boolean | null
          created_at?: string | null
          id?: string
          issue_detected?: string | null
          metadata?: Json | null
          severity?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      alert_escalation_config: {
        Row: {
          alert_type: string
          created_at: string | null
          escalation_level: number
          id: string
          notification_channels: string[] | null
          target_role: string
          time_threshold_minutes: number
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          escalation_level: number
          id?: string
          notification_channels?: string[] | null
          target_role: string
          time_threshold_minutes: number
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          escalation_level?: number
          id?: string
          notification_channels?: string[] | null
          target_role?: string
          time_threshold_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
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
            foreignKeyName: "bookmarks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          order_index: number
          user_id: string
          video_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          order_index?: number
          user_id: string
          video_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          order_index?: number
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          is_smart: boolean | null
          name: string
          order_index: number
          rule_config: Json | null
          rule_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_smart?: boolean | null
          name: string
          order_index?: number
          rule_config?: Json | null
          rule_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_smart?: boolean | null
          name?: string
          order_index?: number
          rule_config?: Json | null
          rule_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment_text: string
          created_at: string
          flagged: boolean | null
          id: string
          moderated_at: string | null
          moderation_reason: string | null
          updated_at: string
          user_id: string
          username: string
          video_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          flagged?: boolean | null
          id?: string
          moderated_at?: string | null
          moderation_reason?: string | null
          updated_at?: string
          user_id: string
          username: string
          video_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          flagged?: boolean | null
          id?: string
          moderated_at?: string | null
          moderation_reason?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          affiliate_id: string
          amount: number
          commission_rate: number
          created_at: string | null
          customer_id: string
          id: string
          level: number
          order_id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          commission_rate: number
          created_at?: string | null
          customer_id: string
          id?: string
          level: number
          order_id: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_rate?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          level?: number
          order_id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "commissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          creator_id: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          creator_id: string
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_subscription_id?: string | null
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          creator_id?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_alerts: {
        Row: {
          affected_period_end: string | null
          affected_period_start: string | null
          alert_sent: boolean | null
          alert_sent_at: string | null
          alert_type: string
          created_at: string | null
          description: string
          escalated_at: string | null
          escalated_to: string[] | null
          escalation_history: Json | null
          escalation_level: number | null
          id: string
          metadata: Json | null
          metric_value: number | null
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          threshold_value: number | null
          title: string
        }
        Insert: {
          affected_period_end?: string | null
          affected_period_start?: string | null
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          alert_type: string
          created_at?: string | null
          description: string
          escalated_at?: string | null
          escalated_to?: string[] | null
          escalation_history?: Json | null
          escalation_level?: number | null
          id?: string
          metadata?: Json | null
          metric_value?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
          title: string
        }
        Update: {
          affected_period_end?: string | null
          affected_period_start?: string | null
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          alert_type?: string
          created_at?: string | null
          description?: string
          escalated_at?: string | null
          escalated_to?: string[] | null
          escalation_history?: Json | null
          escalation_level?: number | null
          id?: string
          metadata?: Json | null
          metric_value?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          threshold_value?: number | null
          title?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      gift_balances: {
        Row: {
          created_at: string | null
          id: string
          total_received: number | null
          total_sent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_received?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          total_received?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gift_catalog: {
        Row: {
          created_at: string | null
          gift_value: number
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          price_usd: number
          tier: string
        }
        Insert: {
          created_at?: string | null
          gift_value: number
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          price_usd: number
          tier: string
        }
        Update: {
          created_at?: string | null
          gift_value?: number
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          price_usd?: number
          tier?: string
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          affiliate_commission: number | null
          affiliate_id: string | null
          created_at: string | null
          gift_id: string
          gift_value: number
          id: string
          platform_fee: number
          recipient_id: string
          sender_id: string
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          created_at?: string | null
          gift_id: string
          gift_value: number
          id?: string
          platform_fee: number
          recipient_id: string
          sender_id: string
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_id?: string | null
          created_at?: string | null
          gift_id?: string
          gift_value?: number
          id?: string
          platform_fee?: number
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gift_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      live_stream_messages: {
        Row: {
          created_at: string | null
          id: string
          live_stream_id: string
          message: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          live_stream_id: string
          message: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          live_stream_id?: string
          message?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_stream_messages_live_stream_id_fkey"
            columns: ["live_stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean | null
          recording_duration: number | null
          started_at: string | null
          title: string
          updated_at: string | null
          user_id: string
          username: string
          video_url: string | null
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean | null
          recording_duration?: number | null
          started_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          username: string
          video_url?: string | null
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean | null
          recording_duration?: number | null
          started_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          username?: string
          video_url?: string | null
          viewer_count?: number | null
        }
        Relationships: []
      }
      notification_ab_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          notification_type: string
          start_date: string | null
          status: string
          target_audience: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          notification_type: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          notification_type?: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_delivery_logs: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          delivery_status: string | null
          error_message: string | null
          external_id: string | null
          failed_reason: string | null
          id: string
          last_status_update: string | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string
          recipient_id: string
          recipient_identifier: string
          sent_at: string
          status: string
          title: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          last_status_update?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string
          recipient_id: string
          recipient_identifier: string
          sent_at?: string
          status?: string
          title: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          error_message?: string | null
          external_id?: string | null
          failed_reason?: string | null
          id?: string
          last_status_update?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string
          recipient_id?: string
          recipient_identifier?: string
          sent_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      notification_template_content: {
        Row: {
          channel: string
          content_blocks: Json | null
          created_at: string | null
          id: string
          language_code: string
          plain_text: string | null
          preview_data: Json | null
          subject: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          content_blocks?: Json | null
          created_at?: string | null
          id?: string
          language_code: string
          plain_text?: string | null
          preview_data?: Json | null
          subject?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          content_blocks?: Json | null
          created_at?: string | null
          id?: string
          language_code?: string
          plain_text?: string | null
          preview_data?: Json | null
          subject?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_template_content_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "notification_template_content_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_template_versions: {
        Row: {
          change_description: string | null
          changed_by: string | null
          content_snapshot: Json
          created_at: string | null
          id: string
          template_id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          changed_by?: string | null
          content_snapshot: Json
          created_at?: string | null
          id?: string
          template_id: string
          version_number: number
        }
        Update: {
          change_description?: string | null
          changed_by?: string | null
          content_snapshot?: Json
          created_at?: string | null
          id?: string
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "notification_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          available_channels: string[] | null
          category: string
          created_at: string | null
          created_by: string | null
          default_language: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          available_channels?: string[] | null
          category: string
          created_at?: string | null
          created_by?: string | null
          default_language?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          available_channels?: string[] | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          default_language?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_default_language_fkey"
            columns: ["default_language"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      notification_test_assignments: {
        Row: {
          assigned_at: string | null
          id: string
          test_id: string
          user_id: string
          variant_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          test_id: string
          user_id: string
          variant_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          test_id?: string
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "notification_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_test_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "notification_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_test_metrics: {
        Row: {
          clicked_at: string | null
          conversion_event: boolean | null
          converted_at: string | null
          created_at: string | null
          id: string
          notification_clicked: boolean | null
          notification_sent_at: string | null
          notification_viewed: boolean | null
          test_id: string
          user_id: string
          variant_id: string
          viewed_at: string | null
        }
        Insert: {
          clicked_at?: string | null
          conversion_event?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          notification_clicked?: boolean | null
          notification_sent_at?: string | null
          notification_viewed?: boolean | null
          test_id: string
          user_id: string
          variant_id: string
          viewed_at?: string | null
        }
        Update: {
          clicked_at?: string | null
          conversion_event?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          notification_clicked?: boolean | null
          notification_sent_at?: string | null
          notification_viewed?: boolean | null
          test_id?: string
          user_id?: string
          variant_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_test_metrics_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "notification_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_test_metrics_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "notification_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_test_variants: {
        Row: {
          created_at: string | null
          cta_link: string | null
          cta_text: string | null
          id: string
          message_body: string
          message_title: string
          test_id: string
          traffic_allocation: number
          variant_name: string
        }
        Insert: {
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          message_body: string
          message_title: string
          test_id: string
          traffic_allocation?: number
          variant_name: string
        }
        Update: {
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          message_body?: string
          message_title?: string
          test_id?: string
          traffic_allocation?: number
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "notification_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          sender_id: string
          sender_username: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          sender_id: string
          sender_username: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          sender_id?: string
          sender_username?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_at_purchase: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_at_purchase?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          affiliate_id: string | null
          coins_paid: number | null
          created_at: string
          customer_email: string
          customer_email_encrypted: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          customer_phone_encrypted: string | null
          delivered_at: string | null
          encryption_key_id: string | null
          id: string
          payment_method: string | null
          shipped_at: string | null
          shipping_address: string
          shipping_address_encrypted: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          coins_paid?: number | null
          created_at?: string
          customer_email: string
          customer_email_encrypted?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          customer_phone_encrypted?: string | null
          delivered_at?: string | null
          encryption_key_id?: string | null
          id?: string
          payment_method?: string | null
          shipped_at?: string | null
          shipping_address: string
          shipping_address_encrypted?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          coins_paid?: number | null
          created_at?: string
          customer_email?: string
          customer_email_encrypted?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          customer_phone_encrypted?: string | null
          delivered_at?: string | null
          encryption_key_id?: string | null
          id?: string
          payment_method?: string | null
          shipped_at?: string | null
          shipping_address?: string
          shipping_address_encrypted?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_audit_logs: {
        Row: {
          accessed_at: string
          accessed_columns: string[] | null
          action: string
          id: string
          ip_address: string | null
          row_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_columns?: string[] | null
          action: string
          id?: string
          ip_address?: string | null
          row_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          accessed_columns?: string[] | null
          action?: string
          id?: string
          ip_address?: string | null
          row_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          external_link: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean
          payment_method: string | null
          price: number
          price_in_coins: number | null
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          payment_method?: string | null
          price: number
          price_in_coins?: number | null
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean
          payment_method?: string | null
          price?: number
          price_in_coins?: number | null
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_region: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          is_private: boolean | null
          referred_by: string | null
          social_links: Json | null
          updated_at: string
          user_id: string
          username: string
          website_url: string | null
        }
        Insert: {
          account_region?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          referred_by?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          username: string
          website_url?: string | null
        }
        Update: {
          account_region?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          referred_by?: string | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      promotional_banners: {
        Row: {
          background_gradient: string
          banner_type: string
          created_at: string | null
          cta_link: string | null
          cta_text: string
          description: string
          display_order: number | null
          end_date: string
          icon_name: string
          id: string
          is_active: boolean | null
          start_date: string
          subtitle: string | null
          title: string
        }
        Insert: {
          background_gradient: string
          banner_type: string
          created_at?: string | null
          cta_link?: string | null
          cta_text: string
          description: string
          display_order?: number | null
          end_date: string
          icon_name: string
          id?: string
          is_active?: boolean | null
          start_date: string
          subtitle?: string | null
          title: string
        }
        Update: {
          background_gradient?: string
          banner_type?: string
          created_at?: string | null
          cta_link?: string | null
          cta_text?: string
          description?: string
          display_order?: number | null
          end_date?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      reward_items: {
        Row: {
          created_at: string | null
          icon_name: string
          id: string
          is_available: boolean | null
          is_on_sale: boolean | null
          item_description: string
          item_name: string
          item_type: string
          metadata: Json | null
          original_price: number | null
          point_cost: number
          sale_end_date: string | null
          sale_percentage: number | null
          sale_start_date: string | null
          stock_limit: number | null
          stock_remaining: number | null
          tier: string
        }
        Insert: {
          created_at?: string | null
          icon_name: string
          id?: string
          is_available?: boolean | null
          is_on_sale?: boolean | null
          item_description: string
          item_name: string
          item_type: string
          metadata?: Json | null
          original_price?: number | null
          point_cost: number
          sale_end_date?: string | null
          sale_percentage?: number | null
          sale_start_date?: string | null
          stock_limit?: number | null
          stock_remaining?: number | null
          tier: string
        }
        Update: {
          created_at?: string | null
          icon_name?: string
          id?: string
          is_available?: boolean | null
          is_on_sale?: boolean | null
          item_description?: string
          item_name?: string
          item_type?: string
          metadata?: Json | null
          original_price?: number | null
          point_cost?: number
          sale_end_date?: string | null
          sale_percentage?: number | null
          sale_start_date?: string | null
          stock_limit?: number | null
          stock_remaining?: number | null
          tier?: string
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          id: string
          reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by: string
          id?: string
          reason?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          id?: string
          reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      scheduled_videos: {
        Row: {
          created_at: string
          id: string
          published_video_id: string | null
          scheduled_time: string
          status: string
          updated_at: string
          user_id: string
          youtube_channel: string | null
          youtube_description: string | null
          youtube_embed_url: string
          youtube_thumbnail: string | null
          youtube_title: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_video_id?: string | null
          scheduled_time: string
          status?: string
          updated_at?: string
          user_id: string
          youtube_channel?: string | null
          youtube_description?: string | null
          youtube_embed_url: string
          youtube_thumbnail?: string | null
          youtube_title: string
          youtube_video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          published_video_id?: string | null
          scheduled_time?: string
          status?: string
          updated_at?: string
          user_id?: string
          youtube_channel?: string | null
          youtube_description?: string | null
          youtube_embed_url?: string
          youtube_thumbnail?: string | null
          youtube_title?: string
          youtube_video_id?: string
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          id: string
          platform: string
          session_id: string | null
          shared_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          id?: string
          platform: string
          session_id?: string | null
          shared_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          id?: string
          platform?: string
          session_id?: string | null
          shared_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_shares_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          daily_lease_price: number | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          lease_expiry: string | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_lease_price?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lease_expiry?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_lease_price?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lease_expiry?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          benefits: string | null
          created_at: string
          creator_id: string
          duration_months: number
          id: string
          is_active: boolean | null
          platform_fee_percentage: number
          price_usd: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          created_at?: string
          creator_id: string
          duration_months: number
          id?: string
          is_active?: boolean | null
          platform_fee_percentage?: number
          price_usd: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          created_at?: string
          creator_id?: string
          duration_months?: number
          id?: string
          is_active?: boolean | null
          platform_fee_percentage?: number
          price_usd?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_transactions: {
        Row: {
          amount_paid: number
          created_at: string
          creator_earnings: number
          creator_id: string
          id: string
          payment_date: string
          platform_fee: number
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          subscriber_id: string
          subscription_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          creator_earnings: number
          creator_id: string
          id?: string
          payment_date?: string
          platform_fee: number
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          subscriber_id: string
          subscription_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          creator_earnings?: number
          creator_id?: string
          id?: string
          payment_date?: string
          platform_fee?: number
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          subscriber_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "creator_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_languages: {
        Row: {
          code: string
          is_active: boolean | null
          name: string
          native_name: string
          rtl: boolean | null
        }
        Insert: {
          code: string
          is_active?: boolean | null
          name: string
          native_name: string
          rtl?: boolean | null
        }
        Update: {
          code?: string
          is_active?: boolean | null
          name?: string
          native_name?: string
          rtl?: boolean | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_achievement_stats: {
        Row: {
          bronze_achievements: number | null
          created_at: string | null
          current_streak_days: number | null
          gold_achievements: number | null
          id: string
          last_updated: string | null
          longest_streak_days: number | null
          platinum_achievements: number | null
          points_balance: number | null
          profiles_created: number | null
          silver_achievements: number | null
          total_achievements_unlocked: number | null
          total_profile_switches: number | null
          user_id: string
        }
        Insert: {
          bronze_achievements?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          gold_achievements?: number | null
          id?: string
          last_updated?: string | null
          longest_streak_days?: number | null
          platinum_achievements?: number | null
          points_balance?: number | null
          profiles_created?: number | null
          silver_achievements?: number | null
          total_achievements_unlocked?: number | null
          total_profile_switches?: number | null
          user_id: string
        }
        Update: {
          bronze_achievements?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          gold_achievements?: number | null
          id?: string
          last_updated?: string | null
          longest_streak_days?: number | null
          platinum_achievements?: number | null
          points_balance?: number | null
          profiles_created?: number | null
          silver_achievements?: number | null
          total_achievements_unlocked?: number | null
          total_profile_switches?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string | null
          id: string
          item_data: Json | null
          item_id: string
          item_name: string
          item_type: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          id?: string
          item_data?: Json | null
          item_id: string
          item_name: string
          item_type: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string
          item_name?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          challenges_email: boolean
          challenges_in_app: boolean
          challenges_sms: boolean
          comments_email: boolean
          comments_in_app: boolean
          comments_sms: boolean
          created_at: string
          email_enabled: boolean
          flash_sales_email: boolean
          flash_sales_in_app: boolean
          flash_sales_sms: boolean
          follows_email: boolean
          follows_in_app: boolean
          follows_sms: boolean
          id: string
          in_app_enabled: boolean
          shares_email: boolean
          shares_in_app: boolean
          shares_sms: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          challenges_email?: boolean
          challenges_in_app?: boolean
          challenges_sms?: boolean
          comments_email?: boolean
          comments_in_app?: boolean
          comments_sms?: boolean
          created_at?: string
          email_enabled?: boolean
          flash_sales_email?: boolean
          flash_sales_in_app?: boolean
          flash_sales_sms?: boolean
          follows_email?: boolean
          follows_in_app?: boolean
          follows_sms?: boolean
          id?: string
          in_app_enabled?: boolean
          shares_email?: boolean
          shares_in_app?: boolean
          shares_sms?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          challenges_email?: boolean
          challenges_in_app?: boolean
          challenges_sms?: boolean
          comments_email?: boolean
          comments_in_app?: boolean
          comments_sms?: boolean
          created_at?: string
          email_enabled?: boolean
          flash_sales_email?: boolean
          flash_sales_in_app?: boolean
          flash_sales_sms?: boolean
          follows_email?: boolean
          follows_in_app?: boolean
          follows_sms?: boolean
          id?: string
          in_app_enabled?: boolean
          shares_email?: boolean
          shares_in_app?: boolean
          shares_sms?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          is_active: boolean | null
          points_spent: number
          purchased_at: string | null
          reward_item_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          points_spent: number
          purchased_at?: string | null
          reward_item_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          points_spent?: number
          purchased_at?: string | null
          reward_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_reward_item_id_fkey"
            columns: ["reward_item_id"]
            isOneToOne: false
            referencedRelation: "reward_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recommendations: {
        Row: {
          affiliate_url: string
          category: string
          created_at: string
          description: string
          id: string
          letter: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_url: string
          category: string
          created_at?: string
          description: string
          id?: string
          letter: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_url?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          letter?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_weekly_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          id: string
          is_completed: boolean | null
          reward_claimed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          reward_claimed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          reward_claimed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      video_chapters: {
        Row: {
          created_at: string
          id: string
          label: string
          timestamp: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          timestamp: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          timestamp?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_chapters_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_engagement: {
        Row: {
          created_at: string
          engagement_type: string
          id: string
          video_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          engagement_type: string
          id?: string
          video_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          engagement_type?: string
          id?: string
          video_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_engagement_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          created_at: string
          device_type: string | null
          id: string
          session_id: string
          source: string | null
          video_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: string
          session_id: string
          source?: string | null
          video_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: string
          session_id?: string
          source?: string | null
          video_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_sessions: {
        Row: {
          completion_rate: number
          created_at: string
          id: string
          last_position_seconds: number | null
          session_id: string
          updated_at: string
          video_duration: number
          video_id: string
          viewer_id: string | null
          watch_duration: number
        }
        Insert: {
          completion_rate?: number
          created_at?: string
          id?: string
          last_position_seconds?: number | null
          session_id: string
          updated_at?: string
          video_duration: number
          video_id: string
          viewer_id?: string | null
          watch_duration?: number
        }
        Update: {
          completion_rate?: number
          created_at?: string
          id?: string
          last_position_seconds?: number | null
          session_id?: string
          updated_at?: string
          video_duration?: number
          video_id?: string
          viewer_id?: string | null
          watch_duration?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_sessions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_active: boolean
          likes: number
          original_created_at: string | null
          original_source_url: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          username: string
          video_url: string
          video_url_1080p: string | null
          video_url_360p: string | null
          video_url_480p: string | null
          video_url_720p: string | null
          views: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          likes?: number
          original_created_at?: string | null
          original_source_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          username: string
          video_url: string
          video_url_1080p?: string | null
          video_url_360p?: string | null
          video_url_480p?: string | null
          video_url_720p?: string | null
          views?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          likes?: number
          original_created_at?: string | null
          original_source_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          video_url?: string
          video_url_1080p?: string | null
          video_url_360p?: string | null
          video_url_480p?: string | null
          video_url_720p?: string | null
          views?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_description: string
          challenge_title: string
          challenge_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          reward_type: string
          reward_value: string
          target_value: number
          tier: string
          week_end: string
          week_start: string
        }
        Insert: {
          challenge_description: string
          challenge_title: string
          challenge_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_type: string
          reward_value: string
          target_value: number
          tier: string
          week_end: string
          week_start: string
        }
        Update: {
          challenge_description?: string
          challenge_title?: string
          challenge_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_type?: string
          reward_value?: string
          target_value?: number
          tier?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      challenge_history_view: {
        Row: {
          challenge_description: string | null
          challenge_id: string | null
          challenge_title: string | null
          challenge_type: string | null
          completed_at: string | null
          current_progress: number | null
          is_completed: boolean | null
          reward_claimed: boolean | null
          reward_type: string | null
          reward_value: string | null
          target_value: number | null
          tier: string | null
          user_id: string | null
          week_end: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_weekly_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_store_lease_valid: {
        Args: { store_id_param: string }
        Returns: boolean
      }
      claim_admin_bootstrap: { Args: { p_token: string }; Returns: Json }
      clear_watch_history: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      create_order_with_encrypted_pii: {
        Args: {
          p_affiliate_id?: string
          p_customer_email: string
          p_customer_id: string
          p_customer_name: string
          p_customer_phone: string
          p_shipping_address: string
          p_store_id: string
          p_total_amount: number
        }
        Returns: string
      }
      decrypt_pii: {
        Args: { ciphertext: string; context?: string }
        Returns: string
      }
      encrypt_pii: {
        Args: { context?: string; plaintext: string }
        Returns: string
      }
      get_ab_test_results: {
        Args: { test_id_param: string }
        Returns: {
          click_rate: number
          conversion_rate: number
          total_clicked: number
          total_converted: number
          total_sent: number
          total_viewed: number
          variant_id: string
          variant_name: string
          view_rate: number
        }[]
      }
      get_achievement_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          anonymous_id: string
          bronze_count: number
          gold_count: number
          longest_streak: number
          platinum_count: number
          rank: number
          silver_count: number
          total_achievements: number
          total_switches: number
        }[]
      }
      get_active_sales: {
        Args: never
        Returns: {
          item_id: string
          item_name: string
          original_price: number
          sale_percentage: number
          sale_price: number
          time_remaining: unknown
        }[]
      }
      get_affiliate_chain: {
        Args: { user_id: string }
        Returns: {
          affiliate_id: string
          affiliate_username: string
          level: number
        }[]
      }
      get_current_weekly_challenges: {
        Args: never
        Returns: {
          challenge_description: string
          challenge_title: string
          challenge_type: string
          id: string
          is_completed: boolean
          reward_claimed: boolean
          reward_type: string
          reward_value: string
          target_value: number
          tier: string
          user_progress: number
          week_end: string
          week_start: string
        }[]
      }
      get_global_achievement_stats: {
        Args: never
        Returns: {
          avg_achievements_per_user: number
          top_streak: number
          total_achievements_unlocked: number
          total_profile_switches: number
          total_users: number
        }[]
      }
      get_notification_stats: {
        Args: never
        Returns: {
          challenges_email_count: number
          challenges_in_app_count: number
          challenges_sms_count: number
          comments_email_count: number
          comments_in_app_count: number
          comments_sms_count: number
          email_enabled_count: number
          flash_sales_email_count: number
          flash_sales_in_app_count: number
          flash_sales_sms_count: number
          follows_email_count: number
          follows_in_app_count: number
          follows_sms_count: number
          in_app_enabled_count: number
          shares_email_count: number
          shares_in_app_count: number
          shares_sms_count: number
          sms_enabled_count: number
          total_users: number
        }[]
      }
      get_order_with_pii: {
        Args: { order_id_param: string }
        Returns: {
          affiliate_id: string
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivered_at: string
          id: string
          shipped_at: string
          shipping_address: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_amount: number
          tracking_number: string
          updated_at: string
        }[]
      }
      get_recommended_videos: {
        Args: { limit_param?: number; user_id_param: string }
        Returns: {
          caption: string
          likes: number
          relevance_score: number
          username: string
          video_id: string
          video_url: string
          views: number
        }[]
      }
      get_user_challenge_stats: {
        Args: never
        Returns: {
          badges_earned: number
          best_week_completions: number
          completion_rate: number
          current_week_completions: number
          total_challenges_completed: number
          total_points_earned: number
          total_rewards_earned: number
        }[]
      }
      get_user_watch_history: {
        Args: {
          limit_param?: number
          offset_param?: number
          user_id_param: string
        }
        Returns: {
          caption: string
          completion_rate: number
          last_position_seconds: number
          last_watched_at: string
          total_watch_time: number
          user_id: string
          username: string
          video_duration: number
          video_id: string
          video_url: string
          watch_count: number
        }[]
      }
      get_watch_history_analytics: {
        Args: { user_id_param: string }
        Returns: Json
      }
      grant_user_role: {
        Args: {
          audit_reason?: string
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_wallet_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      log_pii_access: {
        Args: {
          p_action: string
          p_columns: string[]
          p_row_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      notify_flash_sale: { Args: never; Returns: undefined }
      purchase_reward_item: {
        Args: { points_to_spend: number; reward_item_id_param: string }
        Returns: Json
      }
      remove_from_watch_history: {
        Args: { user_id_param: string; video_id_param: string }
        Returns: undefined
      }
      revoke_user_role: {
        Args: {
          audit_reason?: string
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status: "pending" | "processing" | "completed" | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      order_status: ["pending", "processing", "completed", "cancelled"],
    },
  },
} as const
