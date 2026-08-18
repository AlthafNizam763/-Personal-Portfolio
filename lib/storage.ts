import { put, del } from '@vercel/blob'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALLOWED_VIDEO_TYPES,
  allowedTypesFor,
  validateUpload,
  type UploadKind,
  type UploadValidationError,
} from './upload-limits'

/**
 * Upload adapter with two backends:
 *
 *  - Vercel Blob  — used whenever BLOB_READ_WRITE_TOKEN is present. Required in
 *    production because Vercel's filesystem is read-only.
 *  - Local disk   — development fallback writing into `public/uploads/`, which
 *    is git-ignored.
 *
 * Both return a URL that can be dropped straight into `src`.
 *
 * The two backends are not interchangeable: disk writes are impossible on a
 * read-only host, so choosing that fallback there is a configuration fault, not
 * a fallback. `storeFile` says so explicitly rather than letting the write fail
 * with an EROFS deep inside `fs`.
 */

export {
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOC_TYPES,
  ALLOWED_VIDEO_TYPES,
  allowedTypesFor,
  validateUpload,
}
export type { UploadKind, UploadValidationError }

/**
 * Raised when no upload backend can accept the file: the deployment has none
 * configured, or the configured one rejected the write. The message is written
 * for the admin who sees it in a toast and names the fix, so the upload route
 * forwards it verbatim instead of collapsing it into "Something went wrong".
 */
export class UploadBackendError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadBackendError'
  }
}

/** Every Vercel Blob read-write token carries this prefix. */
const BLOB_TOKEN_PREFIX = 'vercel_blob_rw_'

const EXTENSION_BY_TYPE: Record<string, string> = {
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
 * An env var that exists but holds an empty string — the shape `.env.example`
 * ships and the one a copied-into-the-dashboard value usually has — means "not
 * configured", not "configured with nothing".
 */
function blobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  return token ? token : null
}

function isBlobConfigured(): boolean {
  return blobToken() !== null
}

/** True on hosts whose application filesystem is read-only at runtime. */
function isReadOnlyFilesystem(): boolean {
  return Boolean(process.env.VERCEL)
}

const BLOB_SETUP_HINT =
  'Create one in the Vercel dashboard under Storage → Blob and connect it to this project — ' +
  'BLOB_READ_WRITE_TOKEN is then injected automatically — then redeploy.'

/** `my Photo (2).PNG` -> `my-photo-2` */
function slugifyBaseName(name: string): string {
  return (
    path
      .basename(name, path.extname(name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'file'
  )
}

export interface StoredFile {
  url: string
  pathname: string
  size: number
  contentType: string
}

/**
 * @param folder logical grouping, e.g. "projects" or "certifications"
 */
export async function storeFile(file: File, folder: string): Promise<StoredFile> {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'misc'
  const ext = EXTENSION_BY_TYPE[file.type] ?? 'bin'
  // Random suffix prevents collisions and stops one upload overwriting another
  // when two files share a name.
  const filename = `${slugifyBaseName(file.name)}-${randomBytes(6).toString('hex')}.${ext}`
  const pathname = `uploads/${safeFolder}/${filename}`

  const token = blobToken()

  if (token) {
    // A placeholder pasted into the dashboard reaches Blob as a real request
    // and comes back as an opaque failure, so reject it on sight instead.
    if (!token.startsWith(BLOB_TOKEN_PREFIX)) {
      throw new UploadBackendError(
        `BLOB_READ_WRITE_TOKEN is set but is not a Vercel Blob token (it should start with "${BLOB_TOKEN_PREFIX}"). ${BLOB_SETUP_HINT}`
      )
    }

    try {
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: file.type,
        token,
        // Our own suffix already guarantees uniqueness; disabling Vercel's keeps
        // the stored URL predictable.
        addRandomSuffix: false,
      })
      return {
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        contentType: file.type,
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      throw new UploadBackendError(
        `Vercel Blob rejected the upload: ${detail} Check that the Blob store still exists and is connected to this project.`
      )
    }
  }

  // ---- local disk fallback ----
  // Only viable where the app can write to its own directory. On Vercel it
  // never is, and silently trying is what turns a missing Blob store into an
  // unexplained 500.
  if (isReadOnlyFilesystem()) {
    throw new UploadBackendError(
      `Uploads have no storage configured on this deployment. Vercel's filesystem is read-only, so a Vercel Blob store is required. ${BLOB_SETUP_HINT}`
    )
  }

  const publicDir = path.join(process.cwd(), 'public')
  const targetDir = path.join(publicDir, 'uploads', safeFolder)

  try {
    await mkdir(targetDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(targetDir, filename), buffer)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new UploadBackendError(`Could not write the file to public/uploads: ${detail}`)
  }

  return {
    url: `/${pathname}`,
    pathname: `/${pathname}`,
    size: file.size,
    contentType: file.type,
  }
}

/**
 * Best-effort delete of a previously stored file. Never throws: a missing or
 * externally-hosted asset must not fail the surrounding save.
 */
export async function deleteFile(url: string): Promise<void> {
  if (!url) return

  try {
    if (url.startsWith('http')) {
      const token = blobToken()
      if (token && url.includes('.public.blob.vercel-storage.com')) {
        await del(url, { token })
      }
      return
    }

    // Only ever delete inside public/uploads — never a bundled /assets file.
    if (!url.startsWith('/uploads/')) return

    const target = path.join(process.cwd(), 'public', url.replace(/^\//, ''))
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads')
    const resolved = path.resolve(target)
    if (!resolved.startsWith(path.resolve(uploadsRoot))) return

    await unlink(resolved)
  } catch (err) {
    console.warn('[storage] delete skipped:', (err as Error).message)
  }
}

export function storageBackend(): 'vercel-blob' | 'local-disk' {
  return isBlobConfigured() ? 'vercel-blob' : 'local-disk'
}

/**
 * Whether uploads can succeed at all in this environment. The admin panel shows
 * the reason up front rather than after a failed upload.
 */
export function uploadBackendStatus(): { ready: boolean; backend: string; reason?: string } {
  const token = blobToken()

  if (token) {
    return token.startsWith(BLOB_TOKEN_PREFIX)
      ? { ready: true, backend: 'vercel-blob' }
      : {
          ready: false,
          backend: 'vercel-blob',
          reason: `BLOB_READ_WRITE_TOKEN is not a Vercel Blob token (it should start with "${BLOB_TOKEN_PREFIX}"). ${BLOB_SETUP_HINT}`,
        }
  }

  if (isReadOnlyFilesystem()) {
    return {
      ready: false,
      backend: 'none',
      reason: `Uploads have no storage configured on this deployment. Vercel's filesystem is read-only, so a Vercel Blob store is required. ${BLOB_SETUP_HINT}`,
    }
  }

  return { ready: true, backend: 'local-disk' }
}
