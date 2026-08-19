import type { ApiResponse } from './types'
import {
  MAX_SERVER_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  buildUploadPathname,
  resolveFileType,
  validateUpload,
  type UploadKind,
} from './upload-limits'

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
      json?.error ?? describeHttpError(res.status),
      res.status,
      json?.fieldErrors
    )
  }

  return { data: json.data as T, meta: json.meta }
}

/**
 * Text for a failure that never reached our JSON envelope — a platform-level
 * rejection such as Vercel's request-body limit, which returns its own page and
 * would otherwise surface to the admin as a bare status code.
 */
function describeHttpError(status: number): string {
  if (status === 413) {
    return `That file is too large for the server to accept. The limit is ${MAX_UPLOAD_LABEL}.`
  }
  if (status === 408 || status === 504) {
    return 'The server took too long to respond. Please try again.'
  }
  if (status >= 500) {
    return `The server could not complete the request (error ${status}). Please try again.`
  }
  return `Request failed (${status})`
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

  upload: uploadFile,
}

/* -------------------------------------------------------------------------
 * Uploads
 *
 * Two transports, picked per file:
 *
 *  - through `POST /api/admin/upload`, which validates and stores the file —
 *    the path everything took before, and the only one that works when the
 *    local-disk backend is in use.
 *  - straight to Vercel Blob from the browser, using a scoped token from
 *    `/api/blob-upload`. Serverless functions reject request bodies over
 *    4.5 MB, so this is what makes video possible at all in production.
 *
 * Both report progress, because a 40 MB clip on a phone is not instant.
 * ---------------------------------------------------------------------- */

export interface UploadBackendInfo {
  ready: boolean
  backend: string
  reason?: string
  /** Direct-to-Blob uploads available, so files may exceed `maxServerBytes`. */
  clientUploads?: boolean
  maxBytes: number
  maxServerBytes: number
  maxVideoBytes: number
}

let backendInfoRequest: Promise<UploadBackendInfo> | null = null

/**
 * Cached: every uploader on a screen asks the same question, and the answer
 * only changes when the deployment's environment does.
 */
export function uploadBackendInfo(refresh = false): Promise<UploadBackendInfo> {
  if (refresh || !backendInfoRequest) {
    backendInfoRequest = apiFetch<UploadBackendInfo>('/api/admin/upload')
      .then((r) => r.data)
      .catch((err: unknown) => {
        // Don't cache a failure — a transient error would disable uploads for
        // the rest of the session.
        backendInfoRequest = null
        throw err
      })
  }
  return backendInfoRequest
}

export interface UploadResult {
  url: string
  pathname?: string
  size?: number
  contentType?: string
  backend: string
}

export interface UploadOptions {
  folder: string
  kind?: UploadKind
  /** 0–100, fired as the bytes go out. */
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

/**
 * Files this size or larger are split into parts that upload in parallel and
 * retry individually — the difference between a dropped mobile connection
 * costing one part and costing the whole video.
 */
const MULTIPART_THRESHOLD = 8 * 1024 * 1024

async function uploadFile(file: File, opts: UploadOptions): Promise<UploadResult> {
  const kind = opts.kind ?? 'image'

  // The same rules the endpoint applies, so an unusable file never leaves the
  // device.
  const invalid = validateUpload(file, kind)
  if (invalid) throw new ApiError(invalid.error, 422)

  // A failed status check must not block the upload itself: fall through to
  // the server transport and let it report whatever the real problem is.
  const info = await uploadBackendInfo().catch(() => null)

  if (info && !info.ready) {
    throw new ApiError(info.reason ?? 'Uploads have no storage configured.', 503)
  }

  const serverLimit = info?.maxServerBytes ?? MAX_SERVER_UPLOAD_BYTES

  if (file.size > serverLimit && info?.clientUploads) {
    return uploadDirectToBlob(file, kind, opts)
  }

  return uploadThroughServer(file, kind, opts)
}

async function uploadDirectToBlob(
  file: File,
  kind: UploadKind,
  opts: UploadOptions
): Promise<UploadResult> {
  // Loaded on demand so the Blob client never lands in the bundle of a page
  // that only uploads small images.
  const { upload } = await import('@vercel/blob/client')

  const contentType = resolveFileType(file)
  const pathname = buildUploadPathname(file.name, contentType, opts.folder)

  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      contentType,
      handleUploadUrl: '/api/blob-upload',
      // Tells the token route exactly what is coming, so the token it issues
      // is scoped to that one type and size.
      clientPayload: JSON.stringify({ kind, contentType }),
      multipart: file.size >= MULTIPART_THRESHOLD,
      onUploadProgress: ({ percentage }) => opts.onProgress?.(Math.round(percentage)),
      abortSignal: opts.signal,
    })

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType,
      backend: 'vercel-blob',
    }
  } catch (err) {
    // The Blob client wraps an abort in its own error type, so the signal is
    // the reliable signal — re-raise the cancellation the callers expect.
    if (opts.signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
      throw new DOMException('Upload cancelled', 'AbortError')
    }

    const detail = err instanceof Error ? err.message : 'Upload failed.'
    // The Blob client collapses a rejected token into a generic message, so
    // name the likely cause rather than leaving the admin guessing.
    throw new ApiError(
      detail.includes('client token')
        ? 'The upload was not authorised. Sign in again, then retry.'
        : detail,
      502
    )
  }
}

function uploadThroughServer(
  file: File,
  kind: UploadKind,
  opts: UploadOptions
): Promise<UploadResult> {
  // XMLHttpRequest rather than fetch: it is still the only way to observe
  // request-body progress in the browser.
  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('folder', opts.folder)
    form.append('kind', kind)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/admin/upload')

    const abort = () => xhr.abort()
    opts.signal?.addEventListener('abort', abort)
    const done = () => opts.signal?.removeEventListener('abort', abort)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        opts.onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onerror = () => {
      done()
      reject(new ApiError('The connection dropped during the upload. Please try again.', 0))
    }

    xhr.onabort = () => {
      done()
      reject(new DOMException('Upload cancelled', 'AbortError'))
    }

    xhr.onload = () => {
      done()

      if (xhr.status === 401 && typeof window !== 'undefined') {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/admin/login?next=${next}`
        reject(new ApiError('Your session has expired. Please sign in again.', 401))
        return
      }

      let envelope: ApiResponse<UploadResult> | null = null
      try {
        envelope = JSON.parse(xhr.responseText) as ApiResponse<UploadResult>
      } catch {
        // A platform-level rejection (Vercel's body limit) answers with HTML.
        envelope = null
      }

      if (xhr.status >= 200 && xhr.status < 300 && envelope?.ok && envelope.data) {
        resolve(envelope.data)
        return
      }

      reject(
        new ApiError(
          envelope?.error ?? describeHttpError(xhr.status),
          xhr.status,
          envelope?.fieldErrors
        )
      )
    }

    xhr.send(form)
  })
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
