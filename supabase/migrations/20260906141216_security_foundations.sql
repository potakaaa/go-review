-- Security foundations for a manually managed staff team.
--
-- This migration deliberately does not require MFA in RLS yet. The application
-- needs to ship the enrollment/challenge flow and the existing administrator
-- needs to enroll before that final restriction can be enabled safely.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  created_by uuid references auth.users (id) on delete set null
);

alter table private.staff_members enable row level security;

-- The production roster was reviewed before this migration was authored. Seed
-- only the confirmed owner -- never every Auth user -- so an unexpected account
-- cannot become staff merely because it existed at migration time.
insert into private.staff_members (user_id)
select id
from auth.users
where id = 'fa38c388-9d09-4632-8c6c-268bd11842f3'::uuid
on conflict (user_id) do nothing;

create index staff_members_active_idx
  on private.staff_members (user_id)
  where active;

create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from private.staff_members
      where user_id = (select auth.uid())
        and active
    );
$$;

revoke all on function private.is_active_staff() from public, anon, authenticated;
-- RLS evaluates this predicate as the authenticated caller. EXECUTE is needed
-- for policy evaluation, while the private schema remains absent from the Data
-- API's exposed schemas and has no USAGE grant for direct client access.
grant execute on function private.is_active_staff() to authenticated;

-- A minimal authenticated RPC lets the Next.js access gate distinguish an
-- approved staff account from an arbitrary Supabase Auth account. It exposes no
-- roster data and always evaluates the caller's own auth.uid().
create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from private.staff_members
      where user_id = (select auth.uid())
        and active
    );
$$;

revoke all on function public.is_active_staff() from public, anon;
grant execute on function public.is_active_staff() to authenticated;


-- Shared staff access --------------------------------------------------------

drop policy if exists "Owners can read their routes" on public.redirect_routes;
drop policy if exists "Owners can create their routes" on public.redirect_routes;
drop policy if exists "Owners can update their routes" on public.redirect_routes;

create policy "Active staff can read routes"
  on public.redirect_routes for select
  to authenticated
  using ((select private.is_active_staff()));

create policy "Active staff can create routes"
  on public.redirect_routes for insert
  to authenticated
  with check (
    (select private.is_active_staff())
    and owner_id = (select auth.uid())
  );

create policy "Active staff can update routes"
  on public.redirect_routes for update
  to authenticated
  using ((select private.is_active_staff()))
  with check ((select private.is_active_staff()));

-- RLS controls rows; column grants separately keep server-managed fields from
-- being changed through a direct PostgREST request. There remains no DELETE
-- policy or privilege because printed routes are permanent records.
revoke all on table public.redirect_routes from anon, authenticated;

grant select on table public.redirect_routes to authenticated;

grant insert (
  owner_id,
  slug,
  batch_key,
  batch_position,
  business_name,
  destination_url,
  maps_url,
  notes,
  active,
  locked
) on public.redirect_routes to authenticated;

grant update (
  business_name,
  destination_url,
  maps_url,
  notes,
  active,
  locked
) on public.redirect_routes to authenticated;


-- Google-only destination enforcement ---------------------------------------

create or replace function private.is_google_review_destination(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~* '^https://g\.page(?:[/?#]|$)'
      or value ~* '^https://maps\.app\.goo\.gl(?:[/?#]|$)'
      or value ~* '^https://goo\.gl/maps(?:[/?#]|$)'
      or value ~* '^https://search\.google\.com/local/writereview(?:[/?#]|$)'
      or value ~* '^https://(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})/maps(?:[/?#]|$)'
      or value ~* '^https://(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})/[^#]*[?&]place_?id=';
$$;

revoke all on function private.is_google_review_destination(text)
  from public, anon, authenticated;

create or replace function private.enforce_google_review_destination()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_google_review_destination(new.destination_url) then
    raise exception using
      errcode = '23514',
      message = 'destination_url must be an approved Google review URL';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_google_review_destination()
  from public, anon, authenticated;

drop trigger if exists redirect_routes_google_destination on public.redirect_routes;
create trigger redirect_routes_google_destination
  before insert or update of destination_url on public.redirect_routes
  for each row
  execute function private.enforce_google_review_destination();

-- Twenty existing routes currently point to a non-Google hostname. The trigger
-- deliberately grandfathers those stored values: other fields can still be
-- changed, but any new or changed destination must pass the Google allowlist.


-- Narrow public redirect capability -----------------------------------------

create or replace function public.resolve_redirect(p_slug text)
returns table (route_state text, destination_url text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_destination text;
begin
  if p_slug is null
     or pg_catalog.char_length(p_slug) < 3
     or pg_catalog.char_length(p_slug) > 32
     or p_slug !~ '^[A-Za-z0-9-]+$' then
    return;
  end if;

  update public.redirect_routes
     set scan_count = scan_count + 1,
         last_scanned_at = pg_catalog.now()
   where slug_lower = pg_catalog.lower(p_slug)
     and active
  returning public.redirect_routes.destination_url
       into resolved_destination;

  if found then
    return query select 'active'::text, resolved_destination;
    return;
  end if;

  if exists (
    select 1
    from public.redirect_routes
    where slug_lower = pg_catalog.lower(p_slug)
  ) then
    return query select 'inactive'::text, null::text;
  end if;
end;
$$;

revoke all on function public.resolve_redirect(text) from public, authenticated;
grant execute on function public.resolve_redirect(text) to anon;


-- Private audit trail --------------------------------------------------------

create table private.route_audit_events (
  id bigint generated always as identity primary key,
  route_id uuid not null references public.redirect_routes (id),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('insert', 'update')),
  before_values jsonb,
  after_values jsonb not null,
  created_at timestamptz not null default pg_catalog.now()
);

create index route_audit_events_route_created_idx
  on private.route_audit_events (route_id, created_at desc);

create index route_audit_events_actor_created_idx
  on private.route_audit_events (actor_id, created_at desc)
  where actor_id is not null;

alter table private.route_audit_events enable row level security;

create or replace function private.audit_redirect_route()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_values jsonb;
  new_values jsonb;
begin
  old_values := case when tg_op = 'UPDATE' then pg_catalog.jsonb_build_object(
    'business_name', old.business_name,
    'destination_url', old.destination_url,
    'maps_url', old.maps_url,
    'notes', old.notes,
    'active', old.active,
    'locked', old.locked
  ) else null end;

  new_values := pg_catalog.jsonb_build_object(
    'business_name', new.business_name,
    'destination_url', new.destination_url,
    'maps_url', new.maps_url,
    'notes', new.notes,
    'active', new.active,
    'locked', new.locked
  );

  if tg_op = 'INSERT' or old_values is distinct from new_values then
    insert into private.route_audit_events (
      route_id,
      actor_id,
      action,
      before_values,
      after_values
    ) values (
      new.id,
      (select auth.uid()),
      pg_catalog.lower(tg_op),
      old_values,
      new_values
    );
  end if;

  return new;
end;
$$;

revoke all on function private.audit_redirect_route()
  from public, anon, authenticated;

drop trigger if exists redirect_routes_audit on public.redirect_routes;
create trigger redirect_routes_audit
  after insert or update of business_name, destination_url, maps_url, notes, active, locked
  on public.redirect_routes
  for each row
  execute function private.audit_redirect_route();


-- Function and future-object defaults ---------------------------------------

revoke all on function public.set_updated_at() from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;
