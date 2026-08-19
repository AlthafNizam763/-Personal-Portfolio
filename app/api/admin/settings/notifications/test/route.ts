import { connectToDatabase } from '@/lib/db'
import { checkLoginRateLimit, requireSession } from '@/lib/auth'
import { getChannelToggles } from '@/lib/notification-settings'
import { sendContactNotifications } from '@/lib/notifications'
import { fail, ok, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Fires a sample notification through the currently enabled channels, so the
 * owner can prove the wiring works without waiting for a real visitor.
 *
 * Nothing is written to Messages — this is a delivery test, not a submission.
 * The response carries each channel's status *and* its error text, which is
 * safe here in a way it is not on the public contact endpoint: the caller is
 * an authenticated admin, and provider errors never echo a credential.
 */
export async function POST() {
  try {
    const session = await requireSession()
    if (!session) return unauthorized()

    // A test send costs real email/WhatsApp quota, so cap it well below
    // anything a person would do by hand.
    const limit = checkLoginRateLimit(`notify-test:${session.sub}`, 5, 5 * 60 * 1000)
    if (!limit.allowed) {
      return fail('Too many test notifications. Please wait a few minutes.', 429)
    }

    await connectToDatabase()
    const toggles = await getChannelToggles()

    const outcome = await sendContactNotifications(
      {
        name: 'Test Visitor',
        email: 'test-visitor@example.com',
        phone: '+91 90000 00000',
        subject: 'Notification test',
        website: 'example.com',
        message:
          'This is a test notification sent from Settings -> Notifications. ' +
          'If you can read it, this channel is working.',
        submittedAt: new Date(),
      },
      toggles
    )

    return ok({
      results: Object.values(outcome).map((result) => ({
        channel: result.channel,
        status: result.status,
        error: result.error ?? null,
        delivered: result.delivered ?? null,
      })),
    })
  } catch (err) {
    return serverError(err)
  }
}
