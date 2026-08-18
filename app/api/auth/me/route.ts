import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { getSession, destroySessionCookie } from '@/lib/auth'
import { ok, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Returns the signed-in admin. Also enforces token versioning: a cookie issued
 * before the last password change is rejected and cleared, which is what makes
 * "change password signs out other devices" actually work.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return unauthorized()

    await connectToDatabase()
    const user = await User.findById(session.sub)

    if (!user || (user.tokenVersion ?? 0) !== session.tv) {
      await destroySessionCookie()
      return unauthorized()
    }

    return ok({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    })
  } catch (err) {
    return serverError(err)
  }
}
