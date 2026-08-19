import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

/** Mirrors `ChannelStatus` in lib/notifications/types.ts, plus `pending`. */
export const NOTIFICATION_STATUSES = [
  'pending',
  'sent',
  'disabled',
  'misconfigured',
  'failed',
] as const

const MessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    /**
     * Optional extras. The public form does not render inputs for these, so
     * they are empty on today's submissions — they exist so that adding a
     * phone or subject field later needs no migration, and so the notification
     * templates can show them the moment they are populated.
     */
    phone: { type: String, default: '', trim: true },
    subject: { type: String, default: '', trim: true },
    website: { type: String, default: '', trim: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    /**
     * Delivery audit trail for the owner notifications. Written immediately
     * after the fan-out so an undelivered message is diagnosable from the
     * database alone, without digging through function logs.
     */
    notifications: {
      email: { type: String, enum: NOTIFICATION_STATUSES, default: 'pending' },
      whatsapp: { type: String, enum: NOTIFICATION_STATUSES, default: 'pending' },
      push: { type: String, enum: NOTIFICATION_STATUSES, default: 'pending' },
      /** Last time the fan-out ran for this message. */
      attemptedAt: { type: Date, default: null },
      /** Failure reason, kept short. Admin-only — never returned publicly. */
      error: { type: String, default: '' },
    },
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
