import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

/**
 * Singleton document — there is exactly one profile. `getOrCreateProfile()` in
 * lib/data.ts guarantees it exists.
 */
const ProfileSchema = new Schema(
  {
    name: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    /** Rendered as the large hero heading, e.g. "Fullstack Developer". */
    headline: { type: String, default: '', trim: true },
    /** Strings cycled by the hero type-animation. */
    typedPhrases: { type: [String], default: [] },
    shortDescription: { type: String, default: '' },
    /** Each entry becomes one <p> in the About section. */
    aboutParagraphs: { type: [String], default: [] },
    location: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    profileImage: { type: String, default: '' },
    heroImage: { type: String, default: '/assets/hero-vector.svg' },
    aboutImage: { type: String, default: '/assets/about-me.svg' },
    logo: { type: String, default: '/assets/logo.svg' },
    resumeUrl: { type: String, default: '' },
    resumeLabel: { type: String, default: 'Resume' },
    availableForWork: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export type ProfileDoc = InferSchemaType<typeof ProfileSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Profile: Model<ProfileDoc> =
  (mongoose.models.Profile as Model<ProfileDoc>) ||
  mongoose.model<ProfileDoc>('Profile', ProfileSchema)

export default Profile
