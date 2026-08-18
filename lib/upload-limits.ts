/**
 * Upload constraints shared by the browser and the server.
 *
 * Deliberately free of Node imports so client components can import it: the
 * `accept=""` attribute, the browser-side pre-check and the server's own
 * validation all read from here and therefore cannot drift apart. A file the
 * picker accepts is always a file the endpoint accepts.
 */

/**
 * Vercel caps a serverless function's request body at 4.5 MB, and the request
 * carries multipart overhead on top of the file itself. Anything larger is
 * rejected by the platform before our handler runs, so the app's own limit sits
 * below that ceiling — a file that uploads in development also uploads in
 * production.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export const MAX_UPLOAD_LABEL = '4 MB'

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
] as const

export const ALLOWED_DOC_TYPES = ['application/pdf'] as const

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'] as const

export type UploadKind = 'image' | 'document' | 'video'

export function allowedTypesFor(kind: UploadKind): readonly string[] {
  if (kind === 'document') return ALLOWED_DOC_TYPES
  if (kind === 'video') return ALLOWED_VIDEO_TYPES
  return ALLOWED_IMAGE_TYPES
}

/**
 * Value for an `<input type="file" accept>`. Listing the exact MIME types
 * rather than a wildcard keeps the picker from offering formats the server
 * rejects — `image/*` would let an iPhone hand over a HEIC that then fails.
 */
export function acceptFor(kind: UploadKind): string {
  return allowedTypesFor(kind).join(',')
}

/** Human-readable size, e.g. `3.4 MB` / `812 KB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export interface UploadValidationError {
  error: string
}

/**
 * Runs in the browser before the request is made and again on the server, so a
 * rejected file costs no bandwidth and no caller can bypass the rules.
 */
export function validateUpload(
  file: File,
  kind: UploadKind
): UploadValidationError | null {
  const allowed = allowedTypesFor(kind)
  if (!allowed.includes(file.type)) {
    return {
      error: `Unsupported file type "${file.type || 'unknown'}". Allowed: ${allowed.join(', ')}.`,
    }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error: `File is ${formatBytes(file.size)} — the limit is ${MAX_UPLOAD_LABEL}.`,
    }
  }
  if (file.size === 0) return { error: 'File is empty.' }
  return null
}
