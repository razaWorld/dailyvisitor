import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Use inside Server Components, Route Handlers, and Server Actions.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without write access — safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}

// Service-role client for trusted server-only operations (admin actions,
// writing notifications/audit logs). NEVER import this in client components
// and NEVER expose SUPABASE_SERVICE_ROLE_KEY with the NEXT_PUBLIC_ prefix.
export function createServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
