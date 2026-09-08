begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rbac-owner@example.invalid', now(), now()),
  ('20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'rbac-viewer@example.invalid', now(), now()),
  ('20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'rbac-outsider@example.invalid', now(), now());

insert into private.staff_members (user_id, role)
values
  ('20000000-0000-0000-0000-000000000001', 'superadmin'),
  ('20000000-0000-0000-0000-000000000002', 'admin'),
  ('20000000-0000-0000-0000-000000000003', 'admin');

insert into private.staff_section_permissions (user_id, section, can_view, can_manage)
values
  ('20000000-0000-0000-0000-000000000002', 'routes', true, true),
  ('20000000-0000-0000-0000-000000000002', 'analytics', true, false);

select has_table('private', 'staff_section_permissions', 'section permission table exists');
select has_table('private', 'staff_route_access', 'route assignment table exists');
select has_function('public', 'admin_update_staff', array['uuid', 'text', 'boolean', 'jsonb', 'jsonb'], 'staff update RPC exists');
select ok(
  not has_function_privilege('anon', 'public.admin_list_staff()', 'execute'),
  'anonymous callers cannot execute staff listing'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select lives_ok(
  $$
    insert into public.redirect_routes (
      owner_id, slug, business_name, destination_url, publication_status, active
    ) values (
      '20000000-0000-0000-0000-000000000001',
      'Rbac-Shared-20260908',
      'RBAC shared route',
      'https://g.page/r/rbac/review',
      'published',
      true
    )
  $$,
  'superadmin can create a published route'
);
reset role;

insert into private.staff_route_access (user_id, route_id, access_level, created_by)
select
  '20000000-0000-0000-0000-000000000002',
  id,
  'view',
  '20000000-0000-0000-0000-000000000001'
from public.redirect_routes
where slug = 'Rbac-Shared-20260908';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug = 'Rbac-Shared-20260908'),
  1::bigint,
  'superadmin can read all routes'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug = 'Rbac-Shared-20260908'),
  1::bigint,
  'assigned admin can read a shared route'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.redirect_routes where slug = 'Rbac-Shared-20260908'),
  0::bigint,
  'unassigned admin cannot read another admin route'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
with changed as (
  update public.redirect_routes
  set business_name = 'Should remain unchanged'
  where slug = 'Rbac-Shared-20260908'
  returning id
)
select is(
  (select count(*) from changed),
  0::bigint,
  'view-only route assignment cannot update a route'
);

select lives_ok(
  $$
    insert into public.redirect_routes (
      owner_id, slug, business_name, destination_url, publication_status, active
    ) values (
      '20000000-0000-0000-0000-000000000002',
      'Rbac-Draft-20260908',
      'RBAC draft route',
      'https://g.page/r/rbac-draft/review',
      'published',
      true
    )
  $$,
  'regular admin can create a route when route management is granted'
);
select is(
  (select publication_status from public.redirect_routes where slug = 'Rbac-Draft-20260908'),
  'draft'::text,
  'regular admin inserts are forced to draft'
);
select is(
  (select active from public.redirect_routes where slug = 'Rbac-Draft-20260908'),
  false,
  'regular admin inserts are forced inactive'
);
select throws_ok(
  $$
    update public.redirect_routes
    set publication_status = 'published', active = true
    where slug = 'Rbac-Draft-20260908'
  $$,
  '42501',
  'Only a superadmin can publish a draft route',
  'regular admin cannot publish a draft route'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select lives_ok(
  $$
    update public.redirect_routes
    set publication_status = 'published', active = true
    where slug = 'Rbac-Draft-20260908'
  $$,
  'superadmin can publish a draft route'
);
select is(
  (select publication_status from public.redirect_routes where slug = 'Rbac-Draft-20260908'),
  'published'::text,
  'published route status is stored'
);
select lives_ok(
  $$
    insert into public.redirect_routes (
      owner_id, slug, business_name, destination_url, publication_status, active
    ) values (
      '20000000-0000-0000-0000-000000000001',
      'Rbac-Super-Draft-20260908',
      'RBAC superadmin draft',
      'https://g.page/r/rbac-super-draft/review',
      'draft',
      true
    )
  $$,
  'draft routes cannot be active even for a superadmin insert'
);
select is(
  (select active from public.redirect_routes where slug = 'Rbac-Super-Draft-20260908'),
  false,
  'draft route active state is forced off'
);

reset role;
update private.staff_members
set must_change_password = true
where user_id = '20000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1"}',
  true
);
select is(public.is_password_change_required(), true, 'temporary-password state is visible before MFA');
select throws_ok(
  $$select public.complete_password_change('20000000-0000-0000-0000-000000000002'::uuid)$$,
  '42501',
  NULL,
  'authenticated callers cannot clear temporary-password state directly'
);
set local role service_role;
select is(
  public.complete_password_change('20000000-0000-0000-0000-000000000002'::uuid),
  true,
  'server-only password flow can clear temporary-password state'
);
set local role authenticated;
select is(public.is_password_change_required(), false, 'temporary-password state is cleared');

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.shop_stories),
  0::bigint,
  'admin without stories permission cannot read story records'
);

reset role;
update private.staff_route_access
set access_level = 'manage'
where user_id = '20000000-0000-0000-0000-000000000002'
  and route_id = (select id from public.redirect_routes where slug = 'Rbac-Shared-20260908');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
with changed as (
  update public.redirect_routes
  set business_name = 'Managed by assigned admin'
  where slug = 'Rbac-Shared-20260908'
  returning id
)
select is(
  (select count(*) from changed),
  1::bigint,
  'manage route assignment can update a route'
);

reset role;
update private.staff_members
set active = false
where user_id = '20000000-0000-0000-0000-000000000002';

set local role authenticated;
select is(
  (select count(*) from public.redirect_routes where slug = 'Rbac-Shared-20260908'),
  0::bigint,
  'suspended admins lose route access immediately'
);

select * from finish();
rollback;
