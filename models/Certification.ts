import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const CertificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    issueDate: { type: Date, default: null },
    /** Null means the credential does not expire. */
    expiryDate: { type: Date, default: null },
    credentialId: { type: String, default: '', trim: true },
    credentialUrl: { type: String, default: '' },
    image: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

CertificationSchema.index({ order: 1, issueDate: -1 })

export type CertificationDoc = InferSchemaType<typeof CertificationSchema> & {
  _id: mongoose.Types.ObjectId
}

export const Certification: Model<CertificationDoc> =
  (mongoose.models.Certification as Model<CertificationDoc>) ||
  mongoose.model<CertificationDoc>('Certification', CertificationSchema)

export default Certification
