import { requireSession } from '@/lib/auth'
import { getDashboardStats } from '@/lib/stats'
import { ok, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** JSON counterpart of the dashboard; both read from `getDashboardStats`. */
export async function GET() {
  try {
    if (!(await requireSession())) return unauthorized()
    return ok(await getDashboardStats())
  } catch (err) {
    return serverError(err)
  }
}
