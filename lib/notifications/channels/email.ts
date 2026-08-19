/**
 * Email channel.
 *
 * Two transactional providers are supported, both plain JSON over HTTPS:
 *
 *   EMAIL_PROVIDER=resend    (default) — https://resend.com
 *   EMAIL_PROVIDER=sendgrid            — https://sendgrid.com
 *
 * Adding a third means adding one `send*` function below and one branch in
 * `sendEmailNotification` — nothing outside this file changes.
 *
 * The visitor's address becomes the Reply-To, so answering the notification in
 * your inbox replies to them rather than to the sending domain.
 */

import { notifyTimeoutMs, resolveEmailConfig, type EmailConfig } from '../config'
import { buildEmailHtml, buildEmailSubject, buildEmailText } from '../format'
import { pickString, postToProvider, ProviderError } from '../http'
import type { ChannelResult, ContactNotification } from '../types'

export async function sendEmailNotification(
  payload: ContactNotification,
  adminEnabled = true
): Promise<ChannelResult> {
  const resolved = resolveEmailConfig(adminEnabled)

  if (resolved.state === 'disabled') return { channel: 'email', status: 'disabled' }
  if (resolved.state === 'misconfigured') {
    return {
      channel: 'email',
      status: 'misconfigured',
      error: `Missing ${resolved.missing.join(', ')}`,
    }
  }

  const started = Date.now()
  try {
    const providerId =
      resolved.config.provider === 'sendgrid'
        ? await sendViaSendgrid(resolved.config, payload)
        : await sendViaResend(resolved.config, payload)

    return { channel: 'email', status: 'sent', providerId, durationMs: Date.now() - started }
  } catch (err) {
    return {
      channel: 'email',
      status: 'failed',
      error: err instanceof ProviderError ? err.message : String(err),
      durationMs: Date.now() - started,
    }
  }
}

async function sendViaResend(
  config: EmailConfig,
  payload: ContactNotification
): Promise<string | undefined> {
  const res = await postToProvider(
    'https://api.resend.com/emails',
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: config.to,
        ...(config.bcc.length > 0 ? { bcc: config.bcc } : {}),
        reply_to: payload.email,
        subject: buildEmailSubject(payload),
        html: buildEmailHtml(payload),
        text: buildEmailText(payload),
      }),
    },
    notifyTimeoutMs()
  )

  return pickString(res.body, 'id')
}

async function sendViaSendgrid(
  config: EmailConfig,
  payload: ContactNotification
): Promise<string | undefined> {
  // SendGrid wants a structured `from` rather than a display-name string.
  const from = parseAddress(config.from)

  const res = await postToProvider(
    'https://api.sendgrid.com/v3/mail/send',
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: config.to.map((email) => ({ email })),
            ...(config.bcc.length > 0
              ? { bcc: config.bcc.map((email) => ({ email })) }
              : {}),
          },
        ],
        from,
        reply_to: { email: payload.email, name: payload.name },
        subject: buildEmailSubject(payload),
        content: [
          { type: 'text/plain', value: buildEmailText(payload) },
          { type: 'text/html', value: buildEmailHtml(payload) },
        ],
      }),
    },
    notifyTimeoutMs()
  )

  // SendGrid answers 202 with an empty body; the id lives in a header we do
  // not read back, so there is simply nothing to report.
  return pickString(res.body, 'id')
}

/** `Portfolio <hi@example.com>` -> `{ name, email }`. */
function parseAddress(raw: string): { email: string; name?: string } {
  const match = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/)
  if (!match) return { email: raw.trim() }
  const [, name, email] = match
  return name ? { email: email!.trim(), name: name.replace(/^"|"$/g, '') } : { email: email!.trim() }
}
