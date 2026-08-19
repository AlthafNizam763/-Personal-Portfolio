/**
 * Browser push channel (Web Push, RFC 8030 / 8291 / 8292).
 *
 * Unlike email and WhatsApp there is no third-party provider here: the server
 * signs a VAPID token and posts an encrypted payload straight to whichever
 * push service each browser nominated (Mozilla's, Google's, Apple's, …). The
 * `web-push` package does the ECDH + HKDF + AES128GCM work; hand-rolling that
 * is the one place in this codebase where a dependency clearly earns its keep.
 *
 * Recipients are the admin's own devices, registered from
 * Settings -> Notifications. A subscription the push service reports as gone
 * (404/410) is deleted immediately — that is the documented way to learn the
 * browser was uninstalled, reset, or revoked permission.
 */

import webpush, { WebPushError } from 'web-push'
import { PushSubscription } from '@/models'
import { notifyTimeoutMs, resolvePushConfig, type PushConfig } from '../config'
import { buildPushPayload } from '../format'
import type { ChannelResult, ContactNotification } from '../types'

export async function sendPushNotification(
  payload: ContactNotification,
  adminEnabled = true
): Promise<ChannelResult> {
  const resolved = resolvePushConfig(adminEnabled)

  if (resolved.state === 'disabled') return { channel: 'push', status: 'disabled' }
  if (resolved.state === 'misconfigured') {
    return {
      channel: 'push',
      status: 'misconfigured',
      error: `Missing ${resolved.missing.join(', ')}`,
    }
  }

  const started = Date.now()
  try {
    const subscriptions = await PushSubscription.find().lean()

    if (subscriptions.length === 0) {
      return {
        channel: 'push',
        status: 'misconfigured',
        error: 'No device has been registered for push notifications yet.',
        durationMs: Date.now() - started,
      }
    }

    const body = JSON.stringify(buildPushPayload(payload))
    const results = await Promise.all(
      subscriptions.map((subscription) => deliver(subscription, body, resolved.config))
    )

    const ok = results.filter((r) => r.ok).length
    const delivered = { ok, total: results.length }

    if (ok === 0) {
      return {
        channel: 'push',
        status: 'failed',
        // Every device failed for the same reason more often than not, so the
        // first message is the useful one.
        error: results.find((r) => r.error)?.error ?? 'No device accepted the notification.',
        durationMs: Date.now() - started,
        delivered,
      }
    }

    return { channel: 'push', status: 'sent', durationMs: Date.now() - started, delivered }
  } catch (err) {
    return {
      channel: 'push',
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    }
  }
}

interface StoredSubscription {
  _id: unknown
  endpoint: string
  /** Optional in the Mongoose type, though the schema requires it. */
  keys?: { p256dh: string; auth: string } | null
}

/** Pushes to one device, pruning it if the push service says it is gone. */
async function deliver(
  subscription: StoredSubscription,
  body: string,
  config: PushConfig
): Promise<{ ok: boolean; error?: string }> {
  const { p256dh, auth } = subscription.keys ?? {}

  // A record without key material cannot be encrypted for and never will be.
  if (!p256dh || !auth) {
    await PushSubscription.deleteOne({ _id: subscription._id }).catch(() => {})
    return { ok: false, error: 'Stored subscription had no key material and was removed.' }
  }

  try {
    await webpush.sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh, auth } },
      body,
      {
        vapidDetails: {
          subject: config.subject,
          publicKey: config.publicKey,
          privateKey: config.privateKey,
        },
        TTL: config.ttlSeconds,
        timeout: notifyTimeoutMs(),
        // Nothing here is time-critical enough to wake a dozing phone, but it
        // should not be held back either.
        urgency: 'normal',
      }
    )

    await PushSubscription.updateOne(
      { _id: subscription._id },
      { $set: { lastSuccessAt: new Date(), failureCount: 0 } }
    ).catch(() => {})

    return { ok: true }
  } catch (err) {
    const status = err instanceof WebPushError ? err.statusCode : 0

    // 404 Not Found / 410 Gone: this subscription will never work again.
    if (status === 404 || status === 410) {
      await PushSubscription.deleteOne({ _id: subscription._id }).catch(() => {})
      return { ok: false, error: 'Subscription expired and was removed.' }
    }

    await PushSubscription.updateOne(
      { _id: subscription._id },
      { $inc: { failureCount: 1 } }
    ).catch(() => {})

    const detail = err instanceof Error ? err.message : String(err)
    return { ok: false, error: status ? `HTTP ${status}: ${detail}` : detail }
  }
}
