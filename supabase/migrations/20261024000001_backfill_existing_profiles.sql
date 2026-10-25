insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(left(btrim(u.raw_user_meta_data ->> 'display_name'), 40), ''),
    nullif(left(split_part(u.email, '@', 1), 40), ''),
    'Manager'
  )
from auth.users as u
on conflict (id) do nothing;
