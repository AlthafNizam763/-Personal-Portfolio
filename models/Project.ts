import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const ProjectImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
  },
  { _id: false }
)

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    /** Primary card image. */
    image: { type: String, default: '' },
    /** Additional gallery images shown in the project detail view. */
    images: { type: [ProjectImageSchema], default: [] },
    /** Optional video shown instead of `image` when present (e.g. Loyaltri). */
    video: { type: String, default: '' },
    technologies: { type: [String], default: [] },
    githubUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    category: { type: String, default: 'Web', trim: true },
    featured: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ProjectSchema.index({ order: 1 })
ProjectSchema.index({ featured: -1, order: 1 })

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Project: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ||
  mongoose.model<ProjectDoc>('Project', ProjectSchema)

export default Project
