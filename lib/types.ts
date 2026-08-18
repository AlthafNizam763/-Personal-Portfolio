/**
 * Plain, serialisable shapes shared between server components, API routes and
 * client components. Mongoose documents are converted to these via the
 * `serialize` helpers in `lib/serialize.ts` before crossing the server/client
 * boundary (React cannot pass ObjectId or Date through props).
 */

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Freelance'
  | 'Internship'
  | 'Self-employed'

export interface SocialLinkDTO {
  id: string
  platform: string
  label: string
  url: string
  icon: string
  enabled: boolean
  order: number
}

export interface ProfileDTO {
  id: string
  name: string
  title: string
  headline: string
  typedPhrases: string[]
  shortDescription: string
  aboutParagraphs: string[]
  location: string
  email: string
  phone: string
  profileImage: string
  heroImage: string
  aboutImage: string
  logo: string
  resumeUrl: string
  resumeLabel: string
  availableForWork: boolean
}

export interface SkillDTO {
  id: string
  name: string
  category: string
  level: number
  icon: string
  enabled: boolean
  order: number
}

export interface ExperienceDTO {
  id: string
  company: string
  position: string
  employmentType: EmploymentType | string
  location: string
  startDate: string | null
  endDate: string | null
  current: boolean
  description: string
  technologies: string[]
  companyLogo: string
  companyUrl: string
  enabled: boolean
  order: number
}

export interface ProjectImageDTO {
  url: string
  alt: string
}

export interface ProjectDTO {
  id: string
  title: string
  slug: string
  description: string
  image: string
  images: ProjectImageDTO[]
  video: string
  technologies: string[]
  githubUrl: string
  liveUrl: string
  category: string
  featured: boolean
  enabled: boolean
  order: number
}

export interface EducationDTO {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  grade: string
  startDate: string | null
  endDate: string | null
  current: boolean
  description: string
  image: string
  enabled: boolean
  order: number
}

export interface CertificationDTO {
  id: string
  name: string
  organization: string
  issueDate: string | null
  expiryDate: string | null
  credentialId: string
  credentialUrl: string
  image: string
  enabled: boolean
  order: number
}

export interface AchievementDTO {
  id: string
  title: string
  description: string
  date: string | null
  issuer: string
  icon: string
  image: string
  enabled: boolean
  order: number
}

export interface ServiceDTO {
  id: string
  title: string
  description: string
  icon: string
  enabled: boolean
  order: number
}

export interface MessageDTO {
  id: string
  name: string
  email: string
  website: string
  message: string
  read: boolean
  archived: boolean
  ip: string
  createdAt: string
}

export interface SiteSettingsDTO {
  id: string
  siteTitle: string
  siteDescription: string
  keywords: string[]
  ogImage: string
  favicon: string
  twitterHandle: string
  themeColor: string
  showCursorAnimation: boolean
  sections: Record<SectionKey, boolean>
  navLinks: { label: string; href: string }[]
}

export type SectionKey =
  | 'hero'
  | 'skills'
  | 'experience'
  | 'about'
  | 'services'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'contact'

/** Everything the public portfolio page needs, fetched in one round trip. */
export interface PortfolioData {
  profile: ProfileDTO
  skills: SkillDTO[]
  experiences: ExperienceDTO[]
  projects: ProjectDTO[]
  education: EducationDTO[]
  certifications: CertificationDTO[]
  achievements: AchievementDTO[]
  services: ServiceDTO[]
  socialLinks: SocialLinkDTO[]
  settings: SiteSettingsDTO
}

/** Standard envelope returned by every admin API route. */
export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
