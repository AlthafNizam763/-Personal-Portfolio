/**
 * WhatsApp channel.
 *
 *   WHATSAPP_PROVIDER=meta    (default) — WhatsApp Cloud API (Meta Graph)
 *   WHATSAPP_PROVIDER=twilio            — Twilio Programmable Messaging
 *
 * Cloud API caveat: a business number may only send *free-form* text to a user
 * who messaged it within the previous 24 hours. A notification to your own
 * number will usually fall outside that window and come back as error 131047,
 * so set WHATSAPP_TEMPLATE_NAME to an approved template and this channel sends
 * that instead. Twilio's sandbox has the same 24-hour rule; its production
 * senders behave the same way.
 */

import {
  notifyTimeoutMs,
  resolveWhatsAppConfig,
  type WhatsAppMetaConfig,
  type WhatsAppTwilioConfig,
} from '../config'
import { buildWhatsAppTemplateParams, buildWhatsAppText } from '../format'
import { pickString, postToProvider, ProviderError } from '../http'
import type { ChannelResult, ContactNotification } from '../types'

export async function sendWhatsAppNotification(
  payload: ContactNotification,
  adminEnabled = true
): Promise<ChannelResult> {
  const resolved = resolveWhatsAppConfig(adminEnabled)

  if (resolved.state === 'disabled') return { channel: 'whatsapp', status: 'disabled' }
  if (resolved.state === 'misconfigured') {
    return {
      channel: 'whatsapp',
      status: 'misconfigured',
      error: `Missing ${resolved.missing.join(', ')}`,
    }
  }

  const started = Date.now()
  try {
    const providerId =
      resolved.config.provider === 'twilio'
        ? await sendViaTwilio(resolved.config, payload)
        : await sendViaMeta(resolved.config, payload)

    return { channel: 'whatsapp', status: 'sent', providerId, durationMs: Date.now() - started }
  } catch (err) {
    return {
      channel: 'whatsapp',
      status: 'failed',
      error: err instanceof ProviderError ? err.message : String(err),
      durationMs: Date.now() - started,
    }
  }
}

async function sendViaMeta(
  config: WhatsAppMetaConfig,
  payload: ContactNotification
): Promise<string | undefined> {
  const body = config.templateName
    ? {
        messaging_product: 'whatsapp',
        to: config.to,
        type: 'template',
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: [
            {
              type: 'body',
              parameters: buildWhatsAppTemplateParams(payload).map((text) => ({
                type: 'text',
                text,
              })),
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: config.to,
        type: 'text',
        text: { preview_url: false, body: buildWhatsAppText(payload) },
      }

  const res = await postToProvider(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    notifyTimeoutMs()
  )

  return pickString(res.body, 'messages', 0, 'id')
}

async function sendViaTwilio(
  config: WhatsAppTwilioConfig,
  payload: ContactNotification
): Promise<string | undefined> {
  const form = new URLSearchParams({
    From: config.from,
    To: config.to,
    Body: buildWhatsAppText(payload),
  })

  const res = await postToProvider(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    },
    notifyTimeoutMs()
  )

  return pickString(res.body, 'sid')
}
