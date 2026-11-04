import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "Set TEST_DATABASE_URL to a disposable local PostgreSQL database named cricket_fantasy_test.",
  );
const databaseUrl = new URL(connectionString);
const databaseName = databaseUrl.pathname.slice(1);
const hostname = databaseUrl.hostname.replace(/^\[|\]$/g, "").toLowerCase();
if (databaseName !== "cricket_fantasy_test")
  throw new Error(
    `Refusing destructive test setup for database ${databaseName}; expected cricket_fantasy_test.`,
  );
if (!["localhost", "127.0.0.1", "::1"].includes(hostname))
  throw new Error(
    `Refusing destructive test setup for non-local PostgreSQL host ${hostname}.`,
  );
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const migrationDirectory = resolve(root, "supabase/migrations");
const migrationFiles = (await readdir(migrationDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const migrations = await Promise.all(
  migrationFiles.map((file) =>
    readFile(resolve(migrationDirectory, file), "utf8"),
  ),
);
let admin;
let leagueId;
let otherLeagueId;
let invitation;
let seasonId;
const users = Array.from(
  { length: 9 },
  (_, i) => `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
);
async function authAs(client, userId) {
  await client.query("select set_config('request.jwt.claim.sub', $1, false)", [
    userId,
  ]);
  await client.query("set role authenticated");
}
async function asUser(userId, operation) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await authAs(client, userId);
    return await operation(client);
  } finally {
    await client.query("reset role").catch(() => {});
    await client.end();
  }
}
async function expectPgError(operation, message) {
  await assert.rejects(operation, (error) => {
    assert.match(
      error.message,
      new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
    return true;
  });
}

before(async () => {
  admin = new Client({ connectionString });
  await admin.connect();
  await admin.query(`
    drop schema if exists private cascade;
    drop schema if exists public cascade;
    create schema public;
    create schema if not exists extensions;
    grant all on schema public to postgres;
    do $$ begin
      if not exists(select 1 from pg_namespace where nspname='auth') then
        create schema auth;
        create table auth.users (
          id uuid primary key,
          email text,
          raw_user_meta_data jsonb not null default '{}'::jsonb
        );
        create function auth.uid() returns uuid language sql stable as $fn$
          select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        $fn$;
      end if;
      if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    end $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  await admin.query("delete from auth.users where id = any($1::uuid[])", [
    users,
  ]);
  await admin.query(
    "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
    [
      users[8],
      "manager9@example.test",
      JSON.stringify({
        display_name: "An exceptionally long signup name that needs truncation",
      }),
    ],
  );
  for (const migration of migrations) await admin.query(migration);
  for (const [i, userId] of users.entries()) {
    if (i === 8) continue;
    const displayName = `Manager ${i + 1}`;
    await admin.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
      [
        userId,
        `manager${i + 1}@example.test`,
        JSON.stringify({ display_name: displayName }),
      ],
    );
  }
  const season = await admin.query(
    "select s.id from public.seasons s join public.competitions c on c.id=s.competition_id where c.slug='mlc' and s.year=2026",
  );
  assert.equal(
    season.rows.length,
    1,
    "catalog migration preserves the existing MLC 2026 season identity",
  );
  seasonId = season.rows[0].id;
  const facts = await admin.query(
    `
    select (select count(*) from public.season_players where season_id=$1)::int as players,
      (select count(*) from public.cricket_matches where season_id=$1)::int as matches,
      (select count(distinct match_date) from public.cricket_matches where season_id=$1)::int as match_dates,
      (select count(*) from public.franchises where competition_id=(select competition_id from public.seasons where id=$1))::int as franchises,
      (select count(*) from public.season_rounds where season_id=$1)::int as rounds,
      (select count(*) from public.season_players sp join public.cricket_players cp on cp.id=sp.player_id where sp.season_id=$1 and cp.role='WK')::int as wicketkeepers,
      (select count(*) from public.season_players sp join public.cricket_players cp on cp.id=sp.player_id where sp.season_id=$1 and cp.role='BAT')::int as batters,
      (select count(*) from public.season_players sp join public.cricket_players cp on cp.id=sp.player_id where sp.season_id=$1 and cp.role='BOWL')::int as bowlers,
      (select count(*) from public.season_players sp join public.cricket_players cp on cp.id=sp.player_id where sp.season_id=$1 and cp.role='ALL')::int as all_rounders
  `,
    [seasonId],
  );
  assert.ok(
    facts.rows[0].players >= 90,
    "seeded MLC pool supports the complete 90-pick draft",
  );
  assert.equal(
    facts.rows[0].matches,
    34,
    "real catalog contains all 34 MLC 2026 matches",
  );
  assert.equal(
    facts.rows[0].match_dates,
    22,
    "historical round windows use actual match dates",
  );
  assert.equal(
    facts.rows[0].franchises,
    6,
    "all six MLC franchises are seeded",
  );
  assert.deepEqual(
    [
      facts.rows[0].wicketkeepers,
      facts.rows[0].batters,
      facts.rows[0].bowlers,
      facts.rows[0].all_rounders,
    ],
    [7, 37, 20, 38],
    "source-derived roles support all six role-complete squads",
  );
  assert.equal(
    facts.rows[0].rounds,
    7,
    "historical season has five regular rounds and two playoffs",
  );
  leagueId = (
    await asUser(users[0], (c) =>
      c.query(
        "select public.create_league('Boundary League','Commissioner XI',$1)",
        [seasonId],
      ),
    )
  ).rows[0].create_league;
  invitation = (
    await asUser(users[0], (c) =>
      c.query("select public.create_invitation($1)", [leagueId]),
    )
  ).rows[0].create_invitation;
  otherLeagueId = (
    await asUser(users[2], (c) =>
      c.query(`select public.create_league('Other League','Other XI',$1)`, [
        seasonId,
      ]),
    )
  ).rows[0].create_league;
  await asUser(users[2], (c) =>
    c.query("select public.create_invitation($1)", [otherLeagueId]),
  );
});

after(async () => {
  if (admin) await admin.end();
});

