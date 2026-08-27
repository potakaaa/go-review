-- Review Routes: dynamic QR/NFC redirects for Google Review cards.
--
-- Each physical card is printed once with a permanent /r/<slug> URL. The row
-- below is the indirection layer: the slug never changes, the destination can.

create extension if not exists "pgcrypto";

create table if not exists public.redirect_routes (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  slug            text not null,
  business_name   text not null,
  destination_url text not null,
  notes           text,
  active          boolean not null default true,
  scan_count      integer not null default 0,
  last_scanned_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Stored, generated lower-case form of the slug. Redirect lookups hit this
  -- column so a mistyped `/r/ABC123` still resolves, and so `Abc123` can never
  -- be created alongside `abc123` and shadow a card already in the wild.
  slug_lower      text generated always as (lower(slug)) stored,

  constraint redirect_routes_slug_format
    check (slug ~ '^[A-Za-z0-9-]{3,32}$'),
  constraint redirect_routes_destination_https
    check (destination_url ~* '^https://'),
  constraint redirect_routes_business_name_not_blank
    check (length(btrim(business_name)) > 0)
);

create unique index if not exists redirect_routes_slug_lower_key
  on public.redirect_routes (slug_lower);

-- Drives the dashboard list, which is always "my routes, newest first".
create index if not exists redirect_routes_owner_created_idx
  on public.redirect_routes (owner_id, created_at desc);


-- updated_at maintenance ------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Scoped to the admin-editable columns only. A scan bumping scan_count must not
-- make the route look like it was edited.
drop trigger if exists redirect_routes_set_updated_at on public.redirect_routes;
create trigger redirect_routes_set_updated_at
  before update on public.redirect_routes
  for each row
  when (
    old.business_name   is distinct from new.business_name
    or old.destination_url is distinct from new.destination_url
    or old.notes           is distinct from new.notes
    or old.active          is distinct from new.active
    or old.slug            is distinct from new.slug
  )
  execute function public.set_updated_at();


-- Row Level Security ----------------------------------------------------------
-- Every policy is scoped to the signed-in user. The public redirect endpoint
-- deliberately does NOT rely on these: it reads with the service-role key on
-- the server, so there is no public SELECT policy and no way for an anonymous
-- visitor to enumerate slugs or destinations.
--
-- There is intentionally no DELETE policy. Deactivation is soft: a printed card
-- must never point at a row that has silently vanished.

alter table public.redirect_routes enable row level security;

drop policy if exists "Owners can read their routes" on public.redirect_routes;
create policy "Owners can read their routes"
  on public.redirect_routes for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Owners can create their routes" on public.redirect_routes;
create policy "Owners can create their routes"
  on public.redirect_routes for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their routes" on public.redirect_routes;
create policy "Owners can update their routes"
  on public.redirect_routes for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);


-- Scan counting ---------------------------------------------------------------
-- Called fire-and-forget from the redirect handler after the response has been
-- flushed, so it never delays a customer standing at a table. No IP address,
-- user agent, or any other personal data is recorded -- just a counter and a
-- timestamp.

create or replace function public.increment_scan_count(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.redirect_routes
     set scan_count      = scan_count + 1,
         last_scanned_at = now()
   where slug_lower = lower(p_slug)
     and active;
$$;

-- Only the service role may call this. Revoking the implicit PUBLIC execute
-- grant is what keeps `anon` from inflating a client's scan count at will.
revoke all on function public.increment_scan_count(text) from public;
revoke all on function public.increment_scan_count(text) from anon, authenticated;
grant execute on function public.increment_scan_count(text) to service_role;
