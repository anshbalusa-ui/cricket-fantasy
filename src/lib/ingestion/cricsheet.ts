import { ZERO_STATS, type PlayerMatchStats } from "../fantasy/types";

export type NormalizedCricsheetMatch = {
  sourceId: string;
  season: string;
  date: string;
  teams: [string, string];
  venue: string;
  players: {
    sourceId: string;
    name: string;
    team: string;
    stats: PlayerMatchStats;
  }[];
  warnings: string[];
};

type Obj = Record<string, unknown>;
type PlayerAppearance = { name: string; team: string; stats: PlayerMatchStats };
const CREDITED_WICKETS: Record<string, true> = {
  bowled: true,
  caught: true,
  "caught and bowled": true,
  lbw: true,
  stumped: true,
  "hit wicket": true,
};
const DISMISSALS: Record<string, true> = {
  bowled: true,
  caught: true,
  "caught and bowled": true,
  lbw: true,
  stumped: true,
  "run out": true,
  "retired hurt": true,
  "retired out": true,
  "hit wicket": true,
  "obstructing the field": true,
  "hit the ball twice": true,
  "handled the ball": true,
  "timed out": true,
};
const EXTRA_TYPES: Record<string, true> = {
  byes: true,
  legbyes: true,
  noballs: true,
  penalty: true,
  wides: true,
};

function object(value: unknown, where: string): Obj {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError(`Malformed Cricsheet ${where}`);
  return value as Obj;
}
function string(value: unknown, where: string): string {
  if (typeof value !== "string" || value.length === 0)
    throw new TypeError(`Malformed Cricsheet ${where}`);
  return value;
}
function integer(value: unknown, where: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new TypeError(`Malformed Cricsheet ${where}`);
  return value as number;
}
function array(value: unknown, where: string): unknown[] {
  if (!Array.isArray(value))
    throw new TypeError(`Malformed Cricsheet ${where}`);
  return value;
}

