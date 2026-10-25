import "server-only";
import { requireUser } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";

export type LeagueSummary = Tables<"fantasy_leagues"> & {
  season: Pick<Tables<"seasons">, "id" | "name" | "year">;
  member_count: number;
  my_team_name: string;
};
export type LeagueMember = {
  user_id: string;
  role: Tables<"league_memberships">["role"];
  joined_at: string;
  display_name: string;
  team_name: string;
};
export type LeagueDetail = {
  league: Tables<"fantasy_leagues">;
  season: Pick<Tables<"seasons">, "id" | "name" | "year" | "status">;
  members: LeagueMember[];
  currentUserId: string;
  invitation: Pick<Tables<"league_invitations">, "id" | "expires_at" | "created_at"> | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getMyLeagues(): Promise<LeagueSummary[]> {
  const { user, supabase } = await requireUser("/leagues");
  const { data: memberships, error: membershipsError } = await supabase.from("league_memberships").select("league_id").eq("user_id", user.id);
  if (membershipsError) throw new Error(`Unable to load your league memberships: ${membershipsError.message}`);
  if (!memberships?.length) return [];

  const leagueIds = memberships.map(({ league_id }) => league_id);
  const [{ data: leagues, error: leaguesError }, { data: teams, error: teamsError }, { data: allMemberships, error: allMembershipsError }] = await Promise.all([
    supabase.from("fantasy_leagues").select("*").in("id", leagueIds).order("created_at", { ascending: false }),
    supabase.from("fantasy_teams").select("league_id,manager_user_id,name").in("league_id", leagueIds),
    supabase.from("league_memberships").select("league_id").in("league_id", leagueIds),
  ]);
  if (leaguesError) throw new Error(`Unable to load leagues: ${leaguesError.message}`);
  if (teamsError) throw new Error(`Unable to load league teams: ${teamsError.message}`);
  if (allMembershipsError) throw new Error(`Unable to load league member counts: ${allMembershipsError.message}`);
  if ((leagues ?? []).length !== leagueIds.length) throw new Error("One or more joined leagues could not be loaded.");
  const seasonIds = [...new Set((leagues ?? []).map(({ season_id }) => season_id))];
  const { data: seasons, error: seasonsError } = await supabase.from("seasons").select("id,name,year").in("id", seasonIds);
  if (seasonsError) throw new Error(`Unable to load league seasons: ${seasonsError.message}`);
  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season]));
  const teamByLeague = new Map((teams ?? []).filter(({ manager_user_id }) => manager_user_id === user.id).map((team) => [team.league_id, team.name]));
  const countByLeague = new Map<string, number>();
  for (const member of allMemberships ?? []) countByLeague.set(member.league_id, (countByLeague.get(member.league_id) ?? 0) + 1);
  return (leagues ?? []).map((league) => {
    const season = seasonById.get(league.season_id);
    const myTeam = teamByLeague.get(league.id);
    const memberCount = countByLeague.get(league.id);
    if (!season || !myTeam || memberCount === undefined) throw new Error(`League ${league.id} is missing its season, manager team, or member count.`);
    return { ...league, season, member_count: memberCount, my_team_name: myTeam };
  });
}


export async function getLeagueDetail(leagueId: string): Promise<LeagueDetail | null> {
  const { user, supabase } = await requireUser(`/leagues/${leagueId}`);
  if (!UUID_PATTERN.test(leagueId)) return null;
  const { data: membership, error: membershipError } = await supabase.from("league_memberships").select("id").eq("league_id", leagueId).eq("user_id", user.id).maybeSingle();
  if (membershipError) throw new Error(`Unable to verify league membership: ${membershipError.message}`);
  if (!membership) return null;
  const { data: league, error: leagueError } = await supabase.from("fantasy_leagues").select("*").eq("id", leagueId).maybeSingle();
  if (leagueError) throw new Error(`Unable to load league: ${leagueError.message}`);
  if (!league) return null;
  const [{ data: season, error: seasonError }, { data: memberships, error: membersError }, { data: teams, error: teamsError }, { data: invitation, error: invitationError }] = await Promise.all([
    supabase.from("seasons").select("id,name,year,status").eq("id", league.season_id).maybeSingle(),
    supabase.from("league_memberships").select("user_id,role,joined_at").eq("league_id", leagueId).order("joined_at", { ascending: true }),
    supabase.from("fantasy_teams").select("manager_user_id,name").eq("league_id", leagueId),
    supabase.from("league_invitations").select("id,expires_at,created_at").eq("league_id", leagueId).is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (seasonError) throw new Error(`Unable to load league season: ${seasonError.message}`);
  if (membersError) throw new Error(`Unable to load league members: ${membersError.message}`);
  if (teamsError) throw new Error(`Unable to load league teams: ${teamsError.message}`);
  if (invitationError) throw new Error(`Unable to load invitation: ${invitationError.message}`);
  if (!season) throw new Error(`League ${league.id} references a missing season.`);
  const userIds = (memberships ?? []).map(({ user_id }) => user_id);
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id,display_name").in("id", userIds);
  if (profilesError) throw new Error(`Unable to load manager names: ${profilesError.message}`);
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const teamsByUser = new Map((teams ?? []).map((team) => [team.manager_user_id, team.name]));
  const members: LeagueMember[] = (memberships ?? []).map((member) => {
    const displayName = profilesById.get(member.user_id);
    const teamName = teamsByUser.get(member.user_id);
    if (!displayName || !teamName) throw new Error(`League ${league.id} has incomplete manager profile or team data.`);
    return { ...member, display_name: displayName, team_name: teamName };
  });
  return { league, season, members, currentUserId: user.id, invitation: invitation ?? null };
}
