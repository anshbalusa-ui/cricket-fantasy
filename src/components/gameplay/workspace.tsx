"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  draftTickAction,
  makeDraftPickAction,
  recalculateLeagueAction,
  replayRoundAction,
  saveLineupAction,
  startDraftAction,
} from "@/lib/gameplay/actions";
import { LINEUP_SLOTS, validateLineup } from "@/lib/fantasy/lineup";
import type {
  GameLineup,
  GamePlayer,
  GameRound,
  GameTeam,
  LeagueGameSnapshot,
  LineupSelection,
} from "@/lib/gameplay/types";
import { Avatar, Badge, EmptyState, Panel } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { RoleBadge } from "@/components/fantasy/experience";
import type { SeasonWindow } from "@/lib/catalog/queries";
import "./workspace.css";

type Tab =
  | "home"
  | "roster"
  | "matchup"
  | "standings"
  | "draft"
  | "managers"
  | "players";
type RunAction = (
  action: () => Promise<{ error?: string }>,
  success: string,
) => Promise<boolean>;
type ActionProps = {
  game: LeagueGameSnapshot;
  run: RunAction;
  pending: boolean;
  disabled: boolean;
};
const roleLabels = {
  WK: "Wicketkeeper",
  BAT: "Batter",
  BOWL: "Bowler",
  ALL: "All-rounder",
} as const;
const roleMinimums = { WK: 1, BAT: 2, BOWL: 2, ALL: 2 } as const;
const fmt = (value: number | null) =>
  value === null ? "—" : Number(value).toFixed(1);

export function LeagueWorkspace({
  initial,
  tab,
  calendar,
}: {
  initial: LeagueGameSnapshot;
  tab: Tab;
  calendar: SeasonWindow[];
}) {
  const [game, setGame] = useState(initial);
  const [sync, setSync] = useState<"fresh" | "updating" | "offline">("fresh");
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<{
    sequence: number;
    controller: AbortController | null;
  }>({ sequence: 0, controller: null });
  const lastServerTime = useRef(Date.parse(initial.serverNow));
  const mutationPending = useRef(false);
  const leagueId = initial.league.id;

  useEffect(() => {
    if (Date.parse(initial.serverNow) < lastServerTime.current) return;
    request.current.sequence++;
    request.current.controller?.abort();
    request.current.controller = null;
    lastServerTime.current = Date.parse(initial.serverNow);
    setGame(initial);
    setSync("fresh");
    setRequiresSignIn(false);
    setConnectionMessage("");
  }, [initial]);

  const refresh = useCallback(async () => {
    request.current.controller?.abort();
    const controller = new AbortController();
    const sequence = ++request.current.sequence;
    request.current.controller = controller;
    setSync("updating");
    try {
      const response = await fetch(`/api/leagues/${leagueId}/game`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (sequence !== request.current.sequence) return false;
      if (!response.ok) {
        setRequiresSignIn(response.status === 401);
        setConnectionMessage(
          response.status === 401
            ? "Your session ended. Sign in to reconnect."
            : response.status === 403 || response.status === 404
              ? "This league is no longer accessible to this account."
              : "Connection lost. Showing the last saved league data.",
        );
        setSync("offline");
        return false;
      }
      const next = (await response.json()) as LeagueGameSnapshot;
      if (sequence !== request.current.sequence) return false;
      if (Date.parse(next.serverNow) >= lastServerTime.current) {
        lastServerTime.current = Date.parse(next.serverNow);
        setGame(next);
      }
      setSync("fresh");
      setRequiresSignIn(false);
      setConnectionMessage("");
      return true;
    } catch {
      if (controller.signal.aborted || sequence !== request.current.sequence)
        return false;
      setSync("offline");
      setConnectionMessage(
        "Connection lost. Showing the last saved league data.",
      );
      return false;
    } finally {
      if (sequence === request.current.sequence)
        request.current.controller = null;
    }
  }, [leagueId]);

  useEffect(() => {
    const poll = () => {
      if (
        document.visibilityState === "visible" &&
        !request.current.controller &&
        !mutationPending.current
      )
        void refresh();
    };
    const timer = window.setInterval(
      poll,
      game.draft?.status === "drafting" ? 5000 : 20000,
    );
    document.addEventListener("visibilitychange", poll);
    window.addEventListener("online", poll);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
      window.removeEventListener("online", poll);
    };
  }, [refresh, game.draft?.status]);
  useEffect(
    () => () => {
      request.current.sequence++;
      request.current.controller?.abort();
    },
    [],
  );

  const run = useCallback<RunAction>(
    async (action, success) => {
      if (mutationPending.current || sync === "offline") return false;
      mutationPending.current = true;
      request.current.sequence++;
      request.current.controller?.abort();
      request.current.controller = null;
      setPending(true);
      setError("");
      setNotice("");
      try {
        const result = await action();
        if (result.error) {
          setError(result.error);
          await refresh();
          return false;
        }
        setNotice(success);
        return await refresh();
      } catch {
        setError(
          "The response was interrupted. The action may have completed; reconnect and check the saved state before trying again.",
        );
        await refresh();
        return false;
      } finally {
        mutationPending.current = false;
        setPending(false);
      }
    },
    [refresh, sync],
  );

  const blocked = pending || sync === "offline";
  const currentRound =
    game.rounds.find((round) => round.id === game.currentRoundId) ??
    game.rounds.find((round) => round.status === "open") ??
    game.rounds.at(-1);
  const body =
    tab === "draft" ? (
      <DraftRoom
        game={game}
        run={run}
        pending={pending}
        disabled={blocked}
        calendar={calendar}
      />
    ) : tab === "roster" ? (
      <Roster game={game} run={run} pending={pending} disabled={blocked} />
    ) : tab === "matchup" ? (
      <Matchups
        game={game}
        roundId={currentRound?.id}
        run={run}
        pending={pending}
        disabled={blocked}
      />
    ) : tab === "standings" ? (
      <Standings game={game} run={run} pending={pending} disabled={blocked} />
    ) : tab === "managers" ? (
      <Managers game={game} />
    ) : tab === "players" ? (
      <Players game={game} />
    ) : (
      <Home game={game} />
    );

  return (
    <div className="game-workspace">
      <div className="game-sync">
        <span className={`sync-dot ${sync}`} />
        <span>
          {sync === "offline"
            ? "Offline · saved snapshot"
            : sync === "updating"
              ? "Syncing league"
              : "League synced"}
        </span>
        <button
          type="button"
          aria-label="Refresh league"
          disabled={sync === "updating" || pending}
          onClick={() => void refresh()}
        >
          <Icon name="reset" size={14} />
        </button>
      </div>
      {connectionMessage && (
        <div className="game-message error" role="status">
          <p>
            {connectionMessage} Drafting and lineup changes are paused until
            reconnected.
          </p>
          {requiresSignIn ? (
            <Link
              href={`/sign-in?next=${encodeURIComponent(`/leagues/${leagueId}?tab=${tab}`)}`}
            >
              Sign in
            </Link>
          ) : (
            <button type="button" onClick={() => void refresh()}>
              Reconnect
            </button>
          )}
        </div>
      )}
      {error && (
        <p className="game-message error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="game-message success" role="status">
          <Icon name="checkCircle" size={17} />
          {notice}
        </p>
      )}
      {body}
    </div>
  );
}

