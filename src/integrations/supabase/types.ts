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
          id: string
          updated_at: string
          user_id: string
          username: string
          video_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
          video_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
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
          started_at: string | null
          title: string
          updated_at: string | null
          user_id: string
          username: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean | null
          started_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          username: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean | null
          started_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          username?: string
          viewer_count?: number | null
        }
        Relationships: []
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
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          id: string
          shipped_at: string | null
          shipping_address: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          id?: string
          shipped_at?: string | null
          shipping_address: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string
          customer_email?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          id?: string
          shipped_at?: string | null
          shipping_address?: string
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
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price: number
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
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
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          referred_by: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          referred_by?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          referred_by?: string | null
          updated_at?: string
          user_id?: string
          username?: string
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
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
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
      increment_wallet_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      notify_flash_sale: { Args: never; Returns: undefined }
      purchase_reward_item: {
        Args: { points_to_spend: number; reward_item_id_param: string }
        Returns: Json
      }
    }
    Enums: {
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
      order_status: ["pending", "processing", "completed", "cancelled"],
    },
  },
} as const
