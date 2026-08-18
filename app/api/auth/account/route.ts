import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { createSessionCookie, getSession, signSession } from '@/lib/auth'
import { toFieldErrors, updateAccountSchema } from '@/lib/validators'
import { fail, ok, readJson, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Updates the admin's display name and sign-in email. */
export async function PATCH(req: Request) {
  try {
    const session = await getSession()
    if (!session) return unauthorized()

    const parsed = updateAccountSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('Please check the details you entered.', 422, toFieldErrors(parsed.error))
    }

    const { name, email } = parsed.data

    await connectToDatabase()

    const taken = await User.findOne({ email, _id: { $ne: session.sub } })
    if (taken) {
      return fail('That email is already in use.', 422, {
        email: ['That email is already in use.'],
      })
    }

    const user = await User.findById(session.sub)
    if (!user) return unauthorized()

    user.name = name
    user.email = email
    await user.save()

    // Re-issue the cookie so the sidebar shows the new name/email right away.
    const token = await signSession({
      sub: String(user._id),
      email: user.email,
      name: user.name ?? 'Administrator',
      role: 'admin',
      tv: user.tokenVersion ?? 0,
    })
    await createSessionCookie(token)

    return ok({ id: String(user._id), name: user.name, email: user.email })
  } catch (err) {
    return serverError(err)
  }
}
