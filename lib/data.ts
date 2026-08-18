import { unstable_cache, revalidateTag } from 'next/cache'
import { tryConnect } from './db'
import {
  Achievement,
  Certification,
  Education,
  Experience,
  Profile,
  Project,
  Service,
  SiteSettings,
  Skill,
  SocialLink,
} from '@/models'
import {
  serializeAchievement,
  serializeCertification,
  serializeEducation,
  serializeExperience,
  serializeProfile,
  serializeProject,
  serializeService,
  serializeSettings,
  serializeSkill,
  serializeSocialLink,
} from './serialize'
import { buildFallbackPortfolio, SEED_PROFILE, SEED_SETTINGS } from './seed-content'
import type { PortfolioData } from './types'

/**
 * Single cache tag for all public portfolio content. Every admin mutation
 * calls `revalidatePortfolio()`, which busts this tag — that is the mechanism
 * behind "admin saves -> public site updates automatically" with no rebuild.
 */
export const PORTFOLIO_TAG = 'portfolio'

/** Ensures the two singleton documents exist, creating them from seed if not. */
export async function getOrCreateProfile() {
  const existing = await Profile.findOne().lean()
  if (existing) return existing
  const created = await Profile.create(SEED_PROFILE)
  return created.toObject()
}

export async function getOrCreateSettings() {
  const existing = await SiteSettings.findOne().lean()
  if (existing) return existing
  const created = await SiteSettings.create(SEED_SETTINGS)
  return created.toObject()
}

async function fetchPortfolio(): Promise<PortfolioData> {
  const connected = await tryConnect()
  if (!connected) {
    // Database unreachable — serve the captured original content so the site
    // never renders blank.
    return buildFallbackPortfolio()
  }

  try {
    const [
      profileDoc,
      settingsDoc,
      skillDocs,
      experienceDocs,
      projectDocs,
      educationDocs,
      certificationDocs,
      achievementDocs,
      serviceDocs,
      socialDocs,
    ] = await Promise.all([
      getOrCreateProfile(),
      getOrCreateSettings(),
      Skill.find({ enabled: true }).sort({ order: 1, _id: 1 }).lean(),
      Experience.find({ enabled: true }).sort({ order: 1, startDate: -1 }).lean(),
      Project.find({ enabled: true }).sort({ order: 1, _id: 1 }).lean(),
      Education.find({ enabled: true }).sort({ order: 1, startDate: -1 }).lean(),
      Certification.find({ enabled: true }).sort({ order: 1, issueDate: -1 }).lean(),
      Achievement.find({ enabled: true }).sort({ order: 1, date: -1 }).lean(),
      Service.find({ enabled: true }).sort({ order: 1, _id: 1 }).lean(),
      SocialLink.find({ enabled: true }).sort({ order: 1, _id: 1 }).lean(),
    ])

    return {
      profile: serializeProfile(profileDoc),
      settings: serializeSettings(settingsDoc),
      skills: skillDocs.map(serializeSkill),
      experiences: experienceDocs.map(serializeExperience),
      projects: projectDocs.map(serializeProject),
      education: educationDocs.map(serializeEducation),
      certifications: certificationDocs.map(serializeCertification),
      achievements: achievementDocs.map(serializeAchievement),
      services: serviceDocs.map(serializeService),
      socialLinks: socialDocs.map(serializeSocialLink),
    }
  } catch (err) {
    console.error('[data] portfolio query failed:', (err as Error).message)
    return buildFallbackPortfolio()
  }
}

/**
 * Cached read used by the public page and by `generateMetadata`. Both calls in
 * a single request hit the same cache entry, so the database is queried once.
 */
export const getPortfolioData = unstable_cache(fetchPortfolio, ['portfolio-data'], {
  tags: [PORTFOLIO_TAG],
  revalidate: 3600,
})

/** Call after any admin write so the public site picks up the change at once. */
export function revalidatePortfolio() {
  revalidateTag(PORTFOLIO_TAG)
}
