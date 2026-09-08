-- Multi-admin RBAC for Review Routes.
--
-- Authorization remains database-backed. The Next.js UI may hide controls, but
-- every route/story query and mutation is also checked by these helpers/RLS
-- policies. Auth metadata is deliberately not used for authorization.

-- Staff roles and first-login state -----------------------------------------

alter table private.staff_members
  add column role text not null default 'admin'
    check (role in ('admin', 'superadmin')),
  add column must_change_password boolean not null default false;

-- The already-approved owner remains the initial superadmin. Future
-- superadmins can be added from the protected staff-management screen.
update private.staff_members
set role = 'superadmin'
where user_id = 'fa38c388-9d09-4632-8c6c-268bd11842f3'::uuid;

create table private.staff_section_permissions (
  user_id uuid not null references auth.users (id) on delete cascade,
  section text not null check (section in ('routes', 'analytics', 'convert', 'stories', 'staff')),
  can_view boolean not null default false,
  can_manage boolean not null default false,
  updated_at timestamptz not null default pg_catalog.now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (user_id, section),
  constraint staff_section_manage_requires_view check (not can_manage or can_view)
);

create table private.staff_route_access (
  user_id uuid not null references auth.users (id) on delete cascade,
  route_id uuid not null references public.redirect_routes (id) on delete cascade,
  access_level text not null check (access_level in ('view', 'manage')),
  created_at timestamptz not null default pg_catalog.now(),
  created_by uuid references auth.users (id) on delete set null,
  primary key (user_id, route_id)
);

create table private.staff_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  subject_id uuid references auth.users (id) on delete set null,
  action text not null check (action in (
    'staff_registered',
    'staff_updated',
    'staff_permissions_replaced',
    'staff_routes_replaced',
    'staff_password_reset_requested',
    'staff_password_changed'
  )),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now()
);

create index staff_section_permissions_user_idx
  on private.staff_section_permissions (user_id);

create index staff_route_access_route_idx
  on private.staff_route_access (route_id, user_id);

create index staff_audit_events_subject_created_idx
  on private.staff_audit_events (subject_id, created_at desc);

alter table private.staff_section_permissions enable row level security;
alter table private.staff_route_access enable row level security;
alter table private.staff_audit_events enable row level security;

revoke all on table private.staff_section_permissions from public, anon, authenticated;
revoke all on table private.staff_route_access from public, anon, authenticated;
revoke all on table private.staff_audit_events from public, anon, authenticated;

-- Route publication and assignment -----------------------------------------

alter table public.redirect_routes
  add column publication_status text not null default 'published'
    check (publication_status in ('draft', 'published'));

create index redirect_routes_publication_status_idx
  on public.redirect_routes (publication_status, created_at desc);

create or replace function private.assign_route_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    insert into private.staff_route_access (user_id, route_id, access_level, created_by)
    values ((select auth.uid()), new.id, 'manage', (select auth.uid()))
    on conflict (user_id, route_id) do update
      set access_level = 'manage';
  end if;
  return new;
end;
$$;

revoke all on function private.assign_route_creator() from public, anon, authenticated;

drop trigger if exists redirect_routes_assign_creator on public.redirect_routes;
create trigger redirect_routes_assign_creator
  after insert on public.redirect_routes
  for each row
  execute function private.assign_route_creator();

create or replace function private.enforce_route_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  staff_role text;
begin
  select s.role into staff_role
  from private.staff_members as s
  where s.user_id = (select auth.uid())
    and s.active;

  -- A draft must never be publicly active, including when a superadmin uses
  -- the ordinary active/inactive control instead of the publish action.
  if new.publication_status = 'draft' then
    new.active := false;
  end if;

  if staff_role is distinct from 'superadmin' then
    if tg_op = 'INSERT' then
      new.publication_status := 'draft';
      new.active := false;
    elsif old.publication_status = 'draft' then
      if new.publication_status <> 'draft' or new.active then
        raise exception using
          errcode = '42501',
          message = 'Only a superadmin can publish a draft route';
      end if;
    elsif new.publication_status <> old.publication_status then
      raise exception using
        errcode = '42501',
        message = 'Only a superadmin can change route publication';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_route_publication() from public, anon, authenticated;

