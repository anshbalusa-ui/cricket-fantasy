"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { LineupSelection } from "@/lib/gameplay/types";

const SLOT_IDS: Record<string, true> = {
  WK1: true,
  BAT1: true,
  BAT2: true,
  BOWL1: true,
  BOWL2: true,
  ALL1: true,
  ALL2: true,
  FLEX1: true,
  FLEX2: true,
  FLEX3: true,
  FLEX4: true,
};
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ActionResult = { error?: string };

type GameplayRpc =
  | "start_draft"
  | "make_draft_pick"
  | "draft_tick"
  | "save_lineup"
  | "replay_round"
  | "recalculate_league";

function messageFor(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase();
  if (message.includes("authentication")) return "Sign in to continue.";
  if (message.includes("membership") || message.includes("not found"))
    return "League not found.";
  if (message.includes("commissioner"))
    return "Commissioner permissions are required for this action.";
  if (
    message.includes("stale") ||
    message.includes("turn") ||
    message.includes("deadline") ||
    message.includes("pick") ||
    message.includes("draft")
  )
    return "The draft has changed. Refresh and try again.";
  if (
    message.includes("lineup") ||
    message.includes("owned") ||
    message.includes("locked") ||
    message.includes("round")
  )
    return "That lineup or round is no longer editable.";
  if (
    message.includes("ready") ||
    message.includes("role") ||
    message.includes("player") ||
    message.includes("season")
  )
    return "This action is not available for the current league state.";
  return "Unable to complete this gameplay action right now.";
}

async function invoke(
  leagueId: string,
  rpc: GameplayRpc,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (!UUID.test(leagueId)) return { error: "League not found." };
  if (!isSupabaseConfigured()) return { error: "Sign in to continue." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Sign in to continue." };
    const { error } = await supabase.rpc(rpc, args as never);
    if (error) return { error: messageFor(error) };
    revalidatePath(`/leagues/${leagueId}`);
    revalidatePath(`/leagues/${leagueId}/lobby`);
    revalidatePath("/leagues");
    revalidatePath("/dashboard");
    return {};
  } catch {
    return { error: "Unable to complete this gameplay action right now." };
  }
}

export async function startDraftAction(
  leagueId: string,
): Promise<ActionResult> {
  return invoke(leagueId, "start_draft", { p_league_id: leagueId });
}

export async function makeDraftPickAction(
  leagueId: string,
  playerId: string,
  expectedPick: number,
): Promise<ActionResult> {
  if (!UUID.test(playerId)) return { error: "Choose a valid player." };
  if (
    !Number.isSafeInteger(expectedPick) ||
    expectedPick < 1 ||
    expectedPick > 90
  )
    return { error: "The draft has changed. Refresh and try again." };
  return invoke(leagueId, "make_draft_pick", {
    p_league_id: leagueId,
    p_player_id: playerId,
    p_expected_pick: expectedPick,
  });
}

export async function draftTickAction(leagueId: string): Promise<ActionResult> {
  return invoke(leagueId, "draft_tick", { p_league_id: leagueId });
}

export async function saveLineupAction(
  leagueId: string,
  roundId: string,
  slots: LineupSelection[],
): Promise<ActionResult> {
  if (!UUID.test(roundId) || !Array.isArray(slots) || slots.length !== 11) {
    return { error: "Choose eleven valid players for the lineup." };
  }
  for (let index = 0; index < slots.length; index += 1) {
    const slot = slots[index];
    if (
      !slot ||
      typeof slot.slotId !== "string" ||
      SLOT_IDS[slot.slotId] !== true ||
      typeof slot.playerId !== "string" ||
      !UUID.test(slot.playerId)
    ) {
      return { error: "Choose eleven valid players for the lineup." };
    }
    for (let previous = 0; previous < index; previous += 1) {
      if (
        slots[previous].slotId === slot.slotId ||
        slots[previous].playerId === slot.playerId
      ) {
        return { error: "Choose eleven valid players for the lineup." };
      }
    }
  }
  return invoke(leagueId, "save_lineup", {
    p_league_id: leagueId,
    p_round_id: roundId,
    p_slots: slots,
  });
}

export async function replayRoundAction(
  leagueId: string,
  roundId: string,
): Promise<ActionResult> {
  if (!UUID.test(roundId)) return { error: "Choose a valid round." };
  return invoke(leagueId, "replay_round", {
    p_league_id: leagueId,
    p_round_id: roundId,
  });
}

export async function recalculateLeagueAction(
  leagueId: string,
): Promise<ActionResult> {
  return invoke(leagueId, "recalculate_league", { p_league_id: leagueId });
}
