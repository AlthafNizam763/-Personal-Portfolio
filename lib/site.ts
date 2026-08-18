/**
 * Resolves the canonical public origin, used for metadataBase, Open Graph
 * URLs, the sitemap and robots.txt.
 *
 * Order of preference:
 *  1. NEXT_PUBLIC_SITE_URL  — set this to your real domain in production.
 *  2. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL — injected by Vercel, so
 *     preview deployments get sensible absolute URLs with no configuration.
 *  3. localhost — development fallback.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (productionHost) return `https://${productionHost.replace(/\/+$/, '')}`

  const previewHost = process.env.VERCEL_URL?.trim()
  if (previewHost) return `https://${previewHost.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}

/** Turns a stored path or absolute URL into an absolute URL. */
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getSiteUrl()
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${getSiteUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}
