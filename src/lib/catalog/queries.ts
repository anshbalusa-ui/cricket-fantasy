import "server-only";
import { requireUser } from "@/lib/auth/session";
import { SCORING_VERSION } from "@/lib/fantasy/scoring";
import type {
  MatchPointBreakdown,
  PlayerMatchStats,
  PlayerRole,
} from "@/lib/fantasy/types";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogPlayer = {
  id: string;
  name: string;
  role: PlayerRole;
  roleSource: string;
  franchiseName: string;
  franchiseCode: string;
  appearances: number;
  runs: number;
  wickets: number;
  totalPoints: number;
  averagePoints: number;
};

export type SeasonWindow = {
  id: string;
  roundNumber: number;
  name: string;
  stage: "regular" | "semifinal" | "final";
  startsOn: string;
  endsOn: string;
  matchCount: number;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SummaryRow = Database["public"]["Views"]["season_player_summaries"]["Row"];

async function catalogContext(
  supabase: SupabaseClient<Database>,
  requestedSeasonId?: string,
) {
  const { data: imports, error: importError } = await supabase
    .from("cricket_ingest_runs")
    .select("season_id,source_url,license_url,attribution,role_policy,checksum")
    .order("imported_at", { ascending: false });
  if (importError)
    throw new Error("Unable to load the historical cricket catalog.");
  const readyIds = [
    ...new Set((imports ?? []).map((entry) => entry.season_id)),
  ];
  if (!readyIds.length) return null;
  const { data: seasons, error: seasonError } = await supabase
    .from("seasons")
    .select("id,name,year")
    .in("id", readyIds)
    .order("year", { ascending: false });
  if (seasonError) throw new Error("Unable to load the imported season.");
  const season = requestedSeasonId
    ? UUID.test(requestedSeasonId) &&
      seasons?.find((entry) => entry.id === requestedSeasonId)
    : seasons?.[0];
  if (!season) return null;
  const source = imports?.find((entry) => entry.season_id === season.id);
  if (!source)
    throw new Error("The historical season has no source provenance.");
  return { season, seasons: seasons ?? [], source };
}

function catalogPlayer(row: SummaryRow): CatalogPlayer {
  if (row.scored_appearances !== row.appearances)
    throw new Error("Historical appearance points are incomplete.");
  return {
    id: row.player_id,
    name: row.name,
    role: row.role as PlayerRole,
    roleSource: row.role_source,
    franchiseName: row.franchise_name,
    franchiseCode: row.franchise_code,
    appearances: row.appearances,
    runs: row.runs,
    wickets: row.wickets,
    totalPoints: Number(row.total_points),
    averagePoints: row.appearances
      ? Number(row.total_points) / row.appearances
      : 0,
  };
}

export async function getPlayerCatalog(requestedSeasonId?: string) {
  const { supabase } = await requireUser("/players");
  const context = await catalogContext(supabase, requestedSeasonId);
  if (!context) return null;
  const [players, matches] = await Promise.all([
    supabase
      .from("season_player_summaries")
      .select("*")
      .eq("season_id", context.season.id)
      .order("name"),
    supabase
      .from("cricket_matches")
      .select("id", { count: "exact", head: true })
      .eq("season_id", context.season.id),
  ]);
  if (players.error || matches.error)
    throw new Error("Unable to load recorded historical player statistics.");
  return {
    ...context,
    matchCount: matches.count ?? 0,
    players: (players.data ?? []).map(catalogPlayer),
  };
}

export async function getCatalogPlayer(playerId: string, seasonId?: string) {
  if (!UUID.test(playerId)) return null;
  const { supabase } = await requireUser(`/players/${playerId}`);
  const context = await catalogContext(supabase, seasonId);
  if (!context) return null;
  const [summary, matchRows, franchiseRows] = await Promise.all([
    supabase
      .from("season_player_summaries")
      .select("*")
      .eq("season_id", context.season.id)
      .eq("player_id", playerId)
      .maybeSingle(),
    supabase
      .from("cricket_matches")
      .select(
        "id,match_date,team_a_franchise_id,team_b_franchise_id,venue,source_url,source_id",
      )
      .eq("season_id", context.season.id)
      .order("match_date", { ascending: false }),
    supabase.from("franchises").select("id,name"),
  ]);
  if (summary.error || matchRows.error || franchiseRows.error)
    throw new Error("Unable to load the player's historical record.");
  if (!summary.data) return null;
  const player = catalogPlayer(summary.data);
  const matchIds = (matchRows.data ?? []).map((match) => match.id);
  const [stats, points] = await Promise.all([
    supabase
      .from("player_match_stats")
      .select("match_id,franchise_id,stats")
      .eq("player_id", playerId)
      .in("match_id", matchIds),
    supabase
      .from("player_match_points")
      .select("match_id,total_points,breakdown")
      .eq("player_id", playerId)
      .eq("scoring_version", SCORING_VERSION)
      .in("match_id", matchIds),
  ]);
  if (stats.error || points.error)
    throw new Error("Unable to load the player's scoring ledger.");
  const statsByMatch = new Map(
    (stats.data ?? []).map((entry) => [entry.match_id, entry]),
  );
  const pointsByMatch = new Map(
    (points.data ?? []).map((entry) => [entry.match_id, entry]),
  );
  const franchiseNames = new Map(
    (franchiseRows.data ?? []).map((entry) => [entry.id, entry.name]),
  );
  const appearances = (matchRows.data ?? []).flatMap((match) => {
    const stat = statsByMatch.get(match.id);
    if (!stat) return [];
    const score = pointsByMatch.get(match.id);
    if (!score)
      throw new Error(
        "A historical appearance has no recorded points breakdown.",
      );
    const opponentId =
      stat.franchise_id === match.team_a_franchise_id
        ? match.team_b_franchise_id
        : match.team_a_franchise_id;
    const opponent = franchiseNames.get(opponentId);
    if (!opponent)
      throw new Error("A historical opponent's identity is missing.");
    return [
      {
        matchId: match.id,
        sourceId: match.source_id,
        date: match.match_date,
        opponent,
        venue: match.venue,
        sourceUrl: match.source_url,
        stats: stat.stats as unknown as PlayerMatchStats,
        points: Number(score.total_points),
        breakdown: score.breakdown as unknown as MatchPointBreakdown,
      },
    ];
  });
  return { ...context, player, appearances, scoringVersion: SCORING_VERSION };
}

export async function getSeasonWindows(
  seasonId: string,
): Promise<SeasonWindow[]> {
  const { supabase } = await requireUser("/leagues");
  const { data, error } = await supabase
    .from("season_rounds")
    .select(
      "id,round_number,name,stage,starts_on,ends_on,season_round_matches(count)",
    )
    .eq("season_id", seasonId)
    .order("round_number");
  if (error) throw new Error("Unable to load historical fixture windows.");
  return (data ?? []).map((window) => {
    const matches = window.season_round_matches[0];
    if (!matches)
      throw new Error("A historical fixture window has no match count.");
    return {
      id: window.id,
      roundNumber: window.round_number,
      name: window.name,
      stage: window.stage as SeasonWindow["stage"],
      startsOn: window.starts_on,
      endsOn: window.ends_on,
      matchCount: matches.count,
    };
  });
}
