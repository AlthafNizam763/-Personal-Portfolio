import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { loadEnv, requireEnv } from './load-env'

loadEnv()
requireEnv('MONGODB_URI')

import mongoose from 'mongoose'
import { connectToDatabase } from '../lib/db'
import { User } from '../models'
import { hashPassword, validatePasswordStrength } from '../lib/password'

/**
 * Creates an admin user, or resets the password of an existing one.
 *
 *   npm run create-admin
 *   npm run create-admin -- you@example.com 'YourPassw0rd'
 *
 * Credentials can also come from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 * Resetting a password bumps `tokenVersion`, which signs out every device.
 */
async function main() {
  const [argEmail, argPassword] = process.argv.slice(2)

  let email = (argEmail ?? process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase()
  let password = argPassword ?? process.env.SEED_ADMIN_PASSWORD ?? ''

  // Only prompt when running attached to a terminal; keeps CI usable.
  if ((!email || !password) && stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout })
    if (!email) email = (await rl.question('Admin email: ')).trim().toLowerCase()
    if (!password) password = await rl.question('Password: ')
    rl.close()
  }

  if (!email || !password) {
    console.error(
      '\n✖ Email and password are required.\n' +
        "  Usage: npm run create-admin -- you@example.com 'YourPassw0rd'\n"
    )
    process.exit(1)
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error(`\n✖ "${email}" is not a valid email address.\n`)
    process.exit(1)
  }

  const weak = validatePasswordStrength(password)
  if (weak) {
    console.error(`\n✖ ${weak}\n`)
    process.exit(1)
  }

  await connectToDatabase()

  const existing = await User.findOne({ email })
  const passwordHash = await hashPassword(password)

  if (existing) {
    existing.passwordHash = passwordHash
    // Invalidate any session issued under the old password.
    existing.tokenVersion = (existing.tokenVersion ?? 0) + 1
    await existing.save()
    console.log(`\n✓ Password reset for ${email}. All other sessions were signed out.\n`)
  } else {
    await User.create({ email, name: 'Administrator', passwordHash, role: 'admin' })
    console.log(`\n✓ Admin user created: ${email}\n  Sign in at /admin/login\n`)
  }

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('\n✖ Failed:', err instanceof Error ? err.message : err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
