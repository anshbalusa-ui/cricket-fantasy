"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { validateInvitationToken, validateLeagueName, validateTeamName } from "@/lib/leagues/validation";

export type LeagueActionState = { error?: string; success?: string; token?: string };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const expectedErrors: Record<string, string> = {
  "Authentication required": "Please sign in again to continue.",
  "Invalid invitation": "This invitation is invalid, expired, or has been revoked.",
  "League full": "This league is full.",
  "Already a member": "You are already a member of this league.",
  "Membership required": "You must be a league member to do that.",
  "Commissioner required": "Only the league commissioner can do that.",
  "League is not in lobby": "This action is only available while the league is in its lobby.",
  "Commissioner cannot leave": "The commissioner cannot leave this league.",
};
function expectedError(error: { message: string }) {
  const match = Object.keys(expectedErrors).find((message) => error.message.includes(message));
  return match ? expectedErrors[match] : null;
}
function unknownError(error: { message: string }): never {
  throw new Error(`League operation failed: ${error.message}`);
}

export async function createLeague(_previous: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/leagues/new");
  const name = validateLeagueName(formData.get("leagueName"));
  const teamName = validateTeamName(formData.get("teamName"));
  const seasonId = formData.get("seasonId");
  if ("error" in name) return { error: name.error };
  if ("error" in teamName) return { error: teamName.error };
  if (typeof seasonId !== "string" || !UUID_PATTERN.test(seasonId)) return { error: "Choose an available season." };
  const { data, error } = await supabase.rpc("create_league", { p_name: name.value, p_team_name: teamName.value, p_season_id: seasonId });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  if (!data) throw new Error("League creation returned no league ID.");
  revalidatePath("/dashboard");
  revalidatePath("/leagues");
  redirect(`/leagues/${data}/lobby`);
}

export async function joinLeague(_previous: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/join");
  const token = validateInvitationToken(formData.get("token"));
  const teamName = validateTeamName(formData.get("teamName"));
  if ("error" in token) return { error: token.error };
  if ("error" in teamName) return { error: teamName.error };
  const { data, error } = await supabase.rpc("join_league", { p_token: token.value, p_team_name: teamName.value });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  if (!data) throw new Error("Joining a league returned no league ID.");
  revalidatePath("/dashboard");
  revalidatePath("/leagues");
  revalidatePath(`/leagues/${data}`);
  redirect(`/leagues/${data}/lobby`);
}

export async function createInvitation(leagueId: string, _previous: LeagueActionState, _formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/leagues");
  if (!UUID_PATTERN.test(leagueId)) return { error: "League not found." };
  const { data, error } = await supabase.rpc("create_invitation", { p_league_id: leagueId });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  if (typeof data !== "string" || !/^[a-f0-9]{64}$/.test(data)) throw new Error("Invitation creation returned an invalid token.");
  revalidatePath(`/leagues/${leagueId}/lobby`);
  return { token: data, success: "Invitation link created. Share it only with people you want in this private league." };
}

export async function revokeInvitation(leagueId: string, invitationId: string, _previous: LeagueActionState, _formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/leagues");
  if (!UUID_PATTERN.test(leagueId) || !UUID_PATTERN.test(invitationId)) return { error: "Invitation not found." };
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: invitationId });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  revalidatePath(`/leagues/${leagueId}/lobby`);
  return { success: "Invitation revoked." };
}

export async function renameTeam(leagueId: string, _previous: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/leagues");
  const name = validateTeamName(formData.get("teamName"));
  if (!UUID_PATTERN.test(leagueId)) return { error: "League not found." };
  if ("error" in name) return { error: name.error };
  const { error } = await supabase.rpc("rename_team", { p_league_id: leagueId, p_name: name.value });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  revalidatePath(`/leagues/${leagueId}`);
  revalidatePath(`/leagues/${leagueId}/lobby`);
  return { success: "Team name updated." };
}

export async function renameLeague(leagueId: string, _previous: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/leagues");
  const name = validateLeagueName(formData.get("leagueName"));
  if (!UUID_PATTERN.test(leagueId)) return { error: "League not found." };
  if ("error" in name) return { error: name.error };
  const { error } = await supabase.rpc("rename_league", { p_league_id: leagueId, p_name: name.value });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  revalidatePath("/leagues");
  revalidatePath("/dashboard");
  revalidatePath(`/leagues/${leagueId}`);
  revalidatePath(`/leagues/${leagueId}/lobby`);
  return { success: "League name updated." };
}

export async function leaveLeague(leagueId: string, _previous: LeagueActionState, _formData: FormData): Promise<LeagueActionState> {
  const { supabase } = await requireUser("/leagues");
  if (!UUID_PATTERN.test(leagueId)) return { error: "League not found." };
  const { error } = await supabase.rpc("leave_league", { p_league_id: leagueId });
  if (error) {
    const message = expectedError(error);
    if (message) return { error: message };
    unknownError(error);
  }
  revalidatePath("/dashboard");
  revalidatePath("/leagues");
  redirect("/leagues");
}
