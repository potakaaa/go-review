begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

-- The set-based route policies must grant exactly what the per-row
-- private.can_view_route / private.can_manage_route functions grant, for every
-- kind of staff account. Each persona compares the two across every route.

select plan(24);

insert into auth.users (id, aud, role, email, created_at, updated_at)
select ('40000000-0000-0000-0000-00000000000' || n)::uuid, 'authenticated', 'authenticated',
  'fast-rls-' || n || '@example.invalid', now(), now()
from generate_series(1, 8) n;

insert into private.staff_members (user_id, role, active, all_routes_access)
values
  ('40000000-0000-0000-0000-000000000001', 'superadmin', true, null),   -- superadmin
  ('40000000-0000-0000-0000-000000000002', 'admin', true, 'view'),      -- blanket view
  ('40000000-0000-0000-0000-000000000003', 'admin', true, 'manage'),    -- blanket manage
  ('40000000-0000-0000-0000-000000000004', 'admin', true, null),        -- per-route grants
  ('40000000-0000-0000-0000-000000000005', 'admin', true, null),        -- analytics only
  ('40000000-0000-0000-0000-000000000006', 'admin', true, null),        -- no sections
  ('40000000-0000-0000-0000-000000000007', 'admin', false, 'manage'),   -- deactivated
  ('40000000-0000-0000-0000-000000000008', 'admin', true, null);        -- routes view only

insert into private.staff_section_permissions (user_id, section, can_view, can_manage)
values
  ('40000000-0000-0000-0000-000000000002', 'routes', true, true),
  ('40000000-0000-0000-0000-000000000003', 'routes', true, true),
  ('40000000-0000-0000-0000-000000000004', 'routes', true, true),
  ('40000000-0000-0000-0000-000000000005', 'analytics', true, false),
  ('40000000-0000-0000-0000-000000000007', 'routes', true, true),
  ('40000000-0000-0000-0000-000000000008', 'routes', true, false);

insert into public.redirect_routes (id, owner_id, slug, business_name, destination_url, publication_status, active)
values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'fast-rls-a', 'Fast RLS A', 'https://g.page/r/fast-rls-a/review', 'published', true),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'fast-rls-b', 'Fast RLS B', 'https://g.page/r/fast-rls-b/review', 'published', true),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'fast-rls-c', 'Fast RLS C', 'https://g.page/r/fast-rls-c/review', 'published', true);

insert into private.staff_route_access (user_id, route_id, access_level)
values
  ('40000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000002', 'manage'),
  ('40000000-0000-0000-0000-000000000004', '41000000-0000-0000-0000-000000000001', 'view'),
  ('40000000-0000-0000-0000-000000000004', '41000000-0000-0000-0000-000000000002', 'manage'),
  ('40000000-0000-0000-0000-000000000005', '41000000-0000-0000-0000-000000000001', 'view'),
  ('40000000-0000-0000-0000-000000000006', '41000000-0000-0000-0000-000000000001', 'view'),
  ('40000000-0000-0000-0000-000000000008', '41000000-0000-0000-0000-000000000002', 'manage');

create temp table expected_ids (id uuid primary key) on commit drop;
create temp table actual_ids (id uuid primary key) on commit drop;
grant select, insert, delete on expected_ids, actual_ids to authenticated;

-- Compares, for one persona and JWT, the rows the policies expose (or let the
-- caller update) with the rows the reference functions allow.
create function pg_temp.check_persona(p_user uuid, p_aal text, p_label text)
returns setof text
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', p_user, 'role', 'authenticated', 'aal', p_aal)::text,
    true
  );

  -- Reference answers, computed with RLS bypassed.
  delete from expected_ids;
  insert into expected_ids select id from public.redirect_routes where private.can_view_route(id);
  set local role authenticated;
  delete from actual_ids;
  insert into actual_ids select id from public.redirect_routes;
  reset role;
  return next set_eq(
    'select id from actual_ids', 'select id from expected_ids',
    p_label || ': readable routes match can_view_route'
  );

  delete from expected_ids;
  insert into expected_ids select id from public.redirect_routes where private.can_manage_route(id);
  set local role authenticated;
  delete from actual_ids;
  with touched as (
    update public.redirect_routes set notes = notes returning id
  )
  insert into actual_ids select id from touched;
  reset role;
  return next set_eq(
    'select id from actual_ids', 'select id from expected_ids',
    p_label || ': updatable routes match can_manage_route'
  );
end;
$$;

select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000001', 'aal2', 'superadmin');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000002', 'aal2', 'blanket view');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000003', 'aal2', 'blanket manage');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000004', 'aal2', 'per-route grants');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000005', 'aal2', 'analytics only');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000006', 'aal2', 'no sections');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000007', 'aal2', 'deactivated');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000008', 'aal2', 'routes view only');
select * from pg_temp.check_persona('40000000-0000-0000-0000-000000000004', 'aal1', 'password-only session');

-- The comparisons above are only meaningful if the personas differ. Pin the
-- per-route persona's answer on the three fixture routes.
select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal2"}',
  true
);
set local role authenticated;
select results_eq(
  $$ select slug from public.redirect_routes where slug like 'fast-rls-%' order by slug $$,
  array['fast-rls-a', 'fast-rls-b'],
  'per-route persona reads only its two assigned routes'
);
delete from actual_ids;
with touched as (
  update public.redirect_routes set notes = notes
  where slug like 'fast-rls-%'
  returning id
)
insert into actual_ids select id from touched;
select results_eq(
  $$ select r.slug from actual_ids a join public.redirect_routes r using (id) order by r.slug $$,
  array['fast-rls-b'],
  'per-route persona updates only its manage grant'
);

-- One-call access state ------------------------------------------------------

select results_eq(
  $$ select role, must_change_password, jsonb_array_length(permissions) from public.get_my_staff_access() $$,
  $$ values ('admin'::text, false, 6) $$,
  'access state returns role and all six sections'
);
select is(
  (select p->>'can_manage' from public.get_my_staff_access(), jsonb_array_elements(permissions) p where p->>'section' = 'routes'),
  'true',
  'access state carries section permissions'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000004","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (select jsonb_array_length(permissions) from public.get_my_staff_access()),
  0,
  'a password-only session gets no section permissions'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"40000000-0000-0000-0000-000000000007","role":"authenticated","aal":"aal2"}',
  true
);
select is_empty(
  $$ select * from public.get_my_staff_access() $$,
  'a deactivated account has no access state'
);
reset role;

select * from finish();
rollback;
