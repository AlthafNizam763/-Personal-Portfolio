/**
 * Environment-driven configuration for contact notifications.
 *
 * Every value is read at call time (never at module scope) so that a missing
 * variable can be fixed in the Vercel dashboard and picked up on the next
 * invocation, and so the CLI scripts in scripts/ can load .env.local first.
 *
 * Two switches decide whether a channel runs, and they answer different
 * questions:
 *
 *   NOTIFY_<CHANNEL>_ENABLED=false  — deployment kill switch. Nothing this
 *                                     deployment does can turn the channel on;
 *                                     useful for a staging environment that
 *                                     shares a database with production.
 *   Admin panel toggle              — the day-to-day switch, stored in
 *                                     SiteSettings.notifications and passed in
 *                                     by the caller.
 *
 * With neither blocking, the channel runs if its credentials resolve, and is
 * reported as `misconfigured` if they do not.
 *
 * Secrets never leave this file: channels receive a resolved config object,
 * and the API response only ever sees a `ChannelStatus` string.
 */

import { getSiteUrl } from '@/lib/site'

// --- primitives ------------------------------------------------------------

const env = (key: string): string => process.env[key]?.trim() ?? ''

/**
 * Deployment kill switch. Only an explicit false-y value means anything —
 * everything else, including an unset variable, defers to the admin toggle.
 */
function hardDisabled(key: string): boolean {
  return ['false', '0', 'no', 'off'].includes(env(key).toLowerCase())
}

