import { tryConnect } from './db'
import {
  Achievement,
  Certification,
  Education,
  Experience,
  Message,
  Project,
  Service,
  Skill,
  SocialLink,
} from '@/models'
import { serializeMessage } from './serialize'
import { yearsOfExperience } from './utils'
import type { MessageDTO } from './types'

/** Numbers behind the admin dashboard cards. */
export interface DashboardStats {
  available: boolean
  projects: { total: number; published: number; featured: number }
  skills: { total: number; published: number }
  experience: { total: number; published: number; years: number }
  certifications: { total: number; published: number }
  education: { total: number }
  achievements: { total: number }
  services: { total: number; published: number }
  socialLinks: { total: number }
  messages: { total: number; unread: number; archived: number }
  totalPublished: number
  recentMessages: MessageDTO[]
}

const EMPTY: DashboardStats = {
  available: false,
  projects: { total: 0, published: 0, featured: 0 },
  skills: { total: 0, published: 0 },
  experience: { total: 0, published: 0, years: 0 },
  certifications: { total: 0, published: 0 },
  education: { total: 0 },
  achievements: { total: 0 },
  services: { total: 0, published: 0 },
  socialLinks: { total: 0 },
  messages: { total: 0, unread: 0, archived: 0 },
  totalPublished: 0,
  recentMessages: [],
}

/**
 * Shared by the dashboard page (server component) and /api/admin/stats, so the
 * two can never report different numbers.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!(await tryConnect())) return EMPTY

  const [
    projects,
    publishedProjects,
    featuredProjects,
    skills,
    publishedSkills,
    experiences,
    publishedExperiences,
    certifications,
    publishedCertifications,
    education,
    achievements,
    services,
    publishedServices,
    socialLinks,
    messages,
    unreadMessages,
    archivedMessages,
    experienceDocs,
    recentMessages,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ enabled: true }),
    Project.countDocuments({ featured: true }),
    Skill.countDocuments(),
    Skill.countDocuments({ enabled: true }),
    Experience.countDocuments(),
    Experience.countDocuments({ enabled: true }),
    Certification.countDocuments(),
    Certification.countDocuments({ enabled: true }),
    Education.countDocuments(),
    Achievement.countDocuments(),
    Service.countDocuments(),
    Service.countDocuments({ enabled: true }),
    SocialLink.countDocuments(),
    Message.countDocuments(),
    Message.countDocuments({ read: false, archived: false }),
    Message.countDocuments({ archived: true }),
    Experience.find().select('startDate').lean(),
    Message.find().sort({ createdAt: -1 }).limit(5).lean(),
  ])

  return {
    available: true,
    projects: { total: projects, published: publishedProjects, featured: featuredProjects },
    skills: { total: skills, published: publishedSkills },
    experience: {
      total: experiences,
      published: publishedExperiences,
      years: yearsOfExperience(
        experienceDocs.map((d) => ({
          startDate: d.startDate ? new Date(d.startDate).toISOString() : null,
        }))
      ),
    },
    certifications: { total: certifications, published: publishedCertifications },
    education: { total: education },
    achievements: { total: achievements },
    services: { total: services, published: publishedServices },
    socialLinks: { total: socialLinks },
    messages: { total: messages, unread: unreadMessages, archived: archivedMessages },
    totalPublished:
      publishedProjects +
      publishedSkills +
      publishedExperiences +
      publishedCertifications +
      publishedServices,
    recentMessages: recentMessages.map(serializeMessage),
  }
}
