import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

/**
 * Edge-safe session token helpers.
 *
 * Kept free of `next/headers`, Node crypto and Mongoose so `middleware.ts`
 * (which runs on the Edge runtime) can import it. Cookie read/write lives in
 * `lib/auth.ts`, which is Node-only.
 */

export const SESSION_COOKIE = 'portfolio_admin_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const ISSUER = 'portfolio-admin'

export interface SessionPayload extends JWTPayload {
  sub: string
  email: string
  name: string
  role: 'admin'
  /** Mirrors User.tokenVersion — a password change invalidates old cookies. */
  tv: number
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET is missing or shorter than 32 characters. Set it in .env.local — see .env.example.'
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: {
  sub: string
  email: string
  name: string
  role: 'admin'
  tv: number
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setSubject(payload.sub)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER })
    return payload as SessionPayload
  } catch {
    // Expired, tampered with, or signed under a rotated AUTH_SECRET.
    return null
  }
}
