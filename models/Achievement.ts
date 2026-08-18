import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const AchievementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, default: null },
    issuer: { type: String, default: '', trim: true },
    /** Key into the react-icons registry in lib/icons.tsx. */
    icon: { type: String, default: 'TbTrophy' },
    image: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

AchievementSchema.index({ order: 1, date: -1 })

export type AchievementDoc = InferSchemaType<typeof AchievementSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Achievement: Model<AchievementDoc> =
  (mongoose.models.Achievement as Model<AchievementDoc>) ||
  mongoose.model<AchievementDoc>('Achievement', AchievementSchema)

export default Achievement
