import { connectToDatabase } from '@/lib/db'
import { PushSubscription } from '@/models'
import { requireSession } from '@/lib/auth'
import { getChannelToggles, saveChannelToggles } from '@/lib/notification-settings'
import { describeChannelReadiness, vapidPublicKey } from '@/lib/notifications/config'
import { notificationSettingsSchema, toFieldErrors } from '@/lib/validators'
import { fail, ok, readJson, serverError, unauthorized } from '@/lib/api'
import type { NotificationSettingsDTO, PushDeviceDTO } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Settings -> Notifications.
 *
 * Deliberately separate from `/api/admin/settings`, which saves the whole
 * SiteSettings document from the SEO screen. Two screens writing the same
 * singleton with a full-document `set()` would each undo the other's changes;
 * this route only ever touches the three `notifications.*` paths.
 */

export async function GET() {
  try {
    if (!(await requireSession())) return unauthorized()

    await connectToDatabase()
    return ok(await buildPayload())
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const parsed = notificationSettingsSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('Please check the form for errors.', 422, toFieldErrors(parsed.error))
    }

    await connectToDatabase()
    await saveChannelToggles(parsed.data)

    // Nothing to revalidate: the toggles never reach the public page, and the
    // contact route reads them uncached, so the next submission already sees
    // the new values.
    return ok(await buildPayload())
  } catch (err) {
    return serverError(err)
  }
}

/**
 * The screen needs three things at once: the stored switches, whether each
 * channel has credentials, and which devices are subscribed. Sending them
 * together keeps the UI a single fetch and avoids a half-rendered state where
 * a toggle shows before anyone knows if it can work.
 */
async function buildPayload(): Promise<NotificationSettingsDTO> {
  const [toggles, devices] = await Promise.all([
    getChannelToggles(),
    PushSubscription.find().sort({ createdAt: -1 }).limit(50).lean(),
  ])

  return {
    toggles,
    channels: describeChannelReadiness(),
    push: {
      publicKey: vapidPublicKey(),
      devices: devices.map(serializeDevice),
    },
  }
}

/**
 * Never returns `endpoint` or the key material. The admin has no use for
 * either, and an endpoint is a capability URL — anyone holding it can push to
 * that browser.
 */
function serializeDevice(doc: {
  _id: unknown
  label?: string | null
  createdAt?: Date | null
  lastSuccessAt?: Date | null
}): PushDeviceDTO {
  return {
    id: String(doc._id),
    label: doc.label || 'Unnamed device',
    createdAt: (doc.createdAt ?? new Date(0)).toISOString(),
    lastSuccessAt: doc.lastSuccessAt ? doc.lastSuccessAt.toISOString() : null,
  }
}