function Home({ game }: { game: LeagueGameSnapshot }) {
  const me = game.teams.find((team) => team.id === game.me.teamId)!;
  const round =
    game.rounds.find((item) => item.id === game.currentRoundId) ??
    game.rounds.at(-1);
  const matchup = game.matchups.find(
    (item) =>
      item.roundId === round?.id &&
      (item.homeTeamId === me.id || item.awayTeamId === me.id),
  );
  const opponentId =
    matchup?.homeTeamId === me.id ? matchup.awayTeamId : matchup?.homeTeamId;
  const opponent = game.teams.find((team) => team.id === opponentId);
  const champion = game.teams.find(
    (team) => team.id === game.league.championTeamId,
  );
  const draftOpen = game.draft?.status === "drafting";
  const title = champion
    ? `${champion.name} take the title.`
    : draftOpen
      ? game.draft?.currentTeamId === me.id
        ? "You're on the clock."
        : "Draft night is on."
      : game.league.status === "lobby"
        ? game.teams.length < game.league.capacity
          ? "Get your six together."
          : "Six teams. One first pick."
        : "Your XI. Your season.";
  const actionTab =
    draftOpen || game.league.status === "lobby"
      ? "draft"
      : champion || (round && !matchup)
        ? "standings"
        : "roster";
  return (
    <>
      <section className="game-lead">
        <div>
          <span className="game-kicker">
            {game.league.seasonName} · HISTORICAL REPLAY
          </span>
          <h2>{title}</h2>
          <p>
            {champion
              ? "Seven rounds of cricket. A champion decided by your league's locked XIs and recorded results."
              : draftOpen
                ? "Exclusive players, a snake draft, and fifteen picks to build your squad. The room updates as your league picks."
                : game.league.status === "lobby"
                  ? "Invite your rivals, draft a 15-player squad, then set an XI for every head-to-head round."
                  : "Set eleven starters before your commissioner locks the next round. Four players stay on the bench."}
          </p>
        </div>
        <Link
          className="button button-primary"
          href={`/leagues/${game.league.id}?tab=${actionTab}`}
        >
          {actionTab === "draft"
            ? "Enter draft room"
            : actionTab === "standings"
              ? "League standings"
              : "Set your XI"}
          <Icon name="arrowRight" size={17} />
        </Link>
      </section>
      <div className="game-columns">
        <Panel
          eyebrow="YOUR CLUB"
          title={me.name}
          action={<Avatar name={me.managerName} seed={me.managerId} />}
        >
          <div className="club-numbers">
            <div>
              <strong>{me.rank > 0 ? `#${me.rank}` : "—"}</strong>
              <span>League rank</span>
            </div>
            <div>
              <strong>
                {me.wins}–{me.losses}–{me.draws}
              </strong>
              <span>W · L · D</span>
            </div>
            <div>
              <strong>
                {me.rosterCount}
                <small> / 15</small>
              </strong>
              <span>Squad</span>
            </div>
          </div>
          <Link
            className="game-inline-link"
            href={`/leagues/${game.league.id}?tab=roster`}
          >
            View roster
            <Icon name="arrowRight" size={15} />
          </Link>
        </Panel>
        <Panel
          eyebrow={round?.status === "completed" ? "LATEST ROUND" : "NEXT UP"}
          title={round?.name ?? "Draft night"}
          action={<Icon name={round ? "swords" : "users"} size={23} />}
        >
          <p className="next-opponent">
            {round
              ? opponent
                ? `Your opponent · ${opponent.name}`
                : "Your league matchups are available in the round view."
              : `${game.teams.length} of ${game.league.capacity} managers have joined.`}
          </p>
          <p className="muted">
            {round
              ? `${round.startsOn} – ${round.endsOn} · recorded match window`
              : "The commissioner starts the draft when all six seats are filled."}
          </p>
          <Link
            className="game-inline-link"
            href={`/leagues/${game.league.id}${round ? "?tab=matchup" : "/lobby"}`}
          >
            {round ? "View matchup" : "Invite & manage league"}
            <Icon name="arrowRight" size={15} />
          </Link>
        </Panel>
      </div>
      <Panel eyebrow="AROUND THE LEAGUE" title="Latest picks">
        <ol className="pick-activity">
          {game.picks
            .slice(-5)
            .reverse()
            .map((pick) => {
              const player = game.players.find(
                (item) => item.id === pick.playerId,
              )!;
              const team = game.teams.find((item) => item.id === pick.teamId)!;
              return (
                <li key={pick.id}>
                  <span className="activity-pick">{pick.pickNumber}</span>
                  <div>
                    <b>{player.name}</b>
                    <span>
                      {team.name} · Round {pick.round}
                      {pick.automatic ? " · Auto-pick" : ""}
                    </span>
                  </div>
                  <RoleBadge compact role={player.role} />
                </li>
              );
            })}
        </ol>
        {!game.picks.length && (
          <p className="muted">
            No picks yet. Your league's real draft activity will appear here.
          </p>
        )}
      </Panel>
      <Attribution game={game} />
    </>
  );
}

