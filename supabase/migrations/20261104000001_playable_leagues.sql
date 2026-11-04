alter table public.fantasy_leagues alter column settings_version set default 2;
update public.fantasy_leagues set settings_version = 2;
alter table public.fantasy_leagues add column champion_team_id uuid references public.fantasy_teams(id) on delete set null;
alter table public.league_memberships add column draft_position smallint;
alter table public.league_memberships add constraint league_memberships_draft_position_check check (draft_position is null or draft_position between 1 and 6);
create unique index league_memberships_draft_position_idx on public.league_memberships(league_id, draft_position) where draft_position is not null;

create or replace function public.create_league(p_name text, p_team_name text, p_season_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_id uuid; v_competition_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60
      or p_team_name is null or char_length(btrim(p_team_name)) not between 1 and 40 then
    raise exception 'Invalid league details';
  end if;
  select competition_id into v_competition_id from public.seasons where id = p_season_id;
  if not found then raise exception 'Invalid season'; end if;
  if not exists (select 1 from public.cricket_ingest_runs where season_id = p_season_id)
      or not exists (select 1 from public.seasons s join public.competitions c on c.id = s.competition_id where s.id = p_season_id and s.year = 2026 and c.slug = 'mlc')
      or (select count(*) from public.season_players where season_id = p_season_id) < 90
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = p_season_id and cp.role = 'WK') < 6
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = p_season_id and cp.role = 'BAT') < 12
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = p_season_id and cp.role = 'BOWL') < 12
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = p_season_id and cp.role = 'ALL') < 12
      or (select count(*) from public.franchises where competition_id = v_competition_id) <> 6
      or (select count(*) from public.season_rounds where season_id = p_season_id) <> 7
      or (select count(*) from public.season_rounds sr where sr.season_id = p_season_id and sr.stage = 'regular') <> 5
      or (select count(*) from public.season_rounds sr where sr.season_id = p_season_id and sr.stage = 'semifinal') <> 1
      or (select count(*) from public.season_rounds sr where sr.season_id = p_season_id and sr.stage = 'final') <> 1
      or (select count(*) from public.season_pairings where season_id = p_season_id) <> 15
      or (select count(*) from public.cricket_matches where season_id = p_season_id and status = 'final') <> 34
      or (select count(*) from public.season_round_matches rm join public.season_rounds sr on sr.id = rm.round_id where sr.season_id = p_season_id) <> 34
      or (select count(*) from public.player_match_stats stat join public.cricket_matches match on match.id = stat.match_id where match.season_id = p_season_id) <> 754
      or (select count(*) from public.player_match_points point join public.cricket_matches match on match.id = point.match_id where match.season_id = p_season_id and point.scoring_version = 'mlc-v0.1') <> 754
      or exists (select 1 from public.season_rounds sr where sr.season_id = p_season_id
        and not exists (select 1 from public.season_round_matches srm where srm.round_id = sr.id)) then
    raise exception 'Season not ready';
  end if;
  insert into public.fantasy_leagues(season_id, name, commissioner_user_id, settings_version)
  values (p_season_id, btrim(p_name), v_user, 2) returning id into v_id;
  insert into public.league_memberships(league_id, user_id, role) values (v_id, v_user, 'commissioner');
  insert into public.fantasy_teams(league_id, manager_user_id, name) values (v_id, v_user, btrim(p_team_name));
  return v_id;
end
$$;

create table public.league_drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  league_id uuid not null unique references public.fantasy_leagues(id) on delete cascade,
  status text not null check (status in ('drafting', 'completed')),
  rounds smallint not null default 15 check (rounds = 15),
  next_pick_number smallint not null default 1 check (next_pick_number between 1 and 91),
  total_picks smallint not null default 90 check (total_picks = 90),
  seconds_per_pick integer not null default 90 check (seconds_per_pick between 15 and 300),
  deadline_at timestamptz,
  revision integer not null default 0 check (revision >= 0),
  started_at timestamptz not null default clock_timestamp(),
  completed_at timestamptz,
  check ((status = 'drafting' and next_pick_number between 1 and 90 and deadline_at is not null and completed_at is null)
      or (status = 'completed' and next_pick_number = 91 and deadline_at is null and completed_at is not null))
);
create table public.league_draft_picks (
  id uuid primary key default extensions.gen_random_uuid(),
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  pick_number smallint not null check (pick_number between 1 and 90),
  round_number smallint not null check (round_number between 1 and 15),
  team_id uuid not null references public.fantasy_teams(id) on delete cascade,
  player_id uuid not null references public.cricket_players(id),
  automatic boolean not null default false,
  selected_at timestamptz not null default clock_timestamp(),
  unique (league_id, pick_number),
  unique (league_id, player_id)
);
create index league_draft_picks_team_idx on public.league_draft_picks(league_id, team_id, pick_number);

create table public.league_game_rounds (
  id uuid primary key default extensions.gen_random_uuid(),
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  season_round_id uuid not null references public.season_rounds(id),
  round_number smallint not null check (round_number between 1 and 7),
  name text not null,
  stage text not null check (stage in ('regular', 'semifinal', 'final')),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  status text not null default 'scheduled' check (status in ('scheduled', 'open', 'completed')),
  locked_at timestamptz,
  completed_at timestamptz,
  unique (league_id, round_number),
  unique (league_id, season_round_id),
  check ((status = 'completed' and locked_at is not null and completed_at is not null)
      or (status <> 'completed' and locked_at is null and completed_at is null))
);
create index league_game_rounds_season_round_idx on public.league_game_rounds(season_round_id);

create table public.league_lineups (
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  round_id uuid not null references public.league_game_rounds(id) on delete cascade,
  team_id uuid not null references public.fantasy_teams(id) on delete cascade,
  slots jsonb not null check (case when jsonb_typeof(slots) = 'array' then jsonb_array_length(slots) = 11 else false end),
  submitted_at timestamptz,
  locked_at timestamptz,
  primary key (round_id, team_id)
);
create index league_lineups_team_idx on public.league_lineups(league_id, team_id, round_id);

create table public.league_matchups (
  id uuid primary key default extensions.gen_random_uuid(),
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  round_id uuid not null references public.league_game_rounds(id) on delete cascade,
  home_team_id uuid not null references public.fantasy_teams(id),
  away_team_id uuid not null references public.fantasy_teams(id),
  home_seed smallint,
  away_seed smallint,
  home_score numeric,
  away_score numeric,
  status text not null default 'scheduled' check (status in ('scheduled', 'final')),
  result text check (result in ('home', 'away', 'draw')),
  check (home_team_id <> away_team_id),
  check ((status = 'final' and home_score is not null and away_score is not null and result is not null)
      or (status = 'scheduled' and home_score is null and away_score is null and result is null)),
  unique (round_id, home_team_id, away_team_id)
);
create index league_matchups_round_idx on public.league_matchups(league_id, round_id);

