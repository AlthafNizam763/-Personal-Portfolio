import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const EducationSchema = new Schema(
  {
    institution: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, default: '', trim: true },
    grade: { type: String, default: '', trim: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, default: '' },
    /** Certificate scan or institution logo. */
    image: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

EducationSchema.index({ order: 1, startDate: -1 })

export type EducationDoc = InferSchemaType<typeof EducationSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Education: Model<EducationDoc> =
  (mongoose.models.Education as Model<EducationDoc>) ||
  mongoose.model<EducationDoc>('Education', EducationSchema)

export default Education
