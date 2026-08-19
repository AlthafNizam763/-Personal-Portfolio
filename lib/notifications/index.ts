/**
 * Contact-form notification service.
 *
 * Public entry point: `sendContactNotifications()`. It fans out to every
 * channel in parallel and *never throws* — a dead provider must not turn a
 * saved message into a 500 for the visitor, who has already done their part.
 *
 * Channels are independent. Each one is gated by the admin panel's toggle
 * (Settings -> Notifications, stored in `SiteSettings.notifications`) and then
 * by its own credentials, so email can be live while WhatsApp is off with no
 * code change. The caller supplies the toggles because it already owns the
 * database connection; see `getChannelToggles()` in lib/notification-settings.
 *
 * Server-only. Nothing here may be imported from a client component — the
 * credentials it reads must never reach the browser bundle. The guard below
 * makes that a loud failure rather than a silent leak (the `server-only`
 * package would do the same at build time, but it is not a dependency here).
 */

import { sendEmailNotification } from './channels/email'
import { sendPushNotification } from './channels/push'
import { sendWhatsAppNotification } from './channels/whatsapp'
import {
  ALL_CHANNELS_ON,
  type ChannelName,
  type ChannelResult,
  type ChannelToggles,
  type ContactNotification,
  type NotificationOutcome,
} from './types'

export type {
  ChannelName,
  ChannelResult,
  ChannelStatus,
  ChannelToggles,
  ContactNotification,
  NotificationOutcome,
  NotificationSummary,
} from './types'
export { ALL_CHANNELS_ON, CHANNEL_NAMES, toSummary } from './types'

if (typeof window !== 'undefined') {
  throw new Error('lib/notifications is server-only and must not be bundled for the browser.')
}

/**
 * Dispatches one submission to every enabled channel.
 *
 * Call this only once the message has been persisted — the contract in the
 * route is "saved, then notified", so a failed save sends nothing. Omitting
 * `toggles` treats every channel as switched on, which is what the CLI test
 * script wants; the contact route always passes the stored settings.
 */
export async function sendContactNotifications(
  payload: ContactNotification,
  toggles: ChannelToggles = ALL_CHANNELS_ON
): Promise<NotificationOutcome> {
  const [email, whatsapp, push] = await Promise.all([
    guard('email', () => sendEmailNotification(payload, toggles.email)),
    guard('whatsapp', () => sendWhatsAppNotification(payload, toggles.whatsapp)),
    guard('push', () => sendPushNotification(payload, toggles.push)),
  ])

  const outcome: NotificationOutcome = { email, whatsapp, push }
  logOutcome(outcome)
  return outcome
}

/**
 * Belt-and-braces: the channels already catch provider errors, but a bug in
 * formatting or config parsing would otherwise reject the whole `Promise.all`
 * and bubble into the route.
 */
async function guard(
  channel: ChannelName,
  run: () => Promise<ChannelResult>
): Promise<ChannelResult> {
  try {
    return await run()
  } catch (err) {
    return {
      channel,
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/** One line per submission, with the failure reason when there is one. */
function logOutcome(outcome: NotificationOutcome): void {
  const results = Object.values(outcome)

  const parts = results.map((result) => {
    const count = result.delivered ? `[${result.delivered.ok}/${result.delivered.total}]` : ''
    const reason = result.error ? ` (${result.error})` : ''
    return `${result.channel}=${result.status}${count}${reason}`
  })

  const failed = results.some(
    (result) => result.status === 'failed' || result.status === 'misconfigured'
  )
  const line = `[notify] contact ${parts.join(' ')}`
  if (failed) console.error(line)
  else console.info(line)
}
