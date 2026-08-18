import { connectToDatabase } from '@/lib/db'
import { Profile } from '@/models'
import { requireSession } from '@/lib/auth'
import { getOrCreateProfile, revalidatePortfolio } from '@/lib/data'
import { profileSchema, toFieldErrors } from '@/lib/validators'
import { serializeProfile } from '@/lib/serialize'
import { fail, ok, readJson, serverError, unauthorized } from '@/lib/api'
import { deleteFile } from '@/lib/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Singleton resource — there is exactly one profile document, created from the
 * seed defaults on first read.
 */

export async function GET() {
  try {
    if (!(await requireSession())) return unauthorized()

    await connectToDatabase()
    const profile = await getOrCreateProfile()
    return ok(serializeProfile(profile))
  } catch (err) {
    return serverError(err)
  }
}

const FILE_FIELDS = ['profileImage', 'heroImage', 'aboutImage', 'logo', 'resumeUrl'] as const

export async function PUT(req: Request) {
  try {
    if (!(await requireSession())) return unauthorized()

    const parsed = profileSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return fail('Please check the form for errors.', 422, toFieldErrors(parsed.error))
    }

    await connectToDatabase()

    const existing = await Profile.findOne()
    const payload = parsed.data

    if (existing) {
      // Remove replaced uploads, but never delete a bundled /assets file —
      // deleteFile already restricts itself to /uploads and Blob URLs.
      for (const field of FILE_FIELDS) {
        const previous = existing[field] as string | undefined
        const next = payload[field]
        if (previous && next !== undefined && previous !== next) {
          await deleteFile(previous)
        }
      }

      existing.set(payload)
      await existing.save()
      revalidatePortfolio()
      return ok(serializeProfile(existing.toObject()))
    }

    const created = await Profile.create(payload)
    revalidatePortfolio()
    return ok(serializeProfile(created.toObject()))
  } catch (err) {
    return serverError(err)
  }
}
