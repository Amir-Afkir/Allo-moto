create table if not exists ops_vehicles (
  id text primary key,
  slug text not null unique,
  name text not null,
  brand text not null,
  model text not null,
  category text not null,
  transmission text not null,
  license_category text not null,
  location_label text not null,
  featured boolean not null,
  price_amount integer not null,
  price_currency text not null,
  deposit_amount integer not null,
  deposit_currency text not null,
  included_mileage_km_per_day integer not null,
  description text not null,
  primary_image text not null,
  primary_image_public_id text,
  gallery jsonb not null default '[]'::jsonb,
  monogram text not null,
  hero_tag text not null,
  editorial_note text not null,
  decision_tags jsonb not null default '[]'::jsonb,
  visual_tone text not null,
  ops_status text not null,
  created_at text not null,
  updated_at text not null,
  sort_order integer not null
);

create table if not exists ops_reservations (
  id text primary key,
  reference text not null,
  vehicle_slug text not null,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_country text not null,
  customer_preferred_contact text not null,
  permit_type text not null,
  permit_number text not null,
  document_type text not null,
  document_number text not null,
  customer_notes text not null,
  consent_data_use boolean not null,
  pickup_mode text not null,
  pickup_location_label text not null,
  pickup_date text not null,
  return_date text not null,
  pickup_at text not null,
  return_at text not null,
  total_days integer not null,
  daily_price integer not null,
  estimated_total integer not null,
  deposit_amount integer not null,
  payment_mode text not null,
  status text not null,
  admin_note text not null,
  created_at text not null,
  updated_at text not null,
  sort_order integer not null
);

create table if not exists ops_vehicle_blocks (
  id text primary key,
  vehicle_slug text not null,
  type text not null,
  start_at text not null,
  end_at text not null,
  reservation_id text,
  note text not null,
  created_at text not null,
  updated_at text not null,
  sort_order integer not null
);

create index if not exists ops_vehicles_sort_order_idx
  on ops_vehicles (sort_order);

create index if not exists ops_reservations_sort_order_idx
  on ops_reservations (sort_order);

create index if not exists ops_reservations_status_idx
  on ops_reservations (status);

create index if not exists ops_vehicle_blocks_sort_order_idx
  on ops_vehicle_blocks (sort_order);
