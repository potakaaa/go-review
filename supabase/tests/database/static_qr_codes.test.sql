begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(9);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'qr-manager@example.invalid', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'qr-viewer@example.invalid', now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'qr-outsider@example.invalid', now(), now());

insert into private.staff_members (user_id, role)
values
  ('30000000-0000-0000-0000-000000000001', 'admin'),
  ('30000000-0000-0000-0000-000000000002', 'admin'),
  ('30000000-0000-0000-0000-000000000003', 'admin');

insert into private.staff_section_permissions (user_id, section, can_view, can_manage)
values
  ('30000000-0000-0000-0000-000000000001', 'routes', true, true),
  ('30000000-0000-0000-0000-000000000002', 'routes', true, false),
  ('30000000-0000-0000-0000-000000000003', 'orders', true, false);

select has_table('public', 'static_qr_codes', 'static QR table exists');
select ok(not has_table_privilege('anon', 'public.static_qr_codes', 'select'), 'anon cannot read the QR library');

select throws_ok(
  $$ insert into public.static_qr_codes (label, kind, content) values ('Bad', 'ftp', 'x') $$,
  '23514', null, 'unknown kinds are rejected'
);

set local role authenticated;

-- Route manager: creates a code.
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select lives_ok(
  $$ insert into public.static_qr_codes (label, kind, fields, content, style)
     values ('Menu', 'url', '{"kind":"url","url":"https://example.com"}', 'https://example.com', '{}') $$,
  'route managers can save QR codes'
);
select is(
  (select created_by from public.static_qr_codes where label = 'Menu'),
  '30000000-0000-0000-0000-000000000001'::uuid,
  'the creator is recorded'
);

-- Same manager without MFA sees nothing.
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(*) from public.static_qr_codes), 0::bigint, 'MFA is required to read the library');

-- Route viewer: reads, cannot change.
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}', true);
select is((select count(*) from public.static_qr_codes), 1::bigint, 'route viewers can read the library');
update public.static_qr_codes set label = 'Hijacked';
select is((select label from public.static_qr_codes), 'Menu', 'route viewers cannot edit codes');

-- Staff without route access see nothing.
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}', true);
select is((select count(*) from public.static_qr_codes), 0::bigint, 'staff without route access cannot read the library');

select * from finish();
rollback;
