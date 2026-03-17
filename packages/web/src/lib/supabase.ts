import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          phone: string | null;
          email: string | null;
          full_name: string;
          state_of_release: string;
          conviction_type: string;
          release_date: string | null;
          release_facility: string | null;
          family_situation: Record<string, unknown>;
          skills: Record<string, unknown>;
          immediate_needs: string[];
          supervision_terms: Record<string, unknown>;
          language_preference: string;
          role: string;
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      action_plans: {
        Row: {
          id: string;
          user_id: string;
          state: string;
          status: string;
          plan_data: Record<string, unknown>;
          generated_at: string;
          last_synced: string;
        };
        Insert: Omit<Database['public']['Tables']['action_plans']['Row'], 'id' | 'generated_at' | 'last_synced'>;
        Update: Partial<Database['public']['Tables']['action_plans']['Insert']>;
      };
      plan_steps: {
        Row: {
          id: string;
          plan_id: string;
          phase: string;
          category: string;
          title: string;
          description: string | null;
          instructions: Record<string, unknown>[];
          documents_needed: string[];
          deadline: string | null;
          status: string;
          completed_at: string | null;
          priority: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['plan_steps']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['plan_steps']['Insert']>;
      };
    };
  };
};