create table public.league_round_contributions (
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  round_id uuid not null references public.league_game_rounds(id) on delete cascade,
  team_id uuid not null references public.fantasy_teams(id),
  player_id uuid not null references public.cricket_players(id),
  slot_id text not null,
  score numeric not null,
  appearances integer not null check (appearances >= 0),
  primary key (round_id, team_id, player_id),
  unique (round_id, team_id, slot_id)
);
create index league_round_contributions_league_idx on public.league_round_contributions(league_id, round_id, team_id);

create table public.league_standings (
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  team_id uuid not null references public.fantasy_teams(id) on delete cascade,
  wins smallint not null default 0 check (wins >= 0),
  losses smallint not null default 0 check (losses >= 0),
  draws smallint not null default 0 check (draws >= 0),
  points_for numeric not null default 0,
  points_against numeric not null default 0,
  seed smallint check (seed between 1 and 6),
  primary key (league_id, team_id)
);

create function private.can_complete_draft(p_league_id uuid, p_team_id uuid, p_player_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  with league as (
    select l.season_id from public.fantasy_leagues l where l.id = p_league_id
  ), pool as (
    select sp.player_id, cp.role
    from public.season_players sp
    join public.cricket_players cp on cp.id = sp.player_id
    cross join league l
    where sp.season_id = l.season_id
      and not exists (select 1 from public.league_draft_picks dp where dp.league_id = p_league_id and dp.player_id = sp.player_id)
      and sp.player_id <> p_player_id
  ), needs as (
    select t.id,
      greatest(15 - count(dp.player_id) - case when t.id = p_team_id then 1 else 0 end, 0) as open_roster_slots,
      greatest(1 - count(*) filter (where cp.role = 'WK') - case when t.id = p_team_id and candidate.role = 'WK' then 1 else 0 end, 0) as need_wk,
      greatest(2 - count(*) filter (where cp.role = 'BAT') - case when t.id = p_team_id and candidate.role = 'BAT' then 1 else 0 end, 0) as need_bat,
      greatest(2 - count(*) filter (where cp.role = 'BOWL') - case when t.id = p_team_id and candidate.role = 'BOWL' then 1 else 0 end, 0) as need_bowl,
      greatest(2 - count(*) filter (where cp.role = 'ALL') - case when t.id = p_team_id and candidate.role = 'ALL' then 1 else 0 end, 0) as need_all
    from public.fantasy_teams t
    left join public.league_draft_picks dp on dp.league_id = p_league_id and dp.team_id = t.id
    left join public.cricket_players cp on cp.id = dp.player_id
    left join public.cricket_players candidate on candidate.id = p_player_id
    where t.league_id = p_league_id
    group by t.id, candidate.role
  ), available as (
    select count(*) as total,
      count(*) filter (where role = 'WK') as wk,
      count(*) filter (where role = 'BAT') as bat,
      count(*) filter (where role = 'BOWL') as bowl,
      count(*) filter (where role = 'ALL') as all_role
    from pool
  )
  select exists(select 1 from league)
    and (select coalesce(sum(open_roster_slots), 0) from needs) <= (select total from available)
    and (select coalesce(bool_and(need_wk + need_bat + need_bowl + need_all <= open_roster_slots), false) from needs)
    and (select coalesce(sum(need_wk), 0) from needs) <= (select wk from available)
    and (select coalesce(sum(need_bat), 0) from needs) <= (select bat from available)
    and (select coalesce(sum(need_bowl), 0) from needs) <= (select bowl from available)
    and (select coalesce(sum(need_all), 0) from needs) <= (select all_role from available)
$$;

create function private.default_lineup_slots(p_league_id uuid, p_team_id uuid)
returns jsonb language sql stable security definer set search_path = ''
as $$
  with roster as (
    select dp.player_id, cp.role, dp.pick_number,
      row_number() over (partition by cp.role order by dp.pick_number, dp.player_id) as role_n,
      row_number() over (order by dp.pick_number, dp.player_id) as roster_n
    from public.league_draft_picks dp
    join public.cricket_players cp on cp.id = dp.player_id
    where dp.league_id = p_league_id and dp.team_id = p_team_id
  ), typed as (
    select player_id,
      case role when 'WK' then 'WK1' when 'BAT' then 'BAT' || role_n::text
        when 'BOWL' then 'BOWL' || role_n::text when 'ALL' then 'ALL' || role_n::text end as slot_id,
      case role when 'WK' then 1 when 'BAT' then 2 + role_n::int when 'BOWL' then 4 + role_n::int else 6 + role_n::int end as slot_order
    from roster
    where (role = 'WK' and role_n = 1) or (role = 'BAT' and role_n <= 2)
      or (role = 'BOWL' and role_n <= 2) or (role = 'ALL' and role_n <= 2)
  ), flexible as (
    select r.player_id, 'FLEX' || row_number() over (order by r.pick_number, r.player_id)::text as slot_id,
      8 + row_number() over (order by r.pick_number, r.player_id)::int as slot_order
    from roster r
    where not exists (select 1 from typed t where t.player_id = r.player_id)
    order by r.pick_number, r.player_id limit 4
  ), slots as (
    select * from typed union all select * from flexible
  )
  select coalesce(jsonb_agg(jsonb_build_object('slotId', slot_id, 'playerId', player_id::text) order by slot_order), '[]'::jsonb)
  from slots
$$;

create function private.populate_round_lineups(p_league_id uuid, p_round_id uuid, p_round_number integer)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if p_round_number > 1 then
    insert into public.league_lineups(league_id, round_id, team_id, slots)
    select p_league_id, p_round_id, previous.team_id, previous.slots
    from public.league_game_rounds prior_round
    join public.league_lineups previous on previous.round_id = prior_round.id
    where prior_round.league_id = p_league_id and prior_round.round_number = p_round_number - 1
      and exists (select 1 from public.league_matchups m where m.round_id = p_round_id
        and (m.home_team_id = previous.team_id or m.away_team_id = previous.team_id))
    on conflict (round_id, team_id) do nothing;
  end if;
  insert into public.league_lineups(league_id, round_id, team_id, slots)
  select p_league_id, p_round_id, participant.team_id, private.default_lineup_slots(p_league_id, participant.team_id)
  from (
    select home_team_id as team_id from public.league_matchups where round_id = p_round_id
    union
    select away_team_id as team_id from public.league_matchups where round_id = p_round_id
  ) participant
  where not exists (select 1 from public.league_lineups l where l.round_id = p_round_id and l.team_id = participant.team_id)
  on conflict (round_id, team_id) do nothing;
end
$$;

create function private.score_locked_round(p_league_id uuid, p_round_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_scoring_version text;
begin
  select fl.scoring_version into v_scoring_version from public.fantasy_leagues fl where fl.id = p_league_id;
  delete from public.league_round_contributions where league_id = p_league_id and round_id = p_round_id;
  insert into public.league_round_contributions(league_id, round_id, team_id, player_id, slot_id, score, appearances)
  select p_league_id, p_round_id, lineup.team_id, slot."playerId", slot."slotId",
    coalesce(avg(points.total_points), 0), count(stats.match_id)::integer
  from public.league_lineups lineup
  cross join lateral jsonb_to_recordset(lineup.slots) as slot("slotId" text, "playerId" uuid)
  join public.league_game_rounds game_round on game_round.id = p_round_id and game_round.league_id = p_league_id
  join public.season_round_matches rm on rm.round_id = game_round.season_round_id
  left join public.player_match_stats stats on stats.match_id = rm.match_id and stats.player_id = slot."playerId"
  left join public.player_match_points points on points.match_id = stats.match_id and points.player_id = stats.player_id and points.scoring_version = v_scoring_version
  where lineup.league_id = p_league_id and lineup.round_id = p_round_id
  group by lineup.team_id, slot."playerId", slot."slotId";

  update public.league_matchups matchup set
    home_score = scores.home_score,
    away_score = scores.away_score,
    status = 'final',
    result = case when scores.home_score > scores.away_score then 'home'
                  when scores.home_score < scores.away_score then 'away' else 'draw' end
  from (
    select m.id,
      coalesce((select sum(c.score) from public.league_round_contributions c where c.round_id = m.round_id and c.team_id = m.home_team_id), 0) as home_score,
      coalesce((select sum(c.score) from public.league_round_contributions c where c.round_id = m.round_id and c.team_id = m.away_team_id), 0) as away_score
    from public.league_matchups m where m.league_id = p_league_id and m.round_id = p_round_id
  ) scores
  where matchup.id = scores.id;
end
$$;

create function private.refresh_standings(p_league_id uuid, p_freeze_seeds boolean default false)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_has_playoffs boolean;
begin
  select exists (
    select 1 from public.league_matchups m join public.league_game_rounds r on r.id = m.round_id
    where m.league_id = p_league_id and r.stage in ('semifinal', 'final')
  ) into v_has_playoffs;
  insert into public.league_standings(league_id, team_id, wins, losses, draws, points_for, points_against)
  select p_league_id, t.id,
    count(*) filter (where m.result = case when m.home_team_id = t.id then 'home' else 'away' end)::smallint,
    count(*) filter (where m.result = case when m.home_team_id = t.id then 'away' else 'home' end)::smallint,
    count(*) filter (where m.result = 'draw')::smallint,
    coalesce(sum(case when m.home_team_id = t.id then m.home_score else m.away_score end), 0),
    coalesce(sum(case when m.home_team_id = t.id then m.away_score else m.home_score end), 0)
  from public.fantasy_teams t
  left join public.league_matchups m on m.league_id = p_league_id and m.status = 'final'
    and (m.home_team_id = t.id or m.away_team_id = t.id)
  left join public.league_game_rounds r on r.id = m.round_id and r.stage = 'regular'
  where t.league_id = p_league_id and (m.id is null or r.id is not null)
  group by t.id
  on conflict (league_id, team_id) do update set
    wins = excluded.wins, losses = excluded.losses, draws = excluded.draws,
    points_for = excluded.points_for, points_against = excluded.points_against;

  if p_freeze_seeds and not v_has_playoffs then
    with standings as (
      select s.team_id, (s.wins * 2 + s.draws)::integer as match_points, s.points_for,
        coalesce((
          select sum(case when (m.home_team_id = s.team_id and m.result = 'home') or (m.away_team_id = s.team_id and m.result = 'away') then 2
                          when m.result = 'draw' then 1 else 0 end)
          from public.league_matchups m
          join public.league_game_rounds r on r.id = m.round_id and r.stage = 'regular'
          join public.league_standings opponent on opponent.league_id = m.league_id
            and opponent.team_id = case when m.home_team_id = s.team_id then m.away_team_id else m.home_team_id end
          where m.league_id = p_league_id and m.status = 'final'
            and (m.home_team_id = s.team_id or m.away_team_id = s.team_id)
            and (opponent.wins * 2 + opponent.draws) = (s.wins * 2 + s.draws)
            and opponent.points_for = s.points_for
        ), 0) as head_to_head
      from public.league_standings s where s.league_id = p_league_id
    ), ranked as (
      select team_id, row_number() over(order by match_points desc, points_for desc, head_to_head desc, team_id)::smallint as seed
      from standings
    )
    update public.league_standings s set seed = ranked.seed
    from ranked where s.league_id = p_league_id and s.team_id = ranked.team_id;
  end if;
end
$$;

create function private.create_league_schedule(p_league_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_season_id uuid; v_round_id uuid;
begin
  select season_id into v_season_id from public.fantasy_leagues where id = p_league_id;
  if (select count(*) from public.season_rounds where season_id = v_season_id) <> 7
    or (select count(*) from public.season_rounds where season_id = v_season_id and stage = 'regular') <> 5
    or (select count(*) from public.season_rounds where season_id = v_season_id and stage = 'semifinal') <> 1
    or (select count(*) from public.season_rounds where season_id = v_season_id and stage = 'final') <> 1 then
    raise exception 'Season replay schedule is incomplete';
  end if;
  insert into public.league_game_rounds(league_id, season_round_id, round_number, name, stage, starts_on, ends_on, status)
  select p_league_id, sr.id, sr.round_number, sr.name, sr.stage, sr.starts_on, sr.ends_on,
    case when sr.round_number = 1 then 'open' else 'scheduled' end
  from public.season_rounds sr where sr.season_id = v_season_id;
  insert into public.league_matchups(league_id, round_id, home_team_id, away_team_id)
  select p_league_id, gr.id, home_team.id, away_team.id
  from public.season_pairings pairing
  join public.league_game_rounds gr on gr.league_id = p_league_id and gr.round_number = pairing.round_number
  join public.league_memberships home_member on home_member.league_id = p_league_id and home_member.draft_position = pairing.home_position
  join public.fantasy_teams home_team on home_team.league_id = p_league_id and home_team.manager_user_id = home_member.user_id
  join public.league_memberships away_member on away_member.league_id = p_league_id and away_member.draft_position = pairing.away_position
  join public.fantasy_teams away_team on away_team.league_id = p_league_id and away_team.manager_user_id = away_member.user_id
  where pairing.season_id = v_season_id and pairing.round_number between 1 and 5;
  insert into public.league_standings(league_id, team_id)
  select p_league_id, id from public.fantasy_teams where league_id = p_league_id;
  select id into v_round_id from public.league_game_rounds where league_id = p_league_id and round_number = 1;
  perform private.populate_round_lineups(p_league_id, v_round_id, 1);
end
$$;

create function private.apply_draft_pick(
  p_league_id uuid, p_player_id uuid, p_expected_pick integer, p_automatic boolean, p_actor uuid
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  v_season_id uuid; v_status public.league_status; v_draft public.league_drafts%rowtype;
  v_pick integer; v_round integer; v_position integer; v_team_id uuid; v_owner uuid;
begin
  select season_id, status into v_season_id, v_status
  from public.fantasy_leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = p_actor) then
    raise exception 'League membership required';
  end if;
  select * into v_draft from public.league_drafts where league_id = p_league_id for update;
  if not found then
    if p_automatic then return false; end if;
    raise exception 'Draft is not active';
  end if;
  if v_draft.status <> 'drafting' or v_status <> 'drafting' then
    if p_automatic then return false; end if;
    raise exception 'Draft is not active';
  end if;
  v_pick := v_draft.next_pick_number;
  if p_expected_pick is null or p_expected_pick <> v_pick then
    if p_automatic then return false; end if;
    raise exception 'Stale expected pick number';
  end if;
  if p_automatic then
    if v_draft.deadline_at > clock_timestamp() then return false; end if;
  elsif v_draft.deadline_at <= clock_timestamp() then
    raise exception 'Draft turn deadline expired; request an automatic pick';
  end if;
  v_round := ((v_pick - 1) / 6) + 1;
  v_position := case when v_round % 2 = 1 then ((v_pick - 1) % 6) + 1 else 6 - ((v_pick - 1) % 6) end;
  select team.id, member.user_id into v_team_id, v_owner
  from public.league_memberships member
  join public.fantasy_teams team on team.league_id = member.league_id and team.manager_user_id = member.user_id
  where member.league_id = p_league_id and member.draft_position = v_position;
  if v_team_id is null then raise exception 'Draft order is incomplete'; end if;
  if not p_automatic and v_owner <> p_actor then raise exception 'Not your draft turn'; end if;
  if not exists (
    select 1 from public.season_players sp
    where sp.season_id = v_season_id and sp.player_id = p_player_id
  ) then raise exception 'Player is not in this season pool'; end if;
  if exists (select 1 from public.league_draft_picks where league_id = p_league_id and player_id = p_player_id) then
    raise exception 'Player is already owned';
  end if;
  if not private.can_complete_draft(p_league_id, v_team_id, p_player_id) then
    raise exception 'Pick would make required roster roles infeasible';
  end if;
  insert into public.league_draft_picks(league_id, pick_number, round_number, team_id, player_id, automatic)
  values (p_league_id, v_pick, v_round, v_team_id, p_player_id, p_automatic);
  if v_pick = 90 then
    update public.league_drafts set status = 'completed', next_pick_number = 91,
      deadline_at = null, revision = revision + 1, completed_at = clock_timestamp()
    where id = v_draft.id;
    update public.fantasy_leagues set status = 'active' where id = p_league_id;
    perform private.create_league_schedule(p_league_id);
  else
    update public.league_drafts set next_pick_number = v_pick + 1,
      deadline_at = clock_timestamp() + make_interval(secs => v_draft.seconds_per_pick),
      revision = revision + 1
    where id = v_draft.id;
  end if;
  return true;
end
$$;

create function public.start_draft(p_league_id uuid, p_seconds_per_pick integer default 90)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_season_id uuid; v_status public.league_status;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform 1 from public.fantasy_leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user and role = 'commissioner') then
    raise exception 'Commissioner required';
  end if;
  select season_id, status into v_season_id, v_status from public.fantasy_leagues where id = p_league_id;
  if v_status <> 'lobby' then raise exception 'League is not ready to draft'; end if;
  if p_seconds_per_pick is null or p_seconds_per_pick not between 15 and 300 then raise exception 'Pick clock must be between 15 and 300 seconds'; end if;
  if (select count(*) from public.league_memberships where league_id = p_league_id) <> 6
      or (select count(*) from public.fantasy_teams where league_id = p_league_id) <> 6 then
    raise exception 'Exactly six managers are required to start';
  end if;
  if not exists (select 1 from public.cricket_ingest_runs where season_id = v_season_id)
      or not exists (select 1 from public.seasons s join public.competitions c on c.id = s.competition_id where s.id = v_season_id and s.year = 2026 and c.slug = 'mlc')
      or (select count(*) from public.season_players where season_id = v_season_id) < 90
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = v_season_id and cp.role = 'WK') < 6
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = v_season_id and cp.role = 'BAT') < 12
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = v_season_id and cp.role = 'BOWL') < 12
      or (select count(*) from public.season_players sp join public.cricket_players cp on cp.id = sp.player_id where sp.season_id = v_season_id and cp.role = 'ALL') < 12
      or (select count(*) from public.franchises where competition_id = (select competition_id from public.seasons where id = v_season_id)) <> 6
      or (select count(*) from public.season_rounds where season_id = v_season_id) <> 7
      or (select count(*) from public.season_rounds sr where sr.season_id = v_season_id and sr.stage = 'regular') <> 5
      or (select count(*) from public.season_rounds sr where sr.season_id = v_season_id and sr.stage = 'semifinal') <> 1
      or (select count(*) from public.season_rounds sr where sr.season_id = v_season_id and sr.stage = 'final') <> 1
      or (select count(*) from public.season_pairings where season_id = v_season_id) <> 15
      or (select count(*) from public.cricket_matches where season_id = v_season_id and status = 'final') <> 34
      or (select count(*) from public.season_round_matches rm join public.season_rounds sr on sr.id = rm.round_id where sr.season_id = v_season_id) <> 34
      or (select count(*) from public.player_match_stats stat join public.cricket_matches match on match.id = stat.match_id where match.season_id = v_season_id) <> 754
      or (select count(*) from public.player_match_points point join public.cricket_matches match on match.id = point.match_id where match.season_id = v_season_id and point.scoring_version = 'mlc-v0.1') <> 754
      or exists (select 1 from public.season_rounds sr where sr.season_id = v_season_id and not exists (
        select 1 from public.season_round_matches srm where srm.round_id = sr.id
      )) then
    raise exception 'Season data cannot support a complete league';
  end if;
  update public.league_memberships m set draft_position = ordered.position
  from (
    select id, row_number() over(order by joined_at, user_id)::smallint as position
    from public.league_memberships where league_id = p_league_id
  ) ordered where m.id = ordered.id;
  update public.fantasy_leagues set status = 'drafting', settings_version = 2 where id = p_league_id;
  insert into public.league_drafts(league_id, status, seconds_per_pick, deadline_at)
  values (p_league_id, 'drafting', p_seconds_per_pick, clock_timestamp() + make_interval(secs => p_seconds_per_pick));
