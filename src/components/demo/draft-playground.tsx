"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar, Badge, Panel } from "@/components/ui/primitives";
import { RoleBadge, RosterRows } from "@/components/fantasy/experience";
import { PracticePlayerProfile } from "@/components/fantasy/practice-player-profile";
import { managerAtSnakePick } from "@/lib/fantasy/draft";
import { demoManagers, demoPlayers } from "@/lib/demo/fixtures";

const PICK_ROUNDS = 3;
const PICK_LIMIT = demoManagers.length * PICK_ROUNDS;
const roles = ["ALL_ROLES", "BAT", "BOWL", "ALL", "WK"] as const;
type FilterRole = (typeof roles)[number];
const roleLabels: Record<FilterRole, string> = {
  ALL_ROLES: "All roles",
  BAT: "Batters",
  BOWL: "Bowlers",
  ALL: "All-rounders",
  WK: "Keepers",
};
const draftRatings = [
  92, 89, 88, 86, 84, 83, 81, 80, 79, 77, 76, 75, 74, 73, 72, 70, 69, 68,
];
const playerInfo = new Map(
  demoPlayers.map((player, index) => [
    player.id,
    { player, rating: draftRatings[index] },
  ]),
);
const boardSlots: number[][] = Array.from({ length: PICK_ROUNDS }, () => []);
for (let pickIndex = 0; pickIndex < PICK_LIMIT; pickIndex++) {
  boardSlots[Math.floor(pickIndex / demoManagers.length)][
    managerAtSnakePick(pickIndex, demoManagers.length)
  ] = pickIndex;
}

