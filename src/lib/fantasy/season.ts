export type HistoricalRound = {
  number: number;
  name: string;
  stage: "regular" | "semifinal" | "final";
  startsOn: string;
  endsOn: string;
  matchIds: string[];
};

/** A deterministic single round-robin, with six-team circle-method home/away rotations. */
export function buildRoundRobin(
  teamIds: readonly string[],
): { round: number; homeTeamId: string; awayTeamId: string }[] {
  if (
    teamIds.length !== 6 ||
    new Set(teamIds).size !== 6 ||
    teamIds.some((id) => !id)
  ) {
    throw new RangeError("A round robin requires six distinct team IDs");
  }
  const rotating = [...teamIds];
  const pairings: { round: number; homeTeamId: string; awayTeamId: string }[] =
    [];
  for (let round = 1; round <= 5; round++) {
    for (let i = 0; i < 3; i++) {
      const left = rotating[i];
      const right = rotating[5 - i];
      const homeTeamId = round % 2 === 1 ? left : right;
      const awayTeamId = round % 2 === 1 ? right : left;
      pairings.push({ round, homeTeamId, awayTeamId });
    }
    rotating.splice(1, 0, rotating.pop()!);
  }
  return pairings;
}

/** Partitions chronological match dates into seven contiguous, match-count-balanced windows. */
export function groupHistoricalRounds(
  matches: { id: string; date: string }[],
): HistoricalRound[] {
  if (matches.length === 0)
    throw new RangeError("At least seven distinct match dates are required");
  const byDate = new Map<string, string[]>();
  const ids = new Set<string>();
  for (const match of matches) {
    if (!match.id || ids.has(match.id))
      throw new RangeError("Match IDs must be nonempty and unique");
    ids.add(match.id);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(match.date) ||
      Number.isNaN(Date.parse(`${match.date}T00:00:00Z`)) ||
      new Date(`${match.date}T00:00:00Z`).toISOString().slice(0, 10) !==
        match.date
    ) {
      throw new RangeError(`Invalid match date ${match.date}`);
    }
    const day = byDate.get(match.date);
    if (day) day.push(match.id);
    else byDate.set(match.date, [match.id]);
  }
  const days = [...byDate].sort(([a], [b]) => a.localeCompare(b));
  if (days.length < 7)
    throw new RangeError("At least seven distinct match dates are required");

  const n = days.length;
  const prefix = [0];
  for (const [, dayMatches] of days)
    prefix.push(prefix[prefix.length - 1] + dayMatches.length);
  const total = matches.length;
  const dp = Array.from({ length: 8 }, () =>
    Array<number>(n + 1).fill(Infinity),
  );
  const cuts = Array.from({ length: 8 }, () => Array<number>(n + 1).fill(-1));
  dp[0][0] = 0;
  for (let groups = 1; groups <= 7; groups++) {
    for (let end = groups; end <= n - (7 - groups); end++) {
      for (let start = groups - 1; start < end; start++) {
        const cost =
          dp[groups - 1][start] +
          (7 * (prefix[end] - prefix[start]) - total) ** 2;
        if (cost < dp[groups][end]) {
          dp[groups][end] = cost;
          cuts[groups][end] = start;
        }
      }
    }
  }
  const bounds: [number, number][] = [];
  let end = n;
  for (let group = 7; group > 0; group--) {
    const start = cuts[group][end];
    bounds.push([start, end]);
    end = start;
  }
  bounds.reverse();
  const names = [
    "Regular season 1",
    "Regular season 2",
    "Regular season 3",
    "Regular season 4",
    "Regular season 5",
    "Semifinal",
    "Final",
  ];
  return bounds.map(([start, stop], index) => ({
    number: index + 1,
    name: names[index],
    stage: index < 5 ? "regular" : index === 5 ? "semifinal" : "final",
    startsOn: days[start][0],
    endsOn: days[stop - 1][0],
    matchIds: days.slice(start, stop).flatMap(([, dayMatches]) => dayMatches),
  }));
}
