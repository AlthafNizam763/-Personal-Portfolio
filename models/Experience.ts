import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const ExperienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    employmentType: { type: String, default: 'Full-time', trim: true },
    location: { type: String, default: '', trim: true },
    startDate: { type: Date, default: null },
    /** Ignored when `current` is true — the UI renders "Present" instead. */
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    companyLogo: { type: String, default: '' },
    companyUrl: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ExperienceSchema.index({ order: 1, startDate: -1 })

export type ExperienceDoc = InferSchemaType<typeof ExperienceSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Experience: Model<ExperienceDoc> =
  (mongoose.models.Experience as Model<ExperienceDoc>) ||
  mongoose.model<ExperienceDoc>('Experience', ExperienceSchema)

export default Experience
