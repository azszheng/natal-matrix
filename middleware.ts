import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Supabase can be slow, paused (free-tier auto-pause after inactivity), or
// briefly unreachable. Since this middleware's matcher covers nearly every
// route, an unbounded call here previously took the ENTIRE site down with a
// 504 MIDDLEWARE_INVOCATION_TIMEOUT whenever Supabase didn't respond. Cap
// the call with a timeout and fail open (serve the page unauthenticated)
// instead of blocking the whole site on one external dependency.
const AUTH_TIMEOUT_MS = 4000;

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove, required for Supabase SSR.
  // Wrapped so a slow/unreachable Supabase degrades to "unauthenticated"
  // instead of hanging the request until the platform kills it.
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase auth check timed out')), AUTH_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.error('[middleware] Supabase auth check failed, continuing unauthenticated:', err);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
