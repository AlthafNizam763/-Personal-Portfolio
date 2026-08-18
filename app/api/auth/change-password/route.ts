import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { hashPassword, verifyPassword } from '@/lib/password'
import { createSessionCookie, getSession, signSession } from '@/lib/auth'
import { changePasswordSchema, toFieldErrors } from '@/lib/validators'
import { fail, ok, readJson, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Changing the password bumps `tokenVersion`, invalidating every session
 * issued before now. The current device is immediately re-issued a fresh
 * cookie so the admin is not logged out of the tab they are working in.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return unauthorized()

    const parsed = changePasswordSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('Please check the details you entered.', 422, toFieldErrors(parsed.error))
    }

    const { currentPassword, newPassword } = parsed.data

    await connectToDatabase()
    const user = await User.findById(session.sub)
    if (!user) return unauthorized()

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return fail('Your current password is incorrect.', 422, {
        currentPassword: ['Your current password is incorrect.'],
      })
    }

    if (await verifyPassword(newPassword, user.passwordHash)) {
      return fail('The new password must be different from the current one.', 422, {
        newPassword: ['The new password must be different from the current one.'],
      })
    }

    user.passwordHash = await hashPassword(newPassword)
    user.tokenVersion = (user.tokenVersion ?? 0) + 1
    await user.save()

    const token = await signSession({
      sub: String(user._id),
      email: user.email,
      name: user.name ?? 'Administrator',
      role: 'admin',
      tv: user.tokenVersion,
    })
    await createSessionCookie(token)

    return ok({ changed: true })
  } catch (err) {
    return serverError(err)
  }
}
