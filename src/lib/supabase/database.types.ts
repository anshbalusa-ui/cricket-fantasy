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
      profiles: {
        Row: { id: string; display_name: string; created_at: string };
        Insert: { id: string; display_name: string; created_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      competitions: {
        Row: { id: string; slug: string; name: string; format: string };
        Insert: { id?: string; slug: string; name: string; format: string };
        Update: { slug?: string; name?: string; format?: string };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          competition_id: string;
          year: number;
          name: string;
          status: Database["public"]["Enums"]["season_status"];
          start_at: string | null;
          end_at: string | null;
        };
        Insert: {
          id?: string;
          competition_id: string;
          year: number;
          name: string;
          status?: Database["public"]["Enums"]["season_status"];
          start_at?: string | null;
          end_at?: string | null;
        };
        Update: {
          competition_id?: string;
          year?: number;
          name?: string;
          status?: Database["public"]["Enums"]["season_status"];
          start_at?: string | null;
          end_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seasons_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      fantasy_leagues: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          commissioner_user_id: string;
          capacity: number;
          status: Database["public"]["Enums"]["league_status"];
          settings_version: number;
          scoring_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          name: string;
          commissioner_user_id: string;
          capacity?: number;
          status?: Database["public"]["Enums"]["league_status"];
          settings_version?: number;
          scoring_version?: string;
          created_at?: string;
        };
        Update: {
          season_id?: string;
          name?: string;
          commissioner_user_id?: string;
          capacity?: number;
          status?: Database["public"]["Enums"]["league_status"];
          settings_version?: number;
          scoring_version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fantasy_leagues_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      league_memberships: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["league_member_role"];
          joined_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["league_member_role"];
          joined_at?: string;
        };
        Update: { role?: Database["public"]["Enums"]["league_member_role"] };
        Relationships: [
          {
            foreignKeyName: "league_memberships_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fantasy_teams: {
        Row: { id: string; league_id: string; manager_user_id: string; name: string; created_at: string };
        Insert: { id?: string; league_id: string; manager_user_id: string; name: string; created_at?: string };
        Update: { name?: string };
        Relationships: [
          {
            foreignKeyName: "fantasy_teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fantasy_teams_league_id_manager_user_id_fkey";
            columns: ["league_id", "manager_user_id"];
            isOneToOne: true;
            referencedRelation: "league_memberships";
            referencedColumns: ["league_id", "user_id"];
          },
          {
            foreignKeyName: "fantasy_teams_manager_user_id_fkey";
            columns: ["manager_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      league_invitations: {
        Row: {
          id: string;
          league_id: string;
          token_hash: string;
          created_by: string;
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          token_hash: string;
          created_by: string;
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: { revoked_at?: string | null };
        Relationships: [
          {
            foreignKeyName: "league_invitations_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_invitations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_league: { Args: { p_name: string; p_team_name: string; p_season_id: string }; Returns: string };
      join_league: { Args: { p_token: string; p_team_name: string }; Returns: string };
      create_invitation: { Args: { p_league_id: string }; Returns: string };
      revoke_invitation: { Args: { p_invitation_id: string }; Returns: undefined };
      rename_team: { Args: { p_league_id: string; p_name: string }; Returns: undefined };
      rename_league: { Args: { p_league_id: string; p_name: string }; Returns: undefined };
      leave_league: { Args: { p_league_id: string }; Returns: undefined };
    };
    Enums: {
      season_status: "upcoming" | "active" | "completed";
      league_status: "lobby" | "drafting" | "active" | "completed";
      league_member_role: "commissioner" | "manager";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