end
$$;

create function public.make_draft_pick(p_league_id uuid, p_player_id uuid, p_expected_pick integer)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_expected_pick not between 1 and 90 then raise exception 'Invalid expected pick number'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user) then
    raise exception 'League membership required';
  end if;
  perform private.apply_draft_pick(p_league_id, p_player_id, p_expected_pick, false, v_user);
end
$$;

create function public.draft_tick(p_league_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_draft public.league_drafts%rowtype; v_season_id uuid; v_player_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user) then
    raise exception 'League membership required';
  end if;
  select season_id into v_season_id from public.fantasy_leagues where id = p_league_id;
  if not found then raise exception 'League not found'; end if;
  select * into v_draft from public.league_drafts where league_id = p_league_id;
  if not found or v_draft.status <> 'drafting' then return false; end if;
  if v_draft.deadline_at > clock_timestamp() then return false; end if;
  for v_player_id in
    select sp.player_id from public.season_players sp
    join public.cricket_players cp on cp.id = sp.player_id
    where sp.season_id = v_season_id
      and not exists (select 1 from public.league_draft_picks dp where dp.league_id = p_league_id and dp.player_id = sp.player_id)
    order by cp.role, cp.name, sp.player_id
  loop
    if private.can_complete_draft(p_league_id,
      (select team.id from public.league_memberships member
        join public.fantasy_teams team on team.league_id = member.league_id and team.manager_user_id = member.user_id
        where member.league_id = p_league_id and member.draft_position =
          case when (((v_draft.next_pick_number - 1) / 6) + 1) % 2 = 1
            then ((v_draft.next_pick_number - 1) % 6) + 1 else 6 - ((v_draft.next_pick_number - 1) % 6) end),
      v_player_id) then
      return private.apply_draft_pick(p_league_id, v_player_id, v_draft.next_pick_number, true, v_user);
    end if;
  end loop;
  raise exception 'No feasible season player remains for the expired turn';
