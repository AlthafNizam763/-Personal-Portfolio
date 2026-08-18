import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const SocialLinkSchema = new Schema(
  {
    /** Machine key: linkedin | github | instagram | facebook | whatsapp | youtube | ... */
    platform: { type: String, required: true, trim: true, lowercase: true },
    /** Human label shown in tooltips / aria-labels. */
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    /** Key into the react-icons registry in lib/icons.tsx. */
    icon: { type: String, default: 'TbLink' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

SocialLinkSchema.index({ order: 1 })

export type SocialLinkDoc = InferSchemaType<typeof SocialLinkSchema> & {
  _id: mongoose.Types.ObjectId
}

export const SocialLink: Model<SocialLinkDoc> =
  (mongoose.models.SocialLink as Model<SocialLinkDoc>) ||
  mongoose.model<SocialLinkDoc>('SocialLink', SocialLinkSchema)

export default SocialLink