function DraftClock({
  serverNow,
  deadlineAt,
  blocked,
  onExpire,
}: {
  serverNow: string;
  deadlineAt: string;
  blocked: boolean;
  onExpire: () => Promise<void>;
}) {
  const [elapsed, setElapsed] = useState(0);
  const expiryAttempt = useRef("");
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);
  useEffect(() => {
    const receivedAt = performance.now();
    setElapsed(0);
    const timer = window.setInterval(
      () => setElapsed(performance.now() - receivedAt),
      250,
    );
    return () => window.clearInterval(timer);
  }, [serverNow, deadlineAt]);
  const seconds = Math.max(
    0,
    Math.ceil(
      (Date.parse(deadlineAt) - Date.parse(serverNow) - elapsed) / 1000,
    ),
  );
  const snapshotKey = `${deadlineAt}:${serverNow}`;
  useEffect(() => {
    if (seconds > 0 || blocked || expiryAttempt.current === snapshotKey) return;
    expiryAttempt.current = snapshotKey;
    void onExpireRef.current();
  }, [seconds, blocked, snapshotKey]);
  return (
    <span
      className={`draft-clock ${seconds <= 15 ? "urgent" : ""}`}
      aria-label={`${seconds} seconds remaining on this pick`}
    >
      <Icon name="timer" size={18} />
      <b>
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </b>
    </span>
  );
}

