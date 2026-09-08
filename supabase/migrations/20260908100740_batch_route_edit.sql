-- Apply one destination and a pre-numbered set of business names to selected
-- routes in one database statement. The invoker's RLS policies still decide
-- which rows are visible and writable; any trigger failure rolls the whole
-- statement back instead of leaving a partial batch edit.
drop function if exists public.batch_update_routes(uuid[], text[], text);

create or replace function public.batch_update_routes(
  p_route_ids uuid[],
  p_business_names text[],
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
    raise exception using
      errcode = '22004',
      message = 'Route ids and business names are required';
  end if;

  requested_count := pg_catalog.cardinality(p_route_ids);

  if requested_count is null or requested_count < 1 then
    raise exception using
      errcode = '22023',
      message = 'Select at least one route';
  end if;

  if requested_count > 500 then
    raise exception using
      errcode = '22023',
      message = 'Select 500 routes or fewer';
  end if;

  if pg_catalog.cardinality(p_business_names) <> requested_count then
    raise exception using
      errcode = '22023',
      message = 'Each selected route needs one business name';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(p_route_ids) as ids(route_id)
    where route_id is null
  ) then
    raise exception using
      errcode = '22023',
      message = 'Route ids must be valid';
  end if;

  if (
    select pg_catalog.count(*)
    from pg_catalog.unnest(p_route_ids) as ids(route_id)
  ) <> (
    select pg_catalog.count(distinct route_id)
    from pg_catalog.unnest(p_route_ids) as ids(route_id)
  ) then
    raise exception using
      errcode = '22023',
      message = 'Route ids must be unique';
  end if;

  if exists (
    select 1
    from pg_catalog.unnest(p_business_names) as names(business_name)
    where business_name is null
       or pg_catalog.length(pg_catalog.btrim(business_name)) < 1
       or pg_catalog.length(pg_catalog.btrim(business_name)) > 120
  ) then
    raise exception using
      errcode = '22023',
      message = 'Business names must be between 1 and 120 characters';
  end if;

  if p_destination_url is null
     or pg_catalog.length(pg_catalog.btrim(p_destination_url)) < 1 then
    raise exception using
      errcode = '22023',
      message = 'A destination URL is required';
  end if;

  if p_maps_url is not null
     and (
       pg_catalog.length(pg_catalog.btrim(p_maps_url)) < 1
       or p_maps_url !~* '^https://'
     ) then
    raise exception using
      errcode = '22023',
      message = 'Maps links must use https://';
  end if;

  -- RLS intentionally makes unavailable ids look absent. This prevents the
  -- RPC from being used to probe rows outside the caller's staff boundary.
  select pg_catalog.count(*)
    into visible_count
    from public.redirect_routes
   where id = any (p_route_ids);

  if visible_count <> requested_count then
    raise exception using
      errcode = '42501',
      message = 'One or more selected routes are not available';
  end if;

  if exists (
    select 1
    from public.redirect_routes
    where id = any (p_route_ids)
      and locked
  ) then
    raise exception using
      errcode = '55000',
      message = 'Unlock selected routes before batch editing them';
  end if;

  update public.redirect_routes as route
     set business_name = pg_catalog.btrim(p_business_names[indexes.position]),
         destination_url = pg_catalog.btrim(p_destination_url),
         maps_url = case
           when p_maps_url is null then route.maps_url
           else pg_catalog.btrim(p_maps_url)
         end
   from pg_catalog.generate_subscripts(p_route_ids, 1) as indexes(position)
   where route.id = p_route_ids[indexes.position]
     and not route.locked;

  get diagnostics updated_count = row_count;

  if updated_count <> requested_count then
    raise exception using
      errcode = '42501',
      message = 'The selected routes could not be updated';
  end if;

  return updated_count;
end;
$$;

revoke all on function public.batch_update_routes(uuid[], text[], text, text)
  from public, anon, authenticated;
grant execute on function public.batch_update_routes(uuid[], text[], text, text)
  to authenticated;
