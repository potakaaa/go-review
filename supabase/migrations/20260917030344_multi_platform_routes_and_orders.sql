-- Multi-platform tap routes and privacy-conscious order inquiries.

-- Routes -------------------------------------------------------------------

alter table public.redirect_routes
  add column platform text not null default 'google'
    constraint redirect_routes_platform_check
    check (platform in ('google', 'facebook', 'instagram'));

create index redirect_routes_platform_created_idx
  on public.redirect_routes (platform, created_at desc);

grant insert (platform) on public.redirect_routes to authenticated;
grant update (platform) on public.redirect_routes to authenticated;

create or replace function private.is_platform_destination(
  p_platform text,
  p_value text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_platform
    when 'google' then
      p_value ~* '^https://g\.page(?:[/?#]|$)'
      or p_value ~* '^https://maps\.app\.goo\.gl(?:[/?#]|$)'
      or p_value ~* '^https://goo\.gl/maps(?:[/?#]|$)'
      or p_value ~* '^https://search\.google\.com/local/writereview(?:[/?#]|$)'
      or p_value ~* '^https://(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})/maps(?:[/?#]|$)'
      or p_value ~* '^https://(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})/[^#]*[?&]place_?id='
    when 'facebook' then
      p_value ~* '^https://(?:www\.|m\.|web\.)?facebook\.com/(?![?#]?$)[^[:space:]]+$'
    when 'instagram' then
      p_value ~* '^https://(?:www\.)?instagram\.com/[A-Za-z0-9._]{1,30}/?(?:[?#][^[:space:]]*)?$'
      and p_value !~* '^https://(?:www\.)?instagram\.com/(p|reel|reels|stories|explore|accounts|direct)/'
    else false
  end;
$$;

revoke all on function private.is_platform_destination(text, text)
  from public, anon, authenticated;

drop trigger if exists redirect_routes_google_destination on public.redirect_routes;
drop function if exists private.enforce_google_review_destination();

create or replace function private.enforce_platform_destination()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Preserve the deliberately grandfathered legacy Google rows unless their
  -- platform or destination is actually changed.
  if tg_op = 'UPDATE'
     and new.platform is not distinct from old.platform
     and new.destination_url is not distinct from old.destination_url
     and new.maps_url is not distinct from old.maps_url then
    return new;
  end if;

  if not private.is_platform_destination(new.platform, new.destination_url) then
    raise exception using
      errcode = '23514',
      message = 'destination_url is not approved for the selected platform';
  end if;

  if new.platform <> 'google' and new.maps_url is not null then
    raise exception using
      errcode = '23514',
      message = 'maps_url is only available for Google routes';
  end if;

  if tg_op = 'UPDATE'
     and old.publication_status = 'published'
     and new.platform is distinct from old.platform then
    raise exception using
      errcode = '55000',
      message = 'A published route platform cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_platform_destination()
  from public, anon, authenticated;

create trigger redirect_routes_platform_destination
  before insert or update of platform, destination_url, maps_url
  on public.redirect_routes
  for each row execute function private.enforce_platform_destination();

drop trigger if exists redirect_routes_set_updated_at on public.redirect_routes;
create trigger redirect_routes_set_updated_at
  before update on public.redirect_routes
  for each row
  when (
    old.business_name is distinct from new.business_name
    or old.destination_url is distinct from new.destination_url
    or old.maps_url is distinct from new.maps_url
    or old.notes is distinct from new.notes
    or old.active is distinct from new.active
    or old.slug is distinct from new.slug
    or old.locked is distinct from new.locked
    or old.platform is distinct from new.platform
  )
  execute function public.set_updated_at();

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
    'platform', old.platform,
    'destination_url', old.destination_url,
    'maps_url', old.maps_url,
    'notes', old.notes,
    'active', old.active,
    'locked', old.locked,
    'publication_status', old.publication_status
  ) else null end;

  new_values := pg_catalog.jsonb_build_object(
    'business_name', new.business_name,
    'platform', new.platform,
    'destination_url', new.destination_url,
    'maps_url', new.maps_url,
    'notes', new.notes,
    'active', new.active,
    'locked', new.locked,
    'publication_status', new.publication_status
  );

  if tg_op = 'INSERT' or old_values is distinct from new_values then
    insert into private.route_audit_events (
      route_id, actor_id, action, before_values, after_values
    ) values (
      new.id, (select auth.uid()), pg_catalog.lower(tg_op), old_values, new_values
    );
  end if;
  return new;
