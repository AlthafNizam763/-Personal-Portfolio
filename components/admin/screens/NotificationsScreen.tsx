'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  TbAlertTriangle,
  TbBellRinging,
  TbBrandWhatsapp,
  TbCheck,
  TbDeviceFloppy,
  TbDeviceMobile,
  TbMail,
  TbSend,
  TbTrash,
} from 'react-icons/tb'
import type { IconType } from 'react-icons'
import { api, ApiError } from '@/lib/api-client'
import { Switch } from '../FormFields'
import { useToast } from '../Toast'
import type {
  NotificationChannel,
  NotificationChannelInfo,
  NotificationSettingsDTO,
  NotificationToggles,
  PushDeviceDTO,
} from '@/lib/types'

/**
 * Settings -> Notifications.
 *
 * One switch per channel for "someone submitted the contact form". The
 * switches are the only thing saved here — credentials stay in server-side
 * environment variables, and this screen never sees them. What it *does* show
 * is whether each channel has what it needs, so a switch that is on but silent
 * explains itself instead of looking broken.
 *
 * Push is the odd one out: as well as the switch it needs at least one browser
 * to have granted permission, which can only happen on the device you are
 * sitting at. That is what the "This device" card is for.
 */

interface ChannelMeta {
  key: NotificationChannel
  label: string
  Icon: IconType
  description: string
}

const CHANNELS: ChannelMeta[] = [
  {
    key: 'email',
    label: 'Email Notifications',
    Icon: TbMail,
    description:
      'Emails you the full submission — name, email, phone, subject, message and the time it arrived. Replying answers the visitor directly.',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Notifications',
    Icon: TbBrandWhatsapp,
    description:
      'Sends a short WhatsApp message with the sender and a preview, for when you want to know before you reach a laptop.',
  },
  {
    key: 'push',
    label: 'Push Notifications',
    Icon: TbBellRinging,
    description:
      'A browser notification on the devices you enable below. Works while the site is closed, as long as the browser is running.',
  },
]

type TestResult = {
  channel: NotificationChannel
  status: string
  error: string | null
  delivered: { ok: number; total: number } | null
}

