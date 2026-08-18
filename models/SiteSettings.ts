import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

/**
 * Singleton document holding SEO metadata plus per-section visibility toggles.
 *
 * The `sections` map is what keeps the migrated site visually identical to the
 * original React build: sections that did not exist before (services,
 * education, certifications, achievements) default to `false` and only appear
 * once the admin enables them and adds content.
 */
const SiteSettingsSchema = new Schema(
  {
    siteTitle: { type: String, default: 'Portfolio' },
    siteDescription: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    ogImage: { type: String, default: '/assets/preview.png' },
    favicon: { type: String, default: '/assets/xpalico.png' },
    twitterHandle: { type: String, default: '' },
    themeColor: { type: String, default: '#000000' },
    showCursorAnimation: { type: Boolean, default: true },
    sections: {
      hero: { type: Boolean, default: true },
      skills: { type: Boolean, default: true },
      experience: { type: Boolean, default: true },
      about: { type: Boolean, default: true },
      services: { type: Boolean, default: false },
      projects: { type: Boolean, default: true },
      education: { type: Boolean, default: false },
      certifications: { type: Boolean, default: false },
      achievements: { type: Boolean, default: false },
      contact: { type: Boolean, default: true },
    },
    navLinks: {
      type: [
        new Schema(
          {
            label: { type: String, required: true },
            href: { type: String, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
)

export type SiteSettingsDoc = InferSchemaType<typeof SiteSettingsSchema> & {
  _id: mongoose.Types.ObjectId
}

export const SiteSettings: Model<SiteSettingsDoc> =
  (mongoose.models.SiteSettings as Model<SiteSettingsDoc>) ||
  mongoose.model<SiteSettingsDoc>('SiteSettings', SiteSettingsSchema)

export default SiteSettings
