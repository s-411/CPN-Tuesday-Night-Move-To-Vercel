export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          subscription_tier: 'boyfriend' | 'player' | 'free' | 'premium' | 'lifetime'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_plan_type: 'weekly' | 'annual' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_period_start: string | null
          subscription_period_end: string | null
          subscription_end_date: string | null
          has_seen_paywall: boolean
          onboarding_completed_at: string | null
          created_at: string
          updated_at: string
          last_login_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'boyfriend' | 'player' | 'free' | 'premium' | 'lifetime'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_plan_type?: 'weekly' | 'annual' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_start?: string | null
          subscription_period_end?: string | null
          subscription_end_date?: string | null
          has_seen_paywall?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'boyfriend' | 'player' | 'free' | 'premium' | 'lifetime'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | null
          subscription_plan_type?: 'weekly' | 'annual' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_start?: string | null
          subscription_period_end?: string | null
          subscription_end_date?: string | null
          has_seen_paywall?: boolean
          onboarding_completed_at?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string
        }
      }
      girls: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number
          nationality: string | null
          ethnicity: string | null
          hair_color: string | null
          location_city: string | null
          location_country: string | null
          rating: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age: number
          nationality?: string | null
          ethnicity?: string | null
          hair_color?: string | null
          location_city?: string | null
          location_country?: string | null
          rating: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number
          nationality?: string | null
          ethnicity?: string | null
          hair_color?: string | null
          location_city?: string | null
          location_country?: string | null
          rating?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      data_entries: {
        Row: {
          id: string
          girl_id: string
          date: string
          amount_spent: number
          duration_minutes: number
          number_of_nuts: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          girl_id: string
          date: string
          amount_spent: number
          duration_minutes: number
          number_of_nuts: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          girl_id?: string
          date?: string
          amount_spent?: number
          duration_minutes?: number
          number_of_nuts?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme_settings: Json
          datetime_settings: Json
          privacy_settings: Json
          notification_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme_settings?: Json
          datetime_settings?: Json
          privacy_settings?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme_settings?: Json
          datetime_settings?: Json
          privacy_settings?: Json
          notification_settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      leaderboard_groups: {
        Row: {
          id: string
          name: string
          created_by: string
          invite_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          invite_token?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          invite_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      leaderboard_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          display_username: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          display_username: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          display_username?: string
          joined_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_invite_token: {
        Args: { token: string }
        Returns: {
          group_id: string
          group_name: string
          creator_email: string
          member_count: number
        }[]
      }
      get_user_leaderboard_stats: {
        Args: { user_uuid: string }
        Returns: {
          total_spent: number
          total_nuts: number
          cost_per_nut: number
          total_time_minutes: number
          total_girls: number
          efficiency_score: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
