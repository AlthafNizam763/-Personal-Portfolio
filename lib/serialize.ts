import type {
  AchievementDTO,
  CertificationDTO,
  EducationDTO,
  ExperienceDTO,
  MessageDTO,
  ProfileDTO,
  ProjectDTO,
  SectionKey,
  ServiceDTO,
  SiteSettingsDTO,
  SkillDTO,
  SocialLinkDTO,
} from './types'

/**
 * Mongoose lean documents contain ObjectId and Date instances, neither of
 * which React can pass from a server component to a client component. Every
 * document therefore goes through one of these mappers first.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>

const id = (d: Doc): string => String(d?._id ?? '')
const str = (v: unknown, fallback = ''): string =>
  v === null || v === undefined ? fallback : String(v)
const bool = (v: unknown, fallback = false): boolean =>
  v === null || v === undefined ? fallback : Boolean(v)
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []
const date = (v: unknown): string | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function serializeProfile(d: Doc): ProfileDTO {
  return {
    id: id(d),
    name: str(d.name),
    title: str(d.title),
    headline: str(d.headline),
    typedPhrases: arr(d.typedPhrases),
    shortDescription: str(d.shortDescription),
    aboutParagraphs: arr(d.aboutParagraphs),
    location: str(d.location),
    email: str(d.email),
    phone: str(d.phone),
    profileImage: str(d.profileImage),
    heroImage: str(d.heroImage, '/assets/hero-vector.svg'),
    aboutImage: str(d.aboutImage, '/assets/about-me.svg'),
    logo: str(d.logo, '/assets/logo.svg'),
    resumeUrl: str(d.resumeUrl),
    resumeLabel: str(d.resumeLabel, 'Resume'),
    availableForWork: bool(d.availableForWork, true),
  }
}

export function serializeSkill(d: Doc): SkillDTO {
  return {
    id: id(d),
    name: str(d.name),
    category: str(d.category, 'Other'),
    level: num(d.level, 80),
    icon: str(d.icon, 'TbCode'),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeExperience(d: Doc): ExperienceDTO {
  return {
    id: id(d),
    company: str(d.company),
    position: str(d.position),
    employmentType: str(d.employmentType, 'Full-time'),
    location: str(d.location),
    startDate: date(d.startDate),
    endDate: date(d.endDate),
    current: bool(d.current),
    description: str(d.description),
    technologies: arr(d.technologies),
    companyLogo: str(d.companyLogo),
    companyUrl: str(d.companyUrl),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeProject(d: Doc): ProjectDTO {
  return {
    id: id(d),
    title: str(d.title),
    slug: str(d.slug),
    description: str(d.description),
    image: str(d.image),
    images: Array.isArray(d.images)
      ? d.images
          .filter((i: Doc) => i && i.url)
          .map((i: Doc) => ({ url: str(i.url), alt: str(i.alt) }))
      : [],
    video: str(d.video),
    technologies: arr(d.technologies),
    githubUrl: str(d.githubUrl),
    liveUrl: str(d.liveUrl),
    category: str(d.category, 'Web'),
    featured: bool(d.featured),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeEducation(d: Doc): EducationDTO {
  return {
    id: id(d),
    institution: str(d.institution),
    degree: str(d.degree),
    fieldOfStudy: str(d.fieldOfStudy),
    grade: str(d.grade),
    startDate: date(d.startDate),
    endDate: date(d.endDate),
    current: bool(d.current),
    description: str(d.description),
    image: str(d.image),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeCertification(d: Doc): CertificationDTO {
  return {
    id: id(d),
    name: str(d.name),
    organization: str(d.organization),
    issueDate: date(d.issueDate),
    expiryDate: date(d.expiryDate),
    credentialId: str(d.credentialId),
    credentialUrl: str(d.credentialUrl),
    image: str(d.image),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeAchievement(d: Doc): AchievementDTO {
  return {
    id: id(d),
    title: str(d.title),
    description: str(d.description),
    date: date(d.date),
    issuer: str(d.issuer),
    icon: str(d.icon, 'TbTrophy'),
    image: str(d.image),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeService(d: Doc): ServiceDTO {
  return {
    id: id(d),
    title: str(d.title),
    description: str(d.description),
    icon: str(d.icon, 'TbCode'),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeSocialLink(d: Doc): SocialLinkDTO {
  return {
    id: id(d),
    platform: str(d.platform),
    label: str(d.label),
    url: str(d.url),
    icon: str(d.icon, 'TbLink'),
    enabled: bool(d.enabled, true),
    order: num(d.order),
  }
}

export function serializeMessage(d: Doc): MessageDTO {
  return {
    id: id(d),
    name: str(d.name),
    email: str(d.email),
    website: str(d.website),
    message: str(d.message),
    read: bool(d.read),
    archived: bool(d.archived),
    ip: str(d.ip),
    createdAt: date(d.createdAt) ?? new Date(0).toISOString(),
  }
}

const SECTION_KEYS: SectionKey[] = [
  'hero',
  'skills',
  'experience',
  'about',
  'services',
  'projects',
  'education',
  'certifications',
  'achievements',
  'contact',
]

export function serializeSettings(d: Doc): SiteSettingsDTO {
  const raw = (d?.sections ?? {}) as Record<string, unknown>
  const sections = SECTION_KEYS.reduce(
    (acc, key) => {
      // Sections absent from the original React site stay off unless enabled.
      const defaultOn = !['services', 'education', 'certifications', 'achievements'].includes(key)
      acc[key] = raw[key] === undefined ? defaultOn : Boolean(raw[key])
      return acc
    },
    {} as Record<SectionKey, boolean>
  )

  return {
    id: id(d),
    siteTitle: str(d.siteTitle, 'Portfolio'),
    siteDescription: str(d.siteDescription),
    keywords: arr(d.keywords),
    ogImage: str(d.ogImage, '/assets/preview.png'),
    favicon: str(d.favicon, '/assets/xpalico.png'),
    twitterHandle: str(d.twitterHandle),
    themeColor: str(d.themeColor, '#000000'),
    showCursorAnimation: bool(d.showCursorAnimation, true),
    sections,
    navLinks: Array.isArray(d.navLinks)
      ? d.navLinks
          .filter((l: Doc) => l && l.label && l.href)
          .map((l: Doc) => ({ label: str(l.label), href: str(l.href) }))
      : [],
  }
}