end
$$;

create function public.save_lineup(p_league_id uuid, p_round_id uuid, p_slots jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_team_id uuid; v_status public.league_status;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user) then
    raise exception 'League membership required';
  end if;
  select status into v_status from public.fantasy_leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if v_status <> 'active' then raise exception 'League lineups are not editable'; end if;
  select id into v_team_id from public.fantasy_teams where league_id = p_league_id and manager_user_id = v_user;
  if v_team_id is null then raise exception 'League team not found'; end if;
  if not exists (select 1 from public.league_matchups matchup where matchup.round_id = p_round_id
      and (matchup.home_team_id = v_team_id or matchup.away_team_id = v_team_id)) then
    raise exception 'Team is not participating in this round';
  end if;
  if not exists (select 1 from public.league_game_rounds where id = p_round_id and league_id = p_league_id and status = 'open') then
    raise exception 'Round is not open';
  end if;
  if p_slots is null or jsonb_typeof(p_slots) <> 'array' then
    raise exception 'Lineup must contain exactly eleven slots';
  end if;
  if jsonb_array_length(p_slots) <> 11 then raise exception 'Lineup must contain exactly eleven slots'; end if;
  if (select count(distinct value->>'slotId') from jsonb_array_elements(p_slots)) <> 11
      or (select count(distinct value->>'playerId') from jsonb_array_elements(p_slots)) <> 11
      or exists (
        select 1 from jsonb_array_elements(p_slots) item
        where coalesce(item->>'slotId', '') not in ('WK1','BAT1','BAT2','BOWL1','BOWL2','ALL1','ALL2','FLEX1','FLEX2','FLEX3','FLEX4')
          or coalesce(item->>'playerId', '') = ''
      ) then raise exception 'Lineup slots or players are invalid'; end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_slots) as slot("slotId" text, "playerId" uuid)
    join public.cricket_players player on player.id = slot."playerId"
    where (slot."slotId" = 'WK1' and player.role <> 'WK')
      or (slot."slotId" in ('BAT1','BAT2') and player.role <> 'BAT')
      or (slot."slotId" in ('BOWL1','BOWL2') and player.role <> 'BOWL')
      or (slot."slotId" in ('ALL1','ALL2') and player.role <> 'ALL')
  ) then raise exception 'Player role does not match lineup slot'; end if;
  if exists (
    select 1 from jsonb_to_recordset(p_slots) as slot("slotId" text, "playerId" uuid)
    where not exists (
      select 1 from public.league_draft_picks pick
      where pick.league_id = p_league_id and pick.team_id = v_team_id and pick.player_id = slot."playerId"
    )
  ) then raise exception 'Lineup player is not owned by this team'; end if;
  if exists (select 1 from public.league_lineups where round_id = p_round_id and team_id = v_team_id and locked_at is not null) then
    raise exception 'Lineup is locked';
  end if;
  insert into public.league_lineups(league_id, round_id, team_id, slots, submitted_at)
  values (p_league_id, p_round_id, v_team_id, p_slots, clock_timestamp())
  on conflict (round_id, team_id) do update set slots = excluded.slots, submitted_at = excluded.submitted_at
  where public.league_lineups.locked_at is null;
