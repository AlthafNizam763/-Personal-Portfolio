import { destroySessionCookie } from '@/lib/auth'
import { ok, serverError } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    await destroySessionCookie()
    return ok({ signedOut: true })
  } catch (err) {
    return serverError(err)
  }
}
