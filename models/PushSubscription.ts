import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose'

/**
 * One browser that has agreed to receive push notifications.
 *
 * A subscription is created by the admin panel (Settings -> Notifications ->
 * "Enable on this device") and belongs to a single browser profile on a single
 * device, so the owner normally has a handful: laptop, phone, maybe a second
 * browser. Every enabled channel send fans out to all of them.
 *
 * The `endpoint` is the push service's URL for that browser and is the natural
 * unique key — re-subscribing the same browser returns the same endpoint, so
 * an upsert keeps the collection free of duplicates.
 *
 * `keys.p256dh` and `keys.auth` are the browser's public key material. They
 * are not secrets of ours (the browser hands them out freely) but they are
 * only ever read server-side, and the API never returns them.
 */
const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true, unique: true, trim: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    /** Shown in the admin device list so the owner can tell them apart. */
    label: { type: String, default: '', trim: true },
    userAgent: { type: String, default: '' },
    /** Bumped on every accepted push; helps spot a device that went quiet. */
    lastSuccessAt: { type: Date, default: null },
    /**
     * Consecutive delivery failures. A push service answering 404/410 means
     * the subscription is gone for good and the record is deleted outright;
     * this counter is for the softer failures (timeouts, 5xx).
     */
    failureCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

PushSubscriptionSchema.index({ createdAt: -1 })

export type PushSubscriptionDoc = InferSchemaType<typeof PushSubscriptionSchema> & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export const PushSubscription: Model<PushSubscriptionDoc> =
  (mongoose.models.PushSubscription as Model<PushSubscriptionDoc>) ||
  mongoose.model<PushSubscriptionDoc>('PushSubscription', PushSubscriptionSchema)

export default PushSubscription
