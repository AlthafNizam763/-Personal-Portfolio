import { connectToDatabase } from '@/lib/db'
import { Message } from '@/models'
import { contactSchema, toFieldErrors } from '@/lib/validators'
import { fail, getClientIp, ok, readJson, serverError } from '@/lib/api'
import { checkLoginRateLimit } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public endpoint behind the portfolio's contact form. Submissions land in
 * Admin -> Messages.
 */
export async function POST(req: Request) {
  try {
    const parsed = contactSchema.safeParse(await readJson(req))
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error)
      const first = Object.values(fieldErrors)[0]?.[0]
      return fail(first ?? 'Please check the form and try again.', 422, fieldErrors)
    }

    const { name, email, website, message, company } = parsed.data

    // Honeypot tripped — accept the request so the bot sees success, but do
    // not store anything.
    if (company) return ok({ received: true })

    const ip = getClientIp(req)
    // Reuses the fixed-window limiter: 5 messages per IP per 10 minutes.
    const limit = checkLoginRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)
    if (!limit.allowed) {
      return fail('You have sent several messages already. Please try again later.', 429)
    }

    await connectToDatabase()
    await Message.create({
      name,
      email,
      website,
      message,
      ip,
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? '',
    })

    return ok({ received: true }, undefined, 201)
  } catch (err) {
    return serverError(err)
  }
}
