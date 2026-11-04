import "server-only";
import { requireUser } from "@/lib/auth/session";
import type { LeagueGameSnapshot, PlayerHistory } from "@/lib/gameplay/types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function absent(error: { code: string; message: string }): boolean {
  if (error.code !== "P0001") return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("membership required") || message.includes("not found")
  );
}

function objectResult(
  data: unknown,
  error: { code: string; message: string } | null,
  description: string,
): Record<string, unknown> | null {
  if (error) {
    if (absent(error)) return null;
    throw new Error(description);
  }
  if (data === null) return null;
  if (typeof data !== "object" || Array.isArray(data))
    throw new Error(description);
  return data as Record<string, unknown>;
}

export async function getLeagueGame(
  leagueId: string,
): Promise<LeagueGameSnapshot | null> {
  const { supabase } = await requireUser(`/leagues/${leagueId}`);
  if (!UUID.test(leagueId)) return null;
  const { data, error } = await supabase.rpc("get_league_game", {
    p_league_id: leagueId,
  });
  const result = objectResult(data, error, "Unable to load league gameplay.");
  return result ? (result as unknown as LeagueGameSnapshot) : null;
}

export async function getPlayerHistory(
  leagueId: string,
  playerId: string,
): Promise<PlayerHistory | null> {
  const { supabase } = await requireUser(`/leagues/${leagueId}`);
  if (!UUID.test(leagueId) || !UUID.test(playerId)) return null;
  const { data, error } = await supabase.rpc("get_player_history", {
    p_league_id: leagueId,
    p_player_id: playerId,
  });
  const result = objectResult(data, error, "Unable to load player history.");
  return result ? (result as unknown as PlayerHistory) : null;
}
