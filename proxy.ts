import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/src/lib/supabase/middleware';

const ROLE_PREFIXES: Record<string, string> = {
  '/admin': 'admin',
  '/customer': 'customer',
  '/visitor': 'visitor',
};

export async function proxy(request: NextRequest) {
  const { response, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((p) => pathname.startsWith(p));

  if (!matchedPrefix) {
    return response; // public route (home, login, signup, etc.)
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Look up the caller's role from the profile table.
  const { data: profile } = await supabase
    .from('user')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  const requiredRole = ROLE_PREFIXES[matchedPrefix];

  if (!profile || profile.role !== requiredRole) {
    // return NextResponse.redirect(new URL('/unauthorized', request.url));
    return NextResponse.redirect(new URL( request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
};