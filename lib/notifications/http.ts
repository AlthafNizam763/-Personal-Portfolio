/**
 * Minimal fetch wrapper shared by the notification channels.
 *
 * Every provider used here speaks plain HTTPS + JSON, which is why the module
 * needs no vendor SDKs — one less dependency to keep patched, and nothing
 * extra in the serverless bundle.
 */

export interface ProviderResponse {
  ok: boolean
  status: number
  /** Parsed JSON when the provider returns it, otherwise the raw text. */
  body: unknown
}

export class ProviderError extends Error {
  readonly status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

/**
 * POSTs a body and resolves with the parsed response. Throws `ProviderError`
 * on a non-2xx status, a timeout, or a transport failure, so callers only need
 * one catch.
 */
export async function postToProvider(
  url: string,
  init: { headers: Record<string, string>; body: BodyInit },
  timeoutMs: number
): Promise<ProviderResponse> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: init.headers,
      body: init.body,
      signal: AbortSignal.timeout(timeoutMs),
      // Never let Next's data cache sit in front of an outbound notification.
      cache: 'no-store',
    })
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    throw new ProviderError(timedOut ? `Timed out after ${timeoutMs}ms` : reason)
  }

  const text = await res.text()
  let body: unknown = text
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    /* keep the raw text — some providers return an empty or plain-text body */
  }

  if (!res.ok) {
    throw new ProviderError(`HTTP ${res.status}: ${describe(body) || res.statusText}`, res.status)
  }

  return { ok: true, status: res.status, body }
}

/** Best-effort one-line description of a provider's error payload. */
function describe(body: unknown): string {
  if (typeof body === 'string') return body.slice(0, 300)
  if (!body || typeof body !== 'object') return ''

  const record = body as Record<string, unknown>
  const candidates = [
    record.message,
    (record.error as Record<string, unknown> | undefined)?.message,
    record.error,
    record.detail,
    Array.isArray(record.errors) ? (record.errors[0] as Record<string, unknown>)?.message : undefined,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) return candidate.slice(0, 300)
  }
  return JSON.stringify(body).slice(0, 300)
}

/** Reads a nested string without `any`, used to pull provider message ids. */
export function pickString(body: unknown, ...path: Array<string | number>): string | undefined {
  let current: unknown = body
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string | number, unknown>)[key]
  }
  return typeof current === 'string' ? current : undefined
}
