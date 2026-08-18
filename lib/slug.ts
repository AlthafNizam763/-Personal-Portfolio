import type { Model } from 'mongoose'

/**
 * Appends `-2`, `-3`, … until the slug is free within the collection.
 *
 * Lives in lib/ rather than beside the route handlers because Next.js route
 * files may only export HTTP verbs and route config.
 */
export async function uniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = base || 'item'

  for (let i = 0; i < 200; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const query: Record<string, unknown> = { slug: candidate }
    if (excludeId) query._id = { $ne: excludeId }

    if (!(await model.exists(query))) return candidate
  }

  // Pathological collision count — fall back to something guaranteed unique.
  return `${root}-${Date.now()}`
}

/** Maps a Mongo duplicate-key error to the field that collided. */
export function duplicateKeyField(err: unknown): string | null {
  const e = err as { code?: number; keyPattern?: Record<string, unknown> }
  if (e?.code !== 11000) return null
  return Object.keys(e.keyPattern ?? {})[0] ?? 'value'
}
