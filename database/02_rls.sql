-- ============================================================================
-- Daily Vistory — Row Level Security policies
-- Assumes Supabase Auth: auth.uid() returns the logged-in auth.users.id.
-- public."user".auth_id links a profile row to that auth user.
-- We expose a SQL helper to read the caller's profile id + role cheaply.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Helper functions (security definer, used inside policies)
-- ----------------------------------------------------------------------------
create or replace function public.current_user_id()
returns bigint
language sql security definer stable
set search_path = public
as $$
  select id from public."user" where auth_id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql security definer stable
set search_path = public
as $$
  select role from public."user" where auth_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public
as $$ select public.current_user_role() = 'admin'; $$;

create or replace function public.current_visitor_profile_id()
returns bigint language sql security definer stable
set search_path = public
as $$
  select id from public.visitor_profile where user_id = public.current_user_id();
$$;

-- ----------------------------------------------------------------------------
-- 1. public.user
-- ----------------------------------------------------------------------------
alter table public."user" enable row level security;

drop policy if exists "user_select_own_or_admin" on public."user";
create policy "user_select_own_or_admin" on public."user"
  for select using (
    auth_id = auth.uid() or public.is_admin()
  );

-- Approved, available visitors are publicly viewable (so customers can browse)
drop policy if exists "user_select_public_visitors" on public."user";
create policy "user_select_public_visitors" on public."user"
  for select using (
    role = 'visitor' and exists (
      select 1 from public.visitor_profile vp
      where vp.user_id = "user".id and vp.status = 'approved'
    )
  );

drop policy if exists "user_insert_self" on public."user";
create policy "user_insert_self" on public."user"
  for insert with check (auth_id = auth.uid());

drop policy if exists "user_update_own_or_admin" on public."user";
create policy "user_update_own_or_admin" on public."user"
  for update using (auth_id = auth.uid() or public.is_admin());

drop policy if exists "user_delete_admin_only" on public."user";
create policy "user_delete_admin_only" on public."user"
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 2. service_category — public read, admin write
-- ----------------------------------------------------------------------------
alter table public.service_category enable row level security;

drop policy if exists "category_select_all" on public.service_category;
create policy "category_select_all" on public.service_category
  for select using (true);

drop policy if exists "category_write_admin" on public.service_category;
create policy "category_write_admin" on public.service_category
  for all using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. visitor_profile
-- ----------------------------------------------------------------------------
alter table public.visitor_profile enable row level security;

drop policy if exists "visitor_profile_select" on public.visitor_profile;
create policy "visitor_profile_select" on public.visitor_profile
  for select using (
    status = 'approved'
    or user_id = public.current_user_id()
    or public.is_admin()
  );

drop policy if exists "visitor_profile_insert_self" on public.visitor_profile;
create policy "visitor_profile_insert_self" on public.visitor_profile
  for insert with check (user_id = public.current_user_id());

drop policy if exists "visitor_profile_update" on public.visitor_profile;
create policy "visitor_profile_update" on public.visitor_profile
  for update using (user_id = public.current_user_id() or public.is_admin());

drop policy if exists "visitor_profile_delete_admin" on public.visitor_profile;
create policy "visitor_profile_delete_admin" on public.visitor_profile
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. visitor_service — public read (active), visitor manages own, admin all
-- ----------------------------------------------------------------------------
alter table public.visitor_service enable row level security;

drop policy if exists "visitor_service_select" on public.visitor_service;
create policy "visitor_service_select" on public.visitor_service
  for select using (
    is_active = true
    or visitor_id = public.current_visitor_profile_id()
    or public.is_admin()
  );

