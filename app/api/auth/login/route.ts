import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { verifyPassword } from '@/lib/password'
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  createSessionCookie,
  signSession,
} from '@/lib/auth'
import { loginSchema, toFieldErrors } from '@/lib/validators'
import { fail, getClientIp, ok, readJson, serverError } from '@/lib/api'

// bcrypt and Mongoose both need the Node runtime.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await readJson(req)
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return fail('Please check the details you entered.', 422, toFieldErrors(parsed.error))
    }

    const { email, password } = parsed.data
    const ip = getClientIp(req)

    // Limit per IP+email so one attacker cannot lock out a legitimate user by
    // hammering their address from elsewhere.
    const limit = checkLoginRateLimit(`${ip}:${email}`)
    if (!limit.allowed) {
      return fail(
        `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
        429
      )
    }

    await connectToDatabase()
    const user = await User.findOne({ email }).select('+passwordHash')

    // Identical message and comparable work for both branches, so the response
    // cannot be used to enumerate valid addresses.
    const passwordOk = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv')

    if (!user || !passwordOk) {
      return fail('Incorrect email or password.', 401)
    }

    const token = await signSession({
      sub: String(user._id),
      email: user.email,
      name: user.name ?? 'Administrator',
      role: 'admin',
      tv: user.tokenVersion ?? 0,
    })

    await createSessionCookie(token)
    clearLoginRateLimit(`${ip}:${email}`)

    user.lastLoginAt = new Date()
    await user.save()

    return ok({
      id: String(user._id),
      email: user.email,
      name: user.name,
    })
  } catch (err) {
    return serverError(err)
  }
}
