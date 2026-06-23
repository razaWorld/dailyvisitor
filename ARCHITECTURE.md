# Daily Vistory — Architecture & Design

## 1. Recommended Architecture

- **Frontend & API**: Next.js App Router, deployed serverless (Vercel-style).
  Server Components fetch data directly via Supabase server client; Route
  Handlers (`app/api/**/route.ts`) handle writes that need elevated privilege
  (service role) such as visitor approval or notification dispatch.
- **Database & Auth**: Supabase Postgres + Supabase Auth (`auth.users`).
  `public.user` becomes a **profile table** linked 1:1 to `auth.users` via
  `auth_id`, instead of storing plaintext passwords. PostGIS powers
  proximity search (`nearby_visitors()` SQL function).
- **Maps**: Leaflet/react-leaflet, dynamically imported with `ssr: false`
  everywhere it's used, since Leaflet touches `window`/`document` and breaks
  in serverless SSR otherwise.
- **Realtime (optional, recommended)**: Supabase Realtime channels on
  `orders` so visitors/customers see live order-status updates.

## 2. Why Supabase Auth instead of the custom `password` column

The original `user.password` column stored plaintext credentials — a serious
security risk. Supabase Auth:
- Hashes and stores credentials securely in `auth.users`.
- Gives you `auth.uid()` inside RLS policies for free, so every table's
  security boils down to "does this row belong to `auth.uid()`'s profile?"
- Handles email confirmation, password reset, and session refresh
  (`@supabase/ssr` cookies) out of the box.

Migration path implemented in `database/01_schema.sql`:
1. Add `user.auth_id uuid references auth.users(id)`.
2. Backfill: for each existing row, create an `auth.users` record (e.g. via
   `supabase.auth.admin.createUser` in a one-off script) and set `auth_id`.
3. Drop the `password` column once backfilled.

## 3. Database Tables (beyond `user`)

| Table | Purpose |
|---|---|
| `service_category` | Admin-managed catalog: milk, eggs, fruits, etc. |
| `visitor_profile` | Visitor-specific data: approval status, radius, rating |
| `visitor_service` | Pricing per visitor per category |
| `visitor_availability` | Weekly working hours |
| `visitor_document` | Verification documents (CNIC, license, photo) |
| `customer_address` | Saved delivery addresses |
| `orders` | Customer requests assigned to a visitor |
| `order_item` | Line items per order |
| `order_status_history` | Audit trail for tracking (auto-logged via trigger) |
| `review` | Ratings/reviews, auto-aggregated into `visitor_profile.rating_avg` |
| `favorite` | Customer-bookmarked visitors |
| `notification` | In-app notifications |
| `audit_log` | Admin/system action trail |

Full SQL with constraints, indexes, enums, and triggers: `database/01_schema.sql`.
RLS policies: `database/02_rls.sql`.

## 4. Folder Structure

```
app/
  page.tsx                  landing page
  login/page.tsx            Supabase Auth sign-in
  signup/page.tsx           Supabase Auth sign-up + role + MapPicker
  unauthorized/page.tsx
  admin/dashboard/page.tsx  server component, role-gated by middleware
  customer/
    dashboard/page.tsx
    nearby/page.tsx         MapPicker + useNearbyVisitors hook
  visitor/dashboard/page.tsx
  api/orders/route.ts       example route handler
middleware.ts                refreshes session + enforces role-based routing
src/
  lib/supabase/
    client.ts                browser client (Client Components)
    server.ts                server client (Server Components/Route Handlers)
                              + createServiceClient() for trusted admin ops
    middleware.ts             session refresh helper used by middleware.ts
  lib/hooks/useNearbyVisitors.ts
  components/map/
    LeafletMapInner.tsx       'use client', actual react-leaflet code
    MapPicker.tsx             public API, dynamic(ssr:false) wrapper
  types/database.ts
database/
  01_schema.sql
  02_rls.sql
```

**Server vs Client Components**: dashboards (`admin`, `customer`, `visitor`)
are Server Components that fetch with the server Supabase client — no
client-side waterfall, fast first paint, safe to read RLS-protected data.
Anything interactive (forms, map clicks, live filters) is a Client Component
(`'use client'`), e.g. `signup/page.tsx`, `login/page.tsx`,
`customer/nearby/page.tsx`, and the map components.

## 5. Leaflet Integration

- `LeafletMapInner.tsx` contains the actual `react-leaflet` `MapContainer`,
  `TileLayer` (OpenStreetMap tiles), click handling, and marker rendering.
- `MapPicker.tsx` wraps it with `next/dynamic(() => import('./LeafletMapInner'), { ssr: false })`
  so Leaflet never executes during the Next.js server render — this is what
  makes it safe in serverless mode.
- `MapPicker` is reusable: pass `onChange` for pick-a-point flows (signup,
  address forms) or `nearby` markers for the customer "find providers" map.
- Proximity filtering happens in Postgres via the `nearby_visitors()` SQL
  function (PostGIS `ST_DWithin`/`ST_Distance`), called through
  `useNearbyVisitors()` — far more efficient than filtering in JS.

## 6. Auth & Role Strategy

- **Supabase Auth** is the credential store. Roles live in `public.user.role`
  (a Postgres enum: `admin | customer | visitor`), not in JWT claims, since
  Supabase Auth's `app_metadata` requires admin-API writes — simpler to read
  the profile table directly via helper SQL functions used in RLS
  (`current_user_role()`, `is_admin()`).
- **Route protection**: `middleware.ts` runs on every request, refreshes the
  session, and for any path under `/admin`, `/customer`, `/visitor` checks
  the caller's role against the path prefix, redirecting to `/login` or
  `/unauthorized` as needed.
- **Data protection**: RLS policies are the real source of truth — middleware
  is a UX convenience, RLS is the security boundary, so even direct API/RPC
  calls stay safe.

## 7. Feature Roadmap

Implemented in schema/design:
- Order tracking (`order_status_history`, auto-logged via trigger)
- Visitor availability (`visitor_availability`)
- Ratings/reviews with auto-aggregated `rating_avg`
- Favorites
- Proximity/distance filtering (`nearby_visitors()`)
- Service categories
- Recurring orders (`orders.is_recurring`, `recurrence_rule`)
- Profile verification (`visitor_document`)
- Notifications (`notification` table)
- Admin analytics (counts wired in `admin/dashboard`; extend with charts)

Suggested next iterations:
- Realtime order updates via Supabase Realtime channel subscriptions.
- Payment integration (escrow per order) — would add a `payment` table.
- Push notifications (web push or FCM) tied to the `notification` table.
- Rate limiting on signup/login at the edge.

## 8. Naming Convention Changes Applied

- `jobType` → `job_type` (snake_case, Postgres convention)
- `password` → removed (Supabase Auth owns credentials)
- Added `auth_id`, `phone`, `avatar_url`, `is_active`, `updated_at`,
  `geo_point` (generated via trigger, indexed with GiST for fast proximity
  queries) to `user`.
