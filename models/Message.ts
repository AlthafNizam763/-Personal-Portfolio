import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

const MessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    website: { type: String, default: '', trim: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    /** Captured for abuse triage only; never displayed publicly. */
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
)

MessageSchema.index({ createdAt: -1 })
MessageSchema.index({ read: 1, archived: 1 })

export type MessageDoc = InferSchemaType<typeof MessageSchema> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const Message: Model<MessageDoc> =
  (mongoose.models.Message as Model<MessageDoc>) ||
  mongoose.model<MessageDoc>('Message', MessageSchema)

export default Message
