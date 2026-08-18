import { put, del } from '@vercel/blob'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

/**
 * Upload adapter with two backends:
 *
 *  - Vercel Blob  — used whenever BLOB_READ_WRITE_TOKEN is present. Required in
 *    production because Vercel's filesystem is read-only.
 *  - Local disk   — development fallback writing into `public/uploads/`, which
 *    is git-ignored.
 *
 * Both return a URL that can be dropped straight into `src`.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8 MB

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

export function allowedTypesFor(kind: UploadKind): readonly string[] {
  if (kind === 'document') return ALLOWED_DOC_TYPES
  if (kind === 'video') return ALLOWED_VIDEO_TYPES
  return ALLOWED_IMAGE_TYPES
}

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

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

export interface UploadValidationError {
  error: string
}

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
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${
        MAX_UPLOAD_BYTES / 1024 / 1024
      } MB.`,
    }
  }
  if (file.size === 0) return { error: 'File is empty.' }
  return null
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

  if (isBlobConfigured()) {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
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
  }

  // ---- local disk fallback ----
  const publicDir = path.join(process.cwd(), 'public')
  const targetDir = path.join(publicDir, 'uploads', safeFolder)
  await mkdir(targetDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(targetDir, filename), buffer)

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
      if (isBlobConfigured() && url.includes('.public.blob.vercel-storage.com')) {
        await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN })
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
