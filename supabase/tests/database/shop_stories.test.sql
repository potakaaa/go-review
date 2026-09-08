begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(8);

select has_table('public', 'shop_stories', 'shop stories table exists');
select ok(not has_table_privilege('anon', 'public.shop_stories', 'update'), 'anon cannot update stories');
select ok(has_table_privilege('authenticated', 'public.shop_stories', 'update'), 'authenticated writes are filtered by RLS');

set local role anon;
select is((select count(*) from public.shop_stories where published), 3::bigint, 'anon sees the three approved stories');
select is((select count(*) from public.shop_stories where not published), 0::bigint, 'anon cannot see drafts');
reset role;

select throws_ok(
  $$ insert into public.shop_stories (shop_name, caption, alt_text, before_count, after_count, before_date, after_date)
     values ('Test', 'Invalid period', 'Test photo', 10, 11, '2026-09-01', '2026-08-01') $$,
  '23514', null, 'reversed review periods are rejected'
);
select throws_ok(
  $$ insert into public.shop_stories (shop_name, caption, alt_text, published)
     values ('Test', 'No photo', 'Missing photo', true) $$,
  '23514', null, 'published stories require a photo'
);
select ok(
  exists (select 1 from storage.buckets where id = 'shop-stories' and not public),
  'story photo bucket is private'
);

select * from finish();
rollback;
