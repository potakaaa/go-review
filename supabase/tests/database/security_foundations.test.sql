begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(21);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'staff-test@example.invalid', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'outsider-test@example.invalid', now(), now());

insert into private.staff_members (user_id)
values ('10000000-0000-0000-0000-000000000001');

select has_table('private', 'staff_members', 'staff allowlist exists');
select has_table('private', 'route_audit_events', 'private audit log exists');
select has_function('public', 'resolve_redirect', array['text'], 'public redirect RPC exists');
select has_function('public', 'is_active_staff', array[]::text[], 'staff-check RPC exists');

select ok(
  has_function_privilege('anon', 'public.resolve_redirect(text)', 'execute'),
  'anon can execute only the redirect resolver'
);
select ok(
  not has_function_privilege('authenticated', 'public.resolve_redirect(text)', 'execute'),
  'authenticated cannot execute the public resolver'
);
select ok(
  not has_table_privilege('anon', 'public.redirect_routes', 'select'),
  'anon cannot enumerate routes'
);
select ok(
  has_table_privilege('authenticated', 'public.redirect_routes', 'select'),
  'authenticated receives RLS-filtered reads'
);
select ok(
  not has_column_privilege('authenticated', 'public.redirect_routes', 'scan_count', 'update'),
  'staff cannot directly change scan counters'
);
select ok(
  not has_table_privilege('authenticated', 'public.redirect_routes', 'delete'),
  'staff cannot delete permanent routes'
);

select lives_ok(
  $$
    insert into public.redirect_routes (
      owner_id, slug, business_name, destination_url
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'SecTest-20260907-G1',
      'Google route',
      'https://g.page/r/example/review'
    )
  $$,
  'Google review destinations are accepted'
);
select throws_ok(
  $$
    insert into public.redirect_routes (
      owner_id, slug, business_name, destination_url
    ) values (
      '10000000-0000-0000-0000-000000000001',
      'SecTest-20260907-P1',
      'Blocked route',
      'https://google.com.attacker.invalid/maps/place/example'
    )
  $$,
  '23514',
  'destination_url must be an approved Google review URL',
  'lookalike Google destinations are rejected in Postgres'
);

-- Reproduce a route created before Google-only enforcement. Trigger execution
-- is disabled only for this fixture insert; application updates use it normally.
set local session_replication_role = replica;
insert into public.redirect_routes (
  owner_id, slug, business_name, destination_url
) values (
  '10000000-0000-0000-0000-000000000001',
  'SecTest-20260907-L1',
  'Legacy route',
  'https://fast.com'
);
set local session_replication_role = origin;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}',
  true
);
select is((select count(*) from public.redirect_routes), 0::bigint, 'AAL1 cannot read routes');

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);
select is(public.is_active_staff(), true, 'approved caller is recognised as staff');
select is(
  (
    select count(*)
    from public.redirect_routes
    where slug in ('SecTest-20260907-G1', 'SecTest-20260907-L1')
  ),
  2::bigint,
  'AAL2 staff can read shared routes'
);
select lives_ok(
  $$
    update public.redirect_routes
    set business_name = 'Updated Google route',
        destination_url = 'https://g.page/r/example/review'
    where slug = 'SecTest-20260907-G1'
  $$,
  'authenticated staff can edit a Google route'
);
select lives_ok(
  $$
    update public.redirect_routes
    set business_name = 'Updated legacy route',
        destination_url = 'https://fast.com'
    where slug = 'SecTest-20260907-L1'
  $$,
  'authenticated staff can edit a legacy route without changing its destination'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}',
  true
);
select is(public.is_active_staff(), false, 'unapproved caller is not staff');
select is((select count(*) from public.redirect_routes), 0::bigint, 'unapproved AAL2 caller sees no routes');

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select results_eq(
  $$ select route_state from public.resolve_redirect('SecTest-20260907-G1') $$,
  $$ values ('active'::text) $$,
  'anon resolves one exact active slug'
);
reset role;

select is(
  (
    select scan_count
    from public.redirect_routes
    where slug = 'SecTest-20260907-G1'
  ),
  1,
  'the resolver atomically increments the aggregate scan count'
);

select * from finish();
rollback;
