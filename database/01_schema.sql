-- ============================================================================
-- Daily Vistory — Production Database Schema
-- Run in Supabase SQL editor in this order: 01_schema.sql -> 02_rls.sql -> 03_seed.sql (optional)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- for password hashing if needed
create extension if not exists "postgis";    -- proper geo distance/proximity queries

-- ----------------------------------------------------------------------------
-- 1. Reusable enum types
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'customer', 'visitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.visitor_status as enum ('pending', 'approved', 'suspended', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending', 'accepted', 'rejected', 'in_progress', 'delivered', 'completed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.day_of_week as enum ('mon','tue','wed','thu','fri','sat','sun');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Improve the existing `user` table
--    NOTE: `user` is a reserved-ish word; keep it but quote consistently.
--    We migrate to Supabase Auth: auth.users handles credentials, this table
--    becomes the PROFILE table linked 1:1 via auth_id. `password` is dropped
--    (Supabase Auth stores hashed passwords securely in auth.users).
-- ----------------------------------------------------------------------------

-- 2.1 Add auth_id link to Supabase Auth (nullable during migration, then enforce NOT NULL)
alter table public."user"
  add column if not exists auth_id uuid unique references auth.users(id) on delete cascade;

-- 2.2 Convert role to enum-backed column safely
alter table public."user"
  alter column role drop default;

alter table public."user"
  alter column role type public.user_role using (
    case lower(coalesce(role, 'customer'))
      when 'visitor' then 'visitor'
      when 'admin' then 'admin'
      else 'customer'
    end
  )::public.user_role;

alter table public."user"
  alter column role set default 'customer'::public.user_role;

-- 2.3 Rename camelCase columns to snake_case (Postgres convention)
alter table public."user" rename column "jobType" to job_type;

-- 2.4 Add useful profile fields
alter table public."user"
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- 2.5 Drop plaintext password column (Supabase Auth owns credentials now)
--     Comment this out if you still need a transition period.
alter table public."user" drop column if exists password;

-- 2.6 Add geography point column for fast proximity search (kept in sync with lat/long)
alter table public."user"
  add column if not exists geo_point geography(Point, 4326);

create or replace function public.sync_user_geo_point()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.long is not null then
    new.geo_point := ST_SetSRID(ST_MakePoint(new.long, new.lat), 4326)::geography;
  else
    new.geo_point := null;
  end if;
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_sync_user_geo_point on public."user";
create trigger trg_sync_user_geo_point
  before insert or update of lat, long on public."user"
  for each row execute function public.sync_user_geo_point();

create index if not exists idx_user_geo_point on public."user" using gist (geo_point);
create index if not exists idx_user_role on public."user" (role);
create index if not exists idx_user_email on public."user" (email);

