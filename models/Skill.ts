import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Free-form so the admin can add new groups, e.g. "Languages". */
    category: { type: String, required: true, trim: true, default: 'Other' },
    /** 0-100. Displayed only where the design calls for a meter. */
    level: { type: Number, default: 80, min: 0, max: 100 },
    /** Key into the react-icons registry in lib/icons.tsx, e.g. "FaReact". */
    icon: { type: String, default: 'TbCode' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

SkillSchema.index({ category: 1, order: 1 })

export type SkillDoc = InferSchemaType<typeof SkillSchema> & { _id: mongoose.Types.ObjectId }

export const Skill: Model<SkillDoc> =
  (mongoose.models.Skill as Model<SkillDoc>) || mongoose.model<SkillDoc>('Skill', SkillSchema)

export default Skill