end
$$;

create function public.replay_round(p_league_id uuid, p_round_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_round public.league_game_rounds%rowtype; v_league_status public.league_status; v_next_round_id uuid;
  v_home_winner uuid; v_away_winner uuid; v_home_seed smallint; v_away_seed smallint;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform 1 from public.fantasy_leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user and role = 'commissioner') then
    raise exception 'Commissioner required';
  end if;
  select status into v_league_status from public.fantasy_leagues where id = p_league_id;
  select * into v_round from public.league_game_rounds where id = p_round_id and league_id = p_league_id for update;
  if not found then raise exception 'Round not found'; end if;
  if v_round.status = 'completed' then
    perform private.score_locked_round(p_league_id, p_round_id);
    if v_round.stage = 'regular' then perform private.refresh_standings(p_league_id, v_round.round_number = 5); end if;
    return;
  end if;
  if v_league_status <> 'active' or v_round.status <> 'open'
      or not exists (select 1 from public.league_game_rounds where league_id = p_league_id and status = 'open' and id = p_round_id) then
    raise exception 'Round is not the current open round';
  end if;
  if exists (
    select participant.team_id from (
      select home_team_id as team_id from public.league_matchups where round_id = p_round_id
      union
      select away_team_id as team_id from public.league_matchups where round_id = p_round_id
    ) participant
    where not exists (select 1 from public.league_lineups lineup where lineup.league_id = p_league_id
      and lineup.round_id = p_round_id and lineup.team_id = participant.team_id)
  ) or exists (
    select 1 from public.league_lineups lineup where lineup.league_id = p_league_id and lineup.round_id = p_round_id
      and not exists (select 1 from public.league_matchups matchup where matchup.round_id = p_round_id
        and (matchup.home_team_id = lineup.team_id or matchup.away_team_id = lineup.team_id))
  ) then raise exception 'Every participating team must have a valid lineup'; end if;
  if exists (
    select 1 from public.league_lineups lineup
    cross join lateral jsonb_to_recordset(lineup.slots) as slot("slotId" text, "playerId" uuid)
    where lineup.league_id = p_league_id and lineup.round_id = p_round_id
      and not exists (select 1 from public.league_draft_picks pick
        where pick.league_id = p_league_id and pick.team_id = lineup.team_id and pick.player_id = slot."playerId")
  ) then raise exception 'A frozen lineup contains an unowned player'; end if;
  update public.league_lineups set locked_at = clock_timestamp()
  where league_id = p_league_id and round_id = p_round_id and locked_at is null;
  perform private.score_locked_round(p_league_id, p_round_id);
  update public.league_game_rounds set status = 'completed', locked_at = clock_timestamp(), completed_at = clock_timestamp()
  where id = p_round_id;
  if v_round.stage = 'regular' then
    perform private.refresh_standings(p_league_id, v_round.round_number = 5);
  end if;
  if v_round.round_number < 5 then
    select id into v_next_round_id from public.league_game_rounds
    where league_id = p_league_id and round_number = v_round.round_number + 1 for update;
    update public.league_game_rounds set status = 'open' where id = v_next_round_id;
    perform private.populate_round_lineups(p_league_id, v_next_round_id, v_round.round_number + 1);
  elsif v_round.round_number = 5 then
    insert into public.league_matchups(league_id, round_id, home_team_id, away_team_id, home_seed, away_seed)
    select p_league_id, semi.id, top.team_id, fourth.team_id, 1, 4
    from public.league_game_rounds semi
    cross join lateral (select team_id from public.league_standings where league_id = p_league_id and seed = 1) top
    cross join lateral (select team_id from public.league_standings where league_id = p_league_id and seed = 4) fourth
    where semi.league_id = p_league_id and semi.round_number = 6
    union all
    select p_league_id, semi.id, second.team_id, third.team_id, 2, 3
    from public.league_game_rounds semi
    cross join lateral (select team_id from public.league_standings where league_id = p_league_id and seed = 2) second
    cross join lateral (select team_id from public.league_standings where league_id = p_league_id and seed = 3) third
    where semi.league_id = p_league_id and semi.round_number = 6;
    select id into v_next_round_id from public.league_game_rounds where league_id = p_league_id and round_number = 6 for update;
    update public.league_game_rounds set status = 'open' where id = v_next_round_id;
    perform private.populate_round_lineups(p_league_id, v_next_round_id, 6);
  elsif v_round.round_number = 6 then
    select case when home_score > away_score or (home_score = away_score and home_seed < away_seed) then home_team_id else away_team_id end,
           case when home_score > away_score or (home_score = away_score and home_seed < away_seed) then home_seed else away_seed end
      into v_home_winner, v_home_seed
    from public.league_matchups where league_id = p_league_id and round_id = p_round_id and home_seed = 1;
    select case when home_score > away_score or (home_score = away_score and home_seed < away_seed) then home_team_id else away_team_id end,
           case when home_score > away_score or (home_score = away_score and home_seed < away_seed) then home_seed else away_seed end
      into v_away_winner, v_away_seed
    from public.league_matchups where league_id = p_league_id and round_id = p_round_id and home_seed = 2;
    select id into v_next_round_id from public.league_game_rounds where league_id = p_league_id and round_number = 7 for update;
    if not exists (select 1 from public.league_matchups where round_id = v_next_round_id) then
      insert into public.league_matchups(league_id, round_id, home_team_id, away_team_id, home_seed, away_seed)
      values (p_league_id, v_next_round_id, v_home_winner, v_away_winner, v_home_seed, v_away_seed);
    end if;
    update public.league_game_rounds set status = 'open' where id = v_next_round_id;
    perform private.populate_round_lineups(p_league_id, v_next_round_id, 7);
  elsif v_round.round_number = 7 then
    select case when home_score > away_score or (home_score = away_score and home_seed < away_seed) then home_team_id else away_team_id end
      into v_home_winner
    from public.league_matchups where league_id = p_league_id and round_id = p_round_id;
    update public.fantasy_leagues set champion_team_id = v_home_winner, status = 'completed' where id = p_league_id;
  end if;
