import type { Model, SortOrder } from 'mongoose'
import type { ZodTypeAny } from 'zod'
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
import {
  achievementSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
  serviceSchema,
  skillSchema,
  socialLinkSchema,
} from './validators'
import {
  serializeAchievement,
  serializeCertification,
  serializeEducation,
  serializeExperience,
  serializeMessage,
  serializeProject,
  serializeService,
  serializeSkill,
  serializeSocialLink,
} from './serialize'

/**
 * Registry backing the generic admin CRUD API.
 *
 * `/api/admin/[resource]` and `/api/admin/[resource]/[id]` read everything they
 * need from here, so adding a new manageable content type means adding a model,
 * a Zod schema, a serializer and one entry below — no new route files.
 */

export interface ResourceConfig {
  /** Human labels used in API messages. */
  singular: string
  plural: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>
  /** Undefined for read-only resources (messages). */
  createSchema?: ZodTypeAny
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serialize: (doc: any) => unknown
  /** Fields matched by the `?search=` query, case-insensitive. */
  searchFields: string[]
  /** Fields allowed in `?sort=`; anything else falls back to the default. */
  sortFields: string[]
  defaultSort: Record<string, SortOrder>
  /** Boolean fields exposed as `?filter[field]=true|false`. */
  booleanFilters: string[]
  /** Exact-match string fields exposed as `?category=`, `?platform=` etc. */
  enumFilters: string[]
  /** Fields holding uploaded file URLs — cleaned up on delete. */
  fileFields: string[]
  /** Whether the resource supports drag-to-reorder / order field. */
  orderable: boolean
  /** Whether new records can be created through the API. */
  creatable: boolean
  /** Folder used when uploading media for this resource. */
  uploadFolder: string
}

export const RESOURCES = {
  skills: {
    singular: 'Skill',
    plural: 'Skills',
    model: Skill,
    createSchema: skillSchema,
    serialize: serializeSkill,
    searchFields: ['name', 'category'],
    sortFields: ['order', 'name', 'category', 'level', 'createdAt', 'updatedAt'],
    defaultSort: { order: 1, _id: 1 },
    booleanFilters: ['enabled'],
    enumFilters: ['category'],
    fileFields: [],
    orderable: true,
    creatable: true,
    uploadFolder: 'skills',
  },
  experience: {
    singular: 'Experience',
    plural: 'Experience',
    model: Experience,
    createSchema: experienceSchema,
    serialize: serializeExperience,
    searchFields: ['company', 'position', 'description', 'location'],
    sortFields: ['order', 'company', 'position', 'startDate', 'createdAt', 'updatedAt'],
    defaultSort: { order: 1, startDate: -1 },
    booleanFilters: ['enabled', 'current'],
    enumFilters: ['employmentType'],
    fileFields: ['companyLogo'],
    orderable: true,
    creatable: true,
    uploadFolder: 'experience',
  },
  projects: {
    singular: 'Project',
    plural: 'Projects',
    model: Project,
    createSchema: projectSchema,
    serialize: serializeProject,
    searchFields: ['title', 'description', 'category', 'slug'],
    sortFields: ['order', 'title', 'category', 'createdAt', 'updatedAt'],
    defaultSort: { order: 1, _id: 1 },
    booleanFilters: ['enabled', 'featured'],
    enumFilters: ['category'],
    fileFields: ['image', 'video'],
    orderable: true,
    creatable: true,
    uploadFolder: 'projects',
  },
  education: {
    singular: 'Education entry',
    plural: 'Education',
    model: Education,
    createSchema: educationSchema,
    serialize: serializeEducation,
    searchFields: ['institution', 'degree', 'fieldOfStudy', 'description'],
    sortFields: ['order', 'institution', 'degree', 'startDate', 'createdAt'],
    defaultSort: { order: 1, startDate: -1 },
    booleanFilters: ['enabled', 'current'],
    enumFilters: [],
    fileFields: ['image'],
    orderable: true,
    creatable: true,
    uploadFolder: 'education',
  },
  certifications: {
    singular: 'Certification',
    plural: 'Certifications',
    model: Certification,
    createSchema: certificationSchema,
    serialize: serializeCertification,
    searchFields: ['name', 'organization', 'credentialId'],
    sortFields: ['order', 'name', 'organization', 'issueDate', 'createdAt'],
    defaultSort: { order: 1, issueDate: -1 },
    booleanFilters: ['enabled'],
    enumFilters: ['organization'],
    fileFields: ['image'],
    orderable: true,
    creatable: true,
    uploadFolder: 'certifications',
  },
  achievements: {
    singular: 'Achievement',
    plural: 'Achievements',
    model: Achievement,
    createSchema: achievementSchema,
    serialize: serializeAchievement,
    searchFields: ['title', 'description', 'issuer'],
    sortFields: ['order', 'title', 'date', 'createdAt'],
    defaultSort: { order: 1, date: -1 },
    booleanFilters: ['enabled'],
    enumFilters: [],
    fileFields: ['image'],
    orderable: true,
    creatable: true,
    uploadFolder: 'achievements',
  },
  services: {
    singular: 'Service',
    plural: 'Services',
    model: Service,
    createSchema: serviceSchema,
    serialize: serializeService,
    searchFields: ['title', 'description'],
    sortFields: ['order', 'title', 'createdAt'],
    defaultSort: { order: 1, _id: 1 },
    booleanFilters: ['enabled'],
    enumFilters: [],
    fileFields: [],
    orderable: true,
    creatable: true,
    uploadFolder: 'services',
  },
  'social-links': {
    singular: 'Social link',
    plural: 'Social links',
    model: SocialLink,
    createSchema: socialLinkSchema,
    serialize: serializeSocialLink,
    searchFields: ['platform', 'label', 'url'],
    sortFields: ['order', 'platform', 'label', 'createdAt'],
    defaultSort: { order: 1, _id: 1 },
    booleanFilters: ['enabled'],
    enumFilters: ['platform'],
    fileFields: [],
    orderable: true,
    creatable: true,
    uploadFolder: 'social',
  },
  messages: {
    singular: 'Message',
    plural: 'Messages',
    model: Message,
    // Messages arrive through the public contact form only.
    createSchema: undefined,
    serialize: serializeMessage,
    searchFields: ['name', 'email', 'message', 'website'],
    sortFields: ['createdAt', 'name', 'email'],
    defaultSort: { createdAt: -1 },
    booleanFilters: ['read', 'archived'],
    enumFilters: [],
    fileFields: [],
    orderable: false,
    creatable: false,
    uploadFolder: 'misc',
  },
} satisfies Record<string, ResourceConfig>

export type ResourceKey = keyof typeof RESOURCES

export function isResourceKey(value: string): value is ResourceKey {
  return Object.prototype.hasOwnProperty.call(RESOURCES, value)
}

export function getResource(key: string): ResourceConfig | null {
  return isResourceKey(key) ? (RESOURCES[key] as ResourceConfig) : null
}
