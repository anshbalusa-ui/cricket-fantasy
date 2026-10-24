create extension if not exists pgcrypto with schema extensions;

create type public.season_status as enum ('upcoming', 'active', 'completed');
create type public.league_status as enum ('lobby', 'drafting', 'active', 'completed');
create type public.league_member_role as enum ('commissioner', 'manager');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now()
);
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  format text not null
);
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id),
  year integer not null,
  name text not null,
  status public.season_status not null default 'upcoming',
  start_at date,
  end_at date,
  unique (competition_id, year),
  check (end_at is null or start_at is null or end_at >= start_at)
);
create table public.fantasy_leagues (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  commissioner_user_id uuid not null references public.profiles(id),
  capacity smallint not null default 6 check (capacity between 2 and 20),
  status public.league_status not null default 'lobby',
  settings_version integer not null default 1 check (settings_version > 0),
  scoring_version text not null default 'mlc-v0.1',
  created_at timestamptz not null default now()
);
create table public.league_memberships (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.league_member_role not null,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);
create table public.fantasy_teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  manager_user_id uuid not null references public.profiles(id),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (league_id, manager_user_id),
  foreign key (league_id, manager_user_id)
    references public.league_memberships(league_id, user_id) on delete cascade
);
create table public.league_invitations (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.fantasy_leagues(id) on delete cascade,
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index fantasy_leagues_season_idx on public.fantasy_leagues(season_id);
create index fantasy_leagues_commissioner_idx on public.fantasy_leagues(commissioner_user_id);
create index league_memberships_user_idx on public.league_memberships(user_id, league_id);
create unique index league_memberships_one_commissioner_idx on public.league_memberships(league_id) where role = 'commissioner';
create index fantasy_teams_manager_idx on public.fantasy_teams(manager_user_id);
create index league_invitations_league_idx on public.league_invitations(league_id);
create index league_invitations_created_by_idx on public.league_invitations(created_by);

create schema private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

insert into public.competitions (slug, name, format) values ('mlc', 'Major League Cricket', 'T20');
insert into public.seasons (competition_id, year, name, status)
select id, 2026, 'MLC 2026', 'completed' from public.competitions where slug = 'mlc';

create function public.initialize_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'display_name'), 40), ''), nullif(left(split_part(new.email, '@', 1), 40), ''), 'Manager'));
  return new;
end;
$$;
create trigger initialize_profile_after_signup
  after insert on auth.users
  for each row execute function public.initialize_profile();
revoke all on function public.initialize_profile() from public, anon, authenticated;

create function private.is_league_member(p_league_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.league_memberships m where m.league_id = p_league_id and m.user_id = (select auth.uid())); $$;
create function private.is_league_commissioner(p_league_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.league_memberships m where m.league_id = p_league_id and m.user_id = (select auth.uid()) and m.role = 'commissioner'); $$;

alter table public.profiles enable row level security;
alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.fantasy_leagues enable row level security;
alter table public.league_memberships enable row level security;
alter table public.fantasy_teams enable row level security;
alter table public.league_invitations enable row level security;

create policy profiles_read_self_or_cocomember on public.profiles for select to authenticated
  using (id = (select auth.uid()) or exists (
    select 1 from public.league_memberships mine join public.league_memberships theirs using (league_id)
    where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
  ));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy competitions_read_authenticated on public.competitions for select to authenticated using (true);
create policy seasons_read_authenticated on public.seasons for select to authenticated using (true);
create policy leagues_member_read on public.fantasy_leagues for select to authenticated using (private.is_league_member(id));
create policy memberships_cocommember_read on public.league_memberships for select to authenticated using (private.is_league_member(league_id));
create policy teams_cocommember_read on public.fantasy_teams for select to authenticated using (private.is_league_member(league_id));
create policy invitations_commissioner_read on public.league_invitations for select to authenticated using (private.is_league_commissioner(league_id));

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.competitions, public.seasons, public.fantasy_leagues, public.league_memberships, public.fantasy_teams, public.league_invitations to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke all on function private.is_league_member(uuid), private.is_league_commissioner(uuid) from public, anon;
grant execute on function private.is_league_member(uuid), private.is_league_commissioner(uuid) to authenticated;

