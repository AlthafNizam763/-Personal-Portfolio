import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site'
import { getPortfolioData } from '@/lib/data'

/**
 * The portfolio is a single page with in-page anchors, so the sitemap lists
 * the root plus each enabled section. Section anchors are included because
 * Google surfaces them as "jump to" links in results.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const { settings } = await getPortfolioData()
  const lastModified = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: 'monthly', priority: 1 },
  ]

  for (const [section, isEnabled] of Object.entries(settings.sections)) {
    if (!isEnabled || section === 'hero') continue
    entries.push({
      url: `${base}/#${section}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  return entries
}
