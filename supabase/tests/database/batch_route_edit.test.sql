begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'batch-edit-test@example.invalid', now(), now());

insert into private.staff_members (user_id)
values ('20000000-0000-0000-0000-000000000001');

select has_function(
  'public',
  'batch_update_routes',
  array['uuid[]', 'text[]', 'text', 'text'],
  'batch edit RPC exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.batch_update_routes(uuid[],text[],text,text)',
    'execute'
  ),
  'authenticated can execute the batch edit RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.batch_update_routes(uuid[],text[],text,text)',
    'execute'
  ),
  'anon cannot execute the batch edit RPC'
);

insert into public.redirect_routes (
  id, owner_id, slug, business_name, destination_url, locked
)
values
  (
    '20000000-0000-0000-0000-000000000011',
    '20000000-0000-0000-0000-000000000001',
    'BatchEdit-A',
    'Zulu route',
    'https://g.page/r/old-a/review',
    false
  ),
  (
    '20000000-0000-0000-0000-000000000012',
    '20000000-0000-0000-0000-000000000001',
    'BatchEdit-B',
    'Alpha route',
    'https://g.page/r/old-b/review',
    false
  ),
  (
    '20000000-0000-0000-0000-000000000013',
    '20000000-0000-0000-0000-000000000001',
    'BatchEdit-C',
    'Locked route',
    'https://g.page/r/old-c/review',
    true
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}',
  true
);

select lives_ok(
  $$
    select public.batch_update_routes(
      array[
        '20000000-0000-0000-0000-000000000011'::uuid,
        '20000000-0000-0000-0000-000000000012'::uuid
      ],
      array['restaurant-1', 'restaurant-2']::text[],
      'https://g.page/r/new-destination/review',
      'https://maps.app.goo.gl/new-place'
    )
  $$,
  'unlocked routes update together'
);
select is(
  (
    select count(*)
    from public.redirect_routes
    where business_name in ('restaurant-1', 'restaurant-2')
  ),
  2::bigint,
  'each selected route receives its generated name'
);
select is(
  (
    select count(*)
    from public.redirect_routes
    where destination_url = 'https://g.page/r/new-destination/review'
  ),
  2::bigint,
  'each selected route receives the shared destination'
);
select is(
  (
    select count(*)
    from public.redirect_routes
    where maps_url = 'https://maps.app.goo.gl/new-place'
  ),
  2::bigint,
  'the optional Maps source is copied to selected routes'
);
select is(
  (
    select string_agg(slug, ',' order by slug)
    from public.redirect_routes
    where id in (
      '20000000-0000-0000-0000-000000000011'::uuid,
      '20000000-0000-0000-0000-000000000012'::uuid
    )
  ),
  'BatchEdit-A,BatchEdit-B',
  'printed slugs remain unchanged'
);

select throws_ok(
  $$
    select public.batch_update_routes(
      array['20000000-0000-0000-0000-000000000013'::uuid],
      array['should-not-save']::text[],
      'https://g.page/r/locked-attempt/review',
      null
    )
  $$,
  '55000',
  'Unlock selected routes before batch editing them',
  'locked routes cannot be batch edited'
);
select throws_ok(
  $$
    select public.batch_update_routes(
      array[
        '20000000-0000-0000-0000-000000000011'::uuid,
        '20000000-0000-0000-0000-000000000012'::uuid
      ],
      array['failed-1', 'failed-2']::text[],
      'https://example.com/not-a-review-link',
      null
    )
  $$,
  '23514',
  'destination_url must be an approved Google review URL',
  'invalid destinations fail the whole batch'
);
select is(
  (
    select count(*)
    from public.redirect_routes
    where business_name in ('restaurant-1', 'restaurant-2')
  ),
  2::bigint,
  'a failed batch leaves previous names intact'
);
select throws_ok(
  $$
    select public.batch_update_routes(
      array['20000000-0000-0000-0000-000000000011'::uuid,
            '20000000-0000-0000-0000-000000000011'::uuid],
      array['duplicate-1', 'duplicate-2']::text[],
      'https://g.page/r/duplicate/review',
      null
    )
  $$,
  '22023',
  'Route ids must be unique',
  'duplicate route ids are rejected'
);

select * from finish();
rollback;
