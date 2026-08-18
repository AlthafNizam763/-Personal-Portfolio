import mongoose, { type Mongoose } from 'mongoose'

/**
 * Serverless-safe Mongoose connection.
 *
 * On Vercel every invocation may reuse a warm Lambda container. Without a
 * cache we would open a new connection pool per request and quickly exhaust
 * the Atlas connection limit, so the promise is stashed on `globalThis` and
 * awaited by subsequent calls.
 */

interface MongooseCache {
  conn: Mongoose | null
  promise: Promise<Mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

export async function connectToDatabase(): Promise<Mongoose> {
  // Read at call time, not module scope: the CLI scripts in scripts/ load
  // .env.local themselves, and ESM hoists their imports above that call.
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env.local and add your MongoDB connection string.'
    )
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        // Fail fast instead of hanging a serverless request for 30s when the
        // cluster is unreachable — the public site falls back to seed content.
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
      })
      .then((m) => m)
      .catch((err) => {
        // Reset so the next request can retry rather than reusing a rejected
        // promise forever.
        cached.promise = null
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

/**
 * Returns `true` when a live connection could be established. Used by the
 * public portfolio, which must still render (from seed content) if the
 * database is briefly unavailable.
 */
export async function tryConnect(): Promise<boolean> {
  try {
    await connectToDatabase()
    return true
  } catch (err) {
    console.error('[db] connection failed:', (err as Error).message)
    return false
  }
}

export default connectToDatabase
