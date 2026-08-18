import { requireSession } from '@/lib/auth'
import { fail, ok, serverError, unauthorized } from '@/lib/api'
import {
  MAX_UPLOAD_BYTES,
  storageBackend,
  storeFile,
  validateUpload,
  deleteFile,
  type UploadKind,
} from '@/lib/storage'

// Needs the Node runtime for filesystem access in the local-disk fallback.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Large uploads on a cold container can take a while to stream to Blob.
export const maxDuration = 60

const KINDS: UploadKind[] = ['image', 'document', 'video']

/**
 * POST /api/admin/upload
 *   multipart/form-data: file, folder?, kind?
 *
 * Returns { url } which the caller stores on the record it belongs to.
 */
export async function POST(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const contentType = req.headers.get('content-type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return fail('Expected a multipart/form-data upload.', 415)
    }

    const form = await req.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return fail('No file was included in the request.', 422)
    }

    const rawKind = String(form.get('kind') ?? 'image')
    const kind: UploadKind = KINDS.includes(rawKind as UploadKind)
      ? (rawKind as UploadKind)
      : 'image'

    const invalid = validateUpload(file, kind)
    if (invalid) return fail(invalid.error, 422)

    const folder = String(form.get('folder') ?? 'misc')
    const stored = await storeFile(file, folder)

    return ok({
      url: stored.url,
      pathname: stored.pathname,
      size: stored.size,
      contentType: stored.contentType,
      backend: storageBackend(),
    })
  } catch (err) {
    // Vercel rejects request bodies over its platform limit before we see them.
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Body exceeded') || message.includes('413')) {
      return fail(
        `That file is too large. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
        413
      )
    }
    return serverError(err)
  }
}

/**
 * DELETE /api/admin/upload?url=...
 * Used when the admin removes an image from a gallery before saving.
 */
export async function DELETE(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const url = new URL(req.url).searchParams.get('url')
    if (!url) return fail('No file url supplied.', 422)

    await deleteFile(url)
    return ok({ deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
