import { connectToDatabase } from '@/lib/db'
import { Message } from '@/models'
import { contactSchema, toFieldErrors } from '@/lib/validators'
import { fail, getClientIp, ok, readJson, serverError } from '@/lib/api'
import { checkLoginRateLimit } from '@/lib/auth'
import { sendContactNotifications, toSummary, type NotificationOutcome } from '@/lib/notifications'
import { getChannelToggles } from '@/lib/notification-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public endpoint behind the portfolio's contact form. Submissions land in
 * Admin -> Messages.
 *
 * Order of operations — validate, save, read the owner's notification
 * settings, then notify. Every notification is strictly downstream of a
 * successful write, so a rejected or unsaved submission never produces an
 * email, a WhatsApp message or a push. The fan-out is awaited (the visitor's
 * success animation should not start before the notifications have been handed
 * to the providers) but it can never fail the request:
 * `sendContactNotifications` swallows provider errors and reports them as a
 * per-channel status instead.
 *
 * The switches themselves are read fresh on every submission — that is what
 * makes a toggle flipped in the admin panel apply to the very next message.
 */
export async function POST(req: Request) {
  try {
    const parsed = contactSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error)
      const first = Object.values(fieldErrors)[0]?.[0]
      return fail(first ?? 'Please check the form and try again.', 422, fieldErrors)
    }

    const { name, email, phone, subject, website, message, company } = parsed.data

    // Honeypot tripped — accept the request so the bot sees success, but do
    // not store anything (and therefore do not notify anyone either).
    if (company) return ok({ received: true })

    const ip = getClientIp(req)
    // Reuses the fixed-window limiter: 5 messages per IP per 10 minutes.
    const limit = checkLoginRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)
    if (!limit.allowed) {
      return fail('You have sent several messages already. Please try again later.', 429)
    }

    await connectToDatabase()
    const saved = await Message.create({
      name,
      email,
      phone,
      subject,
      website,
      message,
      ip,
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? '',
    })

    // --- saved; from here on nothing may turn the response into an error ---

    const outcome = await sendContactNotifications(
      {
        name,
        email,
        phone,
        subject,
        website,
        message,
        submittedAt: saved.createdAt ?? new Date(),
        messageId: String(saved._id),
      },
      await getChannelToggles()
    )

    await recordNotificationOutcome(String(saved._id), outcome)

    // Statuses only — no addresses, tokens or provider payloads cross the
    // wire. Useful when checking the wiring from the browser's network tab.
    return ok({ received: true, notifications: toSummary(outcome) }, undefined, 201)
  } catch (err) {
    return serverError(err)
  }
}

/**
 * Stamps the delivery result onto the message so an undelivered notification
 * is visible in the database, not just in the function log. Best effort: a
 * failure here must not cost the visitor their confirmation.
 */
async function recordNotificationOutcome(id: string, outcome: NotificationOutcome) {
  const error = Object.values(outcome)
    .filter((result) => result.error)
    .map((result) => `${result.channel}: ${result.error}`)
    .join(' | ')

  try {
    await Message.updateOne(
      { _id: id },
      {
        $set: {
          'notifications.email': outcome.email.status,
          'notifications.whatsapp': outcome.whatsapp.status,
          'notifications.push': outcome.push.status,
          'notifications.attemptedAt': new Date(),
          'notifications.error': error.slice(0, 500),
        },
      }
    )
  } catch (err) {
    console.error('[notify] could not record delivery status:', (err as Error).message)
  }
}
