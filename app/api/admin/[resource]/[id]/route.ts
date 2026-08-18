import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { getResource } from '@/lib/resources'
import { requireSession } from '@/lib/auth'
import { revalidatePortfolio } from '@/lib/data'
import { toFieldErrors } from '@/lib/validators'
import { fail, notFound, ok, readJson, serverError, unauthorized } from '@/lib/api'
import { deleteFile } from '@/lib/storage'
import { slugify } from '@/lib/utils'
import { duplicateKeyField, uniqueSlug } from '@/lib/slug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generic read / update / delete for a single record of any resource.
 *
 * GET    /api/admin/:resource/:id
 * PATCH  /api/admin/:resource/:id   — partial update
 * DELETE /api/admin/:resource/:id
 */

type Ctx = { params: Promise<{ resource: string; id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    if (!(await requireSession())) return unauthorized()

    const { resource, id } = await params
    const config = getResource(resource)
    if (!config) return notFound('Resource')
    if (!mongoose.isValidObjectId(id)) return notFound(config.singular)

    await connectToDatabase()
    const doc = await config.model.findById(id).lean()
    if (!doc) return notFound(config.singular)

    return ok(config.serialize(doc))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    if (!(await requireSession())) return unauthorized()

    const { resource, id } = await params
    const config = getResource(resource)
    if (!config) return notFound('Resource')
    if (!mongoose.isValidObjectId(id)) return notFound(config.singular)

    await connectToDatabase()
    const existing = await config.model.findById(id)
    if (!existing) return notFound(config.singular)

    const body = (await readJson(req)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') return fail('Invalid request body.', 400)

    let payload: Record<string, unknown>

    if (config.createSchema) {
      // `.partial()` lets the client send only the fields it changed while
      // still validating whatever it does send.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const partial = (config.createSchema as any).partial()
      const parsed = partial.safeParse(body)
      if (!parsed.success) {
        return fail('Please check the form for errors.', 422, toFieldErrors(parsed.error))
      }
      payload = parsed.data as Record<string, unknown>
    } else {
      // Read-only resources (messages) accept only their status flags.
      payload = {}
      if (typeof body.read === 'boolean') payload.read = body.read
      if (typeof body.archived === 'boolean') payload.archived = body.archived
      if (Object.keys(payload).length === 0) {
        return fail('Only "read" and "archived" can be updated on a message.', 422)
      }
    }

    if (resource === 'projects' && typeof payload.slug !== 'undefined') {
      payload.slug = await uniqueSlug(
        config.model,
        (payload.slug as string) || slugify(String(payload.title ?? existing.title ?? '')),
        id
      )
    }

    // Remove a file that is being replaced or cleared, so storage does not
    // accumulate orphans. Only touches fields present in this request.
    for (const field of config.fileFields) {
      const next = payload[field]
      const previous = existing[field] as string | undefined
      if (typeof next === 'string' && previous && previous !== next) {
        await deleteFile(previous)
      }
    }

    existing.set(payload)
    await existing.save()

    revalidatePortfolio()
    return ok(config.serialize(existing.toObject()))
  } catch (err) {
    const field = duplicateKeyField(err)
    if (field) {
      return fail(`That ${field} is already in use.`, 422, {
        [field]: [`That ${field} is already in use.`],
      })
    }
    return serverError(err)
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await requireSession())) return unauthorized()

    const { resource, id } = await params
    const config = getResource(resource)
    if (!config) return notFound('Resource')
    if (!mongoose.isValidObjectId(id)) return notFound(config.singular)

    await connectToDatabase()
    const doc = await config.model.findById(id).lean()
    if (!doc) return notFound(config.singular)

    // Clean up uploaded media belonging to this record.
    const record = doc as Record<string, unknown>
    for (const field of config.fileFields) {
      const value = record[field]
      if (typeof value === 'string') await deleteFile(value)
    }
    if (Array.isArray(record.images)) {
      for (const img of record.images as Array<{ url?: string }>) {
        if (img?.url) await deleteFile(img.url)
      }
    }

    await config.model.findByIdAndDelete(id)
    revalidatePortfolio()

    return ok({ deleted: true, id })
  } catch (err) {
    return serverError(err)
  }
}
