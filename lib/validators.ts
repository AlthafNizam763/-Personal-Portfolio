import { z } from 'zod'

/**
 * Request-body schemas shared by the admin API routes.
 *
 * Every schema is written so `.partial()` produces a valid PATCH schema, which
 * is how the generic `[resource]/[id]` handler supports partial updates.
 */

// --- reusable field helpers ------------------------------------------------

/** Accepts '', 'YYYY-MM-DD', ISO strings or null; always yields Date | null. */
const optionalDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => {
    if (!v) return null
    const d = v instanceof Date ? v : new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  })

/** Empty string is allowed (means "not set"); otherwise must look like a link. */
const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .default('')
  .refine(
    (v) => v === '' || /^(https?:\/\/|\/|mailto:|tel:|data:)/i.test(v),
    'Must be an absolute URL, a site-relative path starting with "/", or a mailto:/tel: link.'
  )

const optionalText = (max = 5000) => z.string().trim().max(max).default('')

const stringArray = z
  .array(z.string().trim().min(1).max(120))
  .max(60)
  .default([])
  .transform((arr) => Array.from(new Set(arr)))

const order = z.coerce.number().int().min(0).max(100000).default(0)
const enabled = z.coerce.boolean().default(true)

// --- auth ------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.').max(200),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.').max(200),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters.')
      .max(200)
      .regex(/[a-z]/, 'Must contain a lowercase letter.')
      .regex(/[A-Z]/, 'Must contain an uppercase letter.')
      .regex(/[0-9]/, 'Must contain a number.'),
    confirmPassword: z.string().min(1, 'Please confirm the new password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
})

// --- profile (singleton) ---------------------------------------------------

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(120),
  title: optionalText(160),
  headline: optionalText(160),
  typedPhrases: z.array(z.string().trim().min(1).max(160)).max(10).default([]),
  shortDescription: optionalText(2000),
  aboutParagraphs: z.array(z.string().trim().min(1).max(4000)).max(12).default([]),
  location: optionalText(160),
  email: z.union([z.string().trim().email('Enter a valid email address.'), z.literal('')]).default(''),
  phone: optionalText(40),
  profileImage: optionalUrl,
  heroImage: optionalUrl,
  aboutImage: optionalUrl,
  logo: optionalUrl,
  resumeUrl: optionalUrl,
  resumeLabel: z.string().trim().max(60).default('Resume'),
  availableForWork: z.coerce.boolean().default(true),
})

// --- collections -----------------------------------------------------------

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name is required.').max(120),
  category: z.string().trim().min(1, 'Category is required.').max(80).default('Other'),
  level: z.coerce.number().int().min(0).max(100).default(80),
  icon: z.string().trim().max(60).default('TbCode'),
  enabled,
  order,
})

export const experienceSchema = z.object({
  company: z.string().trim().min(1, 'Company is required.').max(160),
  position: z.string().trim().min(1, 'Position is required.').max(160),
  employmentType: z.string().trim().max(60).default('Full-time'),
  location: optionalText(160),
  startDate: optionalDate,
  endDate: optionalDate,
  current: z.coerce.boolean().default(false),
  description: optionalText(6000),
  technologies: stringArray,
  companyLogo: optionalUrl,
  companyUrl: optionalUrl,
  enabled,
  order,
})

export const projectSchema = z.object({
  title: z.string().trim().min(1, 'Project name is required.').max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .regex(/^[a-z0-9-]*$/, 'Slug may contain lowercase letters, numbers and hyphens only.')
    .default(''),
  description: optionalText(6000),
  image: optionalUrl,
  images: z
    .array(z.object({ url: z.string().trim().min(1), alt: z.string().trim().max(200).default('') }))
    .max(12)
    .default([]),
  video: optionalUrl,
  technologies: stringArray,
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  category: z.string().trim().max(80).default('Web'),
  featured: z.coerce.boolean().default(false),
  enabled,
  order,
})

export const educationSchema = z.object({
  institution: z.string().trim().min(1, 'Institution is required.').max(200),
  degree: z.string().trim().min(1, 'Degree / course is required.').max(200),
  fieldOfStudy: optionalText(200),
  grade: optionalText(80),
  startDate: optionalDate,
  endDate: optionalDate,
  current: z.coerce.boolean().default(false),
  description: optionalText(4000),
  image: optionalUrl,
  enabled,
  order,
})

export const certificationSchema = z.object({
  name: z.string().trim().min(1, 'Certification name is required.').max(200),
  organization: z.string().trim().min(1, 'Issuing organization is required.').max(200),
  issueDate: optionalDate,
  expiryDate: optionalDate,
  credentialId: optionalText(160),
  credentialUrl: optionalUrl,
  image: optionalUrl,
  enabled,
  order,
})

