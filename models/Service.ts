import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const ServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    /** Key into the react-icons registry in lib/icons.tsx. */
    icon: { type: String, default: 'TbCode' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ServiceSchema.index({ order: 1 })

export type ServiceDoc = InferSchemaType<typeof ServiceSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Service: Model<ServiceDoc> =
  (mongoose.models.Service as Model<ServiceDoc>) ||
  mongoose.model<ServiceDoc>('Service', ServiceSchema)

export default Service
