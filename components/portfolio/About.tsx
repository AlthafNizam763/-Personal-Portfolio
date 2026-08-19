'use client'

import { motion } from 'framer-motion'
import Media from './Media'
import RichText from './RichText'
import type { ProfileDTO } from '@/lib/types'

/**
 * Migrated from src/components/About.jsx.
 *
 * The three hardcoded paragraphs are now `profile.aboutParagraphs`. The first
 * paragraph keeps its larger top margin (`mt-5 lg:mt-10`) and the rest use
 * `mt-3 lg:mt-5`, exactly as before.
 */
export default function About({ profile }: { profile: ProfileDTO }) {
  const paragraphs = profile.aboutParagraphs

  return (
    <section
      className="px-5 lg:px-28 flex justify-between flex-col lg:flex-row"
      id="about"
      aria-label="About me"
    >
      <motion.div
        className="lg:w-1/2"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 10 }}
        viewport={{ once: true }}
      >
        <Media
          src={profile.aboutImage}
          alt="About Me Illustration"
          width={800}
          height={640}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </motion.div>

      <motion.div
        className="lg:w-1/2"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 10, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <h2 className="lg:text-4xl text-2xl mt-4 lg:mt-0">
          About <span className="font-extrabold">Me</span>
        </h2>

        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={`text-[#71717A] text-sm/6 lg:text-base font-mono ${
              index === 0 ? 'mt-5 lg:mt-10' : 'mt-3 lg:mt-5'
            }`}
          >
            <RichText text={paragraph} />
          </p>
        ))}
      </motion.div>
    </section>
  )
}
