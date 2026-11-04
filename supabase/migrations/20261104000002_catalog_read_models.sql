-- Cricket facts only: invoker permissions and the underlying catalog RLS remain authoritative.
create view public.season_player_summaries
with (security_invoker = true)
as
select
  sp.season_id,
  p.id as player_id,
  p.name,
  p.role,
  p.role_source,
  f.id as franchise_id,
  f.name as franchise_name,
  f.code as franchise_code,
  count(s.match_id)::integer as appearances,
  count(mp.match_id)::integer as scored_appearances,
  coalesce(sum((s.stats ->> 'runs')::integer), 0)::integer as runs,
  coalesce(sum((s.stats ->> 'wickets')::integer), 0)::integer as wickets,
  coalesce(sum(mp.total_points), 0) as total_points,
  'mlc-v0.1'::text as scoring_version
from public.season_players sp
join public.cricket_players p on p.id = sp.player_id
join public.franchises f on f.id = sp.franchise_id
left join (
  public.player_match_stats s
  join public.cricket_matches m on m.id = s.match_id
) on s.player_id = sp.player_id and m.season_id = sp.season_id
left join public.player_match_points mp
  on mp.match_id = s.match_id and mp.player_id = s.player_id
  and mp.scoring_version = 'mlc-v0.1'
group by sp.season_id, p.id, p.name, p.role, p.role_source, f.id, f.name, f.code;

revoke all on public.season_player_summaries from public, anon;
grant select on public.season_player_summaries to authenticated;
