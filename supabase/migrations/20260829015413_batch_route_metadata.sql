-- Group routes created together so the dashboard can list and export a whole
-- print run. Existing single routes remain valid with both values null.
alter table public.redirect_routes
  add column batch_key text,
  add column batch_position integer;

alter table public.redirect_routes
  add constraint redirect_routes_batch_key_format
    check (batch_key is null or batch_key ~ '^[A-Za-z0-9]{7}$'),
  add constraint redirect_routes_batch_position_range
    check (batch_position is null or batch_position between 1 and 100),
  add constraint redirect_routes_batch_pair
    check ((batch_key is null) = (batch_position is null));

-- The pair prevents duplicate card numbers within a generated batch. The
-- existing slug index remains the final guard against any URL collision.
create unique index redirect_routes_batch_position_key
  on public.redirect_routes (batch_key, batch_position)
  where batch_key is not null;

create index redirect_routes_owner_batch_position_idx
  on public.redirect_routes (owner_id, batch_key, batch_position)
  where batch_key is not null;