end;
$$;

revoke all on function private.audit_redirect_route() from public, anon, authenticated;
drop trigger if exists redirect_routes_audit on public.redirect_routes;
create trigger redirect_routes_audit
  after insert or update of business_name, platform, destination_url, maps_url,
    notes, active, locked, publication_status
  on public.redirect_routes
  for each row execute function private.audit_redirect_route();

drop function if exists public.batch_update_routes(uuid[], text[], text, text);
create function public.batch_update_routes(
  p_route_ids uuid[],
  p_business_names text[],
  p_platform text,
  p_destination_url text,
  p_maps_url text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requested_count integer;
  visible_count bigint;
  updated_count integer;
begin
  if p_route_ids is null or p_business_names is null then
    raise exception using errcode = '22004', message = 'Route ids and business names are required';
  end if;
  requested_count := pg_catalog.cardinality(p_route_ids);
  if requested_count is null or requested_count < 1 or requested_count > 500 then
    raise exception using errcode = '22023', message = 'Select between 1 and 500 routes';
  end if;
  if pg_catalog.cardinality(p_business_names) <> requested_count then
    raise exception using errcode = '22023', message = 'Each selected route needs one business name';
  end if;
  if p_platform not in ('google', 'facebook', 'instagram') then
    raise exception using errcode = '22023', message = 'Select a valid platform';
  end if;
  if not private.is_platform_destination(p_platform, p_destination_url) then
    raise exception using errcode = '23514', message = 'Destination is not valid for the selected platform';
  end if;
  if p_platform <> 'google' and p_maps_url is not null then
    raise exception using errcode = '23514', message = 'Maps links are only available for Google routes';
  end if;
  if exists (
    select 1 from pg_catalog.unnest(p_route_ids) ids(route_id)
    where route_id is null
  ) or (
    select pg_catalog.count(*) from pg_catalog.unnest(p_route_ids) ids(route_id)
  ) <> (
    select pg_catalog.count(distinct route_id) from pg_catalog.unnest(p_route_ids) ids(route_id)
  ) then
    raise exception using errcode = '22023', message = 'Route ids must be valid and unique';
  end if;
  if exists (
    select 1 from pg_catalog.unnest(p_business_names) names(business_name)
    where business_name is null or pg_catalog.length(pg_catalog.btrim(business_name)) not between 1 and 120
  ) then
    raise exception using errcode = '22023', message = 'Business names must be between 1 and 120 characters';
  end if;

  select pg_catalog.count(*) into visible_count
  from public.redirect_routes where id = any (p_route_ids);
  if visible_count <> requested_count then
    raise exception using errcode = '42501', message = 'One or more selected routes are not available';
  end if;
  if exists (
    select 1 from public.redirect_routes
    where id = any (p_route_ids) and (locked or platform <> p_platform)
  ) then
    raise exception using errcode = '55000', message = 'Selected routes must be unlocked and use one platform';
  end if;

  update public.redirect_routes as route
  set business_name = pg_catalog.btrim(p_business_names[indexes.position]),
      destination_url = pg_catalog.btrim(p_destination_url),
      maps_url = case when p_platform = 'google' then nullif(pg_catalog.btrim(p_maps_url), '') else null end
  from pg_catalog.generate_subscripts(p_route_ids, 1) indexes(position)
  where route.id = p_route_ids[indexes.position] and not route.locked;
  get diagnostics updated_count = row_count;
  if updated_count <> requested_count then
    raise exception using errcode = '42501', message = 'The selected routes could not be updated';
  end if;
  return updated_count;
end;
$$;

revoke all on function public.batch_update_routes(uuid[], text[], text, text, text)
  from public, anon, authenticated;
grant execute on function public.batch_update_routes(uuid[], text[], text, text, text)
  to authenticated;

-- Orders and access ---------------------------------------------------------

alter table private.staff_section_permissions
  drop constraint staff_section_permissions_section_check;
alter table private.staff_section_permissions
  add constraint staff_section_permissions_section_check
  check (section in ('routes', 'analytics', 'convert', 'stories', 'orders', 'staff'));

insert into private.staff_section_permissions (
  user_id, section, can_view, can_manage, updated_by
)
select user_id, 'orders', true, true, user_id
from private.staff_members where active and role = 'superadmin'
on conflict (user_id, section) do nothing;

create or replace function public.get_my_staff_permissions()
returns table (section text, can_view boolean, can_manage boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select sections.section,
    case when s.role = 'superadmin' then true when sections.section = 'staff' then false else coalesce(p.can_view, false) end,
    case when s.role = 'superadmin' then true when sections.section = 'staff' then false else coalesce(p.can_manage, false) end
  from private.staff_members s
  cross join pg_catalog.unnest(array['routes', 'analytics', 'convert', 'stories', 'orders', 'staff']::text[]) sections(section)
  left join private.staff_section_permissions p on p.user_id = s.user_id and p.section = sections.section
  where s.user_id = (select auth.uid()) and s.active and (select auth.jwt() ->> 'aal') = 'aal2';
$$;

create or replace function private.validate_permission_payload(p_permissions jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if pg_catalog.jsonb_typeof(coalesce(p_permissions, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid permissions payload';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value
    where value->>'section' not in ('routes', 'analytics', 'convert', 'stories', 'orders', 'staff')
       or (coalesce((value->>'can_view')::boolean, false) = false
          and coalesce((value->>'can_manage')::boolean, false) = true)
  ) then
    raise exception using errcode = '22023', message = 'Invalid section permissions';
  end if;
end;
$$;

revoke all on function private.validate_permission_payload(jsonb) from public, anon, authenticated;

create table public.order_inquiries (
  id bigint generated always as identity primary key,
  reference_number text generated always as ('GR-' || pg_catalog.lpad(id::text, 6, '0')) stored unique,
  customer_name text not null check (pg_catalog.length(pg_catalog.btrim(customer_name)) between 1 and 120),
  business_name text not null check (pg_catalog.length(pg_catalog.btrim(business_name)) between 1 and 120),
  mobile text not null check (pg_catalog.length(pg_catalog.btrim(mobile)) between 7 and 30),
  email text,
  preferred_contact text not null check (preferred_contact in ('mobile', 'email')),
  city text not null check (pg_catalog.length(pg_catalog.btrim(city)) between 1 and 100),
  barangay text not null check (pg_catalog.length(pg_catalog.btrim(barangay)) between 1 and 100),
  delivery_area text not null check (delivery_area in ('cdo', 'outside_cdo')),
  standee_quantity integer not null default 0 check (standee_quantity between 0 and 100),
  google_card_quantity integer not null default 0 check (google_card_quantity between 0 and 100),
  facebook_card_quantity integer not null default 0 check (facebook_card_quantity between 0 and 100),
  instagram_card_quantity integer not null default 0 check (instagram_card_quantity between 0 and 100),
  estimated_total integer generated always as (
    standee_quantity * 699
    + (google_card_quantity + facebook_card_quantity + instagram_card_quantity) * 299
  ) stored,
  customer_notes text check (customer_notes is null or pg_catalog.length(customer_notes) <= 2000),
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  internal_notes text check (internal_notes is null or pg_catalog.length(internal_notes) <= 4000),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed')),
  notification_attempts integer not null default 0 check (notification_attempts >= 0),
  notification_sent_at timestamptz,
  notification_error text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint order_inquiries_has_product check (
    standee_quantity + google_card_quantity + facebook_card_quantity + instagram_card_quantity > 0
  ),
  constraint order_inquiries_card_minimum check (
    google_card_quantity + facebook_card_quantity + instagram_card_quantity = 0
    or google_card_quantity + facebook_card_quantity + instagram_card_quantity >= 3
  ),
  constraint order_inquiries_email_required check (preferred_contact <> 'email' or email is not null)
);

create index order_inquiries_status_created_idx
  on public.order_inquiries (status, created_at desc);

alter table public.order_inquiries enable row level security;
revoke all on table public.order_inquiries from public, anon, authenticated;
revoke all on sequence public.order_inquiries_id_seq from public, anon, authenticated;
grant all on table public.order_inquiries to service_role;
grant usage, select on sequence public.order_inquiries_id_seq to service_role;
grant select on table public.order_inquiries to authenticated;
grant update (status, internal_notes) on table public.order_inquiries to authenticated;

create policy "Permitted staff can read orders"
  on public.order_inquiries for select to authenticated
  using ((select private.has_section_permission('orders', false)));
create policy "Permitted staff can update orders"
  on public.order_inquiries for update to authenticated
  using ((select private.has_section_permission('orders', true)))
  with check ((select private.has_section_permission('orders', true)));

create trigger order_inquiries_set_updated_at
  before update on public.order_inquiries
  for each row execute function public.set_updated_at();
