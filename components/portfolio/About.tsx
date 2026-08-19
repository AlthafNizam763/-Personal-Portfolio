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
 *
 * From `lg` up the media floats into the left half instead of sitting in its
 * own flex column. A two-column row is only ever as balanced as its shorter
 * column: the media has a fixed aspect ratio while the copy reflows, so between
 * roughly 1024px and 1366px — and for any clip wider than it is tall — the
 * media ran out hundreds of pixels before the text did and left a blank block
 * under it. Floated, the copy keeps its position beside the media and then
 * rewraps to the full width the moment it clears the bottom of it, so that area
 * fills itself and the section is only as tall as its content. `flow-root`
 * makes the section contain the float rather than letting it spill into the
 * next one. Below `lg` there is no float, so the media still stacks above the
 * text exactly as before.
 */
export default function About({ profile }: { profile: ProfileDTO }) {
  const paragraphs = profile.aboutParagraphs

  return (
    <section className="px-5 lg:px-28 flow-root" id="about" aria-label="About me">
      <motion.div
        // `lg:w-1/2` reproduces the old column box to the pixel, so the media
        // and the first paragraph stay exactly where they were.
        className="lg:float-left lg:w-1/2 lg:mb-4"
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
