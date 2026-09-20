begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'blanket-super@example.invalid', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'blanket-admin@example.invalid', now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'listed-admin@example.invalid', now(), now());

insert into private.staff_members (user_id, role)
values
  ('30000000-0000-0000-0000-000000000001', 'superadmin'),
  ('30000000-0000-0000-0000-000000000002', 'admin'),
  ('30000000-0000-0000-0000-000000000003', 'admin');

insert into private.staff_section_permissions (user_id, section, can_view, can_manage)
values
  ('30000000-0000-0000-0000-000000000002', 'routes', true, true),
  ('30000000-0000-0000-0000-000000000003', 'routes', true, true);

-- Shape ---------------------------------------------------------------------

select has_column(
  'private', 'staff_members', 'all_routes_access',
  'staff members carry a blanket route-access level'
);
select has_function(
  'public', 'admin_register_staff',
  array['uuid', 'text', 'jsonb', 'jsonb', 'text'],
  'staff registration RPC accepts a blanket level'
);
select has_function(
  'public', 'admin_update_staff',
  array['uuid', 'text', 'boolean', 'jsonb', 'jsonb', 'text'],
  'staff update RPC accepts a blanket level'
);
select hasnt_function(
  'public', 'admin_update_staff',
  array['uuid', 'text', 'boolean', 'jsonb', 'jsonb'],
  'the earlier update signature is gone, so the RPC call stays unambiguous'
);
select has_function(
  'public', 'admin_list_all_route_access', array[]::text[],
  'the picker can read every grant in one call'
);
select ok(
  not has_function_privilege('anon', 'public.admin_list_all_route_access()', 'execute'),
  'anonymous callers cannot read staff route grants'
);

-- Blanket access -------------------------------------------------------------

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select lives_ok(
  $$
    insert into public.redirect_routes (
      owner_id, slug, business_name, destination_url, publication_status, active
    ) values (
      '30000000-0000-0000-0000-000000000001',
      'Blanket-One-20260920',
      'blanket-cafe-one',
      'https://g.page/r/blanket-one/review',
      'published',
      true
    )
  $$,
  'superadmin can create the first route'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug = 'Blanket-One-20260920'),
  0::bigint,
  'an admin with neither a grant nor a blanket level sees nothing'
);

reset role;
update private.staff_members
set all_routes_access = 'view'
where user_id = '30000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug = 'Blanket-One-20260920'),
  1::bigint,
  'blanket view reaches a route with no explicit grant'
);
with changed as (
  update public.redirect_routes
  set business_name = 'should remain unchanged'
  where slug = 'Blanket-One-20260920'
  returning id
)
select is(
  (select count(*) from changed),
  0::bigint,
  'blanket view cannot update a route'
);

reset role;
update private.staff_members
set all_routes_access = 'manage'
where user_id = '30000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
with changed as (
  update public.redirect_routes
  set business_name = 'blanket-cafe-one renamed'
  where slug = 'Blanket-One-20260920'
  returning id
)
select is(
  (select count(*) from changed),
  1::bigint,
  'blanket manage can update a route'
);

-- The point of the whole feature: a route created afterwards needs no revisit.
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
insert into public.redirect_routes (
  owner_id, slug, business_name, destination_url, publication_status, active
) values (
  '30000000-0000-0000-0000-000000000001',
  'Blanket-Two-20260920',
  'blanket-cafe-two',
  'https://g.page/r/blanket-two/review',
  'published',
  true
);

select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug like 'Blanket-%-20260920'),
  2::bigint,
  'blanket access covers a route created after it was granted'
);

-- Writes through the superadmin RPC ------------------------------------------

reset role;
insert into private.staff_route_access (user_id, route_id, access_level, created_by)
select
  '30000000-0000-0000-0000-000000000003',
  id,
  'manage',
  '30000000-0000-0000-0000-000000000001'
from public.redirect_routes
where slug = 'Blanket-One-20260920';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  public.admin_update_staff(
    '30000000-0000-0000-0000-000000000003'::uuid,
    'admin', true,
    '[{"section":"routes","can_view":true,"can_manage":true}]'::jsonb,
    '[]'::jsonb,
    'manage'
  ),
  true,
  'a superadmin can switch an account to blanket access'
);

-- private.* is readable only outside the authenticated role.
reset role;
select is(
  (select all_routes_access from private.staff_members
   where user_id = '30000000-0000-0000-0000-000000000003'),
  'manage'::text,
  'the blanket level is stored'
);
select is(
  (select count(*) from private.staff_route_access
   where user_id = '30000000-0000-0000-0000-000000000003'),
  0::bigint,
  'blanket access clears the per-route list, leaving one source of truth'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  public.admin_update_staff(
    '30000000-0000-0000-0000-000000000003'::uuid,
    'admin', true,
    '[{"section":"routes","can_view":true,"can_manage":true}]'::jsonb,
    (select jsonb_build_array(
       jsonb_build_object('route_id', id, 'access_level', 'view')
     )
     from public.redirect_routes where slug = 'Blanket-One-20260920'),
    null
  ),
  true,
  'a superadmin can switch the account back to an explicit list'
);

reset role;
select is(
  (select all_routes_access from private.staff_members
   where user_id = '30000000-0000-0000-0000-000000000003'),
  null::text,
  'clearing the blanket level restores per-route grants'
);
select is(
  (select count(*) from private.staff_route_access
   where user_id = '30000000-0000-0000-0000-000000000003'),
  1::bigint,
  'the explicit grant from the payload is stored'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  public.admin_update_staff(
    '30000000-0000-0000-0000-000000000003'::uuid,
    'superadmin', true,
    '[]'::jsonb,
    '[]'::jsonb,
    'manage'
  ),
  true,
  'a superadmin can promote an account'
);

reset role;
select is(
  (select all_routes_access from private.staff_members
   where user_id = '30000000-0000-0000-0000-000000000003'),
  null::text,
  'a superadmin stores no blanket level, since the role already covers every route'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select throws_ok(
  $$
    select public.admin_update_staff(
      '30000000-0000-0000-0000-000000000002'::uuid,
      'admin', true,
      '[{"section":"routes","can_view":true,"can_manage":true}]'::jsonb,
      '[]'::jsonb,
      'owner'
    )
  $$,
  '22023',
  'Invalid blanket route access',
  'an unknown blanket level is rejected'
);

-- Suspension ------------------------------------------------------------------

reset role;
update private.staff_members
set active = false
where user_id = '30000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug like 'Blanket-%-20260920'),
  0::bigint,
  'suspending an account withdraws blanket access immediately'
);

select * from finish();
rollback;
