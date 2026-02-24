export type SupabaseDatabase = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          owner_github_id: number;
          name: string;
          scene_json: string;
          version: number;
          created_at: string;
          updated_at: string;
          last_opened_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_github_id: number;
          name: string;
          scene_json: string;
          version?: number;
          created_at?: string;
          updated_at?: string;
          last_opened_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          id: string;
          owner_github_id: number;
          name: string;
          scene_json: string;
          version: number;
          created_at: string;
          updated_at: string;
          last_opened_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
