-- The 2-in-1 Facebook + Google Maps review standee (₱999).
--
-- One more product column rather than a products table: the catalogue is a
-- short fixed list priced in code and in this generated total, and an order is
-- a single immutable inquiry row. `estimated_total` is a stored generated
-- column, so extending the formula means dropping and re-adding it; the value
-- is recomputed for every existing row, and every old row has a zero quantity
-- in the new column, so historical totals are unchanged.
alter table public.order_inquiries
  add column duo_standee_quantity integer not null default 0
    check (duo_standee_quantity between 0 and 100);

alter table public.order_inquiries
  drop column estimated_total;

alter table public.order_inquiries
  add column estimated_total integer generated always as (
    standee_quantity * 699
    + duo_standee_quantity * 999
    + (google_card_quantity + facebook_card_quantity + instagram_card_quantity) * 299
  ) stored;

-- An order still has to carry something. The duo standee, like the Google
-- standee, stands on its own: only the adhesive cards carry a minimum.
alter table public.order_inquiries
  drop constraint order_inquiries_has_product;

alter table public.order_inquiries
  add constraint order_inquiries_has_product check (
    standee_quantity + duo_standee_quantity + google_card_quantity
      + facebook_card_quantity + instagram_card_quantity > 0
  );
