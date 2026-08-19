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
  req: Request,
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

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      // Filenames carry a random suffix, so a stored URL always points at
      // the same bytes and can be cached hard.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      // Advertised for every file: it is what tells a <video> it may seek.
      'Accept-Ranges': 'bytes',
    }

    const range = parseRange(req.headers.get('range'), stats.size)

    // Mobile Safari asks for a byte range before it will play a video at all,
    // and refuses anything that answers 200 with the whole file. Serving the
    // 206 it asks for is what makes uploaded clips playable on iOS — and what
    // lets any browser seek without downloading the whole thing first.
    if (range === 'invalid') {
      return new Response('Range not satisfiable', {
        status: 416,
        headers: { ...headers, 'Content-Range': `bytes */${stats.size}` },
      })
    }

    if (range) {
      const { start, end } = range
      const partial = Readable.toWeb(
        createReadStream(target, { start, end })
      ) as ReadableStream

      return new Response(partial, {
        status: 206,
        headers: {
          ...headers,
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Content-Length': String(end - start + 1),
        },
      })
    }

    const stream = Readable.toWeb(createReadStream(target)) as ReadableStream

    return new Response(stream, {
      headers: { ...headers, 'Content-Length': String(stats.size) },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

/**
 * Single-range parser — `bytes=0-`, `bytes=500-999`, `bytes=-1000`.
 *
 * Returns `null` when there is no range to honour and `'invalid'` when the
 * client asked for one that cannot be satisfied. Multi-range requests are
 * answered with the whole file, which is allowed and which no video player
 * actually needs.
 */
function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | 'invalid' | null {
  if (!header || size === 0) return null

  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null

  const [, rawStart, rawEnd] = match
  let start: number
  let end: number

  if (rawStart === '') {
    // Suffix form: the last N bytes.
    const suffix = Number(rawEnd)
    if (!rawEnd || Number.isNaN(suffix) || suffix === 0) return 'invalid'
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(rawStart)
    end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1)
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
    return 'invalid'
  }

  return { start, end }
}