export function normalizeCricsheetMatch(
  raw: unknown,
  sourceId: string,
): NormalizedCricsheetMatch {
  if (!sourceId.trim())
    throw new TypeError("Cricsheet sourceId must be nonempty");
  const root = object(raw, "match");
  const info = object(root.info, "info");
  const teamsRaw = array(info.teams, "info.teams");
  if (teamsRaw.length !== 2)
    throw new TypeError("Cricsheet match must have exactly two teams");
  const teams = [string(teamsRaw[0], "team"), string(teamsRaw[1], "team")] as [
    string,
    string,
  ];
  if (teams[0] === teams[1])
    throw new TypeError("Cricsheet teams must be distinct");
  const dates = array(info.dates, "info.dates");
  if (!dates.length) throw new TypeError("Cricsheet match dates are required");
  const date = string(dates[0], "match date");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  )
    throw new TypeError("Malformed Cricsheet match date");
  const season = string(info.season, "season");
  const registry = object(
    object(info.registry, "registry").people,
    "registry.people",
  );
  const namesToIds = new Map<string, string>();
  const idsToNames = new Map<string, string>();
  for (const [name, rawId] of Object.entries(registry)) {
    const id = string(rawId, `registry ID for ${name}`);
    if (idsToNames.has(id))
      throw new TypeError(`Duplicate Cricsheet registry ID ${id}`);
    namesToIds.set(name, id);
    idsToNames.set(id, name);
  }
  const roster = new Map<string, string>();
  const appearances = new Map<string, PlayerAppearance>();
  for (const team of teams) {
    for (const rawName of array(
      object(info.players, "info.players")[team],
      `players for ${team}`,
    )) {
      const name = string(rawName, `player for ${team}`);
      if (roster.has(name))
        throw new TypeError(`Player appears on multiple team lists: ${name}`);
      roster.set(name, team);
      const id = namesToIds.get(name);
      if (!id) throw new TypeError(`Missing stable registry ID for ${name}`);
      appearances.set(id, { name, team, stats: { ...ZERO_STATS } });
    }
  }
  const warnings: string[] = [];
  const player = (
    name: unknown,
    context: string,
    fallbackTeam?: string,
  ): PlayerAppearance => {
    const playerName = string(name, context);
    const id = namesToIds.get(playerName);
    if (!id)
      throw new TypeError(`Missing stable registry ID for ${playerName}`);
    let entry = appearances.get(id);
    if (!entry) {
      const team = roster.get(playerName) ?? fallbackTeam;
      if (!team) throw new TypeError(`Cannot determine team for ${playerName}`);
      entry = { name: playerName, team, stats: { ...ZERO_STATS } };
      appearances.set(id, entry);
    }
    return entry;
  };
  const innings = array(root.innings, "innings");
  const ballsPerOver =
    info.balls_per_over === undefined
      ? 6
      : integer(info.balls_per_over, "balls_per_over");
  if (!ballsPerOver)
    throw new TypeError("Cricsheet balls_per_over must be positive");
  for (const rawInnings of innings) {
    const inn = object(rawInnings, "innings entry");
    const battingTeam = string(inn.team, "innings team");
    if (!teams.includes(battingTeam))
      throw new TypeError(`Unknown innings team ${battingTeam}`);
    if (inn.super_over === true) continue;
    if (inn.super_over !== undefined && typeof inn.super_over !== "boolean")
      throw new TypeError("Malformed super_over marker");
    if (inn.overs === undefined && inn.forfeited !== true)
      throw new TypeError(
        "Cricsheet innings overs are required unless forfeited",
      );
    const overs =
      inn.overs === undefined ? [] : array(inn.overs, "innings overs");
    for (const rawOver of overs) {
      const over = object(rawOver, "over");
      const overNumber = integer(over.over, "over number");
      let legal = 0;
      let bowler: PlayerAppearance | undefined;
      let bowlerRuns = 0;
      let sharedOver = false;
      for (const rawDelivery of array(over.deliveries, "over deliveries")) {
        const delivery = object(rawDelivery, "delivery");
        const batter = player(delivery.batter, "delivery batter", battingTeam);
        const nonStriker = player(
          delivery.non_striker,
          "delivery non_striker",
          battingTeam,
        );
        const deliveryBowler = player(
          delivery.bowler,
          "delivery bowler",
          teams.find((team) => team !== battingTeam),
        );
        if (bowler && bowler !== deliveryBowler) sharedOver = true;
        bowler = deliveryBowler;
        if (
          batter.team !== battingTeam ||
          nonStriker.team !== battingTeam ||
          bowler.team === battingTeam
        )
          throw new TypeError(
            "Cricsheet delivery player team conflicts with innings",
          );
        const runs = object(delivery.runs, "delivery runs");
        const batterRuns = integer(runs.batter, "batter runs");
        const extrasRuns = integer(runs.extras, "delivery extras runs");
        const totalRuns = integer(runs.total, "delivery total runs");
        if (batterRuns + extrasRuns !== totalRuns)
          throw new TypeError("Inconsistent Cricsheet delivery run totals");
        const extras =
          delivery.extras === undefined
            ? {}
            : object(delivery.extras, "delivery extras");
        let extrasSum = 0;
        for (const [kind, value] of Object.entries(extras)) {
          if (!Object.hasOwn(EXTRA_TYPES, kind))
            throw new TypeError(`Unsupported Cricsheet extra ${kind}`);
          extrasSum += integer(value, `${kind} extras`);
        }
        if (extrasSum !== extrasRuns)
          throw new TypeError(
            "Cricsheet extra breakdown does not match runs.extras",
          );
        const isWide = ((extras.wides as number | undefined) ?? 0) > 0;
        const isNoBall = ((extras.noballs as number | undefined) ?? 0) > 0;
        if (!isWide) batter.stats.ballsFaced++;
        if (
          runs.non_boundary !== undefined &&
          typeof runs.non_boundary !== "boolean"
        )
          throw new TypeError("Malformed non_boundary marker");
        if (!runs.non_boundary) {
          if (batterRuns === 4) batter.stats.fours++;
          if (batterRuns === 6) batter.stats.sixes++;
        }
        batter.stats.runs += batterRuns;
        bowlerRuns +=
          batterRuns +
          ((extras.wides as number | undefined) ?? 0) +
          ((extras.noballs as number | undefined) ?? 0);
        if (!isWide && !isNoBall) legal++;

        if (delivery.wickets !== undefined) {
          for (const rawWicket of array(delivery.wickets, "delivery wickets")) {
            const wicket = object(rawWicket, "wicket");
            const kind = string(wicket.kind, "dismissal kind");
            if (!Object.hasOwn(DISMISSALS, kind))
              throw new TypeError(`Unsupported Cricsheet dismissal ${kind}`);
            const dismissed = player(
              wicket.player_out,
              "dismissed player",
              battingTeam,
            );
            if (dismissed.team !== battingTeam)
              throw new TypeError("Dismissed player is not on batting team");
            if (kind !== "retired hurt") dismissed.stats.dismissed = true;
            if (Object.hasOwn(CREDITED_WICKETS, kind)) bowler.stats.wickets++;
            if (kind === "caught" || kind === "caught and bowled") {
              const fielders =
                wicket.fielders === undefined
                  ? []
                  : array(wicket.fielders, "wicket fielders");
              if (kind === "caught and bowled") bowler.stats.catches++;
              else if (fielders.length === 1)
                player(
                  object(fielders[0], "catch fielder").name,
                  "catch fielder",
                  bowler.team,
                ).stats.catches++;
              else
                warnings.push(
                  `Catch fielder attribution ambiguous for ${dismissed.name} (${fielders.length} fielders)`,
                );
            } else if (kind === "stumped") {
              const fielders =
                wicket.fielders === undefined
                  ? []
                  : array(wicket.fielders, "stumping fielders");
              if (fielders.length === 1)
                player(
                  object(fielders[0], "stumping fielder").name,
                  "stumping fielder",
                  bowler.team,
                ).stats.stumpings++;
              else
                warnings.push(
                  `Stumping fielder attribution ambiguous for ${dismissed.name} (${fielders.length} fielders)`,
                );
            } else if (kind === "run out") {
              const fielders =
                wicket.fielders === undefined
                  ? []
                  : array(wicket.fielders, "runout fielders");
              if (fielders.length === 1)
                player(
                  object(fielders[0], "runout fielder").name,
                  "runout fielder",
                  bowler.team,
                ).stats.directRunOuts++;
              else if (fielders.length > 1) {
                for (const fielder of fielders)
                  player(
                    object(fielder, "runout fielder").name,
                    "runout fielder",
                    bowler.team,
                  ).stats.assistedRunOuts++;
                warnings.push(
                  `Run-out direct attribution ambiguous for ${dismissed.name}; all ${fielders.length} fielders receive assisted credit and no direct credit`,
                );
              } else
                warnings.push(
                  `Run-out fielder attribution unavailable for ${dismissed.name}`,
                );
            }
          }
        }
      }
      if (bowler && !sharedOver && legal === ballsPerOver && bowlerRuns === 0)
        bowler.stats.maidens++;
      else if (bowlerRuns === 0 && legal > 0 && legal < ballsPerOver)
        warnings.push(
          `Incomplete over ${overNumber} is not counted as a maiden`,
        );
      if (sharedOver && bowlerRuns === 0)
        warnings.push(
          `Over ${overNumber} was shared between bowlers; no individual completed a maiden`,
        );
    }
  }
  return {
    sourceId,
    season,
    date,
    teams,
    venue: typeof info.venue === "string" ? info.venue : "",
    players: [...appearances.entries()].map(([id, value]) => ({
      sourceId: id,
      ...value,
    })),
    warnings: [...new Set(warnings)],
  };
}