test("signup trigger and existing-account backfill initialize profiles; private rows and public metadata obey RLS", async () => {
  assert.equal(
    (
      await admin.query(
        "select display_name from public.profiles where id=$1",
        [users[0]],
      )
    ).rows[0].display_name,
    "Manager 1",
  );
  assert.equal(
    (
      await admin.query(
        "select char_length(display_name) from public.profiles where id=$1",
        [users[8]],
      )
    ).rows[0].char_length,
    40,
  );
  assert.match(invitation, /^[0-9a-f]{64}$/);
  const storedHash = await admin.query(
    `select encode(token_hash,'hex') as hash from public.league_invitations where league_id=$1 and revoked_at is null`,
    [leagueId],
  );
  const expectedHash = await admin.query(
    `select encode(extensions.digest($1,'sha256'),'hex') as hash`,
    [invitation],
  );
  assert.equal(storedHash.rows[0].hash, expectedHash.rows[0].hash);
  const tables = [
    "profiles",
    "competitions",
    "seasons",
    "fantasy_leagues",
    "league_memberships",
    "fantasy_teams",
    "league_invitations",
  ];
  const updateColumns = {
    profiles: "display_name",
    competitions: "name",
    seasons: "year",
    fantasy_leagues: "name",
    league_memberships: "role",
    fantasy_teams: "name",
    league_invitations: "revoked_at",
  };
  await asUser(users[1], async (client) => {
    for (const table of [
      "fantasy_leagues",
      "league_memberships",
      "fantasy_teams",
      "league_invitations",
    ]) {
      assert.equal(
        (await client.query(`select * from public.${table}`)).rowCount,
        0,
      );
    }
    assert.equal(
      (await client.query("select count(*) from public.seasons")).rows[0].count,
      "1",
    );
    assert.equal(
      (await client.query("select * from public.profiles")).rowCount,
      1,
    );
    await client.query(
      "update public.profiles set display_name='Changed' where id=$1",
      [users[1]],
    );
    const crossProfile = await client.query(
      "update public.profiles set display_name='Cross-user' where id=$1",
      [users[0]],
    );
    assert.equal(
      crossProfile.rowCount,
      0,
      "RLS hides non-coworker profile updates",
    );
    await expectPgError(
      () =>
        client.query("update public.profiles set id=$1 where id=$2", [
          users[2],
          users[1],
        ]),
      "permission denied",
    );
    await expectPgError(
      () => client.query("select public.initialize_profile()"),
      "permission denied",
    );
    await expectPgError(
      () => client.query("select public.is_league_member($1)", [leagueId]),
      "does not exist",
    );
    for (const table of tables) {
      await expectPgError(
        () => client.query(`insert into public.${table} default values`),
        "permission denied",
      );
      if (table !== "profiles") {
        await expectPgError(
          () =>
            client.query(
              `update public.${table} set ${updateColumns[table]}=${updateColumns[table]} where false`,
            ),
          "permission denied",
        );
      }
      await expectPgError(
        () => client.query(`delete from public.${table} where false`),
        "permission denied",
      );
    }
  });
  await asUser(users[0], async (client) => {
    assert.equal(
      (
        await client.query(
          "select count(*) from public.fantasy_leagues where id=$1",
          [leagueId],
        )
      ).rows[0].count,
      "1",
    );
    assert.equal(
      (
        await client.query(
          "select count(*) from public.league_invitations where revoked_at is null",
        )
      ).rows[0].count,
      "1",
    );
    assert.equal(
      (
        await client.query(
          "select display_name from public.profiles where id=$1",
          [users[0]],
        )
      ).rows[0].display_name,
      "Manager 1",
    );
    assert.equal(
      (
        await client.query(
          `select count(*) from public.league_memberships where league_id=$1 and user_id=$2 and role='commissioner'`,
          [leagueId, users[0]],
        )
      ).rows[0].count,
      "1",
    );
    assert.equal(
      (
        await client.query(
          "select count(*) from public.fantasy_teams where league_id=$1 and manager_user_id=$2",
          [leagueId, users[0]],
        )
      ).rows[0].count,
      "1",
    );
    await expectPgError(
      () =>
        client.query(
          "update public.fantasy_leagues set name=name where id=$1",
          [leagueId],
        ),
      "permission denied",
    );
    await expectPgError(
      () =>
        client.query(
          "delete from public.league_invitations where league_id=$1",
          [leagueId],
        ),
      "permission denied",
    );
  });
  const anon = new Client({ connectionString });
  await anon.connect();
  try {
    await anon.query("set role anon");
    for (const table of tables)
      await expectPgError(
        () => anon.query(`select * from public.${table}`),
        "permission denied",
      );
    const forbiddenRpcs = [
      {
        sql: `select public.create_league($1,$2,$3)`,
        args: ["x", "x", seasonId],
      },
      { sql: "select public.join_league($1,$2)", args: ["x", "x"] },
      { sql: "select public.create_invitation($1)", args: [leagueId] },
      {
        sql: "select public.revoke_invitation($1)",
        args: ["00000000-0000-4000-8000-000000000001"],
      },
      { sql: "select public.rename_team($1,$2)", args: [leagueId, "x"] },
      { sql: "select public.rename_league($1,$2)", args: [leagueId, "x"] },
      { sql: "select public.leave_league($1)", args: [leagueId] },
    ];
    for (const rpc of forbiddenRpcs)
      await expectPgError(
        () => anon.query(rpc.sql, rpc.args),
        "permission denied",
      );
    for (const table of tables) {
      await expectPgError(
        () => anon.query(`insert into public.${table} default values`),
        "permission denied",
      );
      await expectPgError(
        () =>
          anon.query(
            `update public.${table} set ${updateColumns[table]}=${updateColumns[table]} where false`,
          ),
        "permission denied",
      );
      await expectPgError(
        () => anon.query(`delete from public.${table} where false`),
        "permission denied",
      );
    }
  } finally {
    await anon.query("reset role");
    await anon.end();
  }
});

