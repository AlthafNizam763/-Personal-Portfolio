import { loadEnv, requireEnv } from './load-env'

loadEnv()
requireEnv('MONGODB_URI')

import mongoose from 'mongoose'
import { connectToDatabase } from '../lib/db'
import {
  Achievement,
  Certification,
  Education,
  Experience,
  Profile,
  Project,
  Service,
  SiteSettings,
  Skill,
  SocialLink,
  User,
} from '../models'
import { hashPassword, validatePasswordStrength } from '../lib/password'
import {
  SEED_EXPERIENCES,
  SEED_PROFILE,
  SEED_PROJECTS,
  SEED_SETTINGS,
  SEED_SKILLS,
  SEED_SOCIAL_LINKS,
} from '../lib/seed-content'

/**
 * Populates MongoDB with the content the original React portfolio rendered, so
 * a fresh database produces a byte-for-byte equivalent page.
 *
 *   npm run seed             — idempotent; only fills collections that are empty
 *   npm run seed -- --force  — wipes the seeded collections first
 *
 * Never touches Education / Certifications / Achievements / Services: those
 * sections did not exist before the migration and ship empty on purpose.
 */

const force = process.argv.includes('--force')

async function main() {
  console.log('→ Connecting to MongoDB…')
  await connectToDatabase()
  console.log('✓ Connected\n')

  if (force) {
    console.log('⚠ --force: clearing seeded collections')
    await Promise.all([
      Profile.deleteMany({}),
      SiteSettings.deleteMany({}),
      Skill.deleteMany({}),
      Experience.deleteMany({}),
      Project.deleteMany({}),
      SocialLink.deleteMany({}),
    ])
    console.log('✓ Cleared\n')
  }

  /* ---------------------------------------------------------- singletons */

  if ((await Profile.countDocuments()) === 0) {
    await Profile.create(SEED_PROFILE)
    console.log('✓ Profile created')
  } else {
    console.log('· Profile already exists — skipped')
  }

  if ((await SiteSettings.countDocuments()) === 0) {
    await SiteSettings.create(SEED_SETTINGS)
    console.log('✓ Site settings created')
  } else {
    console.log('· Site settings already exist — skipped')
  }

  /* -------------------------------------------------------- collections */

  if ((await Skill.countDocuments()) === 0) {
    // `order` is the index in the seed array, which reproduces the original
    // category ordering (a category sorts by its lowest-ordered skill).
    await Skill.insertMany(
      SEED_SKILLS.map((skill, index) => ({ ...skill, enabled: true, order: index }))
    )
    console.log(`✓ ${SEED_SKILLS.length} skills created`)
  } else {
    console.log('· Skills already exist — skipped')
  }

  if ((await Experience.countDocuments()) === 0) {
    await Experience.insertMany(
      SEED_EXPERIENCES.map((exp, index) => ({
        ...exp,
        startDate: exp.startDate ? new Date(exp.startDate) : null,
        endDate: exp.endDate ? new Date(exp.endDate) : null,
        enabled: true,
        order: index,
      }))
    )
    console.log(`✓ ${SEED_EXPERIENCES.length} experience entr(ies) created`)
  } else {
    console.log('· Experience already exists — skipped')
  }

  if ((await Project.countDocuments()) === 0) {
    await Project.insertMany(
      SEED_PROJECTS.map((project, index) => ({
        ...project,
        images: [],
        enabled: true,
        order: index,
      }))
    )
    console.log(`✓ ${SEED_PROJECTS.length} projects created`)
  } else {
    console.log('· Projects already exist — skipped')
  }

  if ((await SocialLink.countDocuments()) === 0) {
    await SocialLink.insertMany(
      SEED_SOCIAL_LINKS.map((link, index) => ({ ...link, enabled: true, order: index }))
    )
    console.log(`✓ ${SEED_SOCIAL_LINKS.length} social links created`)
  } else {
    console.log('· Social links already exist — skipped')
  }

  // Reported for clarity — deliberately left empty.
  const untouched = await Promise.all([
    Education.countDocuments(),
    Certification.countDocuments(),
    Achievement.countDocuments(),
    Service.countDocuments(),
  ])
  console.log(
    `· Education (${untouched[0]}), Certifications (${untouched[1]}), Achievements (${untouched[2]}), Services (${untouched[3]}) — not seeded by design`
  )

  /* ------------------------------------------------------------ admin user */

  console.log('')
  if ((await User.countDocuments()) === 0) {
    const email = (process.env.SEED_ADMIN_EMAIL ?? '').trim().toLowerCase()
    const password = process.env.SEED_ADMIN_PASSWORD ?? ''

    if (!email || !password) {
      console.log(
        '· No admin user created: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.local,\n' +
          '  then run `npm run create-admin`.'
      )
    } else {
      const weak = validatePasswordStrength(password)
      if (weak) {
        console.error(`✖ SEED_ADMIN_PASSWORD rejected: ${weak}`)
        process.exitCode = 1
      } else {
        await User.create({
          email,
          name: SEED_PROFILE.name,
          passwordHash: await hashPassword(password),
          role: 'admin',
        })
        console.log(`✓ Admin user created: ${email}`)
        console.log('  Sign in at /admin/login and change the password in Settings.')
      }
    }
  } else {
    console.log('· Admin user already exists — skipped')
  }

  console.log('\n✓ Seed complete.')
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error('\n✖ Seed failed:', err instanceof Error ? err.message : err)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