export default function NotificationsScreen() {
  const toast = useToast()

  const [data, setData] = useState<NotificationSettingsDTO | null>(null)
  const [toggles, setToggles] = useState<NotificationToggles | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)

  const applyPayload = useCallback((payload: NotificationSettingsDTO) => {
    setData(payload)
    setToggles(payload.toggles)
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .get<NotificationSettingsDTO>('/api/admin/settings/notifications')
      .then(({ data: payload }) => {
        if (!cancelled) applyPayload(payload)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not load notification settings.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [applyPayload])

  // The confirmation is a moment, not a permanent banner.
  useEffect(() => {
    if (savedAt === null) return
    const timer = setTimeout(() => setSavedAt(null), 4000)
    return () => clearTimeout(timer)
  }, [savedAt])

  const change = (channel: NotificationChannel, value: boolean) => {
    setToggles((current) => (current ? { ...current, [channel]: value } : current))
    setDirty(true)
    setSavedAt(null)
  }

  const save = async () => {
    if (!toggles) return
    setSaving(true)
    try {
      const { data: payload } = await api.put<NotificationSettingsDTO>(
        '/api/admin/settings/notifications',
        toggles
      )
      applyPayload(payload)
      setDirty(false)
      setSavedAt(Date.now())
      toast.success('Notification settings saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save notification settings.')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    setTesting(true)
    setTestResults(null)
    try {
      const { data: result } = await api.post<{ results: TestResult[] }>(
        '/api/admin/settings/notifications/test',
        {}
      )
      setTestResults(result.results)
      const delivered = result.results.filter((r) => r.status === 'sent')
      if (delivered.length > 0) {
        toast.success(`Test sent through ${delivered.map((r) => r.channel).join(', ')}.`)
      } else {
        toast.error('No channel delivered the test. See the details below.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the test notification.')
    } finally {
      setTesting(false)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
        <TbAlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-red-800">Could not load notification settings</p>
          <p className="text-sm text-red-700 mt-1">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!data || !toggles) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading notification settings">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-xl bg-white border border-admin-border animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-ink">Notification Settings</h1>
          <p className="text-sm text-admin-muted mt-1 max-w-2xl">
            How you hear about new Contact&nbsp;Me submissions. Turning everything off does not
            affect the form itself — messages are always saved and still appear in your inbox.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TbDeviceFloppy size={18} aria-hidden="true" />
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </header>

      {/* Live region so the confirmation is announced, not just shown. */}
      <div role="status" aria-live="polite">
        {savedAt !== null && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <TbCheck size={18} className="text-green-700 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-green-800">
              Notification settings updated. New submissions use them straight away.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <section className="bg-white border border-admin-border rounded-xl">
          <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
            <h2 className="text-base font-bold text-admin-ink">Contact form notifications</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              Each channel is independent. A channel only sends when its switch is on{' '}
              <em>and</em> its credentials are set on the server.
            </p>
          </header>

          <div className="px-5 sm:px-6 divide-y divide-admin-border">
            {CHANNELS.map(({ key, label, Icon, description }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 py-5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 shrink-0 rounded-lg bg-admin-bg p-2 text-admin-ink">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <Switch
                    checked={toggles[key]}
                    onChange={(checked) => change(key, checked)}
                    label={label}
                    description={description}
                  />
                </div>
                <ChannelBadge
                  channel={key}
                  info={data.channels[key]}
                  deviceCount={key === 'push' ? data.push.devices.length : undefined}
                />
              </div>
            ))}
          </div>

          <footer className="px-5 sm:px-6 py-4 border-t border-admin-border flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              onClick={() => void sendTest()}
              disabled={testing}
              className="inline-flex items-center gap-2 rounded-lg border border-admin-border px-4 py-2 text-sm font-semibold text-admin-ink hover:bg-admin-bg transition-colors disabled:opacity-60"
            >
              <TbSend size={16} aria-hidden="true" />
              {testing ? 'Sending…' : 'Send test notification'}
            </button>
            <p className="text-xs text-admin-muted">
              Delivers a sample through every enabled channel. Nothing is added to Messages.
            </p>
          </footer>

          {testResults && (
            <div className="px-5 sm:px-6 pb-5">
              <ul className="rounded-lg border border-admin-border divide-y divide-admin-border text-sm">
                {testResults.map((result) => (
                  <li key={result.channel} className="flex items-start gap-3 px-4 py-2.5">
                    <StatusDot status={result.status} />
                    <span className="font-semibold capitalize w-20 shrink-0">{result.channel}</span>
                    <span className="text-admin-muted min-w-0">
                      {result.status}
                      {result.delivered && ` — ${result.delivered.ok}/${result.delivered.total} devices`}
                      {result.error && <span className="block text-xs mt-0.5">{result.error}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <PushDevicesSection
          publicKey={data.push.publicKey}
          devices={data.push.devices}
          enabled={toggles.push}
          onChanged={applyPayload}
        />
      </div>

      {dirty && (
        <div className="sticky bottom-4 mt-5 flex justify-end">
          <div className="inline-flex items-center gap-3 rounded-xl border border-admin-border bg-white px-4 py-3 shadow-lg">
            <span className="text-sm text-admin-muted">You have unsaved changes</span>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- indicators */

function ChannelBadge({
  channel,
  info,
  deviceCount,
}: {
  channel: NotificationChannel
  info: NotificationChannelInfo
  deviceCount?: number
}) {
  if (info.killSwitch) {
    return (
      <Badge tone="amber" title={`NOTIFY_${channel.toUpperCase()}_ENABLED=false on the server`}>
        Off in environment
      </Badge>
    )
  }

  if (!info.configured) {
    return <Badge tone="amber" title={`Missing: ${info.missing.join(', ')}`}>Not configured</Badge>
  }

  if (deviceCount === 0) {
    return <Badge tone="amber">No devices yet</Badge>
  }

  return (
    <Badge tone="green">
      Ready
      {deviceCount !== undefined && ` · ${deviceCount} device${deviceCount === 1 ? '' : 's'}`}
    </Badge>
  )
}

function Badge({
  tone,
  title,
  children,
}: {
  tone: 'green' | 'amber' | 'grey'
  title?: string
  children: React.ReactNode
}) {
  const tones = {
    green: 'bg-green-50 text-green-800 border-green-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    grey: 'bg-admin-bg text-admin-muted border-admin-border',
  }
  return (
    <span
      title={title}
      className={`shrink-0 self-start rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const colour =
    status === 'sent' ? 'bg-green-500'
    : status === 'disabled' ? 'bg-admin-border'
    : 'bg-amber-500'
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colour}`} aria-hidden="true" />
}

/* ------------------------------------------------------------ push devices */

type BrowserState =
  | { kind: 'checking' }
  | { kind: 'unsupported'; reason: string }
  | { kind: 'blocked' }
  | { kind: 'off' }
  | { kind: 'on'; deviceId: string }

function PushDevicesSection({
  publicKey,
  devices,
  enabled,
  onChanged,
}: {
  publicKey: string
  devices: PushDeviceDTO[]
  enabled: boolean
  onChanged: (payload: NotificationSettingsDTO) => void
}) {
  const toast = useToast()
  const [browser, setBrowser] = useState<BrowserState>({ kind: 'checking' })
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const { data } = await api.get<NotificationSettingsDTO>('/api/admin/settings/notifications')
    onChanged(data)
  }, [onChanged])

  /** Reads the browser's own state; never writes, so a removed device stays removed. */
  const inspect = useCallback(async () => {
    const unsupported = describeUnsupported()
    if (unsupported) {
      setBrowser({ kind: 'unsupported', reason: unsupported })
      return
    }
    if (Notification.permission === 'denied') {
      setBrowser({ kind: 'blocked' })
      return
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      const subscription = await registration?.pushManager.getSubscription()
      if (!subscription) {
        setBrowser({ kind: 'off' })
        return
      }

      const { data } = await api.post<{ registered: boolean; id?: string }>(
        '/api/admin/push/lookup',
        { endpoint: subscription.endpoint }
      )
      setBrowser(data.registered && data.id ? { kind: 'on', deviceId: data.id } : { kind: 'off' })
    } catch {
      setBrowser({ kind: 'off' })
    }
  }, [])

  useEffect(() => {
    void inspect()
  }, [inspect])

  const enableHere = async () => {
    if (!publicKey) {
      toast.error('Push is not configured on the server yet — add the VAPID keys first.')
      return
    }

    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setBrowser(permission === 'denied' ? { kind: 'blocked' } : { kind: 'off' })
        toast.error('This browser did not grant notification permission.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const subscription = await subscribeWithKey(registration, publicKey)
      const json = subscription.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }

      const { data } = await api.post<{ id: string; label: string }>('/api/admin/push', {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      })

      setBrowser({ kind: 'on', deviceId: data.id })
      await refresh()
      toast.success(`Push enabled on this device (${data.label}).`)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : 'Could not enable push on this device.'
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const disableHere = async () => {
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      const subscription = await registration?.pushManager.getSubscription()

      if (browser.kind === 'on') {
        await api.del(`/api/admin/push?id=${encodeURIComponent(browser.deviceId)}`).catch(() => {})
      }
      await subscription?.unsubscribe()

      setBrowser({ kind: 'off' })
      await refresh()
      toast.success('Push disabled on this device.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not disable push on this device.')
    } finally {
      setBusy(false)
    }
  }

  const removeDevice = async (device: PushDeviceDTO) => {
    try {
      await api.del(`/api/admin/push?id=${encodeURIComponent(device.id)}`)
      // If it was this browser, the local subscription is now orphaned.
      if (browser.kind === 'on' && browser.deviceId === device.id) {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js')
        await (await registration?.pushManager.getSubscription())?.unsubscribe()
        setBrowser({ kind: 'off' })
      }
      await refresh()
      toast.success(`Removed ${device.label}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove that device.')
    }
  }

  return (
    <section className="bg-white border border-admin-border rounded-xl">
      <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
        <h2 className="text-base font-bold text-admin-ink">Push devices</h2>
        <p className="text-xs text-admin-muted mt-0.5">
          Browsers allowed to show you a notification. Permission can only be granted on the device
          itself, so enable it once per laptop or phone you want to be reached on.
        </p>
      </header>

      <div className="p-5 sm:p-6 space-y-5">
        {/* --- this device --- */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-admin-border bg-admin-bg/50 px-4 py-3.5">
          <TbDeviceMobile size={20} className="text-admin-muted shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-admin-ink">This device</p>
            <p className="text-xs text-admin-muted mt-0.5">{describeBrowserState(browser)}</p>
          </div>

          {browser.kind === 'on' && (
            <button
              type="button"
              onClick={() => void disableHere()}
              disabled={busy}
              className="shrink-0 rounded-lg border border-admin-border px-4 py-2 text-sm font-semibold text-admin-ink hover:bg-white transition-colors disabled:opacity-60"
            >
              {busy ? 'Working…' : 'Disable here'}
            </button>
          )}

          {browser.kind === 'off' && (
            <button
              type="button"
              onClick={() => void enableHere()}
              disabled={busy || !publicKey}
              className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Working…' : 'Enable on this device'}
            </button>
          )}
        </div>

        {!enabled && devices.length > 0 && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            Push notifications are switched off above, so these devices will not be sent anything.
          </p>
        )}

        {/* --- registered devices --- */}
        {devices.length === 0 ? (
          <p className="text-sm text-admin-muted">No devices registered yet.</p>
        ) : (
          <ul className="divide-y divide-admin-border border border-admin-border rounded-lg">
            {devices.map((device) => (
              <li key={device.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-admin-ink truncate">
                    {device.label}
                    {browser.kind === 'on' && browser.deviceId === device.id && (
                      <span className="ml-2 text-[11px] font-bold text-admin-muted">
                        (this device)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Added {formatDate(device.createdAt)}
                    {device.lastSuccessAt
                      ? ` · last delivery ${formatDate(device.lastSuccessAt)}`
                      : ' · nothing delivered yet'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeDevice(device)}
                  aria-label={`Remove ${device.label}`}
                  className="shrink-0 p-2 rounded-lg border border-admin-border text-admin-muted hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  <TbTrash size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ helpers */

/** Why push cannot work here, or null when it can. */
function describeUnsupported(): string | null {
  if (typeof window === 'undefined') return null
  if (!window.isSecureContext) {
    return 'Push notifications need a secure connection (https, or localhost during development).'
  }
  if (!('serviceWorker' in navigator)) return 'This browser has no service worker support.'
  if (!('PushManager' in window)) {
    return 'This browser cannot receive push notifications. On an iPhone or iPad, add the site to your Home Screen first.'
  }
  if (!('Notification' in window)) return 'This browser has no notification support.'
  return null
}

function describeBrowserState(state: BrowserState): string {
  switch (state.kind) {
    case 'checking':
      return 'Checking…'
    case 'unsupported':
      return state.reason
    case 'blocked':
      return 'Notifications are blocked for this site. Allow them in your browser’s site settings, then reload.'
    case 'on':
      return 'Registered — this browser will show new submissions.'
    case 'off':
      return 'Not registered on this browser yet.'
  }
}

/**
 * Subscribes with our VAPID key, replacing any subscription that was made with
 * a different one. A key rotation otherwise leaves the browser holding a
 * subscription the server can no longer sign for, and `subscribe()` rejects
 * with InvalidStateError rather than replacing it.
 */
async function subscribeWithKey(
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<globalThis.PushSubscription> {
  const applicationServerKey = urlBase64ToUint8Array(publicKey)
  const existing = await registration.pushManager.getSubscription()

  if (existing) {
    const current = existing.options?.applicationServerKey
    if (current && sameBytes(new Uint8Array(current), applicationServerKey)) return existing
    await existing.unsubscribe()
  }

  return registration.pushManager.subscribe({
    // Required by every browser: a push must always be visible to the user.
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey as unknown as BufferSource,
  })
}

/** VAPID keys travel as base64url; PushManager wants the raw bytes. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  return a.every((byte, index) => byte === b[index])
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
