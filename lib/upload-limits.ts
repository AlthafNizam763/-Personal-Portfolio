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
 * rejected by the platform before our handler runs, so files that travel
 * through `POST /api/admin/upload` stay below that ceiling.
 *
 * Bigger files never reach the function at all: the browser streams them
 * straight to Vercel Blob using a short-lived token from
 * `/api/admin/upload/client`, which has no such limit.
 */
export const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024

/** Older name for the same ceiling, kept so existing imports keep working. */
export const MAX_UPLOAD_BYTES = MAX_SERVER_UPLOAD_BYTES

export const MAX_UPLOAD_LABEL = '4 MB'

/**
 * Ceilings per kind of asset. Images stay small because they are decoded on
 * every page view; a demo clip is allowed to be substantially bigger.
 */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_DOC_BYTES = 8 * 1024 * 1024
export const MAX_VIDEO_BYTES = 64 * 1024 * 1024

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

/** Images *and* video in one picker, for slots that accept either. */
export const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const

export type UploadKind = 'image' | 'document' | 'video' | 'media'

export function allowedTypesFor(kind: UploadKind): readonly string[] {
  if (kind === 'document') return ALLOWED_DOC_TYPES
  if (kind === 'video') return ALLOWED_VIDEO_TYPES
  if (kind === 'media') return ALLOWED_MEDIA_TYPES
  return ALLOWED_IMAGE_TYPES
}

/* -------------------------------------------------------------------------
 * Type detection
 * ---------------------------------------------------------------------- */

/** Canonical extension per stored MIME type — drives the saved filename. */
export const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

/**
 * Reverse lookup, plus the extension aliases a picker realistically hands
 * over. Android file managers frequently report `application/octet-stream`
 * (or nothing at all) for a video, and then the extension is the only signal
 * left to go on.
 */
const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jfif: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
}

/** Types worth naming when rejected, because the fix for them is specific. */
const REJECTION_HINTS: Record<string, string> = {
  'video/quicktime':
    'iPhone videos are recorded as .mov — export or convert it to MP4 first.',
  'image/heic': 'iPhone photos are HEIC — save it as JPEG or PNG first.',
  'image/heif': 'iPhone photos are HEIF — save it as JPEG or PNG first.',
  'video/x-matroska': 'Convert .mkv to MP4 or WebM first.',
  'video/x-msvideo': 'Convert .avi to MP4 or WebM first.',
}

export function extensionOf(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim())
  return match ? match[1]!.toLowerCase() : ''
}

/**
 * The MIME type to treat a picked file as.
 *
 * `File.type` is authoritative when the browser fills it in, but mobile
 * pickers routinely leave it empty or hand back `application/octet-stream`.
 * Falling back to the extension is what makes an MP4 picked from an Android
 * file manager upload instead of failing an otherwise correct type check.
 */
export function resolveFileType(file: { name: string; type: string }): string {
  const declared = (file.type || '').toLowerCase().split(';')[0]!.trim()
  if (declared && declared !== 'application/octet-stream') return declared
  return TYPE_BY_EXTENSION[extensionOf(file.name)] ?? declared
}

export function isVideoType(type: string): boolean {
  return type.startsWith('video/')
}

/** Largest size accepted for a file of this type in this kind of slot. */
export function maxBytesFor(kind: UploadKind, type?: string): number {
  if (kind === 'video') return MAX_VIDEO_BYTES
  if (kind === 'document') return MAX_DOC_BYTES
  if (kind === 'media') return type && isVideoType(type) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  return MAX_IMAGE_BYTES
}

/* -------------------------------------------------------------------------
 * Stored path
 *
 * Lives here rather than in `lib/storage.ts` because a direct-to-Blob upload
 * picks its own pathname in the browser: server and client must produce the
 * same shape, and the token route validates against it.
 * ---------------------------------------------------------------------- */

/** `projects`, `Profile Pics!` → `projects`, `profilepics`. */
export function safeFolderName(folder: string): string {
  return folder.replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, 40) || 'misc'
}