-- ----------------------------------------------------------------------------
-- 3. service_category — admin-managed catalog (milk, eggs, fruits, ...)
-- ----------------------------------------------------------------------------
create table if not exists public.service_category (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  icon_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 4. visitor_profile — extra data specific to the visitor role
-- ----------------------------------------------------------------------------
create table if not exists public.visitor_profile (
  id bigint generated always as identity primary key,
  user_id bigint not null unique references public."user"(id) on delete cascade,
  status public.visitor_status not null default 'pending',
  bio text,
  service_radius_km numeric(5,2) not null default 5.0,
  is_available boolean not null default true,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  approved_by bigint references public."user"(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_visitor_profile_status on public.visitor_profile (status);

-- ----------------------------------------------------------------------------
-- 5. visitor_service — pricing / offerings per visitor per category
-- ----------------------------------------------------------------------------
create table if not exists public.visitor_service (
  id bigint generated always as identity primary key,
  visitor_id bigint not null references public.visitor_profile(id) on delete cascade,
  category_id bigint not null references public.service_category(id) on delete cascade,
  unit text not null default 'item',         -- e.g. 'litre', 'dozen', 'kg', 'item'
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (visitor_id, category_id)
);

-- ----------------------------------------------------------------------------
-- 6. visitor_availability — weekly working hours
-- ----------------------------------------------------------------------------
create table if not exists public.visitor_availability (
  id bigint generated always as identity primary key,
  visitor_id bigint not null references public.visitor_profile(id) on delete cascade,
  day_of_week public.day_of_week not null,
  start_time time not null,
  end_time time not null,
  unique (visitor_id, day_of_week, start_time)
);

-- ----------------------------------------------------------------------------
-- 7. customer_address — saved addresses (a customer can have many)
-- ----------------------------------------------------------------------------
create table if not exists public.customer_address (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public."user"(id) on delete cascade,
  label text not null default 'Home',
  address_line text not null,
  lat numeric not null,
  long numeric not null,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_customer_address_customer on public.customer_address (customer_id);

-- ----------------------------------------------------------------------------
-- 8. orders — customer requests to visitors
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public."user"(id) on delete cascade,
  visitor_id bigint not null references public.visitor_profile(id) on delete cascade,
  address_id bigint references public.customer_address(id) on delete set null,
  status public.order_status not null default 'pending',
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  is_recurring boolean not null default false,
  recurrence_rule text,                     -- e.g. 'DAILY', 'WEEKDAYS', RRULE string
  scheduled_for date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_customer on public.orders (customer_id);
create index if not exists idx_orders_visitor on public.orders (visitor_id);
create index if not exists idx_orders_status on public.orders (status);

-- ----------------------------------------------------------------------------
-- 9. order_item — line items per order
-- ----------------------------------------------------------------------------
create table if not exists public.order_item (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  visitor_service_id bigint not null references public.visitor_service(id) on delete restrict,
  quantity numeric(8,2) not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  line_total numeric(10,2) generated always as (quantity * unit_price) stored
);

create index if not exists idx_order_item_order on public.order_item (order_id);

-- ----------------------------------------------------------------------------
-- 10. order_status_history — audit trail for tracking
-- ----------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  changed_by bigint references public."user"(id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_status_history_order on public.order_status_history (order_id);

-- Auto-log status changes
create or replace function public.log_order_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, null);
  end if;
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_log_order_status_insert on public.orders;
create trigger trg_log_order_status_insert
  after insert on public.orders
  for each row execute function public.log_order_status_change();

drop trigger if exists trg_log_order_status_update on public.orders;
create trigger trg_log_order_status_update
  before update of status on public.orders
  for each row execute function public.log_order_status_change();

-- ----------------------------------------------------------------------------
-- 11. review — customer rates visitor after a completed order
-- ----------------------------------------------------------------------------
create table if not exists public.review (
  id bigint generated always as identity primary key,
  order_id bigint not null unique references public.orders(id) on delete cascade,
  customer_id bigint not null references public."user"(id) on delete cascade,
  visitor_id bigint not null references public.visitor_profile(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_review_visitor on public.review (visitor_id);

-- Keep visitor_profile.rating_avg / rating_count in sync
create or replace function public.refresh_visitor_rating()
returns trigger language plpgsql as $$
begin
  update public.visitor_profile vp
  set rating_count = sub.cnt,
      rating_avg = sub.avg_rating
  from (
    select visitor_id, count(*) as cnt, avg(rating)::numeric(3,2) as avg_rating
    from public.review
    where visitor_id = coalesce(new.visitor_id, old.visitor_id)
    group by visitor_id
  ) sub
  where vp.id = sub.visitor_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_visitor_rating on public.review;
create trigger trg_refresh_visitor_rating
  after insert or update or delete on public.review
  for each row execute function public.refresh_visitor_rating();

-- ----------------------------------------------------------------------------
-- 12. favorite — customer bookmarks a visitor
-- ----------------------------------------------------------------------------
create table if not exists public.favorite (
  id bigint generated always as identity primary key,
  customer_id bigint not null references public."user"(id) on delete cascade,
  visitor_id bigint not null references public.visitor_profile(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (customer_id, visitor_id)
);

-- ----------------------------------------------------------------------------
-- 13. notification — in-app notifications for any role
-- ----------------------------------------------------------------------------
create table if not exists public.notification (
  id bigint generated always as identity primary key,
  user_id bigint not null references public."user"(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'general',     -- 'order_update', 'approval', 'system', ...
  related_order_id bigint references public.orders(id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notification_user on public.notification (user_id, is_read);

-- ----------------------------------------------------------------------------
-- 14. visitor_document — profile verification (ID, license, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.visitor_document (
  id bigint generated always as identity primary key,
  visitor_id bigint not null references public.visitor_profile(id) on delete cascade,
  doc_type text not null,                   -- 'cnic', 'license', 'photo'
  file_url text not null,
  verified boolean not null default false,
  reviewed_by bigint references public."user"(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 15. audit_log — admin/system action trail
-- ----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id bigint references public."user"(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id bigint,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- ----------------------------------------------------------------------------
-- 16. Helper function: nearby visitors (used by the app for proximity search)
-- ----------------------------------------------------------------------------
create or replace function public.nearby_visitors(
  in_lat double precision,
  in_long double precision,
  radius_km double precision default 5
)
returns table (
  user_id bigint,
  name text,
  lat numeric,
  long numeric,
  distance_km double precision,
  visitor_profile_id bigint,
  rating_avg numeric,
  is_available boolean
)
language sql stable as $$
  select
    u.id,
    u.name,
    u.lat,
    u.long,
    ST_Distance(
      u.geo_point,
      ST_SetSRID(ST_MakePoint(in_long, in_lat), 4326)::geography
    ) / 1000.0 as distance_km,
    vp.id,
    vp.rating_avg,
    vp.is_available
  from public."user" u
  join public.visitor_profile vp on vp.user_id = u.id
  where u.role = 'visitor'
    and vp.status = 'approved'
    and vp.is_available = true
    and u.geo_point is not null
    and ST_DWithin(
      u.geo_point,
      ST_SetSRID(ST_MakePoint(in_long, in_lat), 4326)::geography,
      radius_km * 1000
    )
  order by distance_km asc;
$$;
