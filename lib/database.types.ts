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
          cta_type: string;
          cta_url: string | null;
          cta_label: string | null;
          pricing_plans: Json;
          credit_balance: number;
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
          cta_type?: string;
          cta_url?: string | null;
          cta_label?: string | null;
          pricing_plans?: Json;
          credit_balance?: number;
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
          cta_type?: string;
          cta_url?: string | null;
          cta_label?: string | null;
          pricing_plans?: Json;
          credit_balance?: number;
        };
        Relationships: [];
      };
      listing_embeddings: {
        Row: {
          business_id: string;
          embedding: string;
          document_text: string;
          search_tsv: string;
          category: string | null;
          model: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          embedding: string;
          document_text: string;
          category?: string | null;
          model?: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          embedding?: string;
          document_text?: string;
          category?: string | null;
          model?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_embeddings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_clicks: {
        Row: {
          business_id: string;
          charged_usd: number;
          created_at: string;
          destination_url: string;
          id: string;
          visitor_email: string | null;
          visitor_id: string | null;
        };
        Insert: {
          business_id: string;
          charged_usd?: number;
          created_at?: string;
          destination_url: string;
          id?: string;
          visitor_email?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          business_id?: string;
          charged_usd?: number;
          created_at?: string;
          destination_url?: string;
          id?: string;
          visitor_email?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listing_clicks_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          credit_balance: number;
          prepaid_listing_credits: number;
          full_name: string | null;
          id: string;
          role: string;
          subscription_status: string;
        };
        Insert: {
          created_at?: string;
          credit_balance?: number;
          prepaid_listing_credits?: number;
          full_name?: string | null;
          id: string;
          role?: string;
          subscription_status?: string;
        };
        Update: {
          created_at?: string;
          credit_balance?: number;
          prepaid_listing_credits?: number;
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
      record_listing_click: {
        Args: { p_business_id: string; p_destination?: string | null };
        Returns: Json;
      };
      hybrid_search_listings: {
        Args: {
          query_embedding: string;
          query_text: string;
          filter_category?: string | null;
          match_count?: number;
        };
        Returns: {
          business_id: string;
          similarity: number;
          fts_rank: number;
          hybrid_score: number;
          credit_balance: number;
          click_count: number;
          impression_count: number;
        }[];
      };
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