test("invite join validates shape, expiry, revocation, duplicate and operation ownership", async () => {
  await expectPgError(
    () =>
      asUser(users[7], (c) =>
        c.query("select public.rename_team($1,'Unauthorized')", [leagueId]),
      ),
    "Membership required",
  );
  await expectPgError(
    () =>
      asUser(users[7], (c) =>
        c.query("select public.leave_league($1)", [leagueId]),
      ),
    "Membership required",
  );
  await expectPgError(
    () =>
      asUser(users[1], (c) => c.query("select public.join_league('bad','X')")),
    "Invalid invitation",
  );
  await asUser(users[1], async (client) => {
    await expectPgError(
      () => client.query("select public.join_league($1,'X')", ["a".repeat(64)]),
      "Invalid invitation",
    );
  });
  const previousInvitation = invitation;
  invitation = (
    await asUser(users[0], (c) =>
      c.query("select public.create_invitation($1)", [leagueId]),
    )
  ).rows[0].create_invitation;
  await expectPgError(
    () =>
      asUser(users[1], (c) =>
        c.query("select public.join_league($1,$2)", [
          previousInvitation,
          "Old Link",
        ]),
      ),
    "Invalid invitation",
  );
  const invitationId = (
    await admin.query(
      "select id from public.league_invitations where league_id=$1 and revoked_at is null",
      [leagueId],
    )
  ).rows[0].id;
  await expectPgError(
    () =>
      asUser(users[1], (c) =>
        c.query("select public.revoke_invitation($1)", [invitationId]),
      ),
    "Commissioner required",
  );
  await asUser(users[1], (client) =>
    client.query("select public.join_league($1,'Manager Two XI')", [
      invitation,
    ]),
  );
  await expectPgError(
    () =>
      asUser(users[1], (c) =>
        c.query("select public.join_league($1,'Again')", [invitation]),
      ),
    "Already a member",
  );
  await asUser(users[1], async (client) => {
    await expectPgError(
      () =>
        client.query(
          "update public.fantasy_teams set name='Stolen' where league_id=$1 and manager_user_id=$2",
          [leagueId, users[0]],
        ),
      "permission denied",
    );
    await client.query("select public.rename_team($1,'New Manager Two')", [
      leagueId,
    ]);
    assert.equal(
      (
        await client.query(
          "select name from public.fantasy_teams where league_id=$1 and manager_user_id=$2",
          [leagueId, users[1]],
        )
      ).rows[0].name,
      "New Manager Two",
    );
    assert.equal(
      (
        await client.query("select count(*) from public.profiles where id=$1", [
          users[0],
        ])
      ).rows[0].count,
      "1",
    );
    assert.equal(
      (
        await client.query("select count(*) from public.profiles where id=$1", [
          users[2],
        ])
      ).rows[0].count,
      "0",
    );
    assert.equal(
      (
        await client.query("select * from public.fantasy_leagues where id=$1", [
          otherLeagueId,
        ])
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await client.query(
          "select * from public.league_memberships where league_id=$1",
          [otherLeagueId],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await client.query(
          "select * from public.league_invitations where league_id=$1",
          [otherLeagueId],
        )
      ).rowCount,
      0,
    );
  });
  await asUser(users[0], async (client) => {
    await client.query("select public.revoke_invitation($1)", [invitationId]);
    await expectPgError(
      () =>
        client.query("select public.join_league($1,$2)", [
          invitation,
          "Revoked",
        ]),
      "Invalid invitation",
    );
  });
  await admin.query("select set_config('request.jwt.claim.sub','',false)");
  await expectPgError(
    () =>
      admin.query("select public.join_league($1,'Unauthenticated')", [
        invitation,
      ]),
    "Authentication required",
  );
});

test("commissioner protection and joins serialize at six seats", async () => {
  await expectPgError(
    () =>
      asUser(users[0], (c) =>
        c.query("select public.leave_league($1)", [leagueId]),
      ),
    "Commissioner cannot leave",
  );
  await asUser(users[0], (c) =>
    c.query(`select public.rename_league($1,'Renamed Boundary League')`, [
      leagueId,
    ]),
  );
  const activeInvite = (
    await asUser(users[0], (c) =>
      c.query("select public.create_invitation($1)", [leagueId]),
    )
  ).rows[0].create_invitation;
  await Promise.all(
    users
      .slice(2, 5)
      .map((userId, index) =>
        asUser(userId, (c) =>
          c.query("select public.join_league($1,$2)", [
            activeInvite,
            `Team ${index + 3}`,
          ]),
        ),
      ),
  );
  const competing = await Promise.allSettled(
    users
      .slice(5, 7)
      .map((userId, index) =>
        asUser(userId, (c) =>
          c.query("select public.join_league($1,$2)", [
            activeInvite,
            `Competing ${index}`,
          ]),
        ),
      ),
  );
  assert.equal(
    competing.filter((result) => result.status === "fulfilled").length,
    1,
    "exactly one of two competing seventh-place joins succeeds",
  );
  assert.equal(
    competing.filter((result) => result.status === "rejected").length,
    1,
  );
  assert.ok(
    competing.some(
      (result) =>
        result.status === "rejected" &&
        result.reason.message.includes("League full"),
    ),
  );
  assert.equal(
    (
      await admin.query(
        "select count(*) from public.league_memberships where league_id=$1",
        [leagueId],
      )
    ).rows[0].count,
    "6",
  );
  assert.equal(
    (
      await admin.query(
        "select count(*) from public.fantasy_teams where league_id=$1",
        [leagueId],
      )
    ).rows[0].count,
    "6",
  );
  await asUser(users[1], async (client) => {
    await expectPgError(
      () =>
        client.query("select public.rename_league($1,'Unauthorized')", [
          leagueId,
        ]),
      "Commissioner required",
    );
  });
  await expectPgError(
    () =>
      asUser(users[1], (c) =>
        c.query("select public.create_invitation($1)", [leagueId]),
      ),
    "Commissioner required",
  );
  await admin.query(
    "update public.fantasy_leagues set status='active' where id=$1",
    [leagueId],
  );
  await expectPgError(
    () =>
      asUser(users[1], (c) =>
        c.query("select public.leave_league($1)", [leagueId]),
      ),
    "League is not in lobby",
  );
  await expectPgError(
    () =>
      asUser(users[7], (c) =>
        c.query("select public.join_league($1,$2)", [
          activeInvite,
          "Late Team",
        ]),
      ),
    "League is not in lobby",
  );
  await expectPgError(
    () =>
      asUser(users[0], (c) =>
        c.query("select public.create_invitation($1)", [leagueId]),
      ),
    "League is not in lobby",
  );
  await admin.query("select set_config('request.jwt.claim.sub','',false)");
  await expectPgError(
    () => admin.query("select public.create_league('x','x',$1)", [seasonId]),
    "Authentication required",
  );
});

test("expired and malformed tokens share generic invalid invitation error", async () => {
  const token = "b".repeat(64);
  const hash = (
    await admin.query("select extensions.digest($1,'sha256') as hash", [token])
  ).rows[0].hash;
  await admin.query(
    "insert into public.league_invitations(league_id,token_hash,created_by,expires_at) values($1,$2,$3,now()-interval '1 second')",
    [leagueId, hash, users[0]],
  );
  await expectPgError(
    () =>
      asUser(users[7], (c) =>
        c.query("select public.join_league($1,$2)", [token, "Expired"]),
      ),
    "Invalid invitation",
  );
});

test("playable league persists a full snake draft, private role-valid lineups, historical rounds and a stable champion", async () => {
  const gameLeagueId = (
    await asUser(users[0], (client) =>
      client.query(
        "select public.create_league('Historical Replay','Manager One XI',$1)",
        [seasonId],
      ),
    )
  ).rows[0].create_league;
  const invite = (
    await asUser(users[0], (client) =>
      client.query("select public.create_invitation($1)", [gameLeagueId]),
    )
  ).rows[0].create_invitation;
  const underfilledLeagueId = (
    await asUser(users[0], (client) =>
      client.query(
        "select public.create_league('Underfilled Replay','One Manager XI',$1)",
        [seasonId],
      ),
    )
  ).rows[0].create_league;
  await expectPgError(
    () =>
      asUser(users[0], (client) =>
        client.query("select public.start_draft($1)", [underfilledLeagueId]),
      ),
    "Exactly six managers",
  );
  const lobbySnapshot = (
    await asUser(users[0], (client) =>
      client.query("select public.get_league_game($1) as game", [
        underfilledLeagueId,
      ]),
    )
  ).rows[0].game;
  assert.equal(lobbySnapshot.draft, null);
  assert.equal(lobbySnapshot.currentRoundId, null);
  assert.deepEqual(
    [
      lobbySnapshot.picks.length,
      lobbySnapshot.rounds.length,
      lobbySnapshot.lineups.length,
      lobbySnapshot.matchups.length,
      lobbySnapshot.matches.length,
    ],
    [0, 0, 0, 0, 0],
  );
  for (let index = 1; index < 6; index += 1) {
    await asUser(users[index], (client) =>
      client.query("select public.join_league($1,$2)", [
        invite,
        `Manager ${index + 1} XI`,
      ]),
    );
  }

  const emptySeason = (
    await admin.query(
      "insert into public.seasons(competition_id,year,name,status) select competition_id,2099,'Metadata Only','completed' from public.seasons where id=$1 returning id",
      [seasonId],
    )
  ).rows[0].id;
  await expectPgError(
    () =>
      asUser(users[0], (client) =>
        client.query(
          "select public.create_league('Not Ready','No Data XI',$1)",
          [emptySeason],
        ),
      ),
    "Season not ready",
  );
  await expectPgError(
    () =>
      asUser(users[1], (client) =>
        client.query("select public.start_draft($1)", [gameLeagueId]),
      ),
    "Commissioner required",
  );
  await asUser(users[0], (client) =>
    client.query("select public.start_draft($1)", [gameLeagueId]),
  );

  const draftStart = (
    await admin.query(
      "select seconds_per_pick, deadline_at, next_pick_number from public.league_drafts where league_id=$1",
      [gameLeagueId],
    )
  ).rows[0];
  assert.equal(
    draftStart.seconds_per_pick,
    90,
    "server starts a real 90-second clock",
  );
  assert.ok(new Date(draftStart.deadline_at).getTime() > Date.now());
  assert.ok(new Date(draftStart.deadline_at).getTime() <= Date.now() + 90_000);
  const prematureTick = await asUser(users[1], (client) =>
    client.query("select public.draft_tick($1)", [gameLeagueId]),
  );
  assert.equal(
    prematureTick.rows[0].draft_tick,
    false,
    "members cannot auto-pick before the server deadline",
  );
  assert.equal(
    Number(
      (
        await admin.query(
          "select next_pick_number from public.league_drafts where league_id=$1",
          [gameLeagueId],
        )
      ).rows[0].next_pick_number,
    ),
    1,
  );
  assert.equal(Number(draftStart.next_pick_number), 1);
  const memberRows = (
    await admin.query(
      "select user_id,draft_position from public.league_memberships where league_id=$1 order by joined_at,user_id",
      [gameLeagueId],
    )
  ).rows;
  const orderedManagers = memberRows.map((row) => row.user_id);
  assert.deepEqual(
    memberRows.map((row) => Number(row.draft_position)),
    [1, 2, 3, 4, 5, 6],
  );
  const managerAtPosition = (position) => orderedManagers[position - 1];
  const turn = async () => {
    const { next_pick_number: pick } = (
      await admin.query(
        "select next_pick_number from public.league_drafts where league_id=$1",
        [gameLeagueId],
      )
    ).rows[0];
    const number = Number(pick);
    const round = Math.ceil(number / 6);
    const withinRound = (number - 1) % 6;
    const position = round % 2 === 1 ? withinRound + 1 : 6 - withinRound;
    return { pick: number, position, userId: managerAtPosition(position) };
  };
  const candidate = async (role, exclude = []) => {
    const result = await admin.query(
      `
      select sp.player_id from public.season_players sp
      join public.cricket_players cp on cp.id=sp.player_id
      where sp.season_id=$1 and cp.role=$2
        and not exists (select 1 from public.league_draft_picks dp where dp.league_id=$3 and dp.player_id=sp.player_id)
        and not (sp.player_id = any($4::uuid[]))
      order by cp.name,sp.player_id limit 1
    `,
      [seasonId, role, gameLeagueId, exclude],
    );
    return result.rows[0]?.player_id ?? null;
  };
  const pick = async (userId, number, playerId) =>
    asUser(userId, (client) =>
      client.query("select public.make_draft_pick($1,$2,$3)", [
        gameLeagueId,
        playerId,
        number,
      ]),
    );

  const outsiderSnapshot = async () =>
    asUser(users[7], (client) =>
      client.query("select public.get_league_game($1)", [gameLeagueId]),
    );
  await expectPgError(outsiderSnapshot, "League membership required");
  await expectPgError(
    () =>
      asUser(users[7], (client) =>
        client.query("select public.draft_tick($1)", [gameLeagueId]),
      ),
    "League membership required",
  );
  const firstTurn = await turn();
  assert.equal(firstTurn.userId, users[0]);
  const precisionPlayer = await admin.query(
    `
    select sp.player_id from public.season_players sp join public.cricket_players cp on cp.id=sp.player_id
    where sp.season_id=$1 and cp.name='C Munro' and cp.role='BAT' limit 1
  `,
    [seasonId],
  );
  const firstPlayerId = precisionPlayer.rows[0]?.player_id;
  assert.ok(
    firstPlayerId,
    "the real round-four precision fixture is in the season player pool",
  );
  await expectPgError(
    () => pick(users[1], 1, firstPlayerId),
    "Not your draft turn",
  );
  await expectPgError(
    () => pick(users[0], 2, firstPlayerId),
    "Stale expected pick number",
  );
  await pick(firstTurn.userId, firstTurn.pick, firstPlayerId);
  const secondTurn = await turn();
  const concurrentIds = [await candidate("BAT"), await candidate("BOWL")];
  assert.ok(
    concurrentIds[0] &&
      concurrentIds[1] &&
      concurrentIds[0] !== concurrentIds[1],
  );
  const concurrentPicks = await Promise.allSettled(
    concurrentIds.map((playerId) =>
      pick(secondTurn.userId, secondTurn.pick, playerId),
    ),
  );
  assert.equal(
    concurrentPicks.filter((result) => result.status === "fulfilled").length,
    1,
    "league-row serialization lets exactly one simultaneous expected-turn pick commit",
  );
  assert.equal(
    concurrentPicks.filter((result) => result.status === "rejected").length,
    1,
  );
  assert.ok(
    concurrentPicks.some(
      (result) =>
        result.status === "rejected" &&
        /Stale expected pick/.test(result.reason.message),
    ),
  );
  const expiredTurn = await turn();
  await expectPgError(
    () => pick(expiredTurn.userId, expiredTurn.pick, firstPlayerId),
    "already owned",
  );
  await admin.query(
    "update public.league_drafts set deadline_at=clock_timestamp()-interval '1 second' where league_id=$1",
    [gameLeagueId],
  );
  const latePlayer = await candidate("BAT");
  await expectPgError(
    () => pick(expiredTurn.userId, expiredTurn.pick, latePlayer),
    "deadline expired",
  );
  const tickResults = await Promise.all(
    [users[5], users[1]].map((userId) =>
      asUser(userId, (client) =>
        client.query("select public.draft_tick($1)", [gameLeagueId]),
      ),
    ),
  );
  assert.equal(
    tickResults.filter((result) => result.rows[0].draft_tick).length,
    1,
    "concurrent member-triggered expiry advances exactly one pick",
  );
  const automatic = await admin.query(
    "select count(*)::int as count from public.league_draft_picks where league_id=$1 and automatic",
    [gameLeagueId],
  );
  assert.equal(automatic.rows[0].count, 1);

  const minima = { WK: 1, BAT: 2, BOWL: 2, ALL: 2 };
  const roles = ["WK", "BAT", "BOWL", "ALL"];
  while ((await turn()).pick <= 90) {
    const current = await turn();
    const currentTeam = (
      await admin.query(
        "select id from public.fantasy_teams where league_id=$1 and manager_user_id=$2",
        [gameLeagueId, current.userId],
      )
    ).rows[0].id;
    const countsResult = await admin.query(
      `
      select cp.role,count(*)::int as count from public.league_draft_picks dp
      join public.cricket_players cp on cp.id=dp.player_id
      where dp.league_id=$1 and dp.team_id=$2 group by cp.role
    `,
      [gameLeagueId, currentTeam],
    );
    const counts = Object.fromEntries(
      countsResult.rows.map((row) => [row.role, Number(row.count)]),
    );
    const excludedRoles =
      current.userId === managerAtPosition(1) && current.pick < 85
        ? ["WK"]
        : [];
    const targetNeeds = roles.filter(
      (role) =>
        (counts[role] ?? 0) < minima[role] && !excludedRoles.includes(role),
    );
    const specialLastRole =
      current.pick === 85 && current.userId === managerAtPosition(1);
    const roleOptions = roles.filter((role) => !excludedRoles.includes(role));
    const rolePriority = specialLastRole
      ? []
      : [
          ...targetNeeds,
          ...roleOptions.filter((role) => !targetNeeds.includes(role)),
        ];
    if (!targetNeeds.length) {
      const available = await admin.query(
        `
        select cp.role,count(*)::int as available from public.season_players sp
        join public.cricket_players cp on cp.id=sp.player_id
        where sp.season_id=$1 and not exists (select 1 from public.league_draft_picks dp
          where dp.league_id=$2 and dp.player_id=sp.player_id)
        group by cp.role
      `,
        [seasonId, gameLeagueId],
      );
      const availableByRole = Object.fromEntries(
        available.rows.map((row) => [row.role, Number(row.available)]),
      );
      rolePriority.sort(
        (a, b) => (availableByRole[b] ?? 0) - (availableByRole[a] ?? 0),
      );
    }
    let committed = false;
    for (const role of rolePriority) {
      const playerId = await candidate(role);
      if (!playerId) continue;
      try {
        await pick(current.userId, current.pick, playerId);
        committed = true;
        break;
      } catch (error) {
        if (!/roles infeasible/i.test(error.message)) throw error;
      }
    }
    if (current.pick === 85 && current.userId === managerAtPosition(1)) {
      const roster = await admin.query(
        `
        select cp.role,count(*)::int as count from public.league_draft_picks dp
        join public.cricket_players cp on cp.id=dp.player_id
        where dp.league_id=$1 and dp.team_id=$2 group by cp.role
      `,
        [gameLeagueId, currentTeam],
      );
      const currentRoster = Object.fromEntries(
        roster.rows.map((row) => [row.role, Number(row.count)]),
      );
      assert.equal(
        (
          await admin.query(
            "select count(*)::int as count from public.league_draft_picks where league_id=$1 and team_id=$2",
            [gameLeagueId, currentTeam],
          )
        ).rows[0].count,
        14,
      );
      assert.equal(
        currentRoster.WK ?? 0,
        0,
        "the commissioner roster has one required WK slot left",
      );
      let invalidPlayer = null;
      for (const role of ["BAT", "BOWL", "ALL"]) {
        invalidPlayer = await candidate(role);
        if (invalidPlayer) break;
      }
      assert.ok(invalidPlayer);
      await expectPgError(
        () => pick(current.userId, current.pick, invalidPlayer),
        "roles infeasible",
      );
      const requiredWicketkeeper = await candidate("WK");
      assert.ok(requiredWicketkeeper);
      await pick(current.userId, current.pick, requiredWicketkeeper);
      committed = true;
    }
    assert.ok(
      committed,
      `pick ${current.pick} has a role-feasible real player`,
    );
  }

  const totals = await admin.query(
    `
    select d.status,d.next_pick_number,d.deadline_at,d.revision,
      (select count(*)::int from public.league_draft_picks p where p.league_id=d.league_id) as picks,
      (select count(distinct player_id)::int from public.league_draft_picks p where p.league_id=d.league_id) as players
    from public.league_drafts d where d.league_id=$1
  `,
    [gameLeagueId],
  );
  assert.deepEqual(totals.rows[0], {
    status: "completed",
    next_pick_number: 91,
    deadline_at: null,
    revision: 90,
    picks: 90,
    players: 90,
  });
  const snakePicks = await admin.query(
    `
    select p.pick_number,m.user_id from public.league_draft_picks p
    join public.fantasy_teams t on t.id=p.team_id
    join public.league_memberships m on m.league_id=p.league_id and m.user_id=t.manager_user_id
    where p.league_id=$1 order by p.pick_number
  `,
    [gameLeagueId],
  );
  for (const row of snakePicks.rows) {
    const round = Math.ceil(Number(row.pick_number) / 6);
    const withinRound = (Number(row.pick_number) - 1) % 6;
    const position = round % 2 === 1 ? withinRound + 1 : 6 - withinRound;
    assert.equal(
      row.user_id,
      managerAtPosition(position),
      `pick ${row.pick_number} follows the stored snake order`,
    );
  }
  const rosters = await admin.query(
    `
    select t.id,count(p.player_id)::int as count,
      count(*) filter (where cp.role='WK')::int as wk,
      count(*) filter (where cp.role='BAT')::int as bat,
      count(*) filter (where cp.role='BOWL')::int as bowl,
      count(*) filter (where cp.role='ALL')::int as all_role
    from public.fantasy_teams t join public.league_draft_picks p on p.team_id=t.id
    join public.cricket_players cp on cp.id=p.player_id
    where t.league_id=$1 group by t.id
  `,
    [gameLeagueId],
  );
  assert.equal(rosters.rowCount, 6);
  for (const roster of rosters.rows) {
    assert.equal(roster.count, 15);
    assert.ok(
      roster.wk >= 1 &&
        roster.bat >= 2 &&
        roster.bowl >= 2 &&
        roster.all_role >= 2,
    );
  }
  assert.deepEqual(
    (
      await admin.query(
        "select count(*)::int as count from public.league_game_rounds where league_id=$1",
        [gameLeagueId],
      )
    ).rows[0].count,
    7,
  );
  assert.deepEqual(
    (
      await admin.query(
        `select count(*)::int as count from public.league_matchups m join public.league_game_rounds r on r.id=m.round_id
      where m.league_id=$1 and r.stage='regular'`,
        [gameLeagueId],
      )
    ).rows[0].count,
    15,
  );
  const defaultLineupFacts = await admin.query(
    `
    select count(*)::int as teams,
      count(*) filter (where slots <> 11 or distinct_slots <> 11 or distinct_players <> 11 or invalid_slots <> 0)::int as invalid_teams
    from (
      select lineup.team_id, count(*)::int as slots,
        count(distinct slot."slotId")::int as distinct_slots,
        count(distinct slot."playerId")::int as distinct_players,
        count(*) filter (where pick.team_id <> lineup.team_id
          or slot."slotId" not in ('WK1','BAT1','BAT2','BOWL1','BOWL2','ALL1','ALL2','FLEX1','FLEX2','FLEX3','FLEX4')
          or (slot."slotId" = 'WK1' and player.role <> 'WK')
          or (slot."slotId" in ('BAT1','BAT2') and player.role <> 'BAT')
          or (slot."slotId" in ('BOWL1','BOWL2') and player.role <> 'BOWL')
          or (slot."slotId" in ('ALL1','ALL2') and player.role <> 'ALL'))::int as invalid_slots
      from public.league_lineups lineup
      cross join lateral jsonb_to_recordset(lineup.slots) as slot("slotId" text,"playerId" uuid)
      join public.league_draft_picks pick on pick.league_id=lineup.league_id and pick.player_id=slot."playerId"
      join public.cricket_players player on player.id=slot."playerId"
      where lineup.league_id=$1 and lineup.round_id=(select id from public.league_game_rounds where league_id=$1 and round_number=1)
      group by lineup.team_id
    ) teams;
  `,
    [gameLeagueId],
  );
  assert.deepEqual(
    defaultLineupFacts.rows[0],
    { teams: 6, invalid_teams: 0 },
    "each manager starts with eleven distinct owned players in role-valid slots",
  );

  await asUser(users[0], async (client) => {
    const snapshot = (
      await client.query("select public.get_league_game($1) as game", [
        gameLeagueId,
      ])
    ).rows[0].game;
    assert.equal(snapshot.draft.status, "completed");
    assert.equal(snapshot.draft.currentTeamId, null);
    assert.equal(snapshot.picks.length, 90);
    assert.equal(
      snapshot.players.filter((player) => player.ownerTeamId).length,
      90,
    );
    assert.equal(
      snapshot.lineups.length,
      1,
      "unlocked opponents’ default XIs remain private",
    );
    assert.equal(snapshot.lineups[0].teamId, snapshot.me.teamId);
    assert.equal(snapshot.attribution.provider, "Cricsheet");
    assert.equal(snapshot.matches.length, 34);
    const historyPlayer = (
      await admin.query(
        `
      select pms.player_id from public.player_match_stats pms join public.cricket_matches cm on cm.id=pms.match_id
      where cm.season_id=$1 order by cm.match_date,pms.player_id limit 1
    `,
        [seasonId],
      )
    ).rows[0].player_id;
    await expectPgError(
      () =>
        asUser(users[7], (outsider) =>
          outsider.query("select public.get_player_history($1,$2)", [
            gameLeagueId,
            historyPlayer,
          ]),
        ),
      "League membership required",
    );
  });
  await asUser(users[1], async (client) => {
    await expectPgError(
      () =>
        client.query(
          "update public.league_draft_picks set automatic=automatic where league_id=$1",
          [gameLeagueId],
        ),
      "permission denied",
    );
    await expectPgError(
      async () =>
        client.query(
          "insert into public.league_lineups(league_id,round_id,team_id,slots) values($1,$2,$3,'[]'::jsonb)",
          [
            gameLeagueId,
            (
              await admin.query(
                "select id from public.league_game_rounds where league_id=$1 and round_number=1",
                [gameLeagueId],
              )
            ).rows[0].id,
            (
              await admin.query(
                "select id from public.fantasy_teams where league_id=$1 and manager_user_id=$2",
                [gameLeagueId, users[1]],
              )
            ).rows[0].id,
          ],
        ),
      "permission denied",
    );
    const readOnlyGameTables = {
      league_drafts: "status",
      league_draft_picks: "automatic",
      league_game_rounds: "status",
      league_lineups: "slots",
      league_matchups: "status",
      league_round_contributions: "score",
      league_standings: "wins",
    };
    for (const [table, column] of Object.entries(readOnlyGameTables)) {
      await client.query(`select * from public.${table}`);
      await expectPgError(
        () => client.query(`insert into public.${table} default values`),
        "permission denied",
      );
      await expectPgError(
        () =>
          client.query(
            `update public.${table} set ${column}=${column} where false`,
          ),
        "permission denied",
      );
      await expectPgError(
        () => client.query(`delete from public.${table} where false`),
        "permission denied",
      );
    }
    await client.query("select * from public.cricket_players limit 1");
    await expectPgError(
      () => client.query("insert into public.cricket_players default values"),
      "permission denied",
    );
    await expectPgError(
      () =>
        client.query(
          "update public.player_match_points set total_points=total_points where false",
        ),
      "permission denied",
    );
    const readOnlyCatalogTables = {
      franchises: "code",
      cricket_players: "role",
      season_players: "franchise_id",
      cricket_matches: "status",
      player_match_stats: "stats",
      player_match_points: "total_points",
      season_rounds: "name",
      season_round_matches: "match_id",
      season_pairings: "home_position",
      cricket_ingest_runs: "role_policy",
    };
    for (const [table, column] of Object.entries(readOnlyCatalogTables)) {
      await client.query(`select * from public.${table} limit 1`);
      await expectPgError(
        () => client.query(`insert into public.${table} default values`),
        "permission denied",
      );
      await expectPgError(
        () =>
          client.query(
            `update public.${table} set ${column}=${column} where false`,
          ),
        "permission denied",
      );
      await expectPgError(
        () => client.query(`delete from public.${table} where false`),
        "permission denied",
      );
    }
  });
  const firstRound = (
    await admin.query(
      "select id from public.league_game_rounds where league_id=$1 and round_number=1",
      [gameLeagueId],
    )
  ).rows[0].id;
  const ownerTeamId = (
    await admin.query(
      "select id from public.fantasy_teams where league_id=$1 and manager_user_id=$2",
      [gameLeagueId, users[0]],
    )
  ).rows[0].id;
  const defaultSlots = (
    await admin.query(
      "select slots from public.league_lineups where league_id=$1 and round_id=$2 and team_id=$3",
      [gameLeagueId, firstRound, ownerTeamId],
    )
  ).rows[0].slots;
  const badRolePlayer = (
    await admin.query(
      `
    select cp.id from public.cricket_players cp join public.season_players sp on sp.player_id=cp.id
    where sp.season_id=$1 and cp.role='BAT' and cp.id <> all($2::uuid[]) order by cp.name limit 1
  `,
      [seasonId, defaultSlots.map((slot) => slot.playerId)],
    )
  ).rows[0].id;
  const wrongRoleSlots = defaultSlots.map((slot) =>
    slot.slotId === "WK1" ? { ...slot, playerId: badRolePlayer } : slot,
  );
  await expectPgError(
    () =>
      asUser(users[0], (client) =>
        client.query("select public.save_lineup($1,$2,$3::jsonb)", [
          gameLeagueId,
          firstRound,
          JSON.stringify(wrongRoleSlots),
        ]),
      ),
    "role does not match",
  );
  const foreignPlayerId = (
    await admin.query(
      `
    select dp.player_id from public.league_draft_picks dp
    where dp.league_id=$1 and dp.team_id<>$2 order by dp.pick_number limit 1
  `,
      [gameLeagueId, ownerTeamId],
    )
  ).rows[0].player_id;
  const wrongOwnerSlots = defaultSlots.map((slot) =>
    slot.slotId === "FLEX1" ? { ...slot, playerId: foreignPlayerId } : slot,
  );
  await expectPgError(
    () =>
      asUser(users[0], (client) =>
        client.query("select public.save_lineup($1,$2,$3::jsonb)", [
          gameLeagueId,
          firstRound,
          JSON.stringify(wrongOwnerSlots),
        ]),
      ),
    "not owned by this team",
  );
  await asUser(users[0], (client) =>
    client.query("select public.save_lineup($1,$2,$3::jsonb)", [
      gameLeagueId,
      firstRound,
      JSON.stringify(defaultSlots),
    ]),
  );
  await expectPgError(
    () =>
      asUser(users[1], (client) =>
        client.query("select public.replay_round($1,$2)", [
          gameLeagueId,
          firstRound,
        ]),
      ),
    "Commissioner required",
  );
  await asUser(users[0], (client) =>
    client.query("select public.replay_round($1,$2)", [
      gameLeagueId,
      firstRound,
    ]),
  );
  const contributionFacts = await admin.query(
    `
    select count(*)::int as rows,
      count(*) filter (where appearances>0)::int as appearances,
      count(*) filter (where score <> coalesce((
        select avg(points.total_points) from public.league_game_rounds gr
        join public.season_round_matches rm on rm.round_id=gr.season_round_id
        join public.player_match_stats stats on stats.match_id=rm.match_id and stats.player_id=c.player_id
        join public.player_match_points points on points.match_id=stats.match_id and points.player_id=stats.player_id
          and points.scoring_version='mlc-v0.1'
        where gr.id=c.round_id
      ),0))::int as mismatched_averages
    from public.league_round_contributions c where c.league_id=$1 and c.round_id=$2
  `,
    [gameLeagueId, firstRound],
  );
  assert.equal(contributionFacts.rows[0].rows, 66);
  assert.ok(
    contributionFacts.rows[0].appearances > 0,
    "real season appearances produced historical scores",
  );
  assert.equal(
    contributionFacts.rows[0].mismatched_averages,
    0,
    "each XI contribution is the actual round average-per-appearance",
  );
  const roundOneBefore = await admin.query(
    `
    select count(*)::int as rows,sum(score)::numeric as total from public.league_round_contributions
    where league_id=$1 and round_id=$2
  `,
    [gameLeagueId, firstRound],
  );
  await asUser(users[0], (client) =>
    client.query("select public.replay_round($1,$2)", [
      gameLeagueId,
      firstRound,
    ]),
  );
  const roundOneAfter = await admin.query(
    `
    select count(*)::int as rows,sum(score)::numeric as total from public.league_round_contributions
    where league_id=$1 and round_id=$2
  `,
    [gameLeagueId, firstRound],
  );
  assert.deepEqual(
    roundOneAfter.rows[0],
    roundOneBefore.rows[0],
    "replay is idempotent rather than accumulating totals",
  );
  await expectPgError(
    () =>
      asUser(users[0], (client) =>
        client.query("select public.save_lineup($1,$2,$3::jsonb)", [
          gameLeagueId,
          firstRound,
          JSON.stringify(defaultSlots),
        ]),
      ),
    "Round is not open",
  );
  const lockedSnapshot = (
    await asUser(users[1], (client) =>
      client.query("select public.get_league_game($1) as game", [gameLeagueId]),
    )
  ).rows[0].game;
  assert.equal(
    lockedSnapshot.lineups.filter((lineup) => lineup.roundId === firstRound)
      .length,
    6,
    "all frozen opponent XIs become visible after commissioner lock",
  );
  const gameReadTables = [
    "league_drafts",
    "league_draft_picks",
    "league_game_rounds",
    "league_lineups",
    "league_matchups",
    "league_round_contributions",
    "league_standings",
  ];
  for (const table of gameReadTables) {
    const hiddenRows = await asUser(users[7], (client) =>
      client.query(`select * from public.${table} where league_id=$1`, [
        gameLeagueId,
      ]),
    );
    assert.equal(hiddenRows.rowCount, 0, `outsiders cannot read ${table} rows`);
  }

  for (let number = 2; number <= 7; number += 1) {
    const round = (
      await admin.query(
        "select id,stage,status from public.league_game_rounds where league_id=$1 and round_number=$2",
        [gameLeagueId, number],
      )
    ).rows[0];
    const participantCount = (
      await admin.query(
        `
      select count(*)::int as count from (
        select home_team_id as team_id from public.league_matchups where round_id=$1
        union select away_team_id from public.league_matchups where round_id=$1
      ) participants
    `,
        [round.id],
      )
    ).rows[0].count;
    assert.equal(
      Number(round.status === "open"),
      1,
      `historical round ${number} is the next open round`,
    );
    assert.equal(
      (
        await admin.query(
          "select count(*)::int as count from public.league_lineups where round_id=$1",
          [round.id],
        )
      ).rows[0].count,
      participantCount,
      `round ${number} starts with valid copied/default participant XIs`,
    );
    await asUser(users[0], (client) =>
      client.query("select public.replay_round($1,$2)", [
        gameLeagueId,
        round.id,
      ]),
    );
    if (number === 4) {
      const precision = await admin.query(
        `
        with expected as (
          select count(stats.match_id)::int as appearances, avg(points.total_points) as average
          from public.league_game_rounds gr
          join public.season_round_matches rm on rm.round_id=gr.season_round_id
          join public.player_match_stats stats on stats.match_id=rm.match_id and stats.player_id=$3
          join public.player_match_points points on points.match_id=stats.match_id and points.player_id=stats.player_id
            and points.scoring_version='mlc-v0.1'
          where gr.id=$2
        )
        select expected.appearances,(contribution.score=expected.average) as exact_average,
          scale(contribution.score)::int as precision_scale
        from public.league_round_contributions contribution cross join expected
        where contribution.league_id=$1 and contribution.round_id=$2 and contribution.player_id=$3
      `,
        [gameLeagueId, round.id, firstPlayerId],
      );
      assert.equal(
        precision.rowCount,
        1,
        "the actual fractional-score player is in the frozen XI",
      );
      assert.equal(precision.rows[0].appearances, 3);
      assert.equal(precision.rows[0].exact_average, true);
      assert.ok(
        precision.rows[0].precision_scale > 3,
        "stored round points retain full internal precision",
      );
    }
    if (number === 5) {
      const seeds = await admin.query(
        "select count(*)::int as count,count(distinct seed)::int as distinct_seeds from public.league_standings where league_id=$1 and seed is not null",
        [gameLeagueId],
      );
      assert.deepEqual(seeds.rows[0], { count: 6, distinct_seeds: 6 });
      const semifinals = await admin.query(
        `
        select home_seed,away_seed from public.league_matchups m
        join public.league_game_rounds r on r.id=m.round_id
        where m.league_id=$1 and r.round_number=6 order by home_seed
      `,
        [gameLeagueId],
      );
      assert.deepEqual(
        semifinals.rows.map((row) => [
          Number(row.home_seed),
          Number(row.away_seed),
        ]),
        [
          [1, 4],
          [2, 3],
        ],
      );
    }
  }
  const finalIdentity = (
    await admin.query(
      `
    select home_team_id,away_team_id from public.league_matchups m
    join public.league_game_rounds r on r.id=m.round_id
    where m.league_id=$1 and r.round_number=7
  `,
      [gameLeagueId],
    )
  ).rows[0];
  assert.ok(finalIdentity.home_team_id && finalIdentity.away_team_id);
  const champion = (
    await admin.query(
      "select status,champion_team_id from public.fantasy_leagues where id=$1",
      [gameLeagueId],
    )
  ).rows[0];
  assert.equal(champion.status, "completed");
  assert.ok(
    [finalIdentity.home_team_id, finalIdentity.away_team_id].includes(
      champion.champion_team_id,
    ),
  );
  await asUser(users[0], (client) =>
    client.query("select public.recalculate_league($1)", [gameLeagueId]),
  );
  await asUser(users[0], (client) =>
    client.query("select public.recalculate_league($1)", [gameLeagueId]),
  );
  const finalIdentityAfter = (
    await admin.query(
      `
    select home_team_id,away_team_id from public.league_matchups m
    join public.league_game_rounds r on r.id=m.round_id
    where m.league_id=$1 and r.round_number=7
  `,
      [gameLeagueId],
    )
  ).rows[0];
  assert.deepEqual(
    finalIdentityAfter,
    finalIdentity,
    "correction-safe recalculation never changes locked playoff participants",
  );
  const completeSnapshot = (
    await asUser(users[0], (client) =>
      client.query("select public.get_league_game($1) as game", [gameLeagueId]),
    )
  ).rows[0].game;
  assert.equal(
    completeSnapshot.rounds.filter((round) => round.status === "completed")
      .length,
    7,
  );
  assert.equal(
    completeSnapshot.league.championTeamId,
    champion.champion_team_id,
  );

  const anon = new Client({ connectionString });
  await anon.connect();
  try {
    await anon.query("set role anon");
    await expectPgError(
      () => anon.query("select public.get_league_game($1)", [gameLeagueId]),
      "permission denied",
    );
    const anonymousGameRpcs = [
      () =>
        anon.query("select public.create_league('Anon','Anon XI',$1)", [
          seasonId,
        ]),
      () => anon.query("select public.start_draft($1)", [gameLeagueId]),
      () =>
        anon.query("select public.make_draft_pick($1,$2,1)", [
          gameLeagueId,
          firstPlayerId,
        ]),
      () => anon.query("select public.draft_tick($1)", [gameLeagueId]),
      () =>
        anon.query("select public.save_lineup($1,$2,'[]'::jsonb)", [
          gameLeagueId,
          firstRound,
        ]),
      () =>
        anon.query("select public.replay_round($1,$2)", [
          gameLeagueId,
          firstRound,
        ]),
      () =>
        anon.query("select public.get_player_history($1,$2)", [
          gameLeagueId,
          firstPlayerId,
        ]),
    ];
    for (const call of anonymousGameRpcs)
      await expectPgError(call, "permission denied");
    await expectPgError(
      () => anon.query("select public.recalculate_league($1)", [gameLeagueId]),
      "permission denied",
    );
  } finally {
    await anon.query("reset role");
    await anon.end();
  }
});
