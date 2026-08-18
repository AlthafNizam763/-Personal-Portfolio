import bcrypt from 'bcryptjs'

/**
 * Node-runtime only (bcryptjs is not Edge-compatible). Middleware never calls
 * these — it only verifies an already-issued JWT via `jose`.
 */

const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

/** Minimum policy enforced on both sign-up (seed) and password change. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.'
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain a number.'
  return null
}