function DraftRoom({
  game,
  run,
  disabled,
  calendar,
}: ActionProps & { calendar: SeasonWindow[] }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [view, setView] = useState<"players" | "board">("players");
  const draft = game.draft;
  const myTurn = draft?.currentTeamId === game.me.teamId;
  const owner = game.teams.find((team) => team.id === draft?.currentTeamId);
  const squad = game.players.filter(
    (player) => player.ownerTeamId === game.me.teamId,
  );
  const readyPool =
    game.players.length >= game.league.capacity * game.league.squadSize &&
    Object.entries(roleMinimums).every(
      ([key, count]) =>
        game.players.filter((player) => player.role === key).length >=
        count * game.league.capacity,
    );
  const draftTeams = [...game.teams].sort(
    (a, b) => (a.draftPosition ?? 99) - (b.draftPosition ?? 99),
  );
  const available = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return game.players
      .filter(
        (player) =>
          !player.ownerTeamId &&
          (role === "all" || player.role === role) &&
          (!query ||
            player.name.toLocaleLowerCase().includes(query) ||
            player.franchiseName.toLocaleLowerCase().includes(query)),
      )
      .sort(
        (a, b) =>
          b.averagePoints - a.averagePoints || a.name.localeCompare(b.name),
      );
  }, [game.players, search, role]);
  const playerById = useMemo(
    () => new Map(game.players.map((player) => [player.id, player])),
    [game.players],
  );
  const pickByNumber = useMemo(
    () => new Map(game.picks.map((pick) => [pick.pickNumber, pick])),
    [game.picks],
  );

  if (!draft)
    return (
      <>
        <section className="game-lead">
          <div>
            <span className="game-kicker">DRAFT NIGHT</span>
            <h2>A squad nobody else can own.</h2>
            <p>
              Six managers. Fifteen rounds. A snake order that reverses each
              round. Every player belongs to one team within this league.
            </p>
          </div>
          <Badge tone="amber">
            {game.teams.length} / {game.league.capacity} ready
          </Badge>
        </section>
        <div className="game-columns">
          <Panel eyebrow="THE ROOM" title="Your draft league">
            <div className="draft-seats">
              {game.teams.map((team) => (
                <div className="manager-row" key={team.id}>
                  <Avatar name={team.managerName} seed={team.managerId} />
                  <div>
                    <b>{team.managerName}</b>
                    <small>{team.name}</small>
                  </div>
                  <Badge tone="mint">Joined</Badge>
                </div>
              ))}
              {Array.from(
                {
                  length: Math.max(0, game.league.capacity - game.teams.length),
                },
                (_, index) => (
                  <div className="empty-seat" key={index}>
                    <Icon name="users" size={19} />
                    <span>Waiting for a manager</span>
                  </div>
                ),
              )}
            </div>
            <Link
              className="game-inline-link"
              href={`/leagues/${game.league.id}/lobby`}
            >
              Manage invitations
              <Icon name="arrowRight" size={15} />
            </Link>
          </Panel>
          <Panel
            eyebrow="BEFORE THE FIRST PICK"
            title="Build fifteen. Start eleven."
          >
            <div className="draft-format">
              <span>
                <b>15</b> squad
              </span>
              <span>
                <b>11</b> starters
              </span>
              <span>
                <b>4</b> bench
              </span>
            </div>
            <p>
              Keep at least 1 keeper, 2 batters, 2 bowlers, and 2 all-rounders.
              Four flex slots let you choose your XI's balance.
            </p>
            <p className="muted">
              Starting locks league membership. Expired turns receive a
              server-selected, role-safe auto-pick when a member reconnects or
              checks the clock.
            </p>
            {game.me.isCommissioner ? (
              <button
                className="button button-primary"
                disabled={
                  disabled ||
                  game.teams.length !== game.league.capacity ||
                  !readyPool
                }
                onClick={() =>
                  void run(
                    () => startDraftAction(game.league.id),
                    "Draft started. All six seats are locked.",
                  )
                }
              >
                Start snake draft
                <Icon name="arrowRight" size={16} />
              </button>
            ) : (
              <Badge>Commissioner starts the draft</Badge>
            )}
            {!readyPool && (
              <p className="game-form-help">
                The imported pool must contain enough players and eligible roles
                for six valid squads.
              </p>
            )}
          </Panel>
        </div>
        <SeasonCalendar windows={calendar} />
      </>
    );

  return (
    <div className="draft-layout">
      <div className="draft-main">
        <section
          className={`draft-turn ${myTurn && draft.status === "drafting" ? "your-turn" : ""}`}
        >
          <div className="turn-identity">
            <Avatar
              name={owner?.managerName ?? "Draft complete"}
              seed={owner?.managerId ?? draft.id}
            />
            <div>
              <span className="game-kicker">
                {draft.status === "completed"
                  ? "ALL 90 PICKS SAVED"
                  : `ROUND ${Math.ceil(draft.pickNumber / game.league.capacity)} · PICK ${draft.pickNumber} / ${draft.totalPicks}`}
              </span>
              <h2>
                {draft.status === "completed"
                  ? "Your squads are set."
                  : myTurn
                    ? "You're on the clock."
                    : `${owner?.managerName ?? "Manager"} is picking`}
              </h2>
            </div>
          </div>
          {draft.status === "drafting" && draft.deadlineAt ? (
            <DraftClock
              key={`${game.serverNow}:${draft.deadlineAt}`}
              serverNow={game.serverNow}
              deadlineAt={draft.deadlineAt}
              blocked={disabled}
              onExpire={async () => {
                await run(
                  () => draftTickAction(game.league.id),
                  "Draft clock checked against the server.",
                );
              }}
            />
          ) : (
            <Link
              className="button button-primary"
              href={`/leagues/${game.league.id}?tab=roster`}
            >
              Set your XI
              <Icon name="arrowRight" size={16} />
            </Link>
          )}
        </section>
        <div className="draft-view-switch" role="group" aria-label="Draft view">
          <button
            type="button"
            aria-pressed={view === "players"}
            onClick={() => setView("players")}
          >
            <Icon name="users" size={16} />
            Player pool
          </button>
          <button
            type="button"
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            <Icon name="layers" size={16} />
            Draft board
          </button>
          <span>
            {draft.status === "completed"
              ? "Draft complete"
              : myTurn
                ? "Your pick"
                : "Waiting for your turn"}
          </span>
        </div>
        {view === "players" ? (
          <Panel
            eyebrow="SCOUT THE POOL"
            title={`${available.length} available players`}
            className="draft-pool"
          >
            <div className="game-tools">
              <label className="game-search">
                <Icon name="search" size={18} />
                <input
                  aria-label="Search available players"
                  placeholder="Player or franchise"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select
                aria-label="Filter available players by role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="all">All roles</option>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="pool-column-labels">
              <span>Player / franchise</span>
              <span>Role</span>
              <span>Hist. avg</span>
              <span>Pick</span>
            </div>
            <div className="available-list">
              {available.map((player) => (
                <div className="available-player" key={player.id}>
                  <Link
                    className="pool-player-identity"
                    href={`/leagues/${game.league.id}/players/${player.id}`}
                  >
                    <Avatar name={player.name} seed={player.id} size="sm" />
                    <span>
                      <b>{player.name}</b>
                      <small>
                        {player.franchiseCode} · {player.appearances}{" "}
                        appearances
                      </small>
                    </span>
                  </Link>
                  <RoleBadge compact role={player.role} />
                  <span className="pool-average">
                    {fmt(player.averagePoints)}
                  </span>
                  <button
                    className="pick-button"
                    type="button"
                    disabled={
                      disabled || !myTurn || draft.status !== "drafting"
                    }
                    aria-label={`Draft ${player.name}`}
                    onClick={() =>
                      void run(
                        () =>
                          makeDraftPickAction(
                            game.league.id,
                            player.id,
                            draft.pickNumber,
                          ),
                        `${player.name} drafted to your squad.`,
                      )
                    }
                  >
                    {myTurn && draft.status === "drafting" ? "Draft" : "—"}
                  </button>
                </div>
              ))}
            </div>
            {!available.length && (
              <EmptyState
                compact
                icon="search"
                title="No available players match"
                description="Try another name or role. Already drafted players are removed from this pool."
                action={
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      setSearch("");
                      setRole("all");
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            )}
            <p className="game-form-help">
              Sorted by historical average fantasy points. Recorded{" "}
              {game.league.seasonYear} performance, not a projection or live
              score.
            </p>
          </Panel>
        ) : (
          <Panel eyebrow="FIFTEEN-ROUND SNAKE" title="The draft board">
            <div
              className="draft-board-scroll"
              tabIndex={0}
              aria-label="Draft board; scroll to see all managers and rounds"
            >
              <div
                className="draft-board"
                style={{
                  gridTemplateColumns: `repeat(${draftTeams.length}, minmax(132px, 1fr))`,
                }}
              >
                {draftTeams.map((team) => (
                  <section className="draft-team" key={team.id}>
                    <header>
                      <Avatar
                        name={team.managerName}
                        seed={team.managerId}
                        size="sm"
                      />
                      <b>{team.name}</b>
                      <small>Seat {team.draftPosition}</small>
                    </header>
                    {Array.from({ length: draft.rounds }, (_, index) => {
                      const round = index + 1;
                      const number =
                        round % 2
                          ? (round - 1) * game.league.capacity +
                            team.draftPosition!
                          : round * game.league.capacity -
                            team.draftPosition! +
                            1;
                      const pick = pickByNumber.get(number);
                      const player = pick && playerById.get(pick.playerId);
                      return (
                        <div
                          className={`draft-cell ${pick ? "picked" : ""} ${draft.status === "drafting" && number === draft.pickNumber ? "on-clock" : ""}`}
                          key={round}
                        >
                          <small>
                            R{round} · {number}
                            {pick?.automatic ? " · AUTO" : ""}
                          </small>
                          {player ? (
                            <>
                              <Link
                                href={`/leagues/${game.league.id}/players/${player.id}`}
                              >
                                {player.name}
                              </Link>
                              <span>
                                {player.role} · {player.franchiseCode}
                              </span>
                            </>
                          ) : (
                            <span>
                              {number === draft.pickNumber &&
                              draft.status === "drafting"
                                ? "On the clock"
                                : "Awaiting pick"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </div>
      <aside className="draft-aside">
        <Panel
          eyebrow="YOUR SQUAD"
          title={`${squad.length} of ${game.league.squadSize} drafted`}
        >
          <RoleComposition players={squad} />
          <div className="draft-squad-list">
            {squad.map((player) => (
              <Link
                key={player.id}
                href={`/leagues/${game.league.id}/players/${player.id}`}
              >
                <RoleBadge compact role={player.role} />
                <span>
                  {player.name}
                  <small>{player.franchiseCode}</small>
                </span>
              </Link>
            ))}
          </div>
          {!squad.length && (
            <p className="muted">
              Your picks land here. Fill the required roles, then shape your
              four flex spots.
            </p>
          )}
        </Panel>
        <Panel eyebrow="THE LATEST" title="Pick history">
          <ol className="pick-activity">
            {game.picks
              .slice(-8)
              .reverse()
              .map((pick) => {
                const player = playerById.get(pick.playerId)!;
                const team = game.teams.find(
                  (item) => item.id === pick.teamId,
                )!;
                return (
                  <li key={pick.id}>
                    <span className="activity-pick">{pick.pickNumber}</span>
                    <div>
                      <b>{player.name}</b>
                      <span>
                        {team.name}
                        {pick.automatic ? " · Auto" : ""}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ol>
          {!game.picks.length && (
            <p className="muted">The first pick starts the story.</p>
          )}
        </Panel>
        <SeasonCalendar windows={calendar} />
      </aside>
    </div>
  );
}

function SeasonCalendar({ windows }: { windows: SeasonWindow[] }) {
  if (!windows.length) return null;
  return (
    <details className="season-calendar">
      <summary>
        <Icon name="calendar" size={17} />
        <span>{windows.length} published fixture windows</span>
        <Icon name="chevronDown" size={15} />
      </summary>
      <p>
        Recorded 2026 match windows, published before the first pick. These are
        historical dates, not upcoming live fixtures.
      </p>
      <ol>
        {windows.map((window) => (
          <li key={window.id}>
            <span>
              <b>{window.name}</b>
              <small>
                {window.startsOn.slice(5)} – {window.endsOn.slice(5)}
              </small>
            </span>
            <span>{window.matchCount} matches</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

function RoleComposition({ players }: { players: GamePlayer[] }) {
  return (
    <div className="role-composition">
      {Object.entries(roleLabels).map(([role, label]) => {
        const count = players.filter((player) => player.role === role).length;
        const minimum = roleMinimums[role as keyof typeof roleMinimums];
        return (
          <div className={count >= minimum ? "filled" : ""} key={role}>
            <span>{label}</span>
            <b>
              {count}
              <small> / {minimum} min</small>
            </b>
          </div>
        );
      })}
    </div>
  );
}

function Roster({ game, run, pending, disabled }: ActionProps) {
  const [teamId, setTeamId] = useState(game.me.teamId);
  const defaultRoundId = game.currentRoundId ?? game.rounds.at(-1)?.id ?? "";
  const [roundId, setRoundId] = useState(defaultRoundId);
  useEffect(() => {
    if (!roundId && defaultRoundId) setRoundId(defaultRoundId);
  }, [defaultRoundId, roundId]);
  const team = game.teams.find((item) => item.id === teamId)!;
  const round = game.rounds.find((item) => item.id === roundId);
  const lineup = game.lineups.find(
    (item) => item.teamId === teamId && item.roundId === roundId,
  );
  const roster = game.players.filter((player) => player.ownerTeamId === teamId);
  return (
    <>
      <div className="roster-context">
        <div className="turn-identity">
          <Avatar name={team.managerName} seed={team.managerId} />
          <div>
            <span className="game-kicker">
              {teamId === game.me.teamId ? "YOUR CLUB" : "LEAGUE CLUB"}
            </span>
            <h2>{team.name}</h2>
            <span className="muted">
              {team.managerName} · {roster.length} / 15 players
            </span>
          </div>
        </div>
        <div className="game-tools">
          <select
            aria-label="Choose manager team"
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
          >
            {game.teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {game.rounds.length > 0 && (
            <select
              aria-label="Choose lineup round"
              value={roundId}
              onChange={(event) => setRoundId(event.target.value)}
            >
              {game.rounds.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.status}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      {!roster.length ? (
        <EmptyState
          icon="shirt"
          title="Your squad starts in the draft"
          description="Draft fifteen players, then choose eleven starters and four bench players for each round."
          action={
            <Link
              className="button button-primary"
              href={`/leagues/${game.league.id}?tab=draft`}
            >
              Enter draft room
            </Link>
          }
        />
      ) : (
        <LineupEditor
          key={`${teamId}:${roundId}`}
          game={game}
          team={team}
          roster={roster}
          lineup={lineup}
          round={round}
          run={run}
          pending={pending}
          disabled={disabled}
        />
      )}
    </>
  );
}

function LineupEditor({
  game,
  team,
  roster,
  lineup,
  round,
  run,
  pending,
  disabled,
}: ActionProps & {
  team: GameTeam;
  roster: GamePlayer[];
  lineup?: GameLineup;
  round?: GameRound;
}) {
  const [slots, setSlots] = useState<LineupSelection[]>(lineup?.slots ?? []);
  const [dirty, setDirty] = useState(false);
  const isMine = team.id === game.me.teamId;
  const participating = game.matchups.some(
    (matchup) =>
      matchup.roundId === round?.id &&
      (matchup.homeTeamId === team.id || matchup.awayTeamId === team.id),
  );
  const editable = isMine && round?.status === "open" && participating;
  const savedSlots = Object.fromEntries(
    (lineup?.slots ?? []).map((selection) => [
      selection.slotId,
      selection.playerId,
    ]),
  );
  const matchesSaved =
    slots.length === (lineup?.slots.length ?? 0) &&
    slots.every(
      (selection) => savedSlots[selection.slotId] === selection.playerId,
    );
  useEffect(() => {
    if (!editable || !dirty || matchesSaved) {
      setSlots(lineup?.slots ?? []);
      setDirty(false);
    }
  }, [lineup?.slots, editable, dirty, matchesSaved]);
  const validation = validateLineup(slots, roster);
  const privateLineup =
    !isMine && round?.status === "open" && participating && !lineup;
  const selectedByPlayer = new Map(
    slots.map((selection) => [selection.playerId, selection.slotId]),
  );
  const contributions = game.matchups
    .filter((matchup) => matchup.roundId === round?.id)
    .flatMap((matchup) => matchup.contributions)
    .filter((contribution) => contribution.teamId === team.id);
  return (
    <div className="roster-layout">
      <Panel
        eyebrow={
          round?.status === "completed" ? "LOCKED STARTING XI" : "STARTING XI"
        }
        title={round?.name ?? "Draft in progress"}
        action={
          round?.lockedAt ? (
            <Badge>
              <Icon name="lock" size={12} />
              Locked
            </Badge>
          ) : lineup ? (
            <Badge tone="mint">{slots.length} / 11</Badge>
          ) : (
            <Badge>Squad</Badge>
          )
        }
      >
        {!round || !participating || (!lineup && round.status !== "open") ? (
          <p className="muted">
            {!round
              ? "Lineups open after the final draft pick. Your squad is saved as you draft."
              : round.status === "scheduled"
                ? "This round has not opened yet. Your saved squad is shown below."
                : "This club is not participating in this round. Choose an earlier round to review its XI and results."}
          </p>
        ) : privateLineup ? (
          <div className="private-xi">
            <Icon name="lock" size={26} />
            <h3>The XI stays in the dressing room.</h3>
            <p>
              Other managers' starting selections are private until the
              commissioner locks this round. Their drafted squad remains
              visible.
            </p>
          </div>
        ) : (
          <>
            <div className="lineup-editor">
              {LINEUP_SLOTS.map((slot) => {
                const selected =
                  slots.find((selection) => selection.slotId === slot.id)
                    ?.playerId ?? "";
                const used = slots
                  .filter((selection) => selection.slotId !== slot.id)
                  .map((selection) => selection.playerId);
                const player = roster.find((item) => item.id === selected);
                return (
                  <div className="lineup-slot" key={slot.id}>
                    <span
                      className={`slot-marker role-${slot.role.toLowerCase()}`}
                    >
                      {slot.role}
                    </span>
                    <div>
                      <label htmlFor={`slot-${slot.id}`}>
                        {slot.label}
                        <span>{slot.id.replace(/^[A-Z]+/, " ")}</span>
                      </label>
                      {editable ? (
                        <select
                          id={`slot-${slot.id}`}
                          disabled={disabled}
                          value={selected}
                          onChange={(event) => {
                            setDirty(true);
                            setSlots((previous) => [
                              ...previous.filter(
                                (selection) => selection.slotId !== slot.id,
                              ),
                              ...(event.target.value
                                ? [
                                    {
                                      slotId: slot.id,
                                      playerId: event.target.value,
                                    },
                                  ]
                                : []),
                            ]);
                          }}
                        >
                          <option value="">Choose player</option>
                          {roster
                            .filter(
                              (item) =>
                                !used.includes(item.id) &&
                                (slot.role === "FLEX" ||
                                  item.role === slot.role),
                            )
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} · {item.franchiseCode}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <strong>{player?.name ?? "No selection"}</strong>
                      )}
                    </div>
                    {player && (
                      <span className="slot-franchise">
                        {player.franchiseCode}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {editable ? (
              <div className="lineup-save">
                <p className="muted">
                  {dirty
                    ? "Local XI changes. Save before the commissioner locks the round."
                    : "Your current XI carries forward unless you change it. Review and save before the round locks."}
                </p>
                {!validation.valid && (
                  <p className="game-form-help">
                    Fill all eleven slots with eligible, distinct players from
                    your squad.
                  </p>
                )}
                <button
                  className="button button-primary"
                  disabled={
                    disabled ||
                    !validation.valid ||
                    (!dirty && lineup?.submittedAt !== null)
                  }
                  onClick={() =>
                    void run(
                      () => saveLineupAction(game.league.id, round!.id, slots),
                      "Your starting XI is saved.",
                    )
                  }
                >
                  {pending ? "Saving…" : "Save starting XI"}
                  <Icon name="check" size={16} />
                </button>
              </div>
            ) : (
              <p className="game-form-help">
                {round.status === "scheduled"
                  ? "This round has not opened yet."
                  : "Frozen selections are read-only. Only appearances in this round contribute points."}
              </p>
            )}
          </>
        )}
      </Panel>
      <div className="roster-aside">
        <Panel eyebrow="SQUAD BALANCE" title="Fifteen to choose from">
          <RoleComposition players={roster} />
          <p className="game-form-help">
            11 starters · 4 bench. Benched players do not score for your team.
          </p>
        </Panel>
        <Panel
          eyebrow="OWNED PLAYERS"
          title={
            privateLineup
              ? "Squad · XI private"
              : isMine
                ? "Your squad & bench"
                : `${team.name} squad`
          }
        >
          <ul className="roster-list">
            {roster.map((player) => {
              const slot = selectedByPlayer.get(player.id);
              const contribution = contributions.find(
                (item) => item.playerId === player.id,
              );
              return (
                <li key={player.id}>
                  <RoleBadge compact role={player.role} />
                  <div>
                    <Link
                      href={`/leagues/${game.league.id}/players/${player.id}`}
                    >
                      {player.name}
                    </Link>
                    <small>
                      {player.franchiseCode} ·{" "}
                      {!lineup ? "Squad" : (slot ?? "Bench")}
                    </small>
                  </div>
                  <span
                    title={
                      contribution
                        ? "This round's scored average"
                        : "Historical average per appearance"
                    }
                  >
                    {fmt(contribution?.score ?? player.averagePoints)}
                    <small>{contribution ? "round" : "hist. avg"}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Matchups({
  game,
  roundId,
  run,
  disabled,
}: ActionProps & { roundId?: string }) {
  const [round, setRound] = useState(roundId ?? "");
  useEffect(() => {
    if (roundId && !round) setRound(roundId);
  }, [roundId, round]);
  const selected = game.rounds.find((item) => item.id === round);
  const matchups = game.matchups
    .filter((item) => item.roundId === round)
    .sort(
      (a, b) =>
        Number(
          b.homeTeamId === game.me.teamId || b.awayTeamId === game.me.teamId,
        ) -
        Number(
          a.homeTeamId === game.me.teamId || a.awayTeamId === game.me.teamId,
        ),
    );
  const fixtures = game.matches.filter((item) => item.roundId === round);
  return (
    <>
      <div className="matchups-toolbar">
        <div>
          <span className="game-kicker">HEAD TO HEAD</span>
          <h2>{selected?.name ?? "The season starts after the draft"}</h2>
        </div>
        {game.rounds.length > 0 && (
          <select
            aria-label="Select historical round"
            value={round}
            onChange={(event) => setRound(event.target.value)}
          >
            {game.rounds.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.status}
              </option>
            ))}
          </select>
        )}
      </div>
      {game.me.isCommissioner && selected?.status === "open" && (
        <div className="replay-control">
          <div>
            <Icon name="lock" size={19} />
            <p>
              <b>Ready to settle this round?</b>
              <span>
                This freezes all six XIs and scores the recorded historical
                window. Confirm your managers are ready.
              </span>
            </p>
          </div>
          <button
            disabled={disabled}
            className="button button-primary"
            onClick={() =>
              void run(
                () => replayRoundAction(game.league.id, selected.id),
                "The round is locked and historical results are scored.",
              )
            }
          >
            Lock & replay
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      )}
      {!matchups.length ? (
        <EmptyState
          icon="swords"
          title="No matchup in this round yet"
          description="Regular-season pairings open after the draft. Playoff opponents are decided by the final league standings."
        />
      ) : (
        <div className="matchups-list">
          {matchups.map((matchup) => {
            const home = game.teams.find(
              (team) => team.id === matchup.homeTeamId,
            )!;
            const away = game.teams.find(
              (team) => team.id === matchup.awayTeamId,
            );
            const mine =
              home.id === game.me.teamId || away?.id === game.me.teamId;
            return (
              <article
                className={`head-to-head ${mine ? "my-matchup" : ""}`}
                key={matchup.id}
              >
                <header>
                  <span>{mine ? "YOUR MATCHUP" : "LEAGUE MATCHUP"}</span>
                  <Badge tone={matchup.status === "final" ? "mint" : "neutral"}>
                    {matchup.status === "final"
                      ? matchup.result === "draw"
                        ? "Draw"
                        : "Final"
                      : "Awaiting replay"}
                  </Badge>
                </header>
                <div className="matchup-teams">
                  <div
                    className={`matchup-team ${matchup.result === "home" ? "winner" : ""}`}
                  >
                    <Avatar
                      name={home.managerName}
                      seed={home.managerId}
                      size="lg"
                    />
                    <b>{home.name}</b>
                    <small>
                      {home.managerName}
                      {matchup.homeSeed ? ` · Seed ${matchup.homeSeed}` : ""}
                    </small>
                    <strong>{fmt(matchup.homeScore)}</strong>
                  </div>
                  <span className="versus">VS</span>
                  <div
                    className={`matchup-team ${matchup.result === "away" ? "winner" : ""}`}
                  >
                    {away ? (
                      <>
                        <Avatar
                          name={away.managerName}
                          seed={away.managerId}
                          size="lg"
                        />
                        <b>{away.name}</b>
                        <small>
                          {away.managerName}
                          {matchup.awaySeed
                            ? ` · Seed ${matchup.awaySeed}`
                            : ""}
                        </small>
                      </>
                    ) : (
                      <>
                        <span className="bye-mark">
                          <Icon name="flag" size={27} />
                        </span>
                        <b>Bye</b>
                        <small>No opponent</small>
                      </>
                    )}
                    <strong>{fmt(matchup.awayScore)}</strong>
                  </div>
                </div>
                {matchup.contributions.length > 0 ? (
                  <details className="matchup-contributions" open={mine}>
                    <summary>
                      Starting XI contributions{" "}
                      <Icon name="chevronDown" size={15} />
                    </summary>
                    <div className="contribution-teams">
                      {[home, away]
                        .filter((team): team is GameTeam => !!team)
                        .map((team) => (
                          <div key={team.id}>
                            <h3>{team.name}</h3>
                            {matchup.contributions
                              .filter((item) => item.teamId === team.id)
                              .map((contribution) => {
                                const player = game.players.find(
                                  (item) => item.id === contribution.playerId,
                                )!;
                                return (
                                  <Link
                                    key={contribution.playerId}
                                    href={`/leagues/${game.league.id}/players/${player.id}`}
                                  >
                                    <span>
                                      <b>{player.name}</b>
                                      <small>
                                        {contribution.slotId} ·{" "}
                                        {contribution.appearances} appearance
                                        {contribution.appearances === 1
                                          ? ""
                                          : "s"}
                                      </small>
                                    </span>
                                    <strong>{fmt(contribution.score)}</strong>
                                  </Link>
                                );
                              })}
                          </div>
                        ))}
                    </div>
                  </details>
                ) : (
                  <p className="matchup-pending">
                    Scores and starting selections appear after the round is
                    locked. No live scores or projections.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
      <Panel
        eyebrow="THE CRICKET BEHIND THE ROUND"
        title={`${fixtures.length} recorded matches`}
      >
        <div className="fixture-list">
          {fixtures.map((match) => (
            <article className="fixture-row" key={match.id}>
              <span className="fixture-date">
                {new Date(`${match.date}T12:00:00Z`).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", timeZone: "UTC" },
                )}
              </span>
              <div>
                <b>
                  {match.teamAName} <span>v</span> {match.teamBName}
                </b>
                <small>{match.venue} · Final historical record</small>
              </div>
              <a
                href={match.sourceUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Cricsheet source for ${match.teamAName} versus ${match.teamBName} on ${match.date}`}
              >
                <Icon name="arrowUpRight" size={18} />
              </a>
            </article>
          ))}
        </div>
        {!fixtures.length && (
          <p className="muted">
            The source fixture window appears when your league season is
            created.
          </p>
        )}
        <p className="game-form-help">
          Round points average a starter's actual appearances in this window. No
          appearance means zero. Bench players score zero.
        </p>
      </Panel>
    </>
  );
}

function Standings({ game, run, disabled }: ActionProps) {
  const ordered = [...game.teams].sort(
    (a, b) => a.rank - b.rank || a.name.localeCompare(b.name),
  );
  const playoffs = game.matchups.filter(
    (matchup) => matchup.homeSeed !== null || matchup.awaySeed !== null,
  );
  const champion = game.teams.find(
    (team) => team.id === game.league.championTeamId,
  );
  return (
    <>
      {champion && (
        <section className="champion-banner">
          <Icon name="trophy" size={38} />
          <div>
            <span className="game-kicker">LEAGUE CHAMPION</span>
            <h2>{champion.name}</h2>
            <p>
              {champion.managerName} · {game.league.seasonName}
            </p>
          </div>
          <Avatar
            name={champion.managerName}
            seed={champion.managerId}
            size="lg"
          />
        </section>
      )}
      <Panel eyebrow="FIVE ROUNDS TO QUALIFY" title="League standings">
        <div
          className="standings-scroll"
          tabIndex={0}
          aria-label="Standings table; scroll for all statistics"
        >
          <table className="game-standings">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Club</th>
                <th scope="col">W–L–D</th>
                <th scope="col">League pts</th>
                <th scope="col">For</th>
                <th scope="col">Against</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((team) => (
                <tr
                  className={team.id === game.me.teamId ? "your-standing" : ""}
                  key={team.id}
                >
                  <td>
                    <span
                      className={
                        team.rank > 0 && team.rank <= 4 ? "qualifying-rank" : ""
                      }
                    >
                      {team.rank > 0 ? team.rank : "—"}
                    </span>
                  </td>
                  <th scope="row">
                    <Avatar
                      name={team.managerName}
                      seed={team.managerId}
                      size="sm"
                    />
                    <span>
                      {team.name}
                      <small>
                        {team.managerName}
                        {team.id === game.me.teamId ? " · You" : ""}
                      </small>
                    </span>
                  </th>
                  <td>
                    {team.wins}–{team.losses}–{team.draws}
                  </td>
                  <td>{team.wins * 2 + team.draws}</td>
                  <td>{fmt(team.pointsFor)}</td>
                  <td>{fmt(team.pointsAgainst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="game-form-help">
          Win 2 · draw 1 · loss 0. Top four qualify. Ties: league points,
          fantasy points for, then head-to-head record and stable team ID.
          Displayed scores round to one decimal; results use full precision.
        </p>
      </Panel>
      <Panel eyebrow="THE TITLE RUN" title="Playoffs">
        {!playoffs.length ? (
          <div className="playoff-format">
            <div>
              <span>SEMIFINAL 1</span>
              <b>
                Seed 1 <i>vs</i> Seed 4
              </b>
            </div>
            <div>
              <span>SEMIFINAL 2</span>
              <b>
                Seed 2 <i>vs</i> Seed 3
              </b>
            </div>
            <p>
              Seeds are decided after Round 5. Semifinal winners meet in the
              final. An exact playoff tie advances the higher seed.
            </p>
          </div>
        ) : (
          <div className="playoff-bracket">
            {playoffs.map((matchup) => {
              const home = game.teams.find(
                (team) => team.id === matchup.homeTeamId,
              )!;
              const away = game.teams.find(
                (team) => team.id === matchup.awayTeamId,
              );
              return (
                <article key={matchup.id}>
                  <header>
                    {
                      game.rounds.find((round) => round.id === matchup.roundId)
                        ?.name
                    }
                    <Badge
                      tone={matchup.status === "final" ? "mint" : "neutral"}
                    >
                      {matchup.status === "final" ? "Final" : "Scheduled"}
                    </Badge>
                  </header>
                  <div className={matchup.result === "home" ? "winner" : ""}>
                    <span>
                      <small>#{matchup.homeSeed}</small>
                      {home.name}
                    </span>
                    <b>{fmt(matchup.homeScore)}</b>
                  </div>
                  <div className={matchup.result === "away" ? "winner" : ""}>
                    <span>
                      <small>#{matchup.awaySeed}</small>
                      {away?.name ?? "Bye"}
                    </span>
                    <b>{fmt(matchup.awayScore)}</b>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Panel>
      {game.me.isCommissioner &&
        game.rounds.some((round) => round.status === "completed") && (
          <details className="commissioner-tools">
            <summary>
              <Icon name="shield" size={17} />
              Commissioner · scoring tools
              <Icon name="chevronDown" size={16} />
            </summary>
            <p>
              Rebuild scored rounds from frozen XIs and the versioned historical
              points ledger. This does not reopen lineups or run a new draft.
            </p>
            <button
              className="button button-secondary"
              disabled={disabled}
              onClick={() =>
                void run(
                  () => recalculateLeagueAction(game.league.id),
                  "League scoring recalculated from frozen XIs.",
                )
              }
            >
              Recalculate league
            </button>
          </details>
        )}
    </>
  );
}

function Managers({ game }: { game: LeagueGameSnapshot }) {
  return (
    <Panel
      eyebrow="THE PEOPLE IN YOUR LEAGUE"
      title={`${game.teams.length} managers`}
    >
      <div className="manager-grid">
        {game.teams.map((team) => (
          <article className="manager-card" key={team.id}>
            <Avatar name={team.managerName} seed={team.managerId} size="lg" />
            <div>
              <h3>{team.managerName}</h3>
              <p>{team.name}</p>
              {team.id === game.me.teamId && (
                <Badge tone="mint">
                  You{game.me.isCommissioner ? " · Commissioner" : ""}
                </Badge>
              )}
            </div>
            <div className="manager-record">
              <span>
                <b>{team.rosterCount}</b> / 15 drafted
              </span>
              <span>
                <b>
                  {team.wins}–{team.losses}–{team.draws}
                </b>{" "}
                W · L · D
              </span>
            </div>
            <Link
              href={`/leagues/${game.league.id}?tab=roster`}
              className="game-inline-link"
            >
              Browse league rosters
              <Icon name="arrowRight" size={15} />
            </Link>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function Players({ game }: { game: LeagueGameSnapshot }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const query = search.trim().toLocaleLowerCase();
  const players = game.players
    .filter(
      (player) =>
        (role === "all" || player.role === role) &&
        (!query ||
          player.name.toLocaleLowerCase().includes(query) ||
          player.franchiseName.toLocaleLowerCase().includes(query)),
    )
    .sort(
      (a, b) =>
        b.averagePoints - a.averagePoints || a.name.localeCompare(b.name),
    );
  return (
    <>
      <Panel
        eyebrow="REAL CRICKET. YOUR LEAGUE."
        title={`${players.length} players`}
      >
        <div className="game-tools">
          <label className="game-search">
            <Icon name="search" size={18} />
            <input
              aria-label="Search league players"
              placeholder="Player or franchise"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter league players by role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="all">All roles</option>
            {Object.entries(roleLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="league-player-list">
          {players.map((player) => (
            <Link
              href={`/leagues/${game.league.id}/players/${player.id}`}
              key={player.id}
            >
              <Avatar name={player.name} seed={player.id} size="sm" />
              <span className="league-player-name">
                <b>{player.name}</b>
                <small>
                  {player.franchiseCode} · {player.appearances} appearances
                </small>
              </span>
              <RoleBadge compact role={player.role} />
              <span className="ownership-tag">
                {player.ownerTeamId
                  ? game.teams.find((team) => team.id === player.ownerTeamId)
                      ?.name
                  : "Available"}
              </span>
              <span className="pool-average">
                {fmt(player.averagePoints)}
                <small>hist. avg</small>
              </span>
              <Icon name="chevronRight" size={16} />
            </Link>
          ))}
        </div>
        {!players.length && (
          <EmptyState
            compact
            icon="search"
            title="No player matches"
            description="Search a player name or franchise, or try another role."
            action={
              <button
                className="button button-secondary"
                onClick={() => {
                  setSearch("");
                  setRole("all");
                }}
              >
                Clear filters
              </button>
            }
          />
        )}
      </Panel>
      <Attribution game={game} />
    </>
  );
}

function Attribution({ game }: { game: LeagueGameSnapshot }) {
  const source = game.attribution;
  return (
    <details className="game-attribution">
      <summary>
        <Icon name="shield" size={16} />
        <span>Recorded cricket · {game.league.scoringVersion}</span>
        <span>Source & scoring notes</span>
        <Icon name="chevronDown" size={15} />
      </summary>
      <div>
        <p>
          Historical {game.league.seasonYear} MLC data from Cricsheet. Not live,
          not projected. Fantasy role classifications are described below and
          are not a complete official-role dataset.
        </p>
        {source ? (
          <>
            <p>
              <a href={source.url} target="_blank" rel="noreferrer">
                Cricsheet source
              </a>{" "}
              ·{" "}
              <a href={source.licenseUrl} target="_blank" rel="noreferrer">
                ODC Attribution license
              </a>{" "}
              · <a href="/licenses/cricsheet-odc-by-1.0.txt">License copy</a>
            </p>
            <p>{source.rolePolicy}</p>
            <p className="source-checksum">Source SHA-256: {source.checksum}</p>
            {source.warnings.length > 0 && (
              <ul>
                {source.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>
            Source attribution is unavailable. Do not treat unverified figures
            as final scoring.
          </p>
        )}
      </div>
    </details>
  );
}
