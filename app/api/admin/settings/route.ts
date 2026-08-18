import { connectToDatabase } from '@/lib/db'
import { SiteSettings } from '@/models'
import { requireSession } from '@/lib/auth'
import { getOrCreateSettings, revalidatePortfolio } from '@/lib/data'
import { siteSettingsSchema, toFieldErrors } from '@/lib/validators'
import { serializeSettings } from '@/lib/serialize'
import { fail, ok, readJson, serverError, unauthorized } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Singleton resource holding SEO metadata and section visibility toggles. */

export async function GET() {
  try {
    if (!(await requireSession())) return unauthorized()

    await connectToDatabase()
    const settings = await getOrCreateSettings()
    return ok(serializeSettings(settings))
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const parsed = siteSettingsSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('Please check the form for errors.', 422, toFieldErrors(parsed.error))
    }

    await connectToDatabase()

    const existing = await SiteSettings.findOne()
    if (existing) {
      existing.set(parsed.data)
      await existing.save()
      revalidatePortfolio()
      return ok(serializeSettings(existing.toObject()))
    }

    const created = await SiteSettings.create(parsed.data)
    revalidatePortfolio()
    return ok(serializeSettings(created.toObject()))
  } catch (err) {
    return serverError(err)
  }
}