drop policy if exists "visitor_service_write_own" on public.visitor_service;
create policy "visitor_service_write_own" on public.visitor_service
  for all using (
    visitor_id = public.current_visitor_profile_id() or public.is_admin()
  ) with check (
    visitor_id = public.current_visitor_profile_id() or public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 5. visitor_availability — visitor manages own, public read
-- ----------------------------------------------------------------------------
alter table public.visitor_availability enable row level security;

drop policy if exists "availability_select_all" on public.visitor_availability;
create policy "availability_select_all" on public.visitor_availability
  for select using (true);

drop policy if exists "availability_write_own" on public.visitor_availability;
create policy "availability_write_own" on public.visitor_availability
  for all using (
    visitor_id = public.current_visitor_profile_id() or public.is_admin()
  ) with check (
    visitor_id = public.current_visitor_profile_id() or public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 6. customer_address — owner only, admin all
-- ----------------------------------------------------------------------------
alter table public.customer_address enable row level security;

drop policy if exists "address_owner_all" on public.customer_address;
create policy "address_owner_all" on public.customer_address
  for all using (
    customer_id = public.current_user_id() or public.is_admin()
  ) with check (
    customer_id = public.current_user_id() or public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 7. orders — customer sees own, visitor sees own assigned, admin all
-- ----------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (
    customer_id = public.current_user_id()
    or visitor_id = public.current_visitor_profile_id()
    or public.is_admin()
  );

drop policy if exists "orders_insert_customer" on public.orders;
create policy "orders_insert_customer" on public.orders
  for insert with check (
    customer_id = public.current_user_id() or public.is_admin()
  );

-- Customer can update own order (e.g. cancel); visitor can update status of orders assigned to them
drop policy if exists "orders_update" on public.orders;
create policy "orders_update" on public.orders
  for update using (
    customer_id = public.current_user_id()
    or visitor_id = public.current_visitor_profile_id()
    or public.is_admin()
  );

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. order_item — follow parent order visibility
-- ----------------------------------------------------------------------------
alter table public.order_item enable row level security;

drop policy if exists "order_item_select" on public.order_item;
create policy "order_item_select" on public.order_item
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_item.order_id
        and (
          o.customer_id = public.current_user_id()
          or o.visitor_id = public.current_visitor_profile_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "order_item_write" on public.order_item;
create policy "order_item_write" on public.order_item
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_item.order_id
        and (o.customer_id = public.current_user_id() or public.is_admin())
    )
  ) with check (
    exists (
      select 1 from public.orders o
      where o.id = order_item.order_id
        and (o.customer_id = public.current_user_id() or public.is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- 9. order_status_history — read-only to involved parties
-- ----------------------------------------------------------------------------
alter table public.order_status_history enable row level security;

drop policy if exists "order_status_history_select" on public.order_status_history;
create policy "order_status_history_select" on public.order_status_history
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and (
          o.customer_id = public.current_user_id()
          or o.visitor_id = public.current_visitor_profile_id()
          or public.is_admin()
        )
    )
  );

drop policy if exists "order_status_history_insert" on public.order_status_history;
create policy "order_status_history_insert" on public.order_status_history
  for insert with check (true); -- inserts come from trigger / server role

-- ----------------------------------------------------------------------------
-- 10. review — customer who owns the order can write, everyone can read
-- ----------------------------------------------------------------------------
alter table public.review enable row level security;

drop policy if exists "review_select_all" on public.review;
create policy "review_select_all" on public.review
  for select using (true);

drop policy if exists "review_insert_customer" on public.review;
create policy "review_insert_customer" on public.review
  for insert with check (customer_id = public.current_user_id());

drop policy if exists "review_update_own" on public.review;
create policy "review_update_own" on public.review
  for update using (customer_id = public.current_user_id() or public.is_admin());

drop policy if exists "review_delete_admin" on public.review;
create policy "review_delete_admin" on public.review
  for delete using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. favorite — owner only
-- ----------------------------------------------------------------------------
alter table public.favorite enable row level security;

drop policy if exists "favorite_owner_all" on public.favorite;
create policy "favorite_owner_all" on public.favorite
  for all using (
    customer_id = public.current_user_id() or public.is_admin()
  ) with check (
    customer_id = public.current_user_id() or public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 12. notification — owner only
-- ----------------------------------------------------------------------------
alter table public.notification enable row level security;

drop policy if exists "notification_owner_select" on public.notification;
create policy "notification_owner_select" on public.notification
  for select using (
    user_id = public.current_user_id() or public.is_admin()
  );

drop policy if exists "notification_owner_update" on public.notification;
create policy "notification_owner_update" on public.notification
  for update using (user_id = public.current_user_id() or public.is_admin());

drop policy if exists "notification_insert_admin_or_system" on public.notification;
create policy "notification_insert_admin_or_system" on public.notification
  for insert with check (true); -- typically inserted by server-side service role

-- ----------------------------------------------------------------------------
-- 13. visitor_document — owner + admin
-- ----------------------------------------------------------------------------
alter table public.visitor_document enable row level security;

drop policy if exists "visitor_document_select" on public.visitor_document;
create policy "visitor_document_select" on public.visitor_document
  for select using (
    visitor_id = public.current_visitor_profile_id() or public.is_admin()
  );

drop policy if exists "visitor_document_write_own" on public.visitor_document;
create policy "visitor_document_write_own" on public.visitor_document
  for insert with check (visitor_id = public.current_visitor_profile_id());

drop policy if exists "visitor_document_update_admin" on public.visitor_document;
create policy "visitor_document_update_admin" on public.visitor_document
  for update using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 14. audit_log — admin only
-- ----------------------------------------------------------------------------
alter table public.audit_log enable row level security;

drop policy if exists "audit_log_admin_only" on public.audit_log;
create policy "audit_log_admin_only" on public.audit_log
  for select using (public.is_admin());

drop policy if exists "audit_log_insert_system" on public.audit_log;
create policy "audit_log_insert_system" on public.audit_log
  for insert with check (true); -- written by server-side service role only