end
$$;

create function public.recalculate_league(p_league_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_round record; v_champion uuid; v_status public.league_status;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select status into v_status from public.fantasy_leagues where id = p_league_id for update;
  if not found then raise exception 'League not found'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user and role = 'commissioner') then
    raise exception 'Commissioner required';
  end if;
  if v_status not in ('active', 'completed')
      or not exists (select 1 from public.league_game_rounds where league_id = p_league_id and status = 'completed') then
    raise exception 'No completed rounds to recalculate';
  end if;
  for v_round in select id, round_number, stage from public.league_game_rounds
    where league_id = p_league_id and status = 'completed' order by round_number
  loop
    perform private.score_locked_round(p_league_id, v_round.id);
  end loop;
  perform private.refresh_standings(p_league_id, false);
  if exists (select 1 from public.league_game_rounds where league_id = p_league_id and round_number = 5 and status = 'completed')
      and not exists (select 1 from public.league_matchups m join public.league_game_rounds r on r.id = m.round_id
        where m.league_id = p_league_id and r.stage in ('semifinal', 'final')) then
    perform private.refresh_standings(p_league_id, true);
  end if;
  if exists (select 1 from public.league_game_rounds where league_id = p_league_id and round_number = 7 and status = 'completed') then
    select case when home_score > away_score or (home_score = away_score and home_seed < away_seed) then home_team_id else away_team_id end
      into v_champion
    from public.league_matchups where league_id = p_league_id and round_id =
      (select id from public.league_game_rounds where league_id = p_league_id and round_number = 7);
    update public.fantasy_leagues set champion_team_id = v_champion where id = p_league_id;
  end if;
end
$$;

