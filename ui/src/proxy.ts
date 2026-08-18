import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: always call getUser() so the session cookie is refreshed on
  // every request. Never skip this call inside proxy.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const { pathname } = url

  // ── Route classifications ─────────────────────────────────────────────────
  const isCandidateRoute = pathname.startsWith('/dashboard')
  const isEmployerRoute  = pathname.startsWith('/employer')
  const isProtectedRoute = isCandidateRoute || isEmployerRoute

  // Auth-only pages — redirect authenticated users away so they don't see them
  const isAuthPage = pathname === '/login' || pathname.startsWith('/register')

  // ── Unauthenticated: block protected routes ───────────────────────────────
  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Authenticated: role-based routing ─────────────────────────────────────
  if (user) {
    // Redirect away from auth pages — they already have a session
    if (isAuthPage) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = roleData?.role
      url.pathname = role === 'employer' ? '/employer' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Cross-role access protection (only for protected routes)
    if (isProtectedRoute) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = roleData?.role

      if (isCandidateRoute && role === 'employer') {
        url.pathname = '/employer'
        return NextResponse.redirect(url)
      }

      if (isEmployerRoute && role === 'candidate') {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Redirect authenticated users from landing page to their dashboard
    if (pathname === '/') {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = roleData?.role
      if (role === 'employer' || role === 'candidate') {
        url.pathname = role === 'employer' ? '/employer' : '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
