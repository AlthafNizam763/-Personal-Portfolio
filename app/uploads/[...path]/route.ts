import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Serves files uploaded to the local-disk backend (`public/uploads/**`).
 *
 * Next.js indexes `public/` at build time, so anything written there
 * afterwards is not picked up by the static file handler — a file uploaded
 * through the admin would 404 under `next start`. This handler reads it from
 * disk per request instead.
 *
 * On Vercel this route is effectively dead code: `BLOB_READ_WRITE_TOKEN` is
 * set, so uploads return absolute Blob CDN URLs that never reach the app.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params

  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads')
  const target = path.resolve(uploadsRoot, ...segments)

  // Path-traversal guard: never serve anything outside public/uploads.
  // The separator check stops "…/uploads-secrets" matching the prefix.
  if (target !== uploadsRoot && !target.startsWith(uploadsRoot + path.sep)) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const stats = await stat(target)
    if (!stats.isFile()) return new Response('Not found', { status: 404 })

    const contentType =
      CONTENT_TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream'

    const stream = Readable.toWeb(createReadStream(target)) as ReadableStream

    return new Response(stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
        // Filenames carry a random suffix, so a stored URL always points at
        // the same bytes and can be cached hard.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
