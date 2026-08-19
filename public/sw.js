/**
 * Service worker for admin push notifications.
 *
 * IMPORTANT: this worker deliberately has **no `fetch` handler**.
 *
 * It is registered at the root scope so it can receive pushes no matter which
 * page is open, which also means it controls every page on the site. A worker
 * without a fetch listener never intercepts a navigation or a request, so the
 * public portfolio loads exactly as it did before. Do not add caching here
 * without thinking hard about that.
 *
 * Registered from Settings -> Notifications; see NotificationsScreen.tsx.
 */

// Take over as soon as a new version is installed, rather than waiting for
// every tab to close. There is no cached content to invalidate, so there is
// nothing for the old worker to keep alive.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

const FALLBACK = {
  title: 'New contact form submission',
  body: 'Someone just messaged you through your portfolio.',
  url: '/admin/messages',
  tag: 'contact-message',
}

self.addEventListener('push', (event) => {
  let data = FALLBACK

  // A push can legitimately arrive with no payload (some services strip it, and
  // browsers send a test push on subscription in a few configurations), so a
  // malformed body must still produce a notification rather than nothing.
  if (event.data) {
    try {
      data = { ...FALLBACK, ...event.data.json() }
    } catch {
      data = { ...FALLBACK, body: event.data.text() || FALLBACK.body }
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/xpalico.png',
      badge: '/assets/xpalico.png',
      // Same tag collapses repeat notifications for one message instead of
      // stacking duplicates if the push is retried.
      tag: data.tag,
      timestamp: data.timestamp || Date.now(),
      requireInteraction: false,
      data: { url: data.url || FALLBACK.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const target = new URL(event.notification.data?.url || FALLBACK.url, self.location.origin)

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an admin tab that is already open rather than piling up windows.
      for (const client of clients) {
        if (new URL(client.url).origin !== target.origin) continue
        if (!new URL(client.url).pathname.startsWith('/admin')) continue

        return client.focus().then((focused) =>
          'navigate' in focused ? focused.navigate(target.href) : focused
        )
      }

      return self.clients.openWindow(target.href)
    })
  )
})
