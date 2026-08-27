-- Keep the original Google Maps share link alongside the generated review URL.
-- It lets admins revisit the source place while editing a route.
alter table public.redirect_routes
  add column maps_url text;

alter table public.redirect_routes
  add constraint redirect_routes_maps_url_https
  check (maps_url is null or maps_url ~* '^https://');
