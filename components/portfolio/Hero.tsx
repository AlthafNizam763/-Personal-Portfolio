'use client'

import { motion } from 'framer-motion'
import { TypeAnimation } from 'react-type-animation'
import Media from './Media'
import SocialIcons from './SocialIcons'
import type { ProfileDTO, SocialLinkDTO } from '@/lib/types'

/**
 * Migrated from src/pages/Home.jsx.
 *
 * The only structural change: the greeting is an <h1> rather than an <h2>, so
 * the page has exactly one top-level heading. Tailwind's preflight resets
 * heading size and weight to `inherit`, so this renders identically.
 */
export default function Hero({
  profile,
  socialLinks,
}: {
  profile: ProfileDTO
  socialLinks: SocialLinkDTO[]
}) {
  // The original rendered "Fullstack" in solid black and "Developer" in white
  // with a black outline. Splitting on the first space reproduces that for any
  // headline the admin sets.
  const [firstWord, ...restWords] = (profile.headline || '').split(' ')
  const rest = restWords.join(' ')

  // TypeAnimation expects alternating [text, pause, text, pause, ...].
  const sequence = profile.typedPhrases.flatMap((phrase) => [phrase, 1000])

  return (
    <section className="mt-20" id="home" aria-label="Introduction">
      <div className="flex justify-between py-10 items-center px-5 lg:px-28 lg:flex-row flex-col-reverse">
        <motion.div
          className="lg:w-[45%]"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <motion.div
            className="text-2xl lg:text-5xl flex flex-col mt-8 lg:mt-0 gap-2 lg:gap-5 text-nowrap"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.2, ease: 'easeInOut' },
              },
            }}
          >
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            >
              Hello,{' '}
              {sequence.length > 0 ? (
                <TypeAnimation
                  sequence={sequence}
                  speed={10}
                  style={{ fontWeight: 600 }}
                  repeat={Infinity}
                />
              ) : (
                <span style={{ fontWeight: 600 }}>I am {profile.name}</span>
              )}
            </motion.h1>

            {profile.headline && (
              <motion.h2
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <span className="font-extrabold">{firstWord}</span>
                {rest && (
                  <>
                    {' '}
                    <span className="text-white font-extrabold text-stroke-black">{rest}</span>
                  </>
                )}
              </motion.h2>
            )}
          </motion.div>

          {profile.shortDescription && (
            <motion.p
              className="text-[#71717A] text-sm lg:text-base mt-5 font-mono"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              {profile.shortDescription}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-10 lg:mt-14"
          >
            <SocialIcons links={socialLinks} className="gap-x-5" />
          </motion.div>
        </motion.div>

        <motion.div
          className="lg:w-[55%] w-full"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <Media
            src={profile.heroImage}
            alt={profile.name ? `${profile.name} — illustration` : 'Hero illustration'}
            className="h-full w-full"
            width={900}
            height={700}
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </motion.div>
      </div>
    </section>
  )
}
