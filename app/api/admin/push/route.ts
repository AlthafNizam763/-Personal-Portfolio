import { connectToDatabase } from '@/lib/db'
import { PushSubscription } from '@/models'
import { requireSession } from '@/lib/auth'
import { resolvePushConfig } from '@/lib/notifications/config'
import { pushSubscriptionSchema, toFieldErrors } from '@/lib/validators'
import { fail, notFound, ok, readJson, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Devices registered for browser push notifications.
 *
 * Admin-only in both directions: only a signed-in admin can add a device, and
 * the notification channel only ever pushes to devices in this collection. A
 * push endpoint is a capability URL, so it is written here and never read back
 * out — the settings API returns ids and labels only.
 */

export async function POST(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    // Refuse to store a subscription the server could never push to: the
    // browser subscribed against a VAPID key, and without the private half
    // the record is dead weight that would report `failed` forever.
    if (resolvePushConfig(true).state === 'misconfigured') {
      return fail(
        'Push notifications are not configured on the server. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, then try again.',
        503
      )
    }

    const parsed = pushSubscriptionSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('That push subscription is not valid.', 422, toFieldErrors(parsed.error))
    }

    const { endpoint, keys, label } = parsed.data
    const userAgent = req.headers.get('user-agent') ?? ''

    await connectToDatabase()

    // Upsert on the endpoint: re-subscribing the same browser yields the same
    // endpoint, so this refreshes the keys instead of piling up duplicates.
    const device = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          keys,
          label: label || describeUserAgent(userAgent),
          userAgent: userAgent.slice(0, 300),
          failureCount: 0,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean()

    return ok({ id: String(device!._id), label: device!.label }, undefined, 201)
  } catch (err) {
    return serverError(err)
  }
}

/** Removes one device by its id, as listed in Settings -> Notifications. */
export async function DELETE(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const id = new URL(req.url).searchParams.get('id')?.trim()
    if (!id || !/^[a-f\d]{24}$/i.test(id)) return fail('A device id is required.', 422)

    await connectToDatabase()
    const result = await PushSubscription.deleteOne({ _id: id })
    if (result.deletedCount === 0) return notFound('Device')

    return ok({ removed: true })
  } catch (err) {
    return serverError(err)
  }
}

/**
 * A readable device name from the User-Agent, e.g. "Chrome on Windows".
 *
 * Deliberately coarse — this only has to help the owner tell their laptop from
 * their phone in a list of three, not fingerprint anything. Order matters:
 * Edge and Opera both claim to be Chrome, and Chrome claims to be Safari.
 */
function describeUserAgent(ua: string): string {
  if (!ua) return 'Unknown device'

  const browser =
    /\bEdg\//.test(ua) ? 'Edge'
    : /\bOPR\/|\bOpera\b/.test(ua) ? 'Opera'
    : /\bFirefox\//.test(ua) ? 'Firefox'
    : /\bSamsungBrowser\//.test(ua) ? 'Samsung Internet'
    : /\bChrome\//.test(ua) ? 'Chrome'
    : /\bSafari\//.test(ua) ? 'Safari'
    : 'Browser'

  const platform =
    /\bAndroid\b/.test(ua) ? 'Android'
    : /\b(iPhone|iPad|iPod)\b/.test(ua) ? 'iOS'
    : /\bWindows\b/.test(ua) ? 'Windows'
    : /\bMac OS X\b/.test(ua) ? 'macOS'
    : /\bLinux\b/.test(ua) ? 'Linux'
    : ''

  return platform ? `${browser} on ${platform}` : browser
}