create function public.create_league(p_name text, p_team_name text, p_season_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60 or p_team_name is null or char_length(btrim(p_team_name)) not between 1 and 40 then raise exception 'Invalid league details'; end if;
  if not exists (select 1 from public.seasons where id = p_season_id) then raise exception 'Invalid season'; end if;
  insert into public.fantasy_leagues(season_id, name, commissioner_user_id) values(p_season_id, btrim(p_name), v_user) returning id into v_id;
  insert into public.league_memberships(league_id,user_id,role) values(v_id,v_user,'commissioner');
  insert into public.fantasy_teams(league_id,manager_user_id,name) values(v_id,v_user,btrim(p_team_name));
  return v_id;
end; $$;

create function public.join_league(p_token text, p_team_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_league uuid; v_capacity int; v_status public.league_status;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_team_name is null or char_length(btrim(p_team_name)) not between 1 and 40 then raise exception 'Invalid team name'; end if;
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'Invalid invitation'; end if;
  select league_id into v_league from public.league_invitations where token_hash = extensions.digest(p_token, 'sha256') and revoked_at is null and expires_at > clock_timestamp();
  if v_league is null then raise exception 'Invalid invitation'; end if;
  perform 1 from public.fantasy_leagues where id = v_league for update;
  if not exists (select 1 from public.league_invitations where league_id = v_league and token_hash = extensions.digest(p_token, 'sha256') and revoked_at is null and expires_at > clock_timestamp()) then raise exception 'Invalid invitation'; end if;
  select capacity,status into v_capacity,v_status from public.fantasy_leagues where id = v_league;
  if exists (select 1 from public.league_memberships where league_id = v_league and user_id = v_user) then raise exception 'Already a member'; end if;
  if v_status <> 'lobby' then raise exception 'League is not in lobby'; end if;
  if (select count(*) from public.league_memberships where league_id = v_league) >= v_capacity then raise exception 'League full'; end if;
  insert into public.league_memberships(league_id,user_id,role) values(v_league,v_user,'manager');
  insert into public.fantasy_teams(league_id,manager_user_id,name) values(v_league,v_user,btrim(p_team_name));
  return v_league;
end; $$;

create function public.create_invitation(p_league_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_token text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform 1 from public.fantasy_leagues where id = p_league_id for update;
  if not found or not exists(select 1 from public.league_memberships where league_id=p_league_id and user_id=v_user and role='commissioner') then raise exception 'Commissioner required'; end if;
  if not exists(select 1 from public.fantasy_leagues where id=p_league_id and status='lobby') then raise exception 'League is not in lobby'; end if;
  update public.league_invitations set revoked_at=clock_timestamp() where league_id=p_league_id and revoked_at is null;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.league_invitations(league_id,token_hash,created_by,expires_at) values(p_league_id,extensions.digest(v_token,'sha256'),v_user,clock_timestamp()+interval '7 days');
  return v_token;
end; $$;

create function public.revoke_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_league uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select league_id into v_league from public.league_invitations where id=p_invitation_id;
  if v_league is null then raise exception 'Invalid invitation'; end if;
  perform 1 from public.fantasy_leagues where id=v_league for update;
  if not exists(select 1 from public.league_memberships where league_id=v_league and user_id=v_user and role='commissioner') then raise exception 'Commissioner required'; end if;
  update public.league_invitations set revoked_at=coalesce(revoked_at,now()) where id=p_invitation_id;
end; $$;

create function public.rename_team(p_league_id uuid,p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 40 then raise exception 'Invalid team name'; end if;
  if not exists(select 1 from public.league_memberships where league_id=p_league_id and user_id=auth.uid()) then raise exception 'Membership required'; end if;
  update public.fantasy_teams set name=btrim(p_name) where league_id=p_league_id and manager_user_id=auth.uid();
end; $$;

create function public.rename_league(p_league_id uuid,p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60 then raise exception 'Invalid league name'; end if;
  perform 1 from public.fantasy_leagues where id=p_league_id for update;
  if not exists(select 1 from public.league_memberships where league_id=p_league_id and user_id=auth.uid() and role='commissioner') then raise exception 'Commissioner required'; end if;
  if not exists(select 1 from public.fantasy_leagues where id=p_league_id and status='lobby') then raise exception 'League is not in lobby'; end if;
  update public.fantasy_leagues set name=btrim(p_name) where id=p_league_id;
end; $$;

create function public.leave_league(p_league_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_role public.league_member_role;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  perform 1 from public.fantasy_leagues where id=p_league_id for update;
  if not found then raise exception 'League is not in lobby'; end if;
  select role into v_role from public.league_memberships where league_id=p_league_id and user_id=v_user;
  if v_role is null then raise exception 'Membership required'; end if;
  if v_role='commissioner' then raise exception 'Commissioner cannot leave'; end if;
  if not exists(select 1 from public.fantasy_leagues where id=p_league_id and status='lobby') then raise exception 'League is not in lobby'; end if;
  delete from public.league_memberships where league_id=p_league_id and user_id=v_user;
end; $$;

revoke all on function public.create_league(text,text,uuid), public.join_league(text,text), public.create_invitation(uuid), public.revoke_invitation(uuid), public.rename_team(uuid,text), public.rename_league(uuid,text), public.leave_league(uuid) from public, anon;
grant execute on function public.create_league(text,text,uuid), public.join_league(text,text), public.create_invitation(uuid), public.revoke_invitation(uuid), public.rename_team(uuid,text), public.rename_league(uuid,text), public.leave_league(uuid) to authenticated;
