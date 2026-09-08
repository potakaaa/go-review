-- Additive marketing content. No changes to printed routes or staff membership.
create table public.shop_stories (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null default '' check (char_length(shop_name) <= 120),
  caption text not null check (char_length(caption) between 1 and 600),
  alt_text text not null check (char_length(alt_text) between 1 and 300),
  image_path text unique,
  installed_on date,
  before_count integer check (before_count >= 0),
  after_count integer check (after_count >= 0),
  before_date date,
  after_date date,
  source_url text check (source_url is null or source_url ~ '^https://'),
  display_order integer not null default 0 check (display_order between 0 and 10000),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint complete_results check (
    (before_count is null and after_count is null and before_date is null and after_date is null)
    or (before_count is not null and after_count is not null and before_date is not null and after_date is not null
      and before_date < after_date and char_length(trim(shop_name)) > 0)
  ),
  constraint published_photo check (not published or image_path is not null),
  constraint story_image_path check (image_path is null or image_path in ('provided/shop-1.webp', 'provided/shop-2.webp', 'provided/shop-3.webp') or image_path ~ ('^' || id::text || '/[0-9a-f-]+\.webp$'))
);

alter table public.shop_stories enable row level security;
grant select on public.shop_stories to anon, authenticated;
grant insert, update, delete on public.shop_stories to authenticated;
create index shop_stories_public_order on public.shop_stories(display_order, created_at) where published;

create policy "Published stories are readable" on public.shop_stories for select to anon using (published);
create policy "MFA staff manage stories" on public.shop_stories for all to authenticated
  using ((select private.is_active_staff()) and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check ((select private.is_active_staff()) and ((select auth.jwt()) ->> 'aal') = 'aal2');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-stories', 'shop-stories', false, 8388608, array['image/webp']);

create policy "Published story photos are readable" on storage.objects for select to anon, authenticated
  using (bucket_id = 'shop-stories' and exists (
    select 1 from public.shop_stories s where s.published and s.image_path = name
  ));
create policy "MFA staff manage story photos" on storage.objects for all to authenticated
  using (bucket_id = 'shop-stories' and (select private.is_active_staff()) and ((select auth.jwt()) ->> 'aal') = 'aal2')
  with check (bucket_id = 'shop-stories' and (select private.is_active_staff()) and ((select auth.jwt()) ->> 'aal') = 'aal2');

-- User-approved counter photographs, without unconfirmed shop names or results.
insert into public.shop_stories (caption, alt_text, image_path, display_order, published) values
  ('A little space on the coffee counter. An easier way to leave a review.', 'A blue Goreview stand beside a payment QR sign on a coffee shop counter.', 'provided/shop-1.webp', 1, true),
  ('Ready for the next customer, right where the conversation happens.', 'A Goreview stand next to a GCash sign on a food shop counter.', 'provided/shop-2.webp', 2, true),
  ('Good coffee. Fresh bakes. And a simple invitation to share the experience.', 'A Goreview stand on a cafe pastry display; the staff member’s face is covered by a heart sticker.', 'provided/shop-3.webp', 3, true);
