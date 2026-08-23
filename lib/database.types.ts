export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      businesses: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          extra_details: string | null;
          id: string;
          is_featured: boolean;
          is_fictional: boolean;
          logo_url: string | null;
          name: string;
          offer_summary: string | null;
          owner_id: string | null;
          scraped_content: string | null;
          slug: string | null;
          subscription_status: string;
          tagline: string | null;
          tags: string[];
          target_audience: string | null;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          extra_details?: string | null;
          id?: string;
          is_featured?: boolean;
          is_fictional?: boolean;
          logo_url?: string | null;
          name: string;
          offer_summary?: string | null;
          owner_id?: string | null;
          scraped_content?: string | null;
          slug?: string | null;
          subscription_status?: string;
          tagline?: string | null;
          tags?: string[];
          target_audience?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          extra_details?: string | null;
          id?: string;
          is_featured?: boolean;
          is_fictional?: boolean;
          logo_url?: string | null;
          name?: string;
          offer_summary?: string | null;
          owner_id?: string | null;
          scraped_content?: string | null;
          slug?: string | null;
          subscription_status?: string;
          tagline?: string | null;
          tags?: string[];
          target_audience?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: string;
          subscription_status: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: string;
          subscription_status?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
          subscription_status?: string;
        };
        Relationships: [];
      };
      search_sessions: {
        Row: {
          answers: Json;
          completed_at: string | null;
          created_at: string;
          id: string;
          match_reason: string | null;
          match_score: number | null;
          matched_business_id: string | null;
          pain_point: string;
          question_count: number;
          status: string;
          user_id: string | null;
        };
        Insert: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          match_reason?: string | null;
          match_score?: number | null;
          matched_business_id?: string | null;
          pain_point: string;
          question_count?: number;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          answers?: Json;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          match_reason?: string | null;
          match_score?: number | null;
          matched_business_id?: string | null;
          pain_point?: string;
          question_count?: number;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "search_sessions_matched_business_id_fkey";
            columns: ["matched_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SearchSession = Database["public"]["Tables"]["search_sessions"]["Row"];