/** `my Photo (2).PNG` → `my-photo-2` */
export function slugifyFileName(name: string): string {
  return (
    name
      .replace(/\.[a-z0-9]+$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'file'
  )
}

/** 12 hex characters from the Web Crypto API, which Node and browsers share. */
export function randomSuffix(): string {
  const bytes = new Uint8Array(6)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Where a file is stored: `uploads/<folder>/<slug>-<random>.<ext>`. The random
 * suffix prevents collisions and stops one upload overwriting another when two
 * files share a name.
 */
export function buildUploadPathname(
  fileName: string,
  contentType: string,
  folder: string,
  random: string = randomSuffix()
): string {
  const ext = EXTENSION_BY_TYPE[contentType] ?? 'bin'
  return `uploads/${safeFolderName(folder)}/${slugifyFileName(fileName)}-${random}.${ext}`
}

/* -------------------------------------------------------------------------
 * URL classification — used by the public site and the admin previews
 * ---------------------------------------------------------------------- */

/** Strips query/hash so `…/clip.mp4?v=2` still reads as a video. */
function pathOf(url: string): string {
  return url.split(/[?#]/)[0]!.toLowerCase()
}

export function isVideoUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:')) return url.startsWith('data:video/')
  return /\.(mp4|m4v|webm)$/.test(pathOf(url))
}

export function isGifUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:')) return url.startsWith('data:image/gif')
  return /\.gif$/.test(pathOf(url))
}

export function isVectorUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:')) return url.startsWith('data:image/svg')
  return /\.svg$/.test(pathOf(url))
}

/** `image` | `video` for anything we can render; picks the renderer. */
export function mediaKindOfUrl(url: string): 'image' | 'video' {
  return isVideoUrl(url) ? 'video' : 'image'
}

/* -------------------------------------------------------------------------
 * Picker + copy helpers
 * ---------------------------------------------------------------------- */

/**
 * Value for an `<input type="file" accept>`. Listing the exact MIME types
 * rather than a wildcard keeps the picker from offering formats the server
 * rejects — `image/*` would let an iPhone hand over a HEIC that then fails.
 * The matching extensions are listed alongside because several Android
 * pickers filter on extension and show an empty list for a MIME-only accept.
 */
export function acceptFor(kind: UploadKind): string {
  const types = allowedTypesFor(kind)
  const extensions = Object.entries(TYPE_BY_EXTENSION)
    .filter(([, type]) => types.includes(type))
    .map(([ext]) => `.${ext}`)
  return [...types, ...extensions].join(',')
}

/** Short human list of what a slot takes, e.g. "MP4 or WebM · max 64.0 MB". */
export function describeAccepted(kind: UploadKind): string {
  if (kind === 'document') return `PDF · max ${formatBytes(MAX_DOC_BYTES)}`
  if (kind === 'video') return `MP4 or WebM · max ${formatBytes(MAX_VIDEO_BYTES)}`
  if (kind === 'media') {
    return `PNG, JPG, WebP, GIF, SVG (max ${formatBytes(MAX_IMAGE_BYTES)}) or MP4, WebM (max ${formatBytes(MAX_VIDEO_BYTES)})`
  }
  return `PNG, JPG, WebP, GIF or SVG · max ${formatBytes(MAX_IMAGE_BYTES)}`
}

/** Badge text for a stored asset, e.g. `GIF`, `MP4 video`, `SVG`. */
export function labelForUrl(url: string): string {
  if (!url) return ''
  if (isVideoUrl(url)) return `${(extensionOf(pathOf(url)) || 'video').toUpperCase()} video`
  if (isGifUrl(url)) return 'GIF'
  const ext = extensionOf(pathOf(url))
  return ext ? ext.toUpperCase() : 'Image'
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
export function validateUpload(file: File, kind: UploadKind): UploadValidationError | null {
  const allowed = allowedTypesFor(kind)
  const type = resolveFileType(file)

  if (!allowed.includes(type)) {
    const hint = REJECTION_HINTS[type]
    return {
      error: hint
        ? `Unsupported file type "${type}". ${hint}`
        : `Unsupported file type "${type || 'unknown'}". Allowed: ${allowed.join(', ')}.`,
    }
  }

  const limit = maxBytesFor(kind, type)
  if (file.size > limit) {
    return {
      error: `File is ${formatBytes(file.size)} — the limit for ${
        isVideoType(type) ? 'video' : 'this file type'
      } is ${formatBytes(limit)}.`,
    }
  }

  if (file.size === 0) return { error: 'File is empty.' }
  return null
}
