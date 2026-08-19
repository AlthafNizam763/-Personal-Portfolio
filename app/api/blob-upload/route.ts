import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'
import {
  allowedTypesFor,
  maxBytesFor,
  type UploadKind,
} from '@/lib/upload-limits'
import { supportsClientUploads } from '@/lib/storage'

/**
 * Token issuer for direct-to-Blob uploads.
 *
 * A file posted to `/api/admin/upload` travels through a serverless function,
 * and Vercel rejects any request body over 4.5 MB before the handler runs —
 * which rules out video. This route instead hands the browser a short-lived,
 * tightly scoped token so it can stream the file straight to Vercel Blob, and
 * only the resulting URL comes back through the app.
 *
 * It deliberately sits outside `/api/admin` because Vercel calls it back on
 * `blob.upload-completed` with no session cookie, and `middleware.ts` 401s
 * every unauthenticated `/api/admin/*` request. Both branches are still
 * authenticated:
 *
 *  - `blob.generate-client-token` requires an admin session, exactly like the
 *    upload route it stands in for.
 *  - `blob.upload-completed` is verified by `handleUpload` against the store's
 *    HMAC signature, so only Vercel can invoke it.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KINDS: UploadKind[] = ['image', 'document', 'video', 'media']

/** The exact shape `buildUploadPathname` produces — nothing else is accepted. */
const PATHNAME_PATTERN = /^uploads\/[a-z0-9-]{1,40}\/[a-z0-9-]{1,60}-[0-9a-f]{6,32}\.[a-z0-9]{1,5}$/

interface ClientPayload {
  kind: UploadKind
  contentType: string
}

function parseClientPayload(raw: string | null): ClientPayload {
  if (!raw) throw new Error('Upload metadata is missing.')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Upload metadata is not valid JSON.')
  }

  const { kind, contentType } = (parsed ?? {}) as Partial<ClientPayload>

  if (!kind || !KINDS.includes(kind)) throw new Error('Unknown upload kind.')
  if (!contentType || !allowedTypesFor(kind).includes(contentType)) {
    throw new Error(`"${contentType ?? 'unknown'}" is not allowed for a ${kind} upload.`)
  }

  return { kind, contentType }
}

export async function POST(request: Request) {
  if (!supportsClientUploads()) {
    return NextResponse.json(
      { ok: false, error: 'Direct uploads need a Vercel Blob store to be configured.' },
      { status: 503 }
    )
  }

  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected a JSON body.' }, { status: 400 })
  }

  try {
    // The response shape is dictated by the Blob client (`{ clientToken }`),
    // so this route returns it verbatim rather than in the app's envelope.
    const result = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Only an admin may mint a write token. The upload-completed branch
        // below carries no session, which is why the check lives here and not
        // at the top of the handler.
        if (!(await getSession())) throw new Error('You must be signed in to upload.')

        if (!PATHNAME_PATTERN.test(pathname)) {
          throw new Error('Rejected upload path.')
        }

        const { kind, contentType } = parseClientPayload(clientPayload)

        return {
          // Scoped to the one type and size the browser said it was sending,
          // so a leaked token cannot be reused to store something else.
          allowedContentTypes: [contentType],
          maximumSizeInBytes: maxBytesFor(kind, contentType),
          // The pathname already carries a random suffix.
          addRandomSuffix: false,
        }
      },

      onUploadCompleted: async ({ blob }) => {
        // The browser already has the URL from its own `upload()` call, so
        // nothing here is load-bearing — it is only a server-side trace.
        // Vercel cannot reach localhost, so this stays silent in development.
        console.info('[blob-upload] stored', blob.pathname)
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload could not be authorised.'
    console.error('[blob-upload]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