export function DraftPlayground() {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<FilterRole>("ALL_ROLES");
  const [selectedManager, setSelectedManager] = useState(0);
  const [boardOpen, setBoardOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const pickNumber = pickedIds.length;
  const finished = pickNumber >= PICK_LIMIT;
  const managerIndex = finished
    ? null
    : managerAtSnakePick(pickNumber, demoManagers.length);
  const manager = managerIndex === null ? null : demoManagers[managerIndex];
  const draftRound = Math.floor(pickNumber / demoManagers.length) + 1;
  const pickedByPlayer = useMemo(
    () =>
      new Map(
        pickedIds.map((id, index) => [
          id,
          managerAtSnakePick(index, demoManagers.length),
        ]),
      ),
    [pickedIds],
  );
  const query = search.trim().toLowerCase();
  const filteredPlayers = demoPlayers.filter(
    (player) =>
      (role === "ALL_ROLES" || player.role === role) &&
      `${player.name} ${player.team}`.toLowerCase().includes(query),
  );
  const roster = pickedIds.flatMap((id, index) =>
    managerAtSnakePick(index, demoManagers.length) === selectedManager
      ? [playerInfo.get(id)!.player]
      : [],
  );
  const selectedProfile = profileId ? playerInfo.get(profileId) : undefined;
  const profileOwner = profileId ? pickedByPlayer.get(profileId) : undefined;

  function pick(playerId: string) {
    if (!playerInfo.has(playerId)) return;
    setPickedIds((previous) =>
      previous.length >= PICK_LIMIT || previous.includes(playerId)
        ? previous
        : [...previous, playerId],
    );
  }

  function reset() {
    setPickedIds([]);
    setSearch("");
    setRole("ALL_ROLES");
    setSelectedManager(0);
    setProfileId(null);
  }

  return (
    <section className="demo-draft" aria-label="Fictional practice snake draft">
      <Panel
        eyebrow="DRAFT ROOM"
        title="Make your next pick"
        action={
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={reset}
          >
            <Icon name="reset" size={15} /> Reset draft
          </button>
        }
        className="demo-panel demo-draft-panel"
      >
        <p className="demo-panel-description">
          Six fictional teams. Three rounds. An untimed snake draft.
        </p>
        <div className="draft-current" aria-live="polite">
          <Avatar
            name={manager?.name ?? "Draft complete"}
            seed={manager?.id}
            size="md"
          />
          <div className="draft-current-copy">
            <span>{finished ? "PRACTICE COMPLETE" : "CURRENT MANAGER"}</span>
            <strong>{manager?.name ?? "That’s a full board."}</strong>
          </div>
          <div className="draft-current-meta">
            <Badge tone={finished ? "neutral" : "mint"} dot>
              {finished
                ? "18 picks made"
                : `Pick ${pickNumber + 1} / ${PICK_LIMIT}`}
            </Badge>
            <span>
              {finished
                ? "Reset to play again"
                : `Round ${draftRound} · No timer`}
            </span>
          </div>
        </div>
        <div className={`demo-board-wrap${boardOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="demo-board-toggle"
            aria-expanded={boardOpen}
            aria-controls="practice-draft-board"
            onClick={() => setBoardOpen((value) => !value)}
          >
            <span>
              <Icon name="layers" size={16} /> Draft board{" "}
              <small>
                {pickNumber}/{PICK_LIMIT} picks
              </small>
            </span>
            <Icon name="chevronDown" size={16} />
          </button>
          <div
            id="practice-draft-board"
            className="demo-board-scroll"
            role="region"
            aria-label="Draft board by manager and round"
            tabIndex={0}
          >
            <table className="demo-board">
              <caption className="sr-only">
                Fictional snake draft. Managers are columns; rounds are rows.
                The highlighted slot is the current pick.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="demo-round-label">
                    RD
                  </th>
                  {demoManagers.map((entry, index) => (
                    <th
                      key={entry.id}
                      scope="col"
                      className={managerIndex === index ? "is-current" : ""}
                    >
                      <span className="demo-board-manager">
                        <Avatar name={entry.name} seed={entry.id} size="sm" />
                        <strong>{entry.name}</strong>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boardSlots.map((round, roundIndex) => (
                  <tr key={roundIndex}>
                    <th scope="row" className="demo-round-label">
                      <strong>{String(roundIndex + 1).padStart(2, "0")}</strong>
                      <Icon
                        name={roundIndex % 2 === 0 ? "arrowRight" : "arrowLeft"}
                        size={13}
                      />
                    </th>
                    {round.map((slotIndex, managerPosition) => {
                      const selected = pickedIds[slotIndex]
                        ? playerInfo.get(pickedIds[slotIndex])?.player
                        : undefined;
                      const current = !finished && slotIndex === pickNumber;
                      return (
                        <td
                          key={`${roundIndex}-${managerPosition}`}
                          className={`${current ? "is-current " : ""}${selected ? `demo-cell-${selected.role.toLowerCase()}` : ""}`}
                        >
                          <span className="demo-cell-number">
                            {roundIndex + 1}.
                            {String(
                              (slotIndex % demoManagers.length) + 1,
                            ).padStart(2, "0")}
                          </span>
                          {selected ? (
                            <>
                              <strong>{selected.name}</strong>
                              <small>
                                {selected.role} · {selected.team}
                              </small>
                            </>
                          ) : (
                            <span className="demo-cell-empty">
                              {current ? "Next pick" : "—"}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="demo-draft-layout">
          <div className="demo-player-pool">
            <div className="demo-player-tools">
              <label className="demo-search">
                <span className="sr-only">Search fictional players</span>
                <Icon name="search" size={16} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a player or team"
                />
              </label>
              <span className="demo-available-count">
                {demoPlayers.length - pickedIds.length} available
              </span>
            </div>
            <div
              className="demo-role-tabs"
              role="group"
              aria-label="Filter players by cricket role"
            >
              {roles.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={role === item}
                  onClick={() => setRole(item)}
                >
                  {roleLabels[item]}
                </button>
              ))}
            </div>
            <div className="demo-player-head">
              <span>PLAYER</span>
              <span>ROLE</span>
              <span className="demo-rating-heading">DEMO RATING</span>
              <span>PICK</span>
            </div>
            {filteredPlayers.length ? (
              <ul className="demo-player-list">
                {filteredPlayers.map((player) => {
                  const ownerIndex = pickedByPlayer.get(player.id);
                  const rating = playerInfo.get(player.id)?.rating;
                  return (
                    <li className="demo-player-row" key={player.id}>
                      <button
                        type="button"
                        className="demo-player-profile-trigger"
                        onClick={() => setProfileId(player.id)}
                        aria-label={`View ${player.name} player profile`}
                      >
                        <Avatar name={player.name} seed={player.id} size="md" />
                        <span className="demo-player-name">
                          <strong>{player.name}</strong>
                          <small>{player.team}</small>
                        </span>
                        <Icon name="chevronRight" size={13} />
                      </button>
                      <RoleBadge role={player.role} />
                      <span className="demo-rating">
                        <strong>{rating}</strong>
                        <small>fictional</small>
                      </span>
                      <button
                        type="button"
                        className={`demo-pick-button${ownerIndex !== undefined ? " is-picked" : ""}`}
                        disabled={ownerIndex !== undefined || finished}
                        onClick={() => pick(player.id)}
                        aria-label={
                          ownerIndex !== undefined
                            ? `${player.name}, drafted by ${demoManagers[ownerIndex].name}`
                            : `Draft ${player.name}`
                        }
                      >
                        {ownerIndex !== undefined ? (
                          demoManagers[ownerIndex].initials
                        ) : (
                          <>
                            <Icon name="plus" size={13} />
                            <span>Pick</span>
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="demo-no-results">
                <Icon name="search" size={24} />
                <strong>No players match.</strong>
                <span>Try another name, team, or role.</span>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => {
                    setSearch("");
                    setRole("ALL_ROLES");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          <aside className="demo-draft-aside">
            <Panel
              eyebrow="SNAKE ORDER"
              title="The managers"
              className="demo-side-panel"
            >
              <ol className="demo-manager-list">
                {demoManagers.map((entry, index) => {
                  const count = pickedIds.filter(
                    (_, pickIndex) =>
                      managerAtSnakePick(pickIndex, demoManagers.length) ===
                      index,
                  ).length;
                  return (
                    <li
                      className={managerIndex === index ? "is-current" : ""}
                      key={entry.id}
                    >
                      <Avatar name={entry.name} seed={entry.id} size="sm" />
                      <span className="demo-manager-name">{entry.name}</span>
                      <span className="demo-manager-count">
                        {count}/{PICK_ROUNDS}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Panel>
            <Panel
              eyebrow="PICK LOG"
              title="Recent picks"
              className="demo-side-panel"
            >
              <ol className="demo-pick-history" aria-live="polite">
                {pickedIds.length ? (
                  pickedIds
                    .slice(-6)
                    .reverse()
                    .map((id, offset) => {
                      const index = pickedIds.length - 1 - offset;
                      const player = playerInfo.get(id)!.player;
                      const by =
                        demoManagers[
                          managerAtSnakePick(index, demoManagers.length)
                        ];
                      return (
                        <li key={id}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{player.name}</strong>
                          <small>{by.initials}</small>
                        </li>
                      );
                    })
                ) : (
                  <li className="demo-history-empty">
                    Your first pick starts the story.
                  </li>
                )}
              </ol>
            </Panel>
            <Panel
              eyebrow="TEAM VIEW"
              title="Roster composition"
              className="demo-side-panel"
            >
              <label className="demo-team-select">
                <span className="sr-only">Choose manager roster</span>
                <select
                  value={selectedManager}
                  onChange={(event) =>
                    setSelectedManager(Number(event.target.value))
                  }
                >
                  {demoManagers.map((entry, index) => (
                    <option key={entry.id} value={index}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="demo-roster-summary">
                <strong>
                  {roster.length}
                  <small> / 3 picks</small>
                </strong>
                <div>
                  {roles.slice(1).map((item) => (
                    <span key={item}>
                      <b>
                        {roster.filter((player) => player.role === item).length}
                      </b>{" "}
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <RosterRows
                players={roster}
                emptyMessage="No players picked for this team yet."
              />
            </Panel>
            <p className="demo-fiction-note">
              Fictional managers, players and ratings. This room is local
              practice, not multiplayer.
            </p>
          </aside>
        </div>
      </Panel>
      <PracticePlayerProfile
        player={selectedProfile?.player ?? null}
        rating={selectedProfile?.rating}
        onClose={() => setProfileId(null)}
        action={
          selectedProfile && (
            <button
              type="button"
              className="button button-primary"
              disabled={profileOwner !== undefined || finished}
              onClick={() => {
                pick(selectedProfile.player.id);
                setProfileId(null);
              }}
            >
              {profileOwner !== undefined
                ? `Picked by ${demoManagers[profileOwner].initials}`
                : finished
                  ? "Draft complete"
                  : "Draft this player"}
            </button>
          )
        }
      />
    </section>
  );
}
