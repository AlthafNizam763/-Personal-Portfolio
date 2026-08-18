import { cookies } from 'next/headers'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySessionToken,
  type SessionPayload,
} from './jwt'

/**
 * Node-runtime session helpers for route handlers and server components.
 * The Edge-compatible signing/verification primitives live in `lib/jwt.ts`.
 */

export { SESSION_COOKIE, signSession, verifySessionToken }
export type { SessionPayload }

/** Reads and verifies the session from the incoming request's cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

export async function createSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/**
 * Guard for API route handlers. `middleware.ts` already blocks unauthenticated
 * requests to /api/admin/*; this is a second, independent check so a route is
 * never left open if the middleware matcher is edited later.
 */
export async function requireSession(): Promise<SessionPayload | null> {
  return getSession()
}

/**
 * Fixed-window rate limiter for the login endpoint.
 *
 * In-memory, so on serverless it only constrains a single warm container —
 * enough to blunt naive credential stuffing, not a substitute for a WAF or an
 * Upstash-backed limiter if you need hard guarantees.
 */
const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkLoginRateLimit(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
  const now = Date.now()

  // Opportunistic sweep so the map cannot grow without bound.
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k)
  }

  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  entry.count += 1
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 }
}

export function clearLoginRateLimit(key: string) {
  attempts.delete(key)
}