create function public.get_league_game(p_league_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_snapshot jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user) then
    raise exception 'League membership required';
  end if;
  select jsonb_build_object(
    'serverNow', clock_timestamp(),
    'league', jsonb_build_object(
      'id', fl.id, 'name', fl.name, 'status', fl.status, 'seasonId', s.id, 'seasonName', s.name,
      'seasonYear', s.year, 'mode', 'historical', 'settingsVersion', fl.settings_version,
      'scoringVersion', fl.scoring_version, 'squadSize', 15, 'starterCount', 11, 'benchCount', 4,
      'capacity', fl.capacity, 'championTeamId', fl.champion_team_id
    ),
    'me', jsonb_build_object('userId', v_user, 'teamId', my_team.id, 'isCommissioner', membership.role = 'commissioner'),
    'teams', coalesce((
      with ranking as (
        select st.team_id, st.wins, st.losses, st.draws, st.points_for, st.points_against, st.seed,
          (st.wins * 2 + st.draws) as match_points,
          coalesce((select sum(case when (m.home_team_id = st.team_id and m.result = 'home') or (m.away_team_id = st.team_id and m.result = 'away') then 2
                                   when m.result = 'draw' then 1 else 0 end)
            from public.league_matchups m
            join public.league_game_rounds r on r.id = m.round_id and r.stage = 'regular'
            join public.league_standings opponent on opponent.league_id = m.league_id
              and opponent.team_id = case when m.home_team_id = st.team_id then m.away_team_id else m.home_team_id end
            where m.league_id = fl.id and m.status = 'final'
              and (m.home_team_id = st.team_id or m.away_team_id = st.team_id)
              and (opponent.wins * 2 + opponent.draws) = (st.wins * 2 + st.draws)
              and opponent.points_for = st.points_for), 0) as head_to_head
        from public.fantasy_teams t
        left join public.league_standings st on st.league_id = fl.id and st.team_id = t.id
        where t.league_id = fl.id
      ), team_rows as (
        select t.id, t.manager_user_id, p.display_name as manager_name, t.name, member.draft_position,
          r.seed, coalesce(r.match_points, 0) as match_points, coalesce(r.points_for, 0) as points_for,
          coalesce(r.points_against, 0) as points_against, coalesce(r.wins, 0) as wins,
          coalesce(r.losses, 0) as losses, coalesce(r.draws, 0) as draws,
          coalesce(r.head_to_head, 0) as head_to_head,
          (select count(*) from public.league_draft_picks dp where dp.league_id = fl.id and dp.team_id = t.id) as roster_count,
          row_number() over(order by coalesce(r.match_points, 0) desc, coalesce(r.points_for, 0) desc,
            coalesce(r.head_to_head, 0) desc, t.id) as rank
        from public.fantasy_teams t
        join public.league_memberships member on member.league_id = fl.id and member.user_id = t.manager_user_id
        join public.profiles p on p.id = t.manager_user_id
        left join ranking r on r.team_id = t.id
        where t.league_id = fl.id
      )
      select jsonb_agg(jsonb_build_object(
        'id', team.id, 'managerId', team.manager_user_id, 'managerName', team.manager_name, 'name', team.name,
        'draftPosition', team.draft_position, 'seed', team.seed, 'rank', team.rank,
        'wins', team.wins, 'losses', team.losses, 'draws', team.draws,
        'pointsFor', team.points_for, 'pointsAgainst', team.points_against, 'rosterCount', team.roster_count
      ) order by team.rank)
      from team_rows team
    ), '[]'::jsonb),
    'players', coalesce((
      with player_stats as (
        select stat.player_id, count(*)::integer as appearances,
          coalesce(sum((stat.stats->>'runs')::numeric), 0) as runs,
          coalesce(sum((stat.stats->>'wickets')::numeric), 0) as wickets
        from public.player_match_stats stat
        join public.cricket_matches match on match.id = stat.match_id and match.season_id = fl.season_id
        group by stat.player_id
      ), player_points as (
        select point.player_id, count(*)::integer as appearances, sum(point.total_points) as total_points,
          avg(point.total_points) as average_points
        from public.player_match_points point
        join public.cricket_matches match on match.id = point.match_id and match.season_id = fl.season_id
        where point.scoring_version = fl.scoring_version group by point.player_id
      )
      select jsonb_agg(jsonb_build_object(
        'id', cp.id, 'name', cp.name, 'role', cp.role, 'roleSource', cp.role_source,
        'franchiseId', f.id, 'franchiseName', f.name, 'franchiseCode', f.code,
        'appearances', coalesce(ps.appearances, 0), 'runs', coalesce(ps.runs, 0), 'wickets', coalesce(ps.wickets, 0),
        'fantasyPoints', coalesce(pp.total_points, 0), 'averagePoints', coalesce(pp.average_points, 0),
        'ownerTeamId', owned.team_id
      ) order by cp.name, cp.id)
      from public.season_players sp
      join public.cricket_players cp on cp.id = sp.player_id
      join public.franchises f on f.id = sp.franchise_id
      left join player_stats ps on ps.player_id = cp.id
      left join player_points pp on pp.player_id = cp.id
      left join public.league_draft_picks owned on owned.league_id = fl.id and owned.player_id = cp.id
      where sp.season_id = fl.season_id
    ), '[]'::jsonb),
    'draft', (
      select jsonb_build_object(
        'id', draft.id, 'status', draft.status, 'rounds', draft.rounds,
        'pickNumber', draft.next_pick_number, 'totalPicks', draft.total_picks,
        'secondsPerPick', draft.seconds_per_pick, 'deadlineAt', draft.deadline_at,
        'currentTeamId', case when draft.status = 'completed' then null else current_team.id end, 'revision', draft.revision
      )
      from public.league_drafts draft
      left join public.league_memberships member on member.league_id = fl.id and member.draft_position =
        case when (((draft.next_pick_number - 1) / 6) + 1) % 2 = 1 then ((draft.next_pick_number - 1) % 6) + 1
             else 6 - ((draft.next_pick_number - 1) % 6) end
      left join public.fantasy_teams current_team on current_team.league_id = fl.id and current_team.manager_user_id = member.user_id
      where draft.league_id = fl.id
    ),
    'picks', coalesce((
      select jsonb_agg(jsonb_build_object('id', dp.id, 'pickNumber', dp.pick_number, 'round', dp.round_number,
        'teamId', dp.team_id, 'playerId', dp.player_id, 'automatic', dp.automatic, 'selectedAt', dp.selected_at)
        order by dp.pick_number)
      from public.league_draft_picks dp where dp.league_id = fl.id
    ), '[]'::jsonb),
    'rounds', coalesce((
      select jsonb_agg(jsonb_build_object('id', gr.id, 'number', gr.round_number, 'name', gr.name, 'stage', gr.stage,
        'status', gr.status, 'startsOn', gr.starts_on, 'endsOn', gr.ends_on, 'lockedAt', gr.locked_at,
        'completedAt', gr.completed_at, 'matchIds', coalesce((
          select jsonb_agg(rm.match_id order by cm.match_date, cm.source_id)
          from public.season_round_matches rm join public.cricket_matches cm on cm.id = rm.match_id
          where rm.round_id = gr.season_round_id
        ), '[]'::jsonb))
        order by gr.round_number)
      from public.league_game_rounds gr where gr.league_id = fl.id
    ), '[]'::jsonb),
    'currentRoundId', (select id from public.league_game_rounds where league_id = fl.id and status = 'open' order by round_number limit 1),
    'lineups', coalesce((
      select jsonb_agg(jsonb_build_object('teamId', lineup.team_id, 'roundId', lineup.round_id,
        'submittedAt', lineup.submitted_at, 'slots', lineup.slots)
        order by game_round.round_number, lineup.team_id)
      from public.league_lineups lineup
      join public.league_game_rounds game_round on game_round.id = lineup.round_id
      where lineup.league_id = fl.id and (lineup.team_id = my_team.id or game_round.locked_at is not null)
    ), '[]'::jsonb),
    'matchups', coalesce((
      select jsonb_agg(jsonb_build_object('id', matchup.id, 'roundId', matchup.round_id,
        'homeTeamId', matchup.home_team_id, 'awayTeamId', matchup.away_team_id,
        'homeScore', matchup.home_score, 'awayScore', matchup.away_score, 'status', matchup.status,
        'result', matchup.result, 'homeSeed', matchup.home_seed, 'awaySeed', matchup.away_seed,
        'contributions', coalesce((
          select jsonb_agg(jsonb_build_object('teamId', c.team_id, 'playerId', c.player_id, 'slotId', c.slot_id,
            'score', c.score, 'appearances', c.appearances) order by c.team_id, c.slot_id)
          from public.league_round_contributions c where c.league_id = fl.id and c.round_id = matchup.round_id
            and c.team_id in (matchup.home_team_id, matchup.away_team_id)
        ), '[]'::jsonb))
        order by game_round.round_number, matchup.home_seed nulls first, matchup.away_seed nulls first, matchup.id)
      from public.league_matchups matchup join public.league_game_rounds game_round on game_round.id = matchup.round_id
      where matchup.league_id = fl.id
    ), '[]'::jsonb),
    'matches', coalesce((
      select jsonb_agg(jsonb_build_object('id', cm.id, 'roundId', gr.id, 'sourceId', cm.source_id,
        'date', cm.match_date, 'teamAName', team_a.name, 'teamBName', team_b.name, 'venue', cm.venue,
        'status', cm.status, 'sourceUrl', cm.source_url)
        order by cm.match_date, cm.source_id)
      from public.league_game_rounds gr
      join public.season_round_matches rm on rm.round_id = gr.season_round_id
      join public.cricket_matches cm on cm.id = rm.match_id
      join public.franchises team_a on team_a.id = cm.team_a_franchise_id
      join public.franchises team_b on team_b.id = cm.team_b_franchise_id
      where gr.league_id = fl.id
    ), '[]'::jsonb),
    'attribution', (
      select jsonb_build_object('provider', 'Cricsheet', 'url', run.source_url,
        'licenseUrl', run.license_url, 'checksum', run.checksum, 'rolePolicy', run.role_policy, 'warnings', '[]'::jsonb)
      from public.cricket_ingest_runs run where run.season_id = fl.season_id order by run.imported_at desc limit 1
    )
  ) into v_snapshot
  from public.fantasy_leagues fl
  join public.seasons s on s.id = fl.season_id
  join public.league_memberships membership on membership.league_id = fl.id and membership.user_id = v_user
  join public.fantasy_teams my_team on my_team.league_id = fl.id and my_team.manager_user_id = v_user
  where fl.id = p_league_id;
  return v_snapshot;
