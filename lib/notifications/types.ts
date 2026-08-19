/**
 * Shared shapes for the contact-notification pipeline.
 *
 * Nothing in here imports a provider SDK or reads `process.env`, so it is safe
 * to import from anywhere (including tests and scripts).
 */

/** Everything a channel may render. Assembled once, in the contact route. */
export interface ContactNotification {
  /** Visitor's name, already trimmed and validated. */
  name: string
  /** Visitor's email, already lower-cased and validated. */
  email: string
  /**
   * Optional — the public form does not collect a phone number today, so this
   * is usually empty. Channels render it only when present.
   */
  phone?: string
  /** Optional — falls back to a derived subject when the form omits it. */
  subject?: string
  /** Optional website the visitor supplied. */
  website?: string
  /** The message body. */
  message: string
  /** When the submission was stored. */
  submittedAt: Date
  /** Mongo id of the saved Message, used for the admin deep link. */
  messageId?: string
}

export const CHANNEL_NAMES = ['email', 'whatsapp', 'push'] as const

export type ChannelName = (typeof CHANNEL_NAMES)[number]

export type ChannelStatus =
  /** Delivered — the provider accepted the request. */
  | 'sent'
  /** Turned off, either in the admin panel or in configuration. Not an error. */
  | 'disabled'
  /** Enabled but missing credentials, so nothing was attempted. */
  | 'misconfigured'
  /** Attempted and rejected (provider error, timeout, network failure). */
  | 'failed'

export interface ChannelResult {
  channel: ChannelName
  status: ChannelStatus
  /** Provider-side id, when the provider returns one. */
  providerId?: string
  /** Human-readable reason for `failed` / `misconfigured`. Never a secret. */
  error?: string
  /** Round-trip time in ms, for `sent` and `failed`. */
  durationMs?: number
  /**
   * Push only: how many subscribed devices accepted the message, and how many
   * were attempted. A partial delivery still counts as `sent`.
   */
  delivered?: { ok: number; total: number }
}

export type NotificationOutcome = Record<ChannelName, ChannelResult>

/** The admin panel's per-channel switches, as stored in SiteSettings. */
export type ChannelToggles = Record<ChannelName, boolean>

/** Compact `{ email: 'sent', whatsapp: 'disabled' }` view for API responses. */
export type NotificationSummary = Record<ChannelName, ChannelStatus>

export function toSummary(outcome: NotificationOutcome): NotificationSummary {
  return {
    email: outcome.email.status,
    whatsapp: outcome.whatsapp.status,
    push: outcome.push.status,
  }
}

/** Every channel on, used when no explicit toggles are supplied. */
export const ALL_CHANNELS_ON: ChannelToggles = { email: true, whatsapp: true, push: true }
