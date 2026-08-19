import { connectToDatabase } from '@/lib/db'
import { PushSubscription } from '@/models'
import { requireSession } from '@/lib/auth'
import { fail, ok, readJson, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * "Is *this* browser already registered?"
 *
 * The notifications screen knows its own push endpoint (from the service
 * worker) but not the database id, and the device list deliberately omits
 * endpoints. This answers the one question the UI needs without exposing
 * anyone else's.
 *
 * A POST rather than a GET because the endpoint is a long capability URL that
 * has no business appearing in a query string, a browser history entry or an
 * access log. It writes nothing — deleting a device in the admin panel must
 * not be undone by the next page load.
 */
export async function POST(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const body = (await readJson(req)) as { endpoint?: unknown } | null
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : ''
    if (!endpoint) return fail('An endpoint is required.', 422)

    await connectToDatabase()
    const device = await PushSubscription.findOne({ endpoint }).select('_id label').lean()

    return ok(
      device
        ? { registered: true, id: String(device._id), label: device.label }
        : { registered: false }
    )
  } catch (err) {
    return serverError(err)
  }
}