end
$$;

create function public.get_player_history(p_league_id uuid, p_player_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_history jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.league_memberships where league_id = p_league_id and user_id = v_user) then
    raise exception 'League membership required';
  end if;
  if not exists (
    select 1 from public.fantasy_leagues fl join public.season_players sp on sp.season_id = fl.season_id
    where fl.id = p_league_id and sp.player_id = p_player_id
  ) then raise exception 'Player not found in this league season'; end if;
  select jsonb_build_object(
    'playerId', cp.id, 'scoringVersion', fl.scoring_version,
    'appearances', coalesce(jsonb_agg(jsonb_build_object(
      'matchId', cm.id, 'date', cm.match_date,
      'opponent', case when pms.franchise_id = cm.team_a_franchise_id then team_b.name else team_a.name end,
      'franchiseName', franchise.name, 'stats', pms.stats,
      'points', coalesce(pmp.total_points, 0), 'breakdown', pmp.breakdown, 'sourceUrl', cm.source_url
    ) order by cm.match_date, cm.source_id) filter (where cm.id is not null), '[]'::jsonb)
  ) into v_history
  from public.fantasy_leagues fl
  join public.cricket_players cp on cp.id = p_player_id
  left join public.player_match_stats pms on pms.player_id = cp.id
  left join public.cricket_matches cm on cm.id = pms.match_id and cm.season_id = fl.season_id
  left join public.franchises franchise on franchise.id = pms.franchise_id
  left join public.franchises team_a on team_a.id = cm.team_a_franchise_id
  left join public.franchises team_b on team_b.id = cm.team_b_franchise_id
  left join public.player_match_points pmp on pmp.match_id = cm.id and pmp.player_id = cp.id and pmp.scoring_version = fl.scoring_version
  where fl.id = p_league_id
  group by cp.id, fl.scoring_version;
  return v_history;
end
$$;

alter table public.league_drafts enable row level security;
alter table public.league_draft_picks enable row level security;
alter table public.league_game_rounds enable row level security;
alter table public.league_lineups enable row level security;
alter table public.league_matchups enable row level security;
alter table public.league_round_contributions enable row level security;
alter table public.league_standings enable row level security;

create policy league_drafts_member_read on public.league_drafts for select to authenticated using (private.is_league_member(league_id));
create policy league_draft_picks_member_read on public.league_draft_picks for select to authenticated using (private.is_league_member(league_id));
create policy league_game_rounds_member_read on public.league_game_rounds for select to authenticated using (private.is_league_member(league_id));
create policy league_lineups_member_read on public.league_lineups for select to authenticated using (
  private.is_league_member(league_id) and (
    team_id in (select t.id from public.fantasy_teams t where t.league_id = league_lineups.league_id and t.manager_user_id = (select auth.uid()))
    or exists (select 1 from public.league_game_rounds gr where gr.id = league_lineups.round_id and gr.locked_at is not null)
  )
);
create policy league_matchups_member_read on public.league_matchups for select to authenticated using (private.is_league_member(league_id));
create policy league_round_contributions_member_read on public.league_round_contributions for select to authenticated using (private.is_league_member(league_id));
create policy league_standings_member_read on public.league_standings for select to authenticated using (private.is_league_member(league_id));

revoke all on table public.league_drafts, public.league_draft_picks, public.league_game_rounds,
  public.league_lineups, public.league_matchups, public.league_round_contributions, public.league_standings
  from public, anon, authenticated;
grant select on table public.league_drafts, public.league_draft_picks, public.league_game_rounds,
  public.league_lineups, public.league_matchups, public.league_round_contributions, public.league_standings
  to authenticated;
revoke all on function private.can_complete_draft(uuid, uuid, uuid),
  private.default_lineup_slots(uuid, uuid), private.populate_round_lineups(uuid, uuid, integer),
  private.score_locked_round(uuid, uuid), private.refresh_standings(uuid, boolean),
  private.create_league_schedule(uuid), private.apply_draft_pick(uuid, uuid, integer, boolean, uuid)
  from public, anon, authenticated;
revoke all on function public.start_draft(uuid, integer), public.make_draft_pick(uuid, uuid, integer),
  public.draft_tick(uuid), public.save_lineup(uuid, uuid, jsonb), public.replay_round(uuid, uuid),
  public.recalculate_league(uuid), public.get_league_game(uuid), public.get_player_history(uuid, uuid)
  from public, anon;
grant execute on function public.start_draft(uuid, integer), public.make_draft_pick(uuid, uuid, integer),
  public.draft_tick(uuid), public.save_lineup(uuid, uuid, jsonb), public.replay_round(uuid, uuid),
  public.recalculate_league(uuid), public.get_league_game(uuid), public.get_player_history(uuid, uuid)
  to authenticated;
revoke all on function public.create_league(text, text, uuid) from public, anon;
grant execute on function public.create_league(text, text, uuid) to authenticated;
