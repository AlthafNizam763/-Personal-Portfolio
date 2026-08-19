import webpush from 'web-push'

/**
 * Prints a fresh VAPID key pair for browser push notifications.
 *
 *   npm run generate-vapid-keys
 *
 * Copy the two lines into `.env.local` (and into your Vercel project's
 * environment variables). The public key is handed to browsers so they can
 * subscribe; the private key signs each push and must never leave the server.
 *
 * Generate once and keep them. Replacing the pair invalidates every existing
 * subscription — each device has to be re-enabled from
 * Settings -> Notifications.
 */
const { publicKey, privateKey } = webpush.generateVAPIDKeys()

console.log(`
VAPID key pair generated. Add these to .env.local:

VAPID_PUBLIC_KEY="${publicKey}"
VAPID_PRIVATE_KEY="${privateKey}"

Optional — the contact address push services see (defaults to your
NOTIFY_EMAIL_TO, or the site URL):

VAPID_SUBJECT="mailto:you@your-domain.com"

Keep the private key secret, and keep the pair stable: regenerating it
unsubscribes every device that has already been enabled.
`)