drop trigger if exists redirect_routes_enforce_publication on public.redirect_routes;
create trigger redirect_routes_enforce_publication
  before insert or update of publication_status, active
  on public.redirect_routes
  for each row
  execute function private.enforce_route_publication();

-- Authorization helpers ------------------------------------------------------

create or replace function private.is_staff_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (select auth.jwt() ->> 'aal') = 'aal2'
    and exists (
      select 1
      from private.staff_members
      where user_id = (select auth.uid())
        and active
    );
$$;

create or replace function private.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from private.staff_members
  where user_id = (select auth.uid())
    and active
  limit 1;
$$;

create or replace function private.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_staff_role() = 'superadmin';
$$;

create or replace function private.has_section_permission(
  p_section text,
  p_manage boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff_aal2()
    and (
      private.is_superadmin()
      or exists (
        select 1
        from private.staff_section_permissions
        where user_id = (select auth.uid())
          and section = p_section
          and (case when p_manage then can_manage else can_view end)
      )
    )
    and (p_section <> 'staff' or private.is_superadmin());
$$;

create or replace function private.has_route_access(
  p_route_id uuid,
  p_manage boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_staff_aal2()
    and (
      private.is_superadmin()
      or exists (
        select 1
        from private.staff_route_access
        where user_id = (select auth.uid())
          and route_id = p_route_id
          and (not p_manage or access_level = 'manage')
      )
    );
$$;

create or replace function private.can_view_route(p_route_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_route_access(p_route_id, false)
    and (
      private.has_section_permission('routes', false)
      or private.has_section_permission('analytics', false)
    );
$$;

create or replace function private.can_manage_route(p_route_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_route_access(p_route_id, true)
    and private.has_section_permission('routes', true);
$$;

revoke all on function private.is_staff_aal2() from public, anon, authenticated;
revoke all on function private.current_staff_role() from public, anon, authenticated;
revoke all on function private.is_superadmin() from public, anon, authenticated;
revoke all on function private.has_section_permission(text, boolean) from public, anon, authenticated;
revoke all on function private.has_route_access(uuid, boolean) from public, anon, authenticated;
revoke all on function private.can_view_route(uuid) from public, anon, authenticated;
revoke all on function private.can_manage_route(uuid) from public, anon, authenticated;

-- RLS evaluates these predicates as the authenticated caller. EXECUTE is
-- required for policy evaluation even though the functions are SECURITY
-- DEFINER and the private schema remains outside the Data API.
grant execute on function private.is_superadmin() to authenticated;
grant execute on function private.has_section_permission(text, boolean) to authenticated;
grant execute on function private.can_view_route(uuid) to authenticated;
grant execute on function private.can_manage_route(uuid) to authenticated;

-- Existing active staff keep the current shared inventory during migration.
insert into private.staff_route_access (user_id, route_id, access_level, created_by)
select s.user_id, r.id, 'manage', s.user_id
from private.staff_members s
cross join public.redirect_routes r
where s.active
on conflict (user_id, route_id) do nothing;

-- Existing active staff keep the current shared dashboard during migration;
-- newly registered admins start with only the permissions selected by the
-- superadmin.
insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
select s.user_id, section, true, true, s.user_id
from private.staff_members s
cross join unnest(array['routes', 'analytics', 'convert', 'stories', 'staff']::text[]) as section
where s.active
on conflict (user_id, section) do update
  set can_view = excluded.can_view,
      can_manage = excluded.can_manage,
      updated_by = excluded.updated_by,
      updated_at = pg_catalog.now();

-- Route RLS ---------------------------------------------------------------

drop policy if exists "Active staff can read routes" on public.redirect_routes;
drop policy if exists "Active staff can create routes" on public.redirect_routes;
drop policy if exists "Active staff can update routes" on public.redirect_routes;

create policy "Permitted staff can read routes"
  on public.redirect_routes for select
  to authenticated
  using ((select private.can_view_route(id)));

create policy "Permitted staff can create routes"
  on public.redirect_routes for insert
  to authenticated
  with check (
    (select private.has_section_permission('routes', true))
    and owner_id = (select auth.uid())
    and (
      (select private.is_superadmin())
      or (publication_status = 'draft' and not active)
    )
  );

create policy "Permitted staff can update routes"
  on public.redirect_routes for update
  to authenticated
  using ((select private.can_manage_route(id)))
  with check ((select private.can_manage_route(id)));

grant update (publication_status) on public.redirect_routes to authenticated;
grant insert (publication_status) on public.redirect_routes to authenticated;

-- Add publication status to the existing private audit trail.
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
    'locked', old.locked,
    'publication_status', old.publication_status
  ) else null end;

  new_values := pg_catalog.jsonb_build_object(
    'business_name', new.business_name,
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
  after insert or update of business_name, destination_url, maps_url, notes, active, locked, publication_status
  on public.redirect_routes
  for each row
  execute function private.audit_redirect_route();

-- Shop stories use the same section-level permission model. -----------------

drop policy if exists "MFA staff manage stories" on public.shop_stories;
create policy "Permitted staff can read stories" on public.shop_stories
  for select to authenticated
  using ((select private.has_section_permission('stories', false)));

create policy "Permitted staff can manage stories" on public.shop_stories
  for all to authenticated
  using ((select private.has_section_permission('stories', true)))
  with check ((select private.has_section_permission('stories', true)));

drop policy if exists "MFA staff manage story photos" on storage.objects;
create policy "Permitted staff manage story photos" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'shop-stories'
    and (select private.has_section_permission('stories', true))
  )
  with check (
    bucket_id = 'shop-stories'
    and (select private.has_section_permission('stories', true))
  );

-- Auth/session RPCs ---------------------------------------------------------

create or replace function public.is_password_change_required()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.staff_members
    where user_id = (select auth.uid())
      and active
      and must_change_password
  );
$$;

create or replace function public.get_my_staff_profile()
returns table (
  user_id uuid,
  role text,
  must_change_password boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select user_id, role, must_change_password
  from private.staff_members
  where user_id = (select auth.uid())
    and active;
$$;

create or replace function public.get_my_staff_permissions()
returns table (
  section text,
  can_view boolean,
  can_manage boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select sections.section,
    case
      when s.role = 'superadmin' then true
      when sections.section = 'staff' then false
      else coalesce(p.can_view, false)
    end,
    case
      when s.role = 'superadmin' then true
      when sections.section = 'staff' then false
      else coalesce(p.can_manage, false)
    end
  from private.staff_members s
  cross join unnest(array['routes', 'analytics', 'convert', 'stories', 'staff']::text[]) as sections(section)
  left join private.staff_section_permissions p
    on p.user_id = s.user_id
   and p.section = sections.section
  where s.user_id = (select auth.uid())
    and s.active
    and (select auth.jwt() ->> 'aal') = 'aal2';
$$;

create or replace function public.complete_password_change(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed boolean := false;
begin
  update private.staff_members
  set must_change_password = false
  where user_id = p_user_id
    and active
    and must_change_password;
  changed := found;

  if changed then
    insert into private.staff_audit_events (actor_id, subject_id, action)
    values (p_user_id, p_user_id, 'staff_password_changed');
  end if;
  return changed;
end;
$$;

revoke all on function public.is_password_change_required() from public, anon;
revoke all on function public.get_my_staff_profile() from public, anon;
revoke all on function public.get_my_staff_permissions() from public, anon;
revoke all on function public.complete_password_change(uuid) from public, anon, authenticated;
grant execute on function public.is_password_change_required() to authenticated;
grant execute on function public.get_my_staff_profile() to authenticated;
grant execute on function public.get_my_staff_permissions() to authenticated;
grant execute on function public.complete_password_change(uuid) to service_role;

-- Superadmin management RPCs -----------------------------------------------

create or replace function private.require_superadmin()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_staff_aal2() or not private.is_superadmin() then
    raise exception using errcode = '42501', message = 'Superadmin access required';
  end if;
end;
$$;

revoke all on function private.require_superadmin() from public, anon, authenticated;

create or replace function public.admin_list_staff()
returns table (
  user_id uuid,
  email text,
  role text,
  active boolean,
  must_change_password boolean,
  created_at timestamptz,
  created_by uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  return query
    select s.user_id, u.email::text, s.role, s.active,
      s.must_change_password, s.created_at, s.created_by
    from private.staff_members s
    join auth.users u on u.id = s.user_id
    order by s.active desc, s.created_at asc;
end;
$$;

create or replace function public.admin_list_staff_permissions(p_user_id uuid)
returns table (
  section text,
  can_view boolean,
  can_manage boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  return query
    select p.section, p.can_view, p.can_manage
    from private.staff_section_permissions p
    where p.user_id = p_user_id
    order by p.section;
end;
$$;

create or replace function public.admin_list_route_access(p_user_id uuid)
returns table (
  route_id uuid,
  access_level text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  return query
    select a.route_id, a.access_level
    from private.staff_route_access a
    where a.user_id = p_user_id
    order by a.route_id;
end;
$$;

create or replace function private.validate_permission_payload(p_permissions jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(coalesce(p_permissions, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid permissions payload';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value
    where value->>'section' not in ('routes', 'analytics', 'convert', 'stories', 'staff')
       or (coalesce((value->>'can_view')::boolean, false) = false
          and coalesce((value->>'can_manage')::boolean, false) = true)
  ) then
    raise exception using errcode = '22023', message = 'Invalid section permissions';
  end if;
end;
$$;

create or replace function private.validate_route_access_payload(p_access jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if jsonb_typeof(coalesce(p_access, '[]'::jsonb)) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid route access payload';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_access, '[]'::jsonb)) value
    where value->>'access_level' not in ('view', 'manage')
  ) then
    raise exception using errcode = '22023', message = 'Invalid route access level';
  end if;
end;
$$;

revoke all on function private.validate_permission_payload(jsonb) from public, anon, authenticated;
revoke all on function private.validate_route_access_payload(jsonb) from public, anon, authenticated;

create or replace function public.admin_register_staff(
  p_user_id uuid,
  p_role text,
  p_permissions jsonb default '[]'::jsonb,
  p_route_access jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  if p_role not in ('admin', 'superadmin') then
    raise exception using errcode = '22023', message = 'Invalid staff role';
  end if;
  perform private.validate_permission_payload(p_permissions);
  perform private.validate_route_access_payload(p_route_access);
  if p_role = 'admin' and exists (
    select 1
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value
    where value->>'section' = 'staff'
  ) then
    raise exception using errcode = '42501', message = 'Staff permission is superadmin-only';
  end if;

  insert into private.staff_members (user_id, role, active, must_change_password, created_by)
  values (p_user_id, p_role, true, true, (select auth.uid()));

  if p_role = 'superadmin' then
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id, section, true, true, (select auth.uid())
    from unnest(array['routes', 'analytics', 'convert', 'stories', 'staff']::text[]) as section
    on conflict (user_id, section) do update
      set can_view = true, can_manage = true, updated_by = (select auth.uid()), updated_at = pg_catalog.now();
  else
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id,
      value->>'section',
      coalesce((value->>'can_view')::boolean, false),
      coalesce((value->>'can_manage')::boolean, false),
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value;
  end if;

  if p_role = 'admin' then
    insert into private.staff_route_access (user_id, route_id, access_level, created_by)
    select p_user_id,
      (value->>'route_id')::uuid,
      value->>'access_level',
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_route_access, '[]'::jsonb)) value;
  end if;

  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_permissions_replaced',
    pg_catalog.jsonb_build_object('role', p_role)
  );
  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_routes_replaced',
    pg_catalog.jsonb_build_object(
      'assignment_count', pg_catalog.jsonb_array_length(coalesce(p_route_access, '[]'::jsonb))
    )
  );

  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_registered',
    pg_catalog.jsonb_build_object('role', p_role)
  );
  return true;
end;
$$;

create or replace function public.admin_update_staff(
  p_user_id uuid,
  p_role text,
  p_active boolean,
  p_permissions jsonb default '[]'::jsonb,
  p_route_access jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_role text;
begin
  perform private.require_superadmin();
  if p_user_id = (select auth.uid()) then
    raise exception using errcode = '42501', message = 'You cannot change your own superadmin access';
  end if;
  if p_role not in ('admin', 'superadmin') then
    raise exception using errcode = '22023', message = 'Invalid staff role';
  end if;
  perform private.validate_permission_payload(p_permissions);
  perform private.validate_route_access_payload(p_route_access);
  if p_role = 'admin' and exists (
    select 1
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value
    where value->>'section' = 'staff'
  ) then
    raise exception using errcode = '42501', message = 'Staff permission is superadmin-only';
  end if;

  select role into previous_role
  from private.staff_members
  where user_id = p_user_id;
  if previous_role is null then
    raise exception using errcode = 'P0002', message = 'Staff member not found';
  end if;

  if previous_role = 'superadmin' and (p_role <> 'superadmin' or not p_active)
     and (select count(*) from private.staff_members where role = 'superadmin' and active) <= 1 then
    raise exception using errcode = '42501', message = 'At least one active superadmin is required';
  end if;

  update private.staff_members
  set role = p_role,
      active = p_active
  where user_id = p_user_id;

  delete from private.staff_section_permissions where user_id = p_user_id;
  delete from private.staff_route_access where user_id = p_user_id;

  if p_role = 'superadmin' then
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id, section, true, true, (select auth.uid())
    from unnest(array['routes', 'analytics', 'convert', 'stories', 'staff']::text[]) as section;
  else
    insert into private.staff_section_permissions (user_id, section, can_view, can_manage, updated_by)
    select p_user_id,
      value->>'section',
      coalesce((value->>'can_view')::boolean, false),
      coalesce((value->>'can_manage')::boolean, false),
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) value;

    insert into private.staff_route_access (user_id, route_id, access_level, created_by)
    select p_user_id,
      (value->>'route_id')::uuid,
      value->>'access_level',
      (select auth.uid())
    from jsonb_array_elements(coalesce(p_route_access, '[]'::jsonb)) value;
  end if;

  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_permissions_replaced',
    pg_catalog.jsonb_build_object('role', p_role)
  );
  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_routes_replaced',
    pg_catalog.jsonb_build_object(
      'assignment_count', pg_catalog.jsonb_array_length(coalesce(p_route_access, '[]'::jsonb))
    )
  );

  insert into private.staff_audit_events (actor_id, subject_id, action, details)
  values (
    (select auth.uid()), p_user_id, 'staff_updated',
    pg_catalog.jsonb_build_object('role', p_role, 'active', p_active)
  );
  return true;
end;
$$;

create or replace function public.admin_mark_password_change_required(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_superadmin();
  update private.staff_members
  set must_change_password = true
  where user_id = p_user_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'Staff member not found';
  end if;
  insert into private.staff_audit_events (actor_id, subject_id, action)
  values ((select auth.uid()), p_user_id, 'staff_password_reset_requested');
  return true;
end;
$$;

revoke all on function public.admin_list_staff() from public, anon;
revoke all on function public.admin_list_staff_permissions(uuid) from public, anon;
revoke all on function public.admin_list_route_access(uuid) from public, anon;
revoke all on function public.admin_register_staff(uuid, text, jsonb, jsonb) from public, anon;
revoke all on function public.admin_update_staff(uuid, text, boolean, jsonb, jsonb) from public, anon;
revoke all on function public.admin_mark_password_change_required(uuid) from public, anon;
grant execute on function public.admin_list_staff() to authenticated;
grant execute on function public.admin_list_staff_permissions(uuid) to authenticated;
grant execute on function public.admin_list_route_access(uuid) to authenticated;
grant execute on function public.admin_register_staff(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.admin_update_staff(uuid, text, boolean, jsonb, jsonb) to authenticated;
grant execute on function public.admin_mark_password_change_required(uuid) to authenticated;
