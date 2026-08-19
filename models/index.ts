/**
 * Central re-export so API routes can resolve a model by resource name.
 * Importing this module also guarantees every schema is registered with
 * Mongoose before any query runs.
 */
export { default as User } from './User'
export { default as Profile } from './Profile'
export { default as Skill } from './Skill'
export { default as Experience } from './Experience'
export { default as Project } from './Project'
export { default as Education } from './Education'
export { default as Certification } from './Certification'
export { default as Achievement } from './Achievement'
export { default as Service } from './Service'
export { default as SocialLink } from './SocialLink'
export { default as Message } from './Message'
export { default as SiteSettings } from './SiteSettings'
export { default as PushSubscription } from './PushSubscription'

export type { UserDoc } from './User'
export type { ProfileDoc } from './Profile'
export type { SkillDoc } from './Skill'
export type { ExperienceDoc } from './Experience'
export type { ProjectDoc } from './Project'
export type { EducationDoc } from './Education'
export type { CertificationDoc } from './Certification'
export type { AchievementDoc } from './Achievement'
export type { ServiceDoc } from './Service'
export type { SocialLinkDoc } from './SocialLink'
export type { MessageDoc } from './Message'
export type { SiteSettingsDoc } from './SiteSettings'
export type { PushSubscriptionDoc } from './PushSubscription'
