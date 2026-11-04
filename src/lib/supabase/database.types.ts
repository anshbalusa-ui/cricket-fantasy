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
          champion_team_id: string | null;
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
          champion_team_id?: string | null;
        };
        Update: {
          season_id?: string;
          name?: string;
          commissioner_user_id?: string;
          capacity?: number;
          status?: Database["public"]["Enums"]["league_status"];
          settings_version?: number;
          scoring_version?: string;
          champion_team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fantasy_leagues_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fantasy_leagues_champion_team_id_fkey";
            columns: ["champion_team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
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
          draft_position: number | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["league_member_role"];
          joined_at?: string;
          draft_position?: number | null;
        };
        Update: {
          role?: Database["public"]["Enums"]["league_member_role"];
          draft_position?: number | null;
        };
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
        Row: {
          id: string;
          league_id: string;
          manager_user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          manager_user_id: string;
          name: string;
          created_at?: string;
        };
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
      franchises: {
        Row: { id: string; competition_id: string; name: string; code: string };
        Insert: {
          id: string;
          competition_id: string;
          name: string;
          code: string;
        };
        Update: { competition_id?: string; name?: string; code?: string };
        Relationships: [
          {
            foreignKeyName: "franchises_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      cricket_players: {
        Row: {
          id: string;
          source_id: string;
          name: string;
          role: string;
          role_source: string;
        };
        Insert: {
          id: string;
          source_id: string;
          name: string;
          role: string;
          role_source: string;
        };
        Update: {
          source_id?: string;
          name?: string;
          role?: string;
          role_source?: string;
        };
        Relationships: [];
      };
      season_players: {
        Row: { season_id: string; player_id: string; franchise_id: string };
        Insert: { season_id: string; player_id: string; franchise_id: string };
        Update: { franchise_id?: string };
        Relationships: [
          {
            foreignKeyName: "season_players_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "cricket_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_players_franchise_id_fkey";
            columns: ["franchise_id"];
            isOneToOne: false;
            referencedRelation: "franchises";
            referencedColumns: ["id"];
          },
        ];
      };
      cricket_matches: {
        Row: {
          id: string;
          season_id: string;
          source_id: string;
          match_date: string;
          team_a_franchise_id: string;
          team_b_franchise_id: string;
          venue: string;
          status: string;
          source_url: string;
          source_checksum: string;
        };
        Insert: {
          id: string;
          season_id: string;
          source_id: string;
          match_date: string;
          team_a_franchise_id: string;
          team_b_franchise_id: string;
          venue: string;
          status: string;
          source_url: string;
          source_checksum: string;
        };
        Update: {
          match_date?: string;
          team_a_franchise_id?: string;
          team_b_franchise_id?: string;
          venue?: string;
          status?: string;
          source_url?: string;
          source_checksum?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cricket_matches_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cricket_matches_team_a_franchise_id_fkey";
            columns: ["team_a_franchise_id"];
            isOneToOne: false;
            referencedRelation: "franchises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cricket_matches_team_b_franchise_id_fkey";
            columns: ["team_b_franchise_id"];
            isOneToOne: false;
            referencedRelation: "franchises";
            referencedColumns: ["id"];
          },
        ];
      };
      player_match_stats: {
        Row: {
          match_id: string;
          player_id: string;
          franchise_id: string;
          stats: Json;
          source_checksum: string;
        };
        Insert: {
          match_id: string;
          player_id: string;
          franchise_id: string;
          stats: Json;
          source_checksum: string;
        };
        Update: {
          franchise_id?: string;
          stats?: Json;
          source_checksum?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "cricket_matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_match_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "cricket_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_match_stats_franchise_id_fkey";
            columns: ["franchise_id"];
            isOneToOne: false;
            referencedRelation: "franchises";
            referencedColumns: ["id"];
          },
        ];
      };
      player_match_points: {
        Row: {
          match_id: string;
          player_id: string;
          scoring_version: string;
          total_points: number;
          breakdown: Json;
        };
        Insert: {
          match_id: string;
          player_id: string;
          scoring_version: string;
          total_points: number;
          breakdown: Json;
        };
        Update: { total_points?: number; breakdown?: Json };
        Relationships: [
          {
            foreignKeyName: "player_match_points_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "cricket_matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_match_points_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "cricket_players";
            referencedColumns: ["id"];
          },
        ];
      };
      season_rounds: {
        Row: {
          id: string;
          season_id: string;
          round_number: number;
          name: string;
          stage: string;
          starts_on: string;
          ends_on: string;
        };
        Insert: {
          id: string;
          season_id: string;
          round_number: number;
          name: string;
          stage: string;
          starts_on: string;
          ends_on: string;
        };
        Update: {
          name?: string;
          stage?: string;
          starts_on?: string;
          ends_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "season_rounds_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      season_round_matches: {
        Row: { round_id: string; match_id: string };
        Insert: { round_id: string; match_id: string };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "season_round_matches_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "season_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_round_matches_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "cricket_matches";
            referencedColumns: ["id"];
          },
        ];
      };
      season_pairings: {
        Row: {
          season_id: string;
          round_number: number;
          home_position: number;
          away_position: number;
        };
        Insert: {
          season_id: string;
          round_number: number;
          home_position: number;
          away_position: number;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "season_pairings_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      cricket_ingest_runs: {
        Row: {
          id: string;
          season_id: string;
          source_url: string;
          checksum: string;
          source_version: string;
          attribution: string;
          license_url: string;
          role_policy: string;
          imported_at: string;
        };
        Insert: {
          id: string;
          season_id: string;
          source_url: string;
          checksum: string;
          source_version: string;
          attribution: string;
          license_url: string;
          role_policy: string;
          imported_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "cricket_ingest_runs_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      league_drafts: {
        Row: {
          id: string;
          league_id: string;
          status: string;
          rounds: number;
          next_pick_number: number;
          total_picks: number;
          seconds_per_pick: number;
          deadline_at: string | null;
          revision: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          status: string;
          rounds?: number;
          next_pick_number?: number;
          total_picks?: number;
          seconds_per_pick?: number;
          deadline_at?: string | null;
          revision?: number;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: string;
          next_pick_number?: number;
          deadline_at?: string | null;
          revision?: number;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_drafts_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: true;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
        ];
      };
      league_draft_picks: {
        Row: {
          id: string;
          league_id: string;
          pick_number: number;
          round_number: number;
          team_id: string;
          player_id: string;
          automatic: boolean;
          selected_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          pick_number: number;
          round_number: number;
          team_id: string;
          player_id: string;
          automatic?: boolean;
          selected_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "league_draft_picks_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_draft_picks_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_draft_picks_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "cricket_players";
            referencedColumns: ["id"];
          },
        ];
      };
      league_game_rounds: {
        Row: {
          id: string;
          league_id: string;
          season_round_id: string;
          round_number: number;
          name: string;
          stage: string;
          starts_on: string;
          ends_on: string;
          status: string;
          locked_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          season_round_id: string;
          round_number: number;
          name: string;
          stage: string;
          starts_on: string;
          ends_on: string;
          status?: string;
          locked_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: string;
          locked_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_game_rounds_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_game_rounds_season_round_id_fkey";
            columns: ["season_round_id"];
            isOneToOne: false;
            referencedRelation: "season_rounds";
            referencedColumns: ["id"];
          },
        ];
      };
      league_lineups: {
        Row: {
          league_id: string;
          round_id: string;
          team_id: string;
          slots: Json;
          submitted_at: string | null;
          locked_at: string | null;
        };
        Insert: {
          league_id: string;
          round_id: string;
          team_id: string;
          slots: Json;
          submitted_at?: string | null;
          locked_at?: string | null;
        };
        Update: {
          slots?: Json;
          submitted_at?: string | null;
          locked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_lineups_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_lineups_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "league_game_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_lineups_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      league_matchups: {
        Row: {
          id: string;
          league_id: string;
          round_id: string;
          home_team_id: string;
          away_team_id: string;
          home_seed: number | null;
          away_seed: number | null;
          home_score: number | null;
          away_score: number | null;
          status: string;
          result: string | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          round_id: string;
          home_team_id: string;
          away_team_id: string;
          home_seed?: number | null;
          away_seed?: number | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: string;
          result?: string | null;
        };
        Update: {
          home_team_id?: string;
          away_team_id?: string;
          home_seed?: number | null;
          away_seed?: number | null;
          home_score?: number | null;
          away_score?: number | null;
          status?: string;
          result?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_matchups_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_matchups_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "league_game_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_matchups_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_matchups_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      league_round_contributions: {
        Row: {
          league_id: string;
          round_id: string;
          team_id: string;
          player_id: string;
          slot_id: string;
          score: number;
          appearances: number;
        };
        Insert: {
          league_id: string;
          round_id: string;
          team_id: string;
          player_id: string;
          slot_id: string;
          score: number;
          appearances: number;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "league_round_contributions_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_round_contributions_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "league_game_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_round_contributions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_round_contributions_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "cricket_players";
            referencedColumns: ["id"];
          },
        ];
      };
      league_standings: {
        Row: {
          league_id: string;
          team_id: string;
          wins: number;
          losses: number;
          draws: number;
          points_for: number;
          points_against: number;
          seed: number | null;
        };
        Insert: {
          league_id: string;
          team_id: string;
          wins?: number;
          losses?: number;
          draws?: number;
          points_for?: number;
          points_against?: number;
          seed?: number | null;
        };
        Update: {
          wins?: number;
          losses?: number;
          draws?: number;
          points_for?: number;
          points_against?: number;
          seed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_standings_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_standings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "fantasy_teams";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      season_player_summaries: {
        Row: {
          season_id: string;
          player_id: string;
          name: string;
          role: string;
          role_source: string;
          franchise_id: string;
          franchise_name: string;
          franchise_code: string;
          appearances: number;
          scored_appearances: number;
          runs: number;
          wickets: number;
          total_points: number;
          scoring_version: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_league: {
        Args: { p_name: string; p_team_name: string; p_season_id: string };
        Returns: string;
      };
      join_league: {
        Args: { p_token: string; p_team_name: string };
        Returns: string;
      };
      create_invitation: { Args: { p_league_id: string }; Returns: string };
      revoke_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      rename_team: {
        Args: { p_league_id: string; p_name: string };
        Returns: undefined;
      };
      rename_league: {
        Args: { p_league_id: string; p_name: string };
        Returns: undefined;
      };
      leave_league: { Args: { p_league_id: string }; Returns: undefined };
      start_draft: {
        Args: { p_league_id: string; p_seconds_per_pick?: number };
        Returns: undefined;
      };
      make_draft_pick: {
        Args: {
          p_league_id: string;
          p_player_id: string;
          p_expected_pick: number;
        };
        Returns: undefined;
      };
      draft_tick: { Args: { p_league_id: string }; Returns: boolean };
      save_lineup: {
        Args: { p_league_id: string; p_round_id: string; p_slots: Json };
        Returns: undefined;
      };
      replay_round: {
        Args: { p_league_id: string; p_round_id: string };
        Returns: undefined;
      };
      recalculate_league: { Args: { p_league_id: string }; Returns: undefined };
      get_league_game: { Args: { p_league_id: string }; Returns: Json };
      get_player_history: {
        Args: { p_league_id: string; p_player_id: string };
        Returns: Json;
      };
    };
    Enums: {
      season_status: "upcoming" | "active" | "completed";
      league_status: "lobby" | "drafting" | "active" | "completed";
      league_member_role: "commissioner" | "manager";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
