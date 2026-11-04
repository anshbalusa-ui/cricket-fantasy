import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, mkdir, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import {
  groupHistoricalRounds,
  buildRoundRobin,
} from "../src/lib/fantasy/season";
import { SCORING_VERSION, scorePlayerMatch } from "../src/lib/fantasy/scoring";
import {
  normalizeCricsheetMatch,
  type NormalizedCricsheetMatch,
} from "../src/lib/ingestion/cricsheet";
import type { PlayerRole } from "../src/lib/fantasy/types";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVE_URL = "https://cricsheet.org/downloads/mlc_json.zip";
const LICENSE_URL = "https://opendatacommons.org/licenses/by/1.0/";
const ATTRIBUTION =
  "Cricsheet, Major League Cricket JSON data; https://cricsheet.org/";
const ROLE_POLICY =
  "mlc-2026-v2: fantasy-derived, not a complete official-role dataset. WK classifications use official 2026 franchise player pages explicitly listing the person as a wicketkeeper; all other roles derive from 2026 match contributions: ALL when both (runs >= 20 or balls faced >= 15) and (credited wickets > 0 or maiden > 0), BOWL when bowling evidence exists, otherwise BAT. Source URL is retained in each official WK player's role_source.";
const FRANCHISES = [
  ["Los Angeles Knight Riders", "LAKR"],
  ["MI New York", "MINY"],
  ["San Francisco Unicorns", "SFU"],
  ["Seattle Orcas", "SO"],
  ["Texas Super Kings", "TSK"],
  ["Washington Freedom", "WF"],
] as const;
const OFFICIAL_KEEPERS: Record<string, string> = {
  "4663bd23": "https://www.seattleorcas.com/players",
  "571e1d2a": "https://www.seattleorcas.com/players",
  d1305df0: "https://www.washingtonfreedom.com/squad",
  dcabd6bc: "https://www.washingtonfreedom.com/squad",
  "1bae756b": "https://www.lakriders.us/",
  "0c94f480": "https://www.lakriders.us/",
  cf689f00: "https://www.sfunicorns.com/squad/",
};
const SCHEMA_VERSION = "Cricsheet JSON 1.3.0";
const UUID_NAMESPACE = Buffer.from("5fa9a4e6c2b74ea1b19283111d7b004d", "hex");
const uuid = (key: string) => {
  const bytes = createHash("sha1")
    .update(UUID_NAMESPACE)
    .update(key)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const sha256 = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
const assertUpserted = (
  result: { rowCount: number | null },
  entity: string,
) => {
  if (result.rowCount !== 1)
    throw new Error(`Refusing conflicting or incomplete ${entity} upsert`);
};
type MatchRow = {
  id: string;
  sourceId: string;
  date: string;
  teams: [string, string];
  venue: string;
  checksum: string;
  players: NormalizedCricsheetMatch["players"];
};

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const archiveArg = args
    .find((arg) => arg.startsWith("--archive="))
    ?.slice("--archive=".length);
  const sourceEntries: { entry: string; rawBytes: Buffer }[] = [];
  let archiveChecksum: string;
  let archiveMatchCount: number;
  if (archiveArg) {
    const archivePath = path.resolve(archiveArg);
    const archive = await readFile(archivePath);
    archiveChecksum = sha256(archive);
    const names = execFileSync("unzip", ["-Z1", archivePath], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter((name) => name.endsWith(".json"));
    archiveMatchCount = names.length;
    for (const entry of names)
      sourceEntries.push({
        entry,
        rawBytes: execFileSync("unzip", ["-p", archivePath, entry]),
      });
  } else {
    const manifestPath = path.join(ROOT, "data/cricket/mlc-2026/manifest.json");
    const saved: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
    if (
      !saved ||
      typeof saved !== "object" ||
      !("archiveSha256" in saved) ||
      typeof saved.archiveSha256 !== "string" ||
      !("archiveMatchCount" in saved) ||
      typeof saved.archiveMatchCount !== "number" ||
      !("sourceFiles" in saved) ||
      !Array.isArray(saved.sourceFiles)
    )
      throw new Error("Committed source manifest is incomplete");
    archiveChecksum = saved.archiveSha256;
    archiveMatchCount = saved.archiveMatchCount;
    const rawDir = path.join(ROOT, "data/cricket/mlc-2026/raw");
    const sourceFiles = new Map<string, string>();
    for (const item of saved.sourceFiles) {
      if (
        !item ||
        typeof item !== "object" ||
        !("fileName" in item) ||
        typeof item.fileName !== "string" ||
        !("checksum" in item) ||
        typeof item.checksum !== "string"
      )
        throw new Error("Malformed source file manifest entry");
      sourceFiles.set(item.fileName, item.checksum);
    }
    const present = new Set(await readdir(rawDir));
    if (
      present.size !== sourceFiles.size ||
      [...sourceFiles.keys()].some((file) => !present.has(file))
    )
      throw new Error(
        "Committed MLC 2026 source files do not match the manifest",
      );
    for (const [entry, checksum] of sourceFiles) {
      const rawBytes = await readFile(path.join(rawDir, entry));
      if (sha256(rawBytes) !== checksum)
        throw new Error(`Source checksum mismatch: ${entry}`);
      sourceEntries.push({ entry, rawBytes });
    }
  }
  const matches: MatchRow[] = [];
  for (const { entry, rawBytes } of sourceEntries) {
    const raw: unknown = JSON.parse(rawBytes.toString("utf8"));
    if (
      !raw ||
      typeof raw !== "object" ||
      !("info" in raw) ||
      !raw.info ||
      typeof raw.info !== "object" ||
      !("dates" in raw.info) ||
      !Array.isArray(raw.info.dates)
    )
      throw new Error(`Malformed source entry: ${entry}`);
    if (!raw.info.dates[0]?.startsWith("2026-")) continue;
    const sourceId = path.posix.basename(entry, ".json");
    const normalized = normalizeCricsheetMatch(raw, sourceId);
    if (normalized.season !== "2026")
      throw new Error(
        `Unexpected season for ${sourceId}: ${normalized.season}`,
      );
    matches.push({
      id: uuid(`match:${sourceId}`),
      sourceId,
      date: normalized.date,
      teams: normalized.teams,
      venue: normalized.venue,
      checksum: sha256(rawBytes),
      players: normalized.players,
    });
  }
  matches.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.sourceId.localeCompare(b.sourceId),
  );
  const teamCode: Record<string, string> = Object.fromEntries(FRANCHISES);
  for (const match of matches)
    for (const team of match.teams)
      if (!Object.hasOwn(teamCode, team))
        throw new Error(`Unmapped Cricsheet franchise: ${team}`);
  const roles = new Map<
    string,
    {
      sourceId: string;
      name: string;
      team: string;
      runs: number;
      ballsFaced: number;
      wickets: number;
      maidens: number;
    }
  >();
  for (const match of matches)
    for (const player of match.players) {
      const value = roles.get(player.sourceId) ?? {
        sourceId: player.sourceId,
        name: player.name,
        team: player.team,
        runs: 0,
        ballsFaced: 0,
        wickets: 0,
        maidens: 0,
      };
      if (value.name !== player.name || value.team !== player.team)
        throw new Error(
          `Conflicting player identity/team for Cricsheet ID ${player.sourceId}`,
        );
      value.runs += player.stats.runs;
      value.ballsFaced += player.stats.ballsFaced;
      value.wickets += player.stats.wickets;
      value.maidens += player.stats.maidens;
      roles.set(player.sourceId, value);
    }
  for (const sourceId of Object.keys(OFFICIAL_KEEPERS))
    if (!roles.has(sourceId))
      throw new Error(
        `Official keeper ${sourceId} has no recorded 2026 appearance`,
      );
  const roleFor = (
    player: typeof roles extends Map<string, infer V> ? V : never,
  ): PlayerRole => {
    if (OFFICIAL_KEEPERS[player.sourceId]) return "WK";
    const batting = player.runs >= 20 || player.ballsFaced >= 15;
    const bowling = player.wickets > 0 || player.maidens > 0;
    return batting && bowling ? "ALL" : bowling ? "BOWL" : "BAT";
  };
  const playerRoles = new Map([...roles].map(([id, p]) => [id, roleFor(p)]));
  const franchiseByName: Record<string, string> = Object.fromEntries(
    FRANCHISES.map(([name, code]) => [name, uuid(`franchise:mlc:${code}`)]),
  );
  const roundGroups = groupHistoricalRounds(
    matches.map(({ id, date }) => ({ id, date })),
  );
  const franchiseIds: string[] = FRANCHISES.map(([, code]) => code);
  const pairings = buildRoundRobin(franchiseIds);
  const sourceIdByMatchId = new Map(
    matches.map((match) => [match.id, match.sourceId]),
  );
  const sourceVersion = SCHEMA_VERSION;
  const playerRows = [...roles].map(([sourceId, player]) => ({
    id: uuid(`player:${sourceId}`),
    source_id: sourceId,
    name: player.name,
    role: playerRoles.get(sourceId),
    role_source: OFFICIAL_KEEPERS[sourceId]
      ? `Official 2026 franchise roster identifies this player as a wicketkeeper: ${OFFICIAL_KEEPERS[sourceId]}`
      : ROLE_POLICY,
  }));
  const franchiseRows = FRANCHISES.map(([name, code]) => ({
    id: franchiseByName[name],
    name,
    code,
  }));
  const seasonPlayerRows = [...roles].map(([sourceId, player]) => ({
    player_id: uuid(`player:${sourceId}`),
    franchise_id: franchiseByName[player.team],
  }));
  const matchRows = matches.map((match) => ({
    id: match.id,
    source_id: match.sourceId,
    match_date: match.date,
    team_a_franchise_id: franchiseByName[match.teams[0]],
    team_b_franchise_id: franchiseByName[match.teams[1]],
    venue: match.venue,
    status: "final",
    source_url: ARCHIVE_URL,
    source_checksum: match.checksum,
  }));
  const statsRows = matches.flatMap((match) =>
    match.players.map((player) => ({
      match_id: match.id,
      player_id: uuid(`player:${player.sourceId}`),
      franchise_id: franchiseByName[player.team],
      stats: player.stats,
      source_checksum: match.checksum,
    })),
  );
  const pointsRows = matches.flatMap((match) =>
    match.players.map((player) => {
      const breakdown = scorePlayerMatch(
        player.stats,
        playerRoles.get(player.sourceId)!,
      );
      return {
        match_id: match.id,
        player_id: uuid(`player:${player.sourceId}`),
        scoring_version: SCORING_VERSION,
        total_points: breakdown.total,
        breakdown,
      };
    }),
  );
  const roundRows = roundGroups.map((round) => ({
    id: uuid(`round:${round.number}`),
    round_number: round.number,
    name: round.name,
    stage: round.stage,
    starts_on: round.startsOn,
    ends_on: round.endsOn,
  }));
  const roundMatchRows = roundGroups.flatMap((round) =>
    round.matchIds.map((matchId) => ({
      round_id: uuid(`round:${round.number}`),
      match_id: matchId,
    })),
  );
  const pairingRows = pairings.map((pairing) => ({
    round_number: pairing.round,
    home_position: franchiseIds.indexOf(pairing.homeTeamId) + 1,
    away_position: franchiseIds.indexOf(pairing.awayTeamId) + 1,
  }));
  const payload = (tag: string, rows: unknown[]) => {
    // JSON Unicode escapes preserve source dollars without terminating a SQL dollar-quoted block.
    const json = JSON.stringify(rows).replaceAll("$", "\\u0024");
    return `$${tag}$${json}$${tag}$::jsonb`;
  };
  const seedSql = `
-- Generated from Cricsheet JSON by scripts/import-cricket.ts; rerunning upserts the same source identities.
do $catalog_seed$
declare
  v_season uuid;
  v_competition uuid;
  v_rows integer;
begin
  select s.id, s.competition_id into v_season, v_competition
  from public.seasons s join public.competitions c on c.id=s.competition_id
  where c.slug='mlc' and s.year=2026;
  if v_season is null then raise exception 'Expected existing MLC 2026 season'; end if;
  insert into public.franchises(id,competition_id,name,code)
  select x.id,v_competition,x.name,x.code from jsonb_to_recordset(${payload("franchises", franchiseRows)}) as x(id uuid,name text,code text)
  on conflict(id) do update set name=excluded.name,code=excluded.code
  where public.franchises.competition_id=excluded.competition_id and public.franchises.name=excluded.name and public.franchises.code=excluded.code;
  get diagnostics v_rows = row_count;
  if v_rows <> ${franchiseRows.length} then raise exception 'Cricsheet franchise identity conflict'; end if;
  insert into public.cricket_players(id,source_id,name,role,role_source)
  select x.id,x.source_id,x.name,x.role,x.role_source from jsonb_to_recordset(${payload("players", playerRows)}) as x(id uuid,source_id text,name text,role text,role_source text)
  on conflict(source_id) do update set name=excluded.name,role=excluded.role,role_source=excluded.role_source
  where public.cricket_players.id=excluded.id and public.cricket_players.name=excluded.name;
  get diagnostics v_rows = row_count;
  if v_rows <> ${playerRows.length} then raise exception 'Cricsheet player identity conflict'; end if;
  insert into public.season_players(season_id,player_id,franchise_id)
  select v_season,x.player_id,x.franchise_id from jsonb_to_recordset(${payload("seasonplayers", seasonPlayerRows)}) as x(player_id uuid,franchise_id uuid)
  on conflict(season_id,player_id) do update set franchise_id=excluded.franchise_id;
  get diagnostics v_rows = row_count;
  if v_rows <> ${seasonPlayerRows.length} then raise exception 'Cricsheet season-player upsert incomplete'; end if;
  insert into public.cricket_matches(id,season_id,source_id,match_date,team_a_franchise_id,team_b_franchise_id,venue,status,source_url,source_checksum)
  select x.id,v_season,x.source_id,x.match_date,x.team_a_franchise_id,x.team_b_franchise_id,x.venue,x.status,x.source_url,x.source_checksum
  from jsonb_to_recordset(${payload("matches", matchRows)}) as x(id uuid,source_id text,match_date date,team_a_franchise_id uuid,team_b_franchise_id uuid,venue text,status text,source_url text,source_checksum text)
  on conflict(source_id) do update set match_date=excluded.match_date,team_a_franchise_id=excluded.team_a_franchise_id,team_b_franchise_id=excluded.team_b_franchise_id,venue=excluded.venue,status=excluded.status,source_url=excluded.source_url,source_checksum=excluded.source_checksum
  where public.cricket_matches.id=excluded.id and public.cricket_matches.season_id=excluded.season_id;
  get diagnostics v_rows = row_count;
  if v_rows <> ${matchRows.length} then raise exception 'Cricsheet match identity conflict'; end if;
  insert into public.player_match_stats(match_id,player_id,franchise_id,stats,source_checksum)
  select x.match_id,x.player_id,x.franchise_id,x.stats,x.source_checksum from jsonb_to_recordset(${payload("stats", statsRows)}) as x(match_id uuid,player_id uuid,franchise_id uuid,stats jsonb,source_checksum text)
  on conflict(match_id,player_id) do update set franchise_id=excluded.franchise_id,stats=excluded.stats,source_checksum=excluded.source_checksum;
  get diagnostics v_rows = row_count;
  if v_rows <> ${statsRows.length} then raise exception 'Cricsheet stat upsert incomplete'; end if;
  insert into public.player_match_points(match_id,player_id,scoring_version,total_points,breakdown)
  select x.match_id,x.player_id,x.scoring_version,x.total_points,x.breakdown from jsonb_to_recordset(${payload("points", pointsRows)}) as x(match_id uuid,player_id uuid,scoring_version text,total_points numeric,breakdown jsonb)
  on conflict(match_id,player_id,scoring_version) do update set total_points=excluded.total_points,breakdown=excluded.breakdown;
  get diagnostics v_rows = row_count;
  if v_rows <> ${pointsRows.length} then raise exception 'Cricsheet scoring upsert incomplete'; end if;
  insert into public.season_rounds(id,season_id,round_number,name,stage,starts_on,ends_on)
  select x.id,v_season,x.round_number,x.name,x.stage,x.starts_on,x.ends_on from jsonb_to_recordset(${payload("rounds", roundRows)}) as x(id uuid,round_number integer,name text,stage text,starts_on date,ends_on date)
  on conflict(season_id,round_number) do update set name=excluded.name,stage=excluded.stage,starts_on=excluded.starts_on,ends_on=excluded.ends_on;
  get diagnostics v_rows = row_count;
  if v_rows <> ${roundRows.length} then raise exception 'Cricsheet round identity conflict'; end if;
  insert into public.season_round_matches(round_id,match_id)
  select x.round_id,x.match_id from jsonb_to_recordset(${payload("roundmatches", roundMatchRows)}) as x(round_id uuid,match_id uuid)
  on conflict(match_id) do update set round_id=excluded.round_id;
  get diagnostics v_rows = row_count;
  if v_rows <> ${roundMatchRows.length} then raise exception 'Cricsheet round-match upsert incomplete'; end if;
  insert into public.season_pairings(season_id,round_number,home_position,away_position)
  select v_season,x.round_number,x.home_position,x.away_position from jsonb_to_recordset(${payload("pairings", pairingRows)}) as x(round_number integer,home_position integer,away_position integer)
  on conflict(season_id,round_number,home_position) do update set away_position=excluded.away_position;
  get diagnostics v_rows = row_count;
  if v_rows <> ${pairingRows.length} then raise exception 'Cricsheet pairing upsert incomplete'; end if;
  insert into public.cricket_ingest_runs(id,season_id,source_url,checksum,source_version,attribution,license_url,role_policy)
  select x.id,v_season,x.source_url,x.checksum,x.source_version,x.attribution,x.license_url,x.role_policy
  from jsonb_to_recordset(${payload("ingest", [{ id: uuid(`ingest:${archiveChecksum}`), source_url: ARCHIVE_URL, checksum: archiveChecksum, source_version: sourceVersion, attribution: ATTRIBUTION, license_url: LICENSE_URL, role_policy: ROLE_POLICY }])})
    as x(id uuid,source_url text,checksum text,source_version text,attribution text,license_url text,role_policy text)
  on conflict(checksum) do update set source_version=excluded.source_version,attribution=excluded.attribution,license_url=excluded.license_url,role_policy=excluded.role_policy,imported_at=now();
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'Cricsheet ingest audit upsert incomplete'; end if;
  if (select count(*) from public.cricket_matches where season_id=v_season) <> ${matchRows.length} then raise exception 'Cricsheet match seed count mismatch'; end if;
  if (select count(*) from public.player_match_stats p join public.cricket_matches m on m.id=p.match_id where m.season_id=v_season) <> ${statsRows.length} then raise exception 'Cricsheet stat seed count mismatch'; end if;
end
$catalog_seed$;
`;
  const migrationPath = path.join(
    ROOT,
    "supabase/migrations/20261104000000_cricket_catalog.sql",
  );
  const migrationMarker =
    "-- Generated from Cricsheet JSON by scripts/import-cricket.ts;";
  if (args.includes("--write-migration")) {
    const base = await readFile(migrationPath, "utf8");
    const markerIndex = base.indexOf(migrationMarker);
    await writeFile(
      migrationPath,
      `${markerIndex < 0 ? base.trimEnd() : base.slice(0, markerIndex).trimEnd()}\n\n${seedSql}`,
    );
    console.log(
      `Wrote ${matchRows.length} normalized matches, ${playerRows.length} players, ${statsRows.length} stats, ${pointsRows.length} scored appearances to ${migrationPath}`,
    );
    return;
  }
  const manifest = {
    provider: "Cricsheet",
    sourceUrl: ARCHIVE_URL,
    formatUrl: "https://cricsheet.org/format/json/",
    formatVersion: SCHEMA_VERSION,
    licenseUrl: LICENSE_URL,
    attribution: ATTRIBUTION,
    archiveSha256: archiveChecksum,
    archiveMatchCount,
    season: 2026,
    matchCount: matches.length,
    distinctDates: new Set(matches.map((m) => m.date)).size,
    playerCount: roles.size,
    roleCounts: Object.fromEntries(
      ["WK", "BAT", "BOWL", "ALL"].map((r) => [
        r,
        [...playerRoles.values()].filter((role) => role === r).length,
      ]),
    ),
    officialKeeperSources: Object.fromEntries(
      Object.entries(OFFICIAL_KEEPERS).map(([sourceId, url]) => [
        sourceId,
        { name: roles.get(sourceId)?.name, url },
      ]),
    ),
    rolePolicy: ROLE_POLICY,
    sourceFiles: matches.map((match) => ({
      fileName: `${match.sourceId}.json`,
      sourceId: match.sourceId,
      date: match.date,
      checksum: match.checksum,
    })),
    rounds: roundGroups.map((round) => ({
      number: round.number,
      name: round.name,
      stage: round.stage,
      startsOn: round.startsOn,
      endsOn: round.endsOn,
      matchCount: round.matchIds.length,
      sourceIds: round.matchIds.map((id) => sourceIdByMatchId.get(id)),
    })),
  };
  const manifestPath = path.join(ROOT, "data/cricket/mlc-2026/manifest.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
  if (!apply) {
    console.log(
      "Preview only. Set DATABASE_URL and pass --apply to upsert the catalog.",
    );
    return;
  }
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required with --apply");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("begin");
    const season = await client.query<{ id: string }>(
      "select s.id from public.seasons s join public.competitions c on c.id=s.competition_id where c.slug=$1 and s.year=$2",
      ["mlc", 2026],
    );
    if (season.rowCount !== 1)
      throw new Error(
        "Expected exactly one existing MLC 2026 season; refusing to create or replace it",
      );
    const seasonId = season.rows[0].id;
    const competition = await client.query<{ id: string }>(
      "select competition_id as id from public.seasons where id=$1",
      [seasonId],
    );
    for (const [name, code] of FRANCHISES)
      assertUpserted(
        await client.query(
          `insert into public.franchises(id,competition_id,name,code) values($1,$2,$3,$4) on conflict(id) do update set name=excluded.name,code=excluded.code where public.franchises.competition_id=excluded.competition_id and public.franchises.name=excluded.name and public.franchises.code=excluded.code`,
          [franchiseByName[name], competition.rows[0].id, name, code],
        ),
        "franchise",
      );
    for (const [sourceId, player] of roles) {
      assertUpserted(
        await client.query(
          `insert into public.cricket_players(id,source_id,name,role,role_source) values($1,$2,$3,$4,$5) on conflict(source_id) do update set name=excluded.name,role=excluded.role,role_source=excluded.role_source where public.cricket_players.name=excluded.name and public.cricket_players.id=excluded.id`,
          [
            uuid(`player:${sourceId}`),
            sourceId,
            player.name,
            playerRoles.get(sourceId),
            OFFICIAL_KEEPERS[sourceId]
              ? `Official 2026 franchise roster identifies this player as a wicketkeeper: ${OFFICIAL_KEEPERS[sourceId]}`
              : ROLE_POLICY,
          ],
        ),
        "player",
      );
      assertUpserted(
        await client.query(
          `insert into public.season_players(season_id,player_id,franchise_id) values($1,$2,$3) on conflict(season_id,player_id) do update set franchise_id=excluded.franchise_id`,
          [seasonId, uuid(`player:${sourceId}`), franchiseByName[player.team]],
        ),
        "season player",
      );
    }
    for (const match of matches) {
      const rawStats = match.players;
      const a = franchiseByName[match.teams[0]];
      const b = franchiseByName[match.teams[1]];
      assertUpserted(
        await client.query(
          `insert into public.cricket_matches(id,season_id,source_id,match_date,team_a_franchise_id,team_b_franchise_id,venue,status,source_url,source_checksum) values($1,$2,$3,$4,$5,$6,$7,'final',$8,$9) on conflict(source_id) do update set match_date=excluded.match_date,team_a_franchise_id=excluded.team_a_franchise_id,team_b_franchise_id=excluded.team_b_franchise_id,venue=excluded.venue,status='final',source_url=excluded.source_url,source_checksum=excluded.source_checksum where public.cricket_matches.id=excluded.id and public.cricket_matches.season_id=excluded.season_id`,
          [
            match.id,
            seasonId,
            match.sourceId,
            match.date,
            a,
            b,
            match.venue,
            ARCHIVE_URL,
            match.checksum,
          ],
        ),
        "match",
      );
      for (const player of rawStats) {
        const playerId = uuid(`player:${player.sourceId}`);
        const matchId = match.id;
        const points = scorePlayerMatch(
          player.stats,
          playerRoles.get(player.sourceId)!,
        );
        assertUpserted(
          await client.query(
            `insert into public.player_match_stats(match_id,player_id,franchise_id,stats,source_checksum) values($1,$2,$3,$4,$5) on conflict(match_id,player_id) do update set franchise_id=excluded.franchise_id,stats=excluded.stats,source_checksum=excluded.source_checksum`,
            [
              matchId,
              playerId,
              franchiseByName[player.team],
              player.stats,
              match.checksum,
            ],
          ),
          "match stats",
        );
        assertUpserted(
          await client.query(
            `insert into public.player_match_points(match_id,player_id,scoring_version,total_points,breakdown) values($1,$2,$3,$4,$5) on conflict(match_id,player_id,scoring_version) do update set total_points=excluded.total_points,breakdown=excluded.breakdown`,
            [matchId, playerId, SCORING_VERSION, points.total, points],
          ),
          "match points",
        );
      }
    }
    for (const round of roundGroups) {
      const roundId = uuid(`round:${round.number}`);
      assertUpserted(
        await client.query(
          `insert into public.season_rounds(id,season_id,round_number,name,stage,starts_on,ends_on) values($1,$2,$3,$4,$5,$6,$7) on conflict(season_id,round_number) do update set name=excluded.name,stage=excluded.stage,starts_on=excluded.starts_on,ends_on=excluded.ends_on where public.season_rounds.id=excluded.id`,
          [
            roundId,
            seasonId,
            round.number,
            round.name,
            round.stage,
            round.startsOn,
            round.endsOn,
          ],
        ),
        "season round",
      );
      for (const matchId of round.matchIds)
        assertUpserted(
          await client.query(
            `insert into public.season_round_matches(round_id,match_id) values($1,$2) on conflict(match_id) do update set round_id=excluded.round_id`,
            [roundId, matchId],
          ),
          "round match",
        );
    }
    for (const pairing of pairings) {
      const home = franchiseIds.indexOf(pairing.homeTeamId) + 1;
      const away = franchiseIds.indexOf(pairing.awayTeamId) + 1;
      assertUpserted(
        await client.query(
          `insert into public.season_pairings(season_id,round_number,home_position,away_position) values($1,$2,$3,$4) on conflict(season_id,round_number,home_position) do update set away_position=excluded.away_position`,
          [seasonId, pairing.round, home, away],
        ),
        "season pairing",
      );
    }
    assertUpserted(
      await client.query(
        `insert into public.cricket_ingest_runs(id,season_id,source_url,checksum,source_version,attribution,license_url,role_policy) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(checksum) do update set source_version=excluded.source_version,attribution=excluded.attribution,license_url=excluded.license_url,role_policy=excluded.role_policy,imported_at=now() where public.cricket_ingest_runs.id=excluded.id`,
        [
          uuid(`ingest:${archiveChecksum}`),
          seasonId,
          ARCHIVE_URL,
          archiveChecksum,
          SCHEMA_VERSION,
          ATTRIBUTION,
          LICENSE_URL,
          ROLE_POLICY,
        ],
      ),
      "ingest audit",
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