export const achievementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  description: optionalText(4000),
  date: optionalDate,
  issuer: optionalText(200),
  icon: z.string().trim().max(60).default('TbTrophy'),
  image: optionalUrl,
  enabled,
  order,
})

export const serviceSchema = z.object({
  title: z.string().trim().min(1, 'Service title is required.').max(200),
  description: optionalText(4000),
  icon: z.string().trim().max(60).default('TbCode'),
  enabled,
  order,
})

export const socialLinkSchema = z.object({
  platform: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Platform key is required.')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only.'),
  label: z.string().trim().min(1, 'Label is required.').max(80),
  url: z
    .string()
    .trim()
    .min(1, 'URL is required.')
    .max(2048)
    .refine(
      (v) => /^(https?:\/\/|mailto:|tel:|\/)/i.test(v),
      'Must start with http(s)://, mailto:, tel: or /'
    ),
  icon: z.string().trim().max(60).default('TbLink'),
  enabled,
  order,
})

// --- site settings ---------------------------------------------------------

export const siteSettingsSchema = z.object({
  siteTitle: z.string().trim().min(1, 'Site title is required.').max(160),
  siteDescription: optionalText(400),
  keywords: stringArray,
  ogImage: optionalUrl,
  favicon: optionalUrl,
  twitterHandle: z.string().trim().max(60).default(''),
  themeColor: z
    .string()
    .trim()
    .max(20)
    .default('#000000')
    .refine((v) => v === '' || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v), 'Use a hex colour like #000000.'),
  showCursorAnimation: z.coerce.boolean().default(true),
  sections: z
    .object({
      hero: z.coerce.boolean().default(true),
      skills: z.coerce.boolean().default(true),
      experience: z.coerce.boolean().default(true),
      about: z.coerce.boolean().default(true),
      services: z.coerce.boolean().default(false),
      projects: z.coerce.boolean().default(true),
      education: z.coerce.boolean().default(false),
      certifications: z.coerce.boolean().default(false),
      achievements: z.coerce.boolean().default(false),
      contact: z.coerce.boolean().default(true),
    })
    .default({}),
  navLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        href: z.string().trim().min(1).max(200),
      })
    )
    .max(12)
    .default([]),
})

// --- public contact form ---------------------------------------------------

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  website: z.string().trim().max(300).default(''),
  message: z.string().trim().min(5, 'Please write a short message.').max(5000),
  /**
   * Optional extras. The rendered form has no inputs for these, so they are
   * absent from every submission today; accepting them keeps the contract
   * forward-compatible with a form that does collect them, and lets the owner
   * notifications show a phone number and a real subject line once it does.
   * No existing rule changes — an omitted field simply defaults to ''.
   */
  phone: z.string().trim().max(40).optional().default(''),
  subject: z.string().trim().max(200).optional().default(''),
  /**
   * Honeypot — real users never fill this hidden field.
   *
   * Deliberately permissive: rejecting it here would return a 422 that tells
   * the bot exactly which field gave it away. The route accepts the request
   * with a normal success response and simply discards it.
   */
  company: z.string().max(200).optional().default(''),
})

// --- notification settings -------------------------------------------------

/**
 * The three admin-panel switches for contact-form notifications.
 *
 * Strict booleans rather than `z.coerce.boolean()` (used for the section
 * toggles above): coercion turns the string "false" into `true`, which for an
 * on/off switch would silently do the opposite of what was asked. The admin
 * client sends real JSON booleans, so anything else is a bug worth a 422.
 */
export const notificationSettingsSchema = z.object({
  email: z.boolean(),
  whatsapp: z.boolean(),
  push: z.boolean(),
})

/**
 * A browser's push subscription, exactly as `PushManager.subscribe()` returns
 * it. The endpoint is the push service URL the server will POST to, so it is
 * held to https — the only scheme the Web Push protocol uses.
 */
export const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .trim()
    .min(1, 'The browser did not return a push endpoint.')
    .max(1000)
    .refine((value) => {
      try {
        return new URL(value).protocol === 'https:'
      } catch {
        return false
      }
    }, 'A push endpoint must be an https URL.'),
  keys: z.object({
    p256dh: z.string().trim().min(1).max(255),
    auth: z.string().trim().min(1).max(255),
  }),
  /** Free-text device name shown in the admin device list. */
  label: z.string().trim().max(120).optional().default(''),
})

// --- reorder ---------------------------------------------------------------

export const reorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(500),
  /**
   * Index of the first id within the full list. The admin reorders one page at
   * a time, so the server writes `offset + index` rather than `index` — without
   * it, reordering page 2 would renumber those rows 0..n and interleave them
   * with page 1.
   */
  offset: z.coerce.number().int().min(0).max(100000).default(0),
})

/** Flattens a ZodError into `{ field: [messages] }` for form display. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    ;(out[key] ??= []).push(issue.message)
  }
  return out
}
