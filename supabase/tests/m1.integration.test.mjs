import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set TEST_DATABASE_URL to a disposable PostgreSQL database named cricket_fantasy_test.');
const databaseName = new URL(connectionString).pathname.slice(1);
if (databaseName !== 'cricket_fantasy_test') throw new Error(`Refusing destructive test setup for database ${databaseName}; expected cricket_fantasy_test.`);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const migration = await readFile(resolve(root, 'supabase/migrations/20261024000000_m1_private_leagues.sql'), 'utf8');
let admin;
let leagueId;
let otherLeagueId;
let invitation;
const users = Array.from({ length: 9 }, (_, i) => `10000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
const seasonId = '00000000-0000-4000-8000-000000000001';

async function authAs(client, userId) {
  await client.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await client.query('set role authenticated');
}
async function asUser(userId, operation) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await authAs(client, userId);
    return await operation(client);
  } finally {
    await client.query('reset role').catch(() => {});
    await client.end();
  }
}
async function expectPgError(operation, message) {
  await assert.rejects(operation, (error) => {
    assert.match(error.message, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
  await admin.query('delete from auth.users where id = any($1::uuid[])', [users]);
  await admin.query(migration);
  for (const [i, userId] of users.entries()) {
    const displayName = i === 8 ? 'An exceptionally long signup name that needs truncation' : `Manager ${i + 1}`;
    await admin.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [userId, `manager${i + 1}@example.test`, JSON.stringify({ display_name: displayName })]);
  }
  const season = await admin.query("select id from public.seasons where name='MLC 2026'");
  assert.equal(season.rows.length, 1, 'historical season metadata is seeded without fixtures');
  leagueId = (await asUser(users[0], (c) => c.query("select public.create_league('Boundary League','Commissioner XI',$1)", [season.rows[0].id]))).rows[0].create_league;
  invitation = (await asUser(users[0], (c) => c.query('select public.create_invitation($1)', [leagueId]))).rows[0].create_invitation;
  otherLeagueId = (await asUser(users[2], (c) => c.query(`select public.create_league('Other League','Other XI',$1)`, [season.rows[0].id]))).rows[0].create_league;
  await asUser(users[2], (c) => c.query('select public.create_invitation($1)', [otherLeagueId]));
});

after(async () => { if (admin) await admin.end(); });

test('signup trigger initializes profile; private rows and public metadata obey RLS', async () => {
  assert.equal((await admin.query('select display_name from public.profiles where id=$1', [users[0]])).rows[0].display_name, 'Manager 1');
  assert.equal((await admin.query('select char_length(display_name) from public.profiles where id=$1', [users[8]])).rows[0].char_length, 40);
  assert.match(invitation, /^[0-9a-f]{64}$/);
  const storedHash = await admin.query(`select encode(token_hash,'hex') as hash from public.league_invitations where league_id=$1 and revoked_at is null`, [leagueId]);
  const expectedHash = await admin.query(`select encode(extensions.digest($1,'sha256'),'hex') as hash`, [invitation]);
  assert.equal(storedHash.rows[0].hash, expectedHash.rows[0].hash);
  const tables = ['profiles', 'competitions', 'seasons', 'fantasy_leagues', 'league_memberships', 'fantasy_teams', 'league_invitations'];
  const updateColumns = {
    profiles: 'display_name',
    competitions: 'name',
    seasons: 'year',
    fantasy_leagues: 'name',
    league_memberships: 'role',
    fantasy_teams: 'name',
    league_invitations: 'revoked_at',
  };
  await asUser(users[1], async (client) => {
    for (const table of ['fantasy_leagues', 'league_memberships', 'fantasy_teams', 'league_invitations']) {
      assert.equal((await client.query(`select * from public.${table}`)).rowCount, 0);
    }
    assert.equal((await client.query('select count(*) from public.seasons')).rows[0].count, '1');
    assert.equal((await client.query('select * from public.profiles')).rowCount, 1);
    await client.query("update public.profiles set display_name='Changed' where id=$1", [users[1]]);
    const crossProfile = await client.query("update public.profiles set display_name='Cross-user' where id=$1", [users[0]]);
    assert.equal(crossProfile.rowCount, 0, 'RLS hides non-coworker profile updates');
    await expectPgError(() => client.query('update public.profiles set id=$1 where id=$2', [users[2], users[1]]), 'permission denied');
    await expectPgError(() => client.query('select public.initialize_profile()'), 'permission denied');
    await expectPgError(() => client.query('select public.is_league_member($1)', [leagueId]), 'does not exist');
    for (const table of tables) {
      await expectPgError(() => client.query(`insert into public.${table} default values`), 'permission denied');
      if (table !== 'profiles') {
        await expectPgError(() => client.query(`update public.${table} set ${updateColumns[table]}=${updateColumns[table]} where false`), 'permission denied');
      }
      await expectPgError(() => client.query(`delete from public.${table} where false`), 'permission denied');
    }
  });
  await asUser(users[0], async (client) => {
    assert.equal((await client.query('select count(*) from public.fantasy_leagues where id=$1', [leagueId])).rows[0].count, '1');
    assert.equal((await client.query('select count(*) from public.league_invitations where revoked_at is null')).rows[0].count, '1');
    assert.equal((await client.query('select display_name from public.profiles where id=$1', [users[0]])).rows[0].display_name, 'Manager 1');
    assert.equal((await client.query(`select count(*) from public.league_memberships where league_id=$1 and user_id=$2 and role='commissioner'`, [leagueId, users[0]])).rows[0].count, '1');
    assert.equal((await client.query('select count(*) from public.fantasy_teams where league_id=$1 and manager_user_id=$2', [leagueId, users[0]])).rows[0].count, '1');
    await expectPgError(() => client.query('update public.fantasy_leagues set name=name where id=$1', [leagueId]), 'permission denied');
    await expectPgError(() => client.query('delete from public.league_invitations where league_id=$1', [leagueId]), 'permission denied');
  });
  const anon = new Client({ connectionString });
  await anon.connect();
  try {
    await anon.query('set role anon');
    for (const table of tables) await expectPgError(() => anon.query(`select * from public.${table}`), 'permission denied');
    const forbiddenRpcs = [
      { sql: `select public.create_league($1,$2,$3)`, args: ['x', 'x', seasonId] },
      { sql: 'select public.join_league($1,$2)', args: ['x', 'x'] },
      { sql: 'select public.create_invitation($1)', args: [leagueId] },
      { sql: 'select public.revoke_invitation($1)', args: ['00000000-0000-4000-8000-000000000001'] },
      { sql: 'select public.rename_team($1,$2)', args: [leagueId, 'x'] },
      { sql: 'select public.rename_league($1,$2)', args: [leagueId, 'x'] },
      { sql: 'select public.leave_league($1)', args: [leagueId] },
    ];
    for (const rpc of forbiddenRpcs) await expectPgError(() => anon.query(rpc.sql, rpc.args), 'permission denied');
    for (const table of tables) {
      await expectPgError(() => anon.query(`insert into public.${table} default values`), 'permission denied');
      await expectPgError(() => anon.query(`update public.${table} set ${updateColumns[table]}=${updateColumns[table]} where false`), 'permission denied');
      await expectPgError(() => anon.query(`delete from public.${table} where false`), 'permission denied');
    }
  } finally { await anon.query('reset role'); await anon.end(); }
});

test('invite join validates shape, expiry, revocation, duplicate and operation ownership', async () => {
  await expectPgError(() => asUser(users[7], (c) => c.query("select public.rename_team($1,'Unauthorized')", [leagueId])), 'Membership required');
  await expectPgError(() => asUser(users[7], (c) => c.query('select public.leave_league($1)', [leagueId])), 'Membership required');
  await expectPgError(() => asUser(users[1], (c) => c.query("select public.join_league('bad','X')")), 'Invalid invitation');
  await asUser(users[1], async (client) => {
    await expectPgError(() => client.query("select public.join_league($1,'X')", ['a'.repeat(64)]), 'Invalid invitation');
  });
  const previousInvitation = invitation;
  invitation = (await asUser(users[0], (c) => c.query('select public.create_invitation($1)', [leagueId]))).rows[0].create_invitation;
  await expectPgError(() => asUser(users[1], (c) => c.query('select public.join_league($1,$2)', [previousInvitation, 'Old Link'])), 'Invalid invitation');
  const invitationId = (await admin.query('select id from public.league_invitations where league_id=$1 and revoked_at is null', [leagueId])).rows[0].id;
  await expectPgError(() => asUser(users[1], (c) => c.query('select public.revoke_invitation($1)', [invitationId])), 'Commissioner required');
  await asUser(users[1], (client) => client.query("select public.join_league($1,'Manager Two XI')", [invitation]));
  await expectPgError(() => asUser(users[1], (c) => c.query("select public.join_league($1,'Again')", [invitation])), 'Already a member');
  await asUser(users[1], async (client) => {
    await expectPgError(() => client.query("update public.fantasy_teams set name='Stolen' where league_id=$1 and manager_user_id=$2", [leagueId, users[0]]), 'permission denied');
    await client.query("select public.rename_team($1,'New Manager Two')", [leagueId]);
    assert.equal((await client.query('select name from public.fantasy_teams where league_id=$1 and manager_user_id=$2', [leagueId, users[1]])).rows[0].name, 'New Manager Two');
    assert.equal((await client.query('select count(*) from public.profiles where id=$1', [users[0]])).rows[0].count, '1');
    assert.equal((await client.query('select count(*) from public.profiles where id=$1', [users[2]])).rows[0].count, '0');
    assert.equal((await client.query('select * from public.fantasy_leagues where id=$1', [otherLeagueId])).rowCount, 0);
    assert.equal((await client.query('select * from public.league_memberships where league_id=$1', [otherLeagueId])).rowCount, 0);
    assert.equal((await client.query('select * from public.league_invitations where league_id=$1', [otherLeagueId])).rowCount, 0);
  });
  await asUser(users[0], async (client) => {
    await client.query('select public.revoke_invitation($1)', [invitationId]);
    await expectPgError(() => client.query('select public.join_league($1,$2)', [invitation, 'Revoked']), 'Invalid invitation');
  });
  await admin.query("select set_config('request.jwt.claim.sub','',false)");
  await expectPgError(() => admin.query("select public.join_league($1,'Unauthenticated')", [invitation]), 'Authentication required');
});

test('commissioner protection and joins serialize at six seats', async () => {
  await expectPgError(() => asUser(users[0], (c) => c.query('select public.leave_league($1)', [leagueId])), 'Commissioner cannot leave');
  await asUser(users[0], (c) => c.query(`select public.rename_league($1,'Renamed Boundary League')`, [leagueId]));
  const activeInvite = (await asUser(users[0], (c) => c.query('select public.create_invitation($1)', [leagueId]))).rows[0].create_invitation;
  await Promise.all(users.slice(2, 5).map((userId, index) => asUser(userId, (c) => c.query('select public.join_league($1,$2)', [activeInvite, `Team ${index + 3}`]))));
  const competing = await Promise.allSettled(users.slice(5, 7).map((userId, index) => asUser(userId, (c) => c.query('select public.join_league($1,$2)', [activeInvite, `Competing ${index}`]))));
  assert.equal(competing.filter((result) => result.status === 'fulfilled').length, 1, 'exactly one of two competing seventh-place joins succeeds');
  assert.equal(competing.filter((result) => result.status === 'rejected').length, 1);
  assert.ok(competing.some((result) => result.status === 'rejected' && result.reason.message.includes('League full')));
  assert.equal((await admin.query('select count(*) from public.league_memberships where league_id=$1', [leagueId])).rows[0].count, '6');
  assert.equal((await admin.query('select count(*) from public.fantasy_teams where league_id=$1', [leagueId])).rows[0].count, '6');
  await asUser(users[1], async (client) => {
    await expectPgError(() => client.query("select public.rename_league($1,'Unauthorized')", [leagueId]), 'Commissioner required');
  });
  await expectPgError(() => asUser(users[1], (c) => c.query('select public.create_invitation($1)', [leagueId])), 'Commissioner required');
  await admin.query("update public.fantasy_leagues set status='active' where id=$1", [leagueId]);
  await expectPgError(() => asUser(users[1], (c) => c.query('select public.leave_league($1)', [leagueId])), 'League is not in lobby');
  await expectPgError(() => asUser(users[7], (c) => c.query('select public.join_league($1,$2)', [activeInvite, 'Late Team'])), 'League is not in lobby');
  await expectPgError(() => asUser(users[0], (c) => c.query('select public.create_invitation($1)', [leagueId])), 'League is not in lobby');
  await admin.query("select set_config('request.jwt.claim.sub','',false)");
  await expectPgError(() => admin.query("select public.create_league('x','x',$1)", [seasonId]), 'Authentication required');
});

test('expired and malformed tokens share generic invalid invitation error', async () => {
  const token = 'b'.repeat(64);
  const hash = (await admin.query("select extensions.digest($1,'sha256') as hash", [token])).rows[0].hash;
  await admin.query('insert into public.league_invitations(league_id,token_hash,created_by,expires_at) values($1,$2,$3,now()-interval \'1 second\')', [leagueId, hash, users[0]]);
  await expectPgError(() => asUser(users[7], (c) => c.query('select public.join_league($1,$2)', [token, 'Expired'])), 'Invalid invitation');
});
