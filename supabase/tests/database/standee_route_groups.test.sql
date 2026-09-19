begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'standee-test@example.invalid', now(), now());

insert into private.staff_members (user_id, role)
values ('30000000-0000-0000-0000-000000000001', 'superadmin');

select has_column('public', 'redirect_routes', 'standee_key', 'standee_key exists');
select has_column('public', 'redirect_routes', 'standee_position', 'standee_position exists');

-- Which stand a QR belongs to is decided at print time and never reassigned.
select ok(
  has_column_privilege('authenticated', 'public.redirect_routes', 'standee_key', 'insert'),
  'authenticated can set standee_key on insert'
);
select ok(
  not has_column_privilege('authenticated', 'public.redirect_routes', 'standee_key', 'update'),
  'authenticated cannot move a QR to another stand'
);

-- A complete two-slot stand.
insert into public.redirect_routes (
  owner_id, slug, standee_key, standee_position, business_name, platform, destination_url
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Standee-1',
    'Kx9mQ2t',
    1,
    'Bella''s Cafe',
    'facebook',
    'https://www.facebook.com/bellascafe'
  ),
  (
    '30000000-0000-0000-0000-000000000001',
    'Standee-2',
    'Kx9mQ2t',
    2,
    'Bella''s Cafe',
    'google',
    'https://g.page/r/standee-test/review'
  );

select is(
  (select count(*)::int from public.redirect_routes where standee_key = 'Kx9mQ2t'),
  2,
  'both QRs on the stand were stored'
);

select throws_ok(
  $$insert into public.redirect_routes (
      owner_id, slug, standee_key, standee_position, business_name, platform, destination_url
    ) values (
      '30000000-0000-0000-0000-000000000001', 'Standee-dup', 'Kx9mQ2t', 1,
      'Bella''s Cafe', 'instagram', 'https://www.instagram.com/bellascafe/'
    )$$,
  23505,
  null,
  'one QR per slot on a stand'
);

select throws_ok(
  $$insert into public.redirect_routes (
      owner_id, slug, standee_key, standee_position, business_name, platform, destination_url
    ) values (
      '30000000-0000-0000-0000-000000000001', 'Standee-5', 'Kx9mQ2t', 5,
      'Bella''s Cafe', 'google', 'https://g.page/r/standee-test-5/review'
    )$$,
  23514,
  null,
  'a stand holds at most four QR codes'
);

select throws_ok(
  $$insert into public.redirect_routes (
      owner_id, slug, standee_key, standee_position, business_name, platform, destination_url
    ) values (
      '30000000-0000-0000-0000-000000000001', 'Standee-half', 'Qw4rT7y', null,
      'Bella''s Cafe', 'google', 'https://g.page/r/standee-test-6/review'
    )$$,
  23514,
  null,
  'a stand key without a slot is rejected'
);

select throws_ok(
  $$insert into public.redirect_routes (
      owner_id, slug, standee_key, standee_position, business_name, platform, destination_url
    ) values (
      '30000000-0000-0000-0000-000000000001', 'Standee-bad', 'short', 1,
      'Bella''s Cafe', 'google', 'https://g.page/r/standee-test-7/review'
    )$$,
  23514,
  null,
  'a stand key must be seven readable characters'
);

select * from finish();
rollback;
