import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/jwt'

/**
 * Route protection for the admin area.
 *
 * The public portfolio is deliberately untouched — this only matches /admin
 * and /api/admin. Runs on the Edge runtime, so it verifies the session JWT
 * with `jose` and never touches Mongoose or bcrypt.
 */

const LOGIN_PATH = '/admin/login'

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = await verifySessionToken(token)

  const isApi = pathname.startsWith('/api/admin')
  const isLoginPage = pathname === LOGIN_PATH

  // Already signed in and visiting the login page -> go to the dashboard.
  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  if (session) return NextResponse.next()

  // ---- unauthenticated ----
  if (isApi) {
    // APIs get a 401 rather than an HTML redirect so fetch() callers can react.
    return NextResponse.json(
      { ok: false, error: 'You must be signed in to perform this action.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const loginUrl = new URL(LOGIN_PATH, req.url)
  // Remember where the user was heading so login can send them back.
  const target = `${pathname}${search}`
  if (target && target !== '/admin') loginUrl.searchParams.set('next', target)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
