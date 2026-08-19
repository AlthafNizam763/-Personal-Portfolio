/**
 * Read/write helpers for the admin panel's notification toggles.
 *
 * The values live on the `SiteSettings` singleton (`notifications.email`,
 * `.whatsapp`, `.push`) rather than in a model of their own — it is already
 * the document that holds site-wide configuration, and `getOrCreateSettings()`
 * guarantees it exists.
 *
 * Reads are deliberately *not* cached. `getPortfolioData()` is wrapped in
 * `unstable_cache` because the public page can tolerate a stale minute; a
 * toggle flipped in the admin panel has to apply to the very next submission,
 * which is what "changes take effect immediately" means here.
 */

import { SiteSettings } from '@/models'
import { CHANNEL_NAMES, type ChannelName, type ChannelToggles } from './notifications/types'

/**
 * Every channel is on by default, so adding this feature to a deployment that
 * already had email working does not silently switch it off.
 */
export const DEFAULT_TOGGLES: ChannelToggles = { email: true, whatsapp: true, push: true }

/** Coerces whatever is stored (or missing) into three real booleans. */
export function normaliseToggles(raw: unknown): ChannelToggles {
  const source = (raw ?? {}) as Record<string, unknown>

  return CHANNEL_NAMES.reduce((acc, channel) => {
    const value = source[channel]
    acc[channel] = value === undefined || value === null ? DEFAULT_TOGGLES[channel] : Boolean(value)
    return acc
  }, {} as ChannelToggles)
}

/**
 * Current toggles, straight from the database.
 *
 * Falls back to the defaults if the read fails: the caller has just saved a
 * message, and losing the notification because a second query hiccuped would
 * be a worse outcome than sending one the owner had switched off.
 */
export async function getChannelToggles(): Promise<ChannelToggles> {
  try {
    const doc = await SiteSettings.findOne().select('notifications').lean()
    return normaliseToggles(doc?.notifications)
  } catch (err) {
    console.error('[notify] could not read notification settings:', (err as Error).message)
    return { ...DEFAULT_TOGGLES }
  }
}

/**
 * Writes the three switches without touching the rest of the settings
 * document — the SEO screen and this one save independently, and a whole-doc
 * `set()` from either would clobber the other.
 */
export async function saveChannelToggles(toggles: ChannelToggles): Promise<ChannelToggles> {
  const update = CHANNEL_NAMES.reduce(
    (acc, channel: ChannelName) => {
      acc[`notifications.${channel}`] = toggles[channel]
      return acc
    },
    {} as Record<string, boolean>
  )

  const saved = await SiteSettings.findOneAndUpdate(
    {},
    { $set: update },
    // The singleton is normally created by `getOrCreateSettings()`, but a
    // fresh database could reach this first.
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
    .select('notifications')
    .lean()

  return normaliseToggles(saved?.notifications)
}
