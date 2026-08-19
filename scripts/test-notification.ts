import { loadEnv } from './load-env'

loadEnv()

import mongoose from 'mongoose'
import { connectToDatabase } from '../lib/db'
import { getChannelToggles } from '../lib/notification-settings'
import { sendContactNotifications } from '../lib/notifications'
import { ALL_CHANNELS_ON, type ChannelToggles } from '../lib/notifications/types'

/**
 * Sends a fake contact submission through the configured notification
 * channels, without writing anything to Messages.
 *
 *   npm run test-notification
 *   npm run test-notification -- "Test Visitor" you@example.com
 *
 * It reads the same switches the contact form does (Admin -> Settings ->
 * Notifications), so what you see here is what a real submission would do.
 * Every channel prints `sent`, `disabled`, `misconfigured` or `failed` with the
 * provider's own error message — the fastest way to spot a wrong sender domain
 * or an expired WhatsApp token.
 *
 * Without MONGODB_URI it still runs, assuming every switch is on; push is
 * skipped in that mode because the subscribed devices live in the database.
 */
async function main() {
  const [name = 'Test Visitor', email = 'test-visitor@example.com'] = process.argv.slice(2)

  let toggles: ChannelToggles = { ...ALL_CHANNELS_ON }
  let connected = false

  if (process.env.MONGODB_URI) {
    await connectToDatabase()
    connected = true
    toggles = await getChannelToggles()
    console.log(
      '\nSwitches from the admin panel: ' +
        Object.entries(toggles)
          .map(([channel, on]) => `${channel}=${on ? 'on' : 'off'}`)
          .join('  ')
    )
  } else {
    toggles.push = false
    console.log('\nMONGODB_URI is not set — assuming every switch is on, and skipping push.')
  }

  console.log('\nSending a test notification…\n')

  const outcome = await sendContactNotifications(
    {
      name,
      email,
      phone: '+91 90000 00000',
      subject: 'Notification pipeline test',
      website: 'https://example.com',
      message:
        'This is a test message from `npm run test-notification`. ' +
        'If you are reading it, the channel that delivered it is wired up correctly.',
      submittedAt: new Date(),
    },
    toggles
  )

  const results = [outcome.email, outcome.whatsapp, outcome.push]

  for (const result of results) {
    const icon = { sent: '✔', disabled: '·', misconfigured: '✖', failed: '✖' }[result.status]
    const suffix = result.error ? ` — ${result.error}` : ''
    const timing = result.durationMs ? ` (${result.durationMs}ms)` : ''
    const devices = result.delivered ? ` ${result.delivered.ok}/${result.delivered.total} devices` : ''
    console.log(`  ${icon} ${result.channel.padEnd(9)} ${result.status}${devices}${timing}${suffix}`)
  }

  if (connected) await mongoose.disconnect()

  const broken = results.filter(
    (result) => result.status === 'failed' || result.status === 'misconfigured'
  )

  if (broken.length > 0) {
    console.error('\n✖ At least one enabled channel is not working. See .env.example.\n')
    process.exit(1)
  }

  console.log('\n✔ Done.\n')
}

main().catch((err) => {
  console.error('\n✖ Unexpected failure:', err)
  process.exit(1)
})
