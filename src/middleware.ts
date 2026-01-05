// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  const path = url.pathname

  // 1. Protected Routes (require login)
  // Exclude /admin/login from protection so users can actually log in
  // Also exclude /login and /register obviously
  const isAdminLogin = path === '/admin/login'
  const isAuthPage = path === '/login' || path === '/register' || path === '/first-access'

  // Protect /admin (but not login) and /dashboard
  const isProtectedRoute = (path.startsWith('/admin') && !isAdminLogin) || path.startsWith('/dashboard')

  if (isProtectedRoute && !user) {
    if (path.startsWith('/admin')) {
      url.pathname = '/admin/login'
    } else {
      url.pathname = '/login'
    }
    return NextResponse.redirect(url)
  }

  // 2. Admin Routes (require 'admin' role)
  if (path.startsWith('/admin') && !isAdminLogin && user) {
    // Check metadata first (fastest)
    const role = user.user_metadata?.role

    // If user is NOT admin
    if (role !== 'admin') {
      console.log(`Unauthorized access to ${path} by user ${user.id} (role: ${role})`)
      url.pathname = '/dashboard' // Redirect to user dashboard
      return NextResponse.redirect(url)
    }
  }

  // 3. Prevent logged-in users from visiting login/register (optional UX improvement)
  if ((isAuthPage || isAdminLogin) && user) {
    const role = user.user_metadata?.role
    if (role === 'admin') {
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    } else {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with a common extension (e.g., .svg, .png)
     * - /login (allow access to login page)
     * - /register (allow access to register page)
     * Feel free to modify this to your specific needs.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
