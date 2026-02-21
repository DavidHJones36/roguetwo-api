export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string;
          description: string | null;
          end_timestamp: string | null;
          event_timestamp: string;
          host: string;
          id: number;
          pending_sitter: string | null;
          sitter: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_timestamp?: string | null;
          event_timestamp: string;
          host?: string;
          id?: number;
          pending_sitter?: string | null;
          sitter?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_timestamp?: string | null;
          event_timestamp?: string;
          host?: string;
          id?: number;
          pending_sitter?: string | null;
          sitter?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      host_sitters: {
        Row: {
          created_at: string;
          host: string;
          id: string;
          sitter: string;
          sitter_status: Database['public']['Enums']['sitter_status'];
        };
        Insert: {
          created_at?: string;
          host?: string;
          id?: string;
          sitter?: string;
          sitter_status: Database['public']['Enums']['sitter_status'];
        };
        Update: {
          created_at?: string;
          host?: string;
          id?: string;
          sitter?: string;
          sitter_status?: Database['public']['Enums']['sitter_status'];
        };
        Relationships: [];
      };
      invite_links: {
        Row: {
          created_at: string;
          expires_at: string;
          host: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string;
          host?: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          host?: string;
          id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
        };
        Relationships: [];
      };
      profiles_private: {
        Row: {
          created_at: string;
          id: string;
          isHost: boolean;
          isSitter: boolean;
          phone: string | null;
          sms_opt_in: boolean | null;
          subscription_level_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          isHost?: boolean;
          isSitter?: boolean;
          phone?: string | null;
          sms_opt_in?: boolean | null;
          subscription_level_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          isHost?: boolean;
          isSitter?: boolean;
          phone?: string | null;
          sms_opt_in?: boolean | null;
          subscription_level_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_private_subscription_level_id_fkey';
            columns: ['subscription_level_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_levels';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_levels: {
        Row: {
          created_at: string;
          events_per_month: number;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          events_per_month: number;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          events_per_month?: number;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      sitter_status: 'denied' | 'pending' | 'approved' | 'deleted' | 'invited';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
