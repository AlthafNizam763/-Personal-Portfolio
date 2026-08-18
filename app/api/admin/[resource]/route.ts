import { connectToDatabase } from '@/lib/db'
import { getResource } from '@/lib/resources'
import { requireSession } from '@/lib/auth'
import { revalidatePortfolio } from '@/lib/data'
import { toFieldErrors } from '@/lib/validators'
import { fail, notFound, ok, parseListQuery, readJson, serverError, unauthorized } from '@/lib/api'
import { slugify } from '@/lib/utils'
import { duplicateKeyField, uniqueSlug } from '@/lib/slug'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Generic list + create endpoint shared by every manageable content type.
 * Behaviour is driven entirely by `lib/resources.ts`, so adding a resource
 * needs no new route file.
 *
 * GET  /api/admin/:resource?search=&sort=&dir=&page=&pageSize=&enabled=true
 * POST /api/admin/:resource
 */

export async function GET(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  try {
    if (!(await requireSession())) return unauthorized()

    const { resource } = await params
    const config = getResource(resource)
    if (!config) return notFound('Resource')

    await connectToDatabase()

    const url = new URL(req.url)
    const { filter, sort, page, pageSize, skip } = parseListQuery(url.searchParams, config)

    const [docs, total] = await Promise.all([
      config.model.find(filter).sort(sort).skip(skip).limit(pageSize).lean(),
      config.model.countDocuments(filter),
    ])

    // Distinct values for the filter dropdowns (e.g. skill categories). Run
    // against the whole collection, not just the current page, so the options
    // do not shift as the user pages through.
    const facets: Record<string, string[]> = {}
    await Promise.all(
      config.enumFilters.map(async (field) => {
        const values = await config.model.distinct(field)
        facets[field] = values
          .filter((v: unknown): v is string => typeof v === 'string' && v.length > 0)
          .sort((a, b) => a.localeCompare(b))
      })
    )

    return ok(
      { items: docs.map(config.serialize), facets },
      {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    )
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  try {
    if (!(await requireSession())) return unauthorized()

    const { resource } = await params
    const config = getResource(resource)
    if (!config) return notFound('Resource')

    if (!config.creatable || !config.createSchema) {
      return fail(`${config.plural} cannot be created here.`, 405)
    }

    const parsed = config.createSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('Please check the form for errors.', 422, toFieldErrors(parsed.error))
    }

    const payload = parsed.data as Record<string, unknown>

    await connectToDatabase()

    // New records go to the end of the list unless an explicit order was sent.
    if (config.orderable && !payload.order) {
      const last = await config.model.findOne().sort({ order: -1 }).select('order').lean()
      payload.order = ((last as { order?: number } | null)?.order ?? -1) + 1
    }

    if (resource === 'projects') {
      payload.slug = await uniqueSlug(
        config.model,
        (payload.slug as string) || slugify(String(payload.title ?? ''))
      )
    }

    const created = await config.model.create(payload)
    revalidatePortfolio()

    return ok(config.serialize(created.toObject()), undefined, 201)
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
