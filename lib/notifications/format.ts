/**
 * Renders a submission into the body each channel needs.
 *
 * Pure functions — no env reads apart from the timezone/site-url helpers, no
 * network. Every visitor-supplied value is escaped before it reaches the HTML
 * email, so a message containing markup cannot inject anything into the inbox.
 */

import { getSiteUrl } from '@/lib/site'
import { notifyTimezone } from './config'
import type { ContactNotification } from './types'

/** WhatsApp rejects bodies over 4096 chars; leave room for the labels. */
const WHATSAPP_MESSAGE_LIMIT = 900

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** `19 August 2026 at 14:32 (Asia/Kolkata)` in the configured zone. */
export function formatSubmittedAt(date: Date, timeZone = notifyTimezone()): string {
  try {
    const stamp = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone,
    }).format(date)
    return `${stamp} (${timeZone})`
  } catch {
    // An invalid NOTIFY_TIMEZONE should degrade, not break the notification.
    return `${date.toISOString()} (UTC)`
  }
}

/**
 * The form has no subject field, so fall back to something that still reads
 * well in an inbox list. A `subject` supplied by a future form wins.
 *
 * Collapsed to a single line: a subject is an email *header*, and a stray
 * newline in visitor input is the classic header-injection trick.
 */
export function resolveSubject(payload: ContactNotification): string {
  const supplied = singleLine(payload.subject ?? '')
  return supplied || `New portfolio enquiry from ${singleLine(payload.name)}`
}

/** Strips CR/LF and runs of whitespace, then caps the length. */
function singleLine(value: string, max = 150): string {
  return truncate(value.replace(/\s+/g, ' ').trim(), max)
}

/** Ordered label/value pairs; entries with no value are dropped. */
function detailRows(payload: ContactNotification): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['Name', payload.name],
    ['Email', payload.email],
  ]
  if (payload.phone?.trim()) rows.push(['Phone', payload.phone.trim()])
  if (payload.website?.trim()) rows.push(['Website', payload.website.trim()])
  rows.push(['Subject', resolveSubject(payload)])
  rows.push(['Submitted', formatSubmittedAt(payload.submittedAt)])
  return rows
}

export function buildEmailSubject(payload: ContactNotification): string {
  return `📬 ${resolveSubject(payload)}`
}

export function buildEmailText(payload: ContactNotification): string {
  const details = detailRows(payload)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')

  return [
    'New Contact Form Submission',
    '',
    details,
    '',
    'Message:',
    payload.message,
    '',
    `Read it in the admin panel: ${adminMessagesUrl()}`,
  ].join('\n')
}

export function buildEmailHtml(payload: ContactNotification): string {
  const rows = detailRows(payload)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 16px 8px 0;color:#71717A;font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(
            label
          )}</td>
          <td style="padding:8px 0;color:#000;font-size:14px;font-weight:600;">${linkify(
            label,
            value
          )}</td>
        </tr>`
    )
    .join('')

  // Inline styles only, and a table for the detail grid: every mail client
  // strips <style> blocks and most still handle flexbox badly.
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border:2px solid #000;border-radius:8px;">
      <tr>
        <td style="padding:24px 24px 8px;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717A;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">Portfolio</p>
          <h1 style="margin:4px 0 0;font-size:22px;font-weight:800;color:#000;">New Contact Form Submission</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 0;">
          <p style="margin:0 0 8px;font-size:13px;color:#71717A;">Message</p>
          <div style="border-left:3px solid #000;padding:4px 0 4px 14px;font-size:15px;line-height:1.6;color:#18181B;white-space:pre-wrap;">${escapeHtml(
            payload.message
          )}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <a href="${escapeHtml(adminMessagesUrl())}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:6px;">Open in admin panel</a>
          <p style="margin:16px 0 0;font-size:12px;color:#A1A1AA;">Sent automatically by your portfolio contact form. Reply to this email to answer ${escapeHtml(
            payload.name
          )} directly.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * Short and scannable — WhatsApp previews only the first couple of lines, and
 * a long message body would push the sender's details off the notification.
 */
export function buildWhatsAppText(payload: ContactNotification): string {
  const lines = [
    '*New Contact Form Submission*',
    '',
    `*Name:* ${payload.name}`,
    `*Email:* ${payload.email}`,
  ]
  if (payload.phone?.trim()) lines.push(`*Phone:* ${payload.phone.trim()}`)
  lines.push(`*Subject:* ${resolveSubject(payload)}`)
  lines.push(`*Message:* ${truncate(payload.message, WHATSAPP_MESSAGE_LIMIT)}`)
  lines.push('', formatSubmittedAt(payload.submittedAt))
  return lines.join('\n')
}

/**
 * Body parameters for an approved Cloud API template, in the same order as the
 * placeholders documented in .env.example ({{1}} name, {{2}} email,
 * {{3}} subject, {{4}} message).
 */
export function buildWhatsAppTemplateParams(payload: ContactNotification): string[] {
  return [
    payload.name,
    payload.email,
    resolveSubject(payload),
    // Template parameters may not contain newlines or tabs.
    truncate(payload.message.replace(/\s+/g, ' ').trim(), 700),
  ]
}

/**
 * Payload for a Web Push notification. Kept small on purpose: push services
 * cap an encrypted payload at roughly 4 KB, and a notification body longer
 * than a couple of lines is truncated by the operating system anyway.
 *
 * `url` is what the service worker opens when the notification is clicked,
 * and `tag` collapses repeat notifications for the same message.
 */
export interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
  timestamp: number
}

export function buildPushPayload(payload: ContactNotification): PushPayload {
  const lines = [payload.email]
  if (payload.phone?.trim()) lines.push(payload.phone.trim())
  lines.push(truncate(singleLine(payload.message, 200), 200))

  return {
    title: `New message from ${singleLine(payload.name, 60)}`,
    body: lines.join(' · '),
    // Deep-links straight to the inbox; the service worker focuses an already
    // open admin tab rather than piling up new ones.
    url: adminMessagesUrl(),
    tag: payload.messageId ? `contact-${payload.messageId}` : 'contact-message',
    timestamp: payload.submittedAt.getTime(),
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value
}

/** Makes the email and website rows clickable in the HTML email. */
function linkify(label: string, value: string): string {
  const safe = escapeHtml(value)
  if (label === 'Email') return `<a href="mailto:${safe}" style="color:#000;">${safe}</a>`
  if (label === 'Phone') {
    return `<a href="tel:${escapeHtml(value.replace(/\s+/g, ''))}" style="color:#000;">${safe}</a>`
  }
  if (label === 'Website') {
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`
    return `<a href="${escapeHtml(href)}" style="color:#000;">${safe}</a>`
  }
  return safe
}

function adminMessagesUrl(): string {
  return `${getSiteUrl()}/admin/messages`
}
