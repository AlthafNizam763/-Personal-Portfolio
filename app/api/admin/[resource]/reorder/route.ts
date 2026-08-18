import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/db'
import { getResource } from '@/lib/resources'
import { requireSession } from '@/lib/auth'
import { revalidatePortfolio } from '@/lib/data'
import { reorderSchema } from '@/lib/validators'
import { fail, notFound, ok, readJson, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Persists a new display order.
 *
 * POST /api/admin/:resource/reorder  { ids: [...], offset?: number }
 *
 * The `ids` array is the desired order; each record's `order` becomes
 * `offset + index`. Written as one bulk operation so the list cannot be left
 * half-sorted.
 *
 * This static segment is declared alongside `[id]`, and Next.js matches static
 * segments first, so "reorder" never reaches the id handler.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  try {
    if (!(await requireSession())) return unauthorized()

    const { resource } = await params
    const config = getResource(resource)
    if (!config) return notFound('Resource')
    if (!config.orderable) return fail(`${config.plural} cannot be reordered.`, 405)

    const parsed = reorderSchema.safeParse(await readJson(req))
    if (!parsed.success) return fail('Expected a list of ids to reorder.', 422)

    const { offset } = parsed.data
    const ids = parsed.data.ids.filter((id) => mongoose.isValidObjectId(id))
    if (ids.length === 0) return fail('No valid ids supplied.', 422)

    await connectToDatabase()

    await config.model.bulkWrite(
      ids.map((id, index) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { order: offset + index } },
        },
      }))
    )

    revalidatePortfolio()
    return ok({ reordered: ids.length })
  } catch (err) {
    return serverError(err)
  }
}
