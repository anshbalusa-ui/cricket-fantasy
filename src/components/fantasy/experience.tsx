import { Avatar, Badge, Panel } from "@/components/ui/primitives";
import type { PlayerRole } from "@/lib/fantasy/types";
import {
  BENCH_COUNT,
  LINEUP_SLOTS,
  SQUAD_SIZE,
  STARTER_COUNT,
} from "@/lib/fantasy/lineup";
import { Icon } from "@/components/ui/icon";
import "./experience.css";

const roleNames: Record<PlayerRole, string> = {
  BAT: "Batter",
  BOWL: "Bowler",
  ALL: "All-rounder",
  WK: "Wicketkeeper",
};

export function RoleBadge({
  role,
  compact = false,
}: {
  role: PlayerRole;
  compact?: boolean;
}) {
  const tone =
    role === "BAT"
      ? "amber"
      : role === "BOWL"
        ? "blue"
        : role === "ALL"
          ? "violet"
          : "mint";
  return (
    <Badge tone={tone}>
      {compact ? (
        <>
          <span aria-hidden="true">{role}</span>
          <span className="sr-only">{roleNames[role]}</span>
        </>
      ) : (
        roleNames[role]
      )}
    </Badge>
  );
}

export function PlayerIdentity({
  name,
  team,
  role,
  seed,
}: {
  name: string;
  team: string;
  role?: PlayerRole;
  seed?: string;
}) {
  return (
    <div className="fantasy-player-identity">
      <Avatar name={name} seed={seed} size="md" />
      <span>
        <strong title={name}>{name}</strong>
        <small>{team}</small>
      </span>
      {role && <RoleBadge role={role} />}
    </div>
  );
}

export function RosterRows({
  players,
  emptyMessage = "No players drafted yet.",
}: {
  players: { id: string; name: string; team: string; role: PlayerRole }[];
  emptyMessage?: string;
}) {
  return players.length ? (
    <ul className="fantasy-roster-rows">
      {players.map((player) => (
        <li key={player.id}>
          <PlayerIdentity
            name={player.name}
            team={player.team}
            role={player.role}
            seed={player.id}
          />
        </li>
      ))}
    </ul>
  ) : (
    <p className="fantasy-roster-empty">{emptyMessage}</p>
  );
}

export function LineupFormatGuide() {
  return (
    <Panel
      eyebrow="THE SQUAD FORMAT"
      title="Fifteen picks. Your best XI."
      action={<Badge tone="mint">11 + 4</Badge>}
      className="fantasy-preview"
    >
      <div className="fantasy-roster-count">
        <strong>{SQUAD_SIZE} roster spots</strong>
        <span>
          {STARTER_COUNT} starters · {BENCH_COUNT} bench
        </span>
      </div>
      <div className="fantasy-lineup-heading">
        <span>
          <Icon name="shirt" size={14} /> Starting XI
        </span>
        <small>{STARTER_COUNT} positions</small>
      </div>
      <ol className="fantasy-slot-list">
        {LINEUP_SLOTS.map((slot) => (
          <li key={slot.id}>
            <span
              className={`fantasy-slot-role fantasy-slot-${slot.role.toLowerCase()}`}
            >
              {slot.role}
            </span>
            <span className="fantasy-empty-player">
              <Icon name="shirt" size={15} />
            </span>
            <span className="fantasy-slot-copy">
              <strong>{slot.label}</strong>
              <small>
                {slot.role === "FLEX"
                  ? "Any player you own"
                  : `An owned ${roleNames[slot.role].toLowerCase()}`}
              </small>
            </span>
          </li>
        ))}
      </ol>
      <div className="fantasy-lineup-heading fantasy-bench-heading">
        <span>
          <Icon name="layers" size={14} /> The bench
        </span>
        <small>{BENCH_COUNT} reserves</small>
      </div>
      <p className="fantasy-pending-note">
        Your other four drafted players stay on the bench. Bench contributions
        do not count. Change your XI in your league’s My Team screen before the
        round is locked.
      </p>
    </Panel>
  );
}
