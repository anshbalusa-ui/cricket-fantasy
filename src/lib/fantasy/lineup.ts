import type { PlayerRole } from "./types";

export const SQUAD_SIZE = 15;
export const STARTER_COUNT = 11;
export const BENCH_COUNT = 4;
export const SETTINGS_VERSION = 2;

export const LINEUP_SLOTS = [
  { id: "WK1", role: "WK", label: "Wicketkeeper" },
  { id: "BAT1", role: "BAT", label: "Batter" },
  { id: "BAT2", role: "BAT", label: "Batter" },
  { id: "BOWL1", role: "BOWL", label: "Bowler" },
  { id: "BOWL2", role: "BOWL", label: "Bowler" },
  { id: "ALL1", role: "ALL", label: "All-rounder" },
  { id: "ALL2", role: "ALL", label: "All-rounder" },
  { id: "FLEX1", role: "FLEX", label: "Flex" },
  { id: "FLEX2", role: "FLEX", label: "Flex" },
  { id: "FLEX3", role: "FLEX", label: "Flex" },
  { id: "FLEX4", role: "FLEX", label: "Flex" },
] as const satisfies readonly {
  id: string;
  role: PlayerRole | "FLEX";
  label: string;
}[];

const REQUIRED_ROLES: Record<PlayerRole, number> = {
  WK: 1,
  BAT: 2,
  BOWL: 2,
  ALL: 2,
};
const ROLES = Object.keys(REQUIRED_ROLES) as PlayerRole[];
const SLOT_BY_ID = Object.fromEntries(
  LINEUP_SLOTS.map((slot) => [slot.id, slot]),
) as Record<string, (typeof LINEUP_SLOTS)[number]>;

export function validateLineup(
  slots: { slotId: string; playerId: string }[],
  roster: { id: string; role: PlayerRole }[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const owned = new Map<string, PlayerRole>();
  for (const player of roster) {
    if (!Object.hasOwn(REQUIRED_ROLES, player.role))
      errors.push(`Invalid role for player ${player.id}`);
    if (owned.has(player.id))
      errors.push(`Duplicate roster player ${player.id}`);
    owned.set(player.id, player.role);
  }
  if (slots.length !== STARTER_COUNT)
    errors.push(`Lineup must contain exactly ${STARTER_COUNT} players`);
  const usedSlots = new Set<string>();
  const usedPlayers = new Set<string>();
  for (const selection of slots) {
    const slot = SLOT_BY_ID[selection.slotId];
    if (!Object.hasOwn(SLOT_BY_ID, selection.slotId)) {
      errors.push(`Unknown lineup slot ${selection.slotId}`);
      continue;
    }
    if (usedSlots.has(selection.slotId))
      errors.push(`Duplicate lineup slot ${selection.slotId}`);
    usedSlots.add(selection.slotId);
    if (usedPlayers.has(selection.playerId))
      errors.push(`Duplicate lineup player ${selection.playerId}`);
    usedPlayers.add(selection.playerId);
    const role = owned.get(selection.playerId);
    if (!role) errors.push(`Player ${selection.playerId} is not owned`);
    else if (slot.role !== "FLEX" && role !== slot.role)
      errors.push(`Player ${selection.playerId} is ineligible for ${slot.id}`);
  }
  for (const slot of LINEUP_SLOTS)
    if (!usedSlots.has(slot.id)) errors.push(`Missing lineup slot ${slot.id}`);
  return { valid: errors.length === 0, errors };
}

/** Whether remaining picks can complete this team's required role slots and squad size. */
export function canCompleteRoster(
  rosterRoles: PlayerRole[],
  availableRoles: PlayerRole[],
  squadSize = SQUAD_SIZE,
): boolean {
  if (
    !Number.isInteger(squadSize) ||
    squadSize < STARTER_COUNT ||
    rosterRoles.length > squadSize
  )
    return false;
  const remainingPicks = squadSize - rosterRoles.length;
  if (availableRoles.length < remainingPicks) return false;
  const needs = { ...REQUIRED_ROLES };
  const available: Record<PlayerRole, number> = {
    WK: 0,
    BAT: 0,
    BOWL: 0,
    ALL: 0,
  };
  for (const role of rosterRoles) {
    if (!Object.hasOwn(REQUIRED_ROLES, role)) return false;
    needs[role] = Math.max(0, needs[role] - 1);
  }
  for (const role of availableRoles) {
    if (!Object.hasOwn(REQUIRED_ROLES, role)) return false;
    available[role]++;
  }
  let requiredPicks = 0;
  for (const role of ROLES) {
    if (available[role] < needs[role]) return false;
    requiredPicks += needs[role];
  }
  return requiredPicks <= remainingPicks;
}
