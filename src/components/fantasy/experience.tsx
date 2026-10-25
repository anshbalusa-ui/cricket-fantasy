import { Avatar, Badge, Panel } from "@/components/ui/primitives";
import type { PlayerRole } from "@/lib/fantasy/types";
import { Icon } from "@/components/ui/icon";
import "./experience.css";

const roleNames: Record<PlayerRole, string> = {
  BAT: "Batter",
  BOWL: "Bowler",
  ALL: "All-rounder",
  WK: "Wicketkeeper",
};

export function RoleBadge({ role }: { role: PlayerRole }) {
  const tone =
    role === "BAT"
      ? "amber"
      : role === "BOWL"
        ? "blue"
        : role === "ALL"
          ? "violet"
          : "mint";
  return <Badge tone={tone}>{roleNames[role]}</Badge>;
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

const starterSlots = [
  "BAT",
  "BAT",
  "BOWL",
  "BOWL",
  "ALL",
  "ALL",
  "WK",
  "FLEX",
] as const;

export function RosterPreview({
  teamName,
  compact = false,
}: {
  teamName: string;
  compact?: boolean;
}) {
  const visibleStarters = compact ? starterSlots.slice(0, 4) : starterSlots;
  return (
    <Panel
      eyebrow="YOUR SQUAD"
      title={teamName}
      action={<Badge tone="amber">After the draft</Badge>}
      className={`fantasy-preview${compact ? " fantasy-preview-compact" : ""}`}
    >
      <div className="fantasy-roster-count">
        <strong>10 roster spots</strong>
        <span>Planned league format</span>
      </div>
      <div className="fantasy-lineup-heading">
        <span>
          <Icon name="shirt" size={14} /> Starting eight
        </span>
        <small>8 spots</small>
      </div>
      <ol className="fantasy-slot-list">
        {visibleStarters.map((role, index) => (
          <li key={`${role}-${index}`}>
            <span
              className={`fantasy-slot-role fantasy-slot-${role.toLowerCase()}`}
            >
              {role}
            </span>
            <span className="fantasy-empty-player">
              <Icon name="plus" size={15} />
            </span>
            <span className="fantasy-slot-copy">
              <strong>Open roster spot</strong>
              <small>
                {role === "FLEX" ? "Any eligible role" : roleNames[role]} ·
                assigned after draft
              </small>
            </span>
            <span className="fantasy-slot-points">
              <span aria-hidden="true">—</span>
              <span className="sr-only">Points unavailable</span>
            </span>
          </li>
        ))}
      </ol>
      {compact && (
        <p className="fantasy-more-slots">
          Four more starters · two bench spots
        </p>
      )}
      {!compact && (
        <>
          <div className="fantasy-lineup-heading fantasy-bench-heading">
            <span>
              <Icon name="layers" size={14} /> The bench
            </span>
            <small>2 spots</small>
          </div>
          <ol className="fantasy-slot-list fantasy-bench-list">
            {[1, 2].map((slot) => (
              <li key={slot}>
                <span className="fantasy-slot-role">BN</span>
                <span className="fantasy-empty-player">
                  <Icon name="plus" size={15} />
                </span>
                <span className="fantasy-slot-copy">
                  <strong>Bench spot {slot}</strong>
                  <small>Reserve player · assigned after draft</small>
                </span>
                <span className="fantasy-slot-points">
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Points unavailable</span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="fantasy-pending-note">
        Roster ownership and lineup changes become available with multiplayer
        drafting. These are empty format slots, not player assignments.
      </p>
    </Panel>
  );
}

export function MatchupPreview({ teamName }: { teamName?: string }) {
  return (
    <Panel
      eyebrow="HEAD TO HEAD"
      title="Your next matchup"
      action={<Badge tone="amber">Upcoming</Badge>}
      className="fantasy-preview"
    >
      <div className="fantasy-matchup-meta">
        <Icon name="calendar" size={14} />
        <span>Round not scheduled</span>
        <span className="fantasy-matchup-status">Awaiting fixtures</span>
      </div>
      <div className="fantasy-matchup-preview">
        <div>
          <Avatar name={teamName ?? "Your team"} size="lg" />
          <strong>{teamName ?? "Your team"}</strong>
          <small>Your side</small>
        </div>
        <span className="fantasy-matchup-vs">VS</span>
        <div className="fantasy-opponent">
          <span className="fantasy-opponent-mark">
            <Icon name="shield" size={23} />
          </span>
          <strong>Opponent unassigned</strong>
          <small>Schedule pending</small>
        </div>
      </div>
      <div className="fantasy-matchup-score">
        <strong>
          <span aria-hidden="true">—</span>
          <span className="sr-only">Your score unavailable</span>
        </strong>
        <span>FANTASY POINTS</span>
        <strong>
          <span aria-hidden="true">—</span>
          <span className="sr-only">Opponent score unavailable</span>
        </strong>
      </div>
      <div className="fantasy-contributions">
        <Icon name="activity" size={17} />
        <p>
          <strong>Every contribution will count.</strong>
          <span>
            Player breakdowns appear after match data is imported and fantasy
            rounds are scored.
          </span>
        </p>
      </div>
      <p className="fantasy-pending-note">
        No scores, projections or live match status are available yet.
      </p>
    </Panel>
  );
}
