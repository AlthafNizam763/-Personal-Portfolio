import type { ApiResponse } from './types'

/**
 * Browser-side fetch wrapper for the admin panel.
 *
 * Unwraps the standard `{ ok, data, error, fieldErrors, meta }` envelope and
 * turns a 401 into a redirect to the login page, so an expired session never
 * leaves the UI silently failing.
 */

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<{ data: T; meta?: ApiResponse<T>['meta'] }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
    // Always hit the server: admin data must never come from the bfcache.
    cache: 'no-store',
  })

  if (res.status === 401 && typeof window !== 'undefined') {
    const next = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/admin/login?next=${next}`
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null

  if (!res.ok || !json?.ok) {
    throw new ApiError(
      json?.error ?? `Request failed (${res.status})`,
      res.status,
      json?.fieldErrors
    )
  }

  return { data: json.data as T, meta: json.meta }
}

/** Convenience helpers so call sites read as intent, not plumbing. */
export const api = {
  get: <T>(url: string) => apiFetch<T>(url),

  post: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),

  del: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),

  upload: async (
    file: File,
    opts: { folder: string; kind?: 'image' | 'document' | 'video' }
  ) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', opts.folder)
    form.append('kind', opts.kind ?? 'image')
    const { data } = await apiFetch<{ url: string; backend: string }>('/api/admin/upload', {
      method: 'POST',
      body: form,
    })
    return data
  },
}

/** Serialises a filter/sort/page state object into a query string. */
export function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === null) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