/** Splits a comma/semicolon separated list, dropping blanks. */
function list(key: string): string[] {
  return env(key)
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function intEnv(key: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(env(key), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

// --- shared ----------------------------------------------------------------

/** Per-channel network budget. Kept well under the serverless request limit. */
export const notifyTimeoutMs = (): number => intEnv('NOTIFY_TIMEOUT_MS', 8000, 1000, 25000)

/** IANA zone used to render the submission timestamp. */
export const notifyTimezone = (): string => env('NOTIFY_TIMEZONE') || 'UTC'

// --- channel configs -------------------------------------------------------

export type EmailProvider = 'resend' | 'sendgrid'

export interface EmailConfig {
  provider: EmailProvider
  apiKey: string
  /** RFC 5322 address, optionally `Name <addr@example.com>`. */
  from: string
  /** One or more recipients — the site owner. */
  to: string[]
  /** Extra recipients, blind-copied. */
  bcc: string[]
}

export interface WhatsAppMetaConfig {
  provider: 'meta'
  accessToken: string
  phoneNumberId: string
  apiVersion: string
  /** E.164 digits (no plus, no spaces) of the owner's WhatsApp number. */
  to: string
  /**
   * Cloud API only allows free-form text inside a 24-hour customer-service
   * window, which a notification to yourself will usually be outside of. Set a
   * template name to send an approved template instead.
   */
  templateName: string
  templateLanguage: string
}

export interface WhatsAppTwilioConfig {
  provider: 'twilio'
  accountSid: string
  authToken: string
  /** Twilio's sandbox or your approved sender, channel-prefixed. */
  from: string
  /** The owner's number, channel-prefixed. */
  to: string
}

export type WhatsAppConfig = WhatsAppMetaConfig | WhatsAppTwilioConfig

export interface PushConfig {
  /** VAPID application server key pair (RFC 8292). */
  publicKey: string
  privateKey: string
  /** A mailto: or https: contact for the push service operator. */
  subject: string
  /** How long a push service should hold an undelivered message. */
  ttlSeconds: number
}

/**
 * Resolution result for one channel: either usable config, or the reason it
 * cannot run.
 */
export type Resolved<T> =
  | { state: 'ready'; config: T }
  | { state: 'disabled' }
  | { state: 'misconfigured'; missing: string[] }

function resolve<T>(
  killSwitchKey: string,
  adminEnabled: boolean,
  config: T,
  missing: string[]
): Resolved<T> {
  if (hardDisabled(killSwitchKey)) return { state: 'disabled' }
  if (!adminEnabled) return { state: 'disabled' }
  if (missing.length > 0) return { state: 'misconfigured', missing }
  return { state: 'ready', config }
}

export function resolveEmailConfig(adminEnabled = true): Resolved<EmailConfig> {
  const provider: EmailProvider =
    env('EMAIL_PROVIDER').toLowerCase() === 'sendgrid' ? 'sendgrid' : 'resend'

  const apiKeyVar = provider === 'sendgrid' ? 'SENDGRID_API_KEY' : 'RESEND_API_KEY'
  const apiKey = env(apiKeyVar)
  const from = env('NOTIFY_EMAIL_FROM')
  const to = list('NOTIFY_EMAIL_TO')

  const missing: string[] = []
  if (!apiKey) missing.push(apiKeyVar)
  if (!from) missing.push('NOTIFY_EMAIL_FROM')
  if (to.length === 0) missing.push('NOTIFY_EMAIL_TO')

  return resolve<EmailConfig>(
    'NOTIFY_EMAIL_ENABLED',
    adminEnabled,
    { provider, apiKey, from, to, bcc: list('NOTIFY_EMAIL_BCC') },
    missing
  )
}

export function resolveWhatsAppConfig(adminEnabled = true): Resolved<WhatsAppConfig> {
  const provider = env('WHATSAPP_PROVIDER').toLowerCase() === 'twilio' ? 'twilio' : 'meta'
  const to = env('WHATSAPP_TO')

  if (provider === 'twilio') {
    const accountSid = env('TWILIO_ACCOUNT_SID')
    const authToken = env('TWILIO_AUTH_TOKEN')
    const from = env('TWILIO_WHATSAPP_FROM')

    const missing: string[] = []
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID')
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN')
    if (!from) missing.push('TWILIO_WHATSAPP_FROM')
    if (!to) missing.push('WHATSAPP_TO')

    return resolve<WhatsAppConfig>(
      'NOTIFY_WHATSAPP_ENABLED',
      adminEnabled,
      {
        provider: 'twilio',
        accountSid,
        authToken,
        from: withWhatsAppPrefix(from),
        to: withWhatsAppPrefix(to),
      },
      missing
    )
  }

  const accessToken = env('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = env('WHATSAPP_PHONE_NUMBER_ID')

  const missing: string[] = []
  if (!accessToken) missing.push('WHATSAPP_ACCESS_TOKEN')
  if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID')
  if (!to) missing.push('WHATSAPP_TO')

  return resolve<WhatsAppConfig>(
    'NOTIFY_WHATSAPP_ENABLED',
    adminEnabled,
    {
      provider: 'meta',
      accessToken,
      phoneNumberId,
      apiVersion: env('WHATSAPP_API_VERSION') || 'v21.0',
      to: toE164Digits(to),
      templateName: env('WHATSAPP_TEMPLATE_NAME'),
      templateLanguage: env('WHATSAPP_TEMPLATE_LANGUAGE') || 'en_US',
    },
    missing
  )
}

export function resolvePushConfig(adminEnabled = true): Resolved<PushConfig> {
  const publicKey = env('VAPID_PUBLIC_KEY')
  const privateKey = env('VAPID_PRIVATE_KEY')

  const missing: string[] = []
  if (!publicKey) missing.push('VAPID_PUBLIC_KEY')
  if (!privateKey) missing.push('VAPID_PRIVATE_KEY')

  return resolve<PushConfig>(
    'NOTIFY_PUSH_ENABLED',
    adminEnabled,
    {
      publicKey,
      privateKey,
      subject: vapidSubject(),
      ttlSeconds: intEnv('PUSH_TTL_SECONDS', 24 * 60 * 60, 60, 28 * 24 * 60 * 60),
    },
    missing
  )
}

/**
 * Push services require a way to contact whoever is sending. An explicit
 * VAPID_SUBJECT wins; otherwise fall back to the notification inbox, then to
 * the site's own origin (an https: URL is equally valid per RFC 8292).
 */
function vapidSubject(): string {
  const explicit = env('VAPID_SUBJECT')
  if (explicit) return explicit

  const inbox = list('NOTIFY_EMAIL_TO')[0]
  return inbox ? `mailto:${inbox}` : getSiteUrl()
}

/**
 * The VAPID public key is handed to the browser so it can subscribe — it is
 * public by design, unlike the private key, which never leaves the server.
 * Returns an empty string when push has not been set up.
 */
export function vapidPublicKey(): string {
  return env('VAPID_PUBLIC_KEY')
}

/** Cloud API wants bare digits: "+91 98765 43210" becomes "919876543210". */
export function toE164Digits(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

/** Twilio wants a channel-prefixed E.164 address. */
function withWhatsAppPrefix(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('whatsapp:')) return raw
  const digits = toE164Digits(raw)
  return digits ? `whatsapp:+${digits}` : ''
}

/** What the admin screen shows next to each toggle. */
export interface ChannelReadiness {
  /** True when every credential the channel needs is present. */
  configured: boolean
  /** Names of the environment variables still to be filled in. */
  missing: string[]
  /** Which provider implementation would run. */
  provider: string
  /** True when NOTIFY_<CHANNEL>_ENABLED forces the channel off. */
  killSwitch: boolean
}

/**
 * Whether each channel has the credentials it needs, ignoring both switches.
 * The admin screen uses this to explain a toggle that cannot do anything yet;
 * it reports presence only, never a value.
 */
export function describeChannelReadiness(): Record<'email' | 'whatsapp' | 'push', ChannelReadiness> {
  const describe = (resolved: Resolved<unknown>) => ({
    configured: resolved.state === 'ready',
    missing: resolved.state === 'misconfigured' ? resolved.missing : [],
  })

  return {
    email: {
      ...describe(resolveEmailConfig(true)),
      provider: env('EMAIL_PROVIDER').toLowerCase() === 'sendgrid' ? 'sendgrid' : 'resend',
      killSwitch: hardDisabled('NOTIFY_EMAIL_ENABLED'),
    },
    whatsapp: {
      ...describe(resolveWhatsAppConfig(true)),
      provider: env('WHATSAPP_PROVIDER').toLowerCase() === 'twilio' ? 'twilio' : 'meta',
      killSwitch: hardDisabled('NOTIFY_WHATSAPP_ENABLED'),
    },
    push: {
      ...describe(resolvePushConfig(true)),
      provider: 'web-push',
      killSwitch: hardDisabled('NOTIFY_PUSH_ENABLED'),
    },
  }
}
