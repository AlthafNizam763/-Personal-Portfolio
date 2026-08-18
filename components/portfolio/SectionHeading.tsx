'use client'

import { motion } from 'framer-motion'

/**
 * The centred "My **Skills**" / "My **Projects**" heading used across the
 * portfolio.
 *
 * `animated` is a prop rather than always-on because the original Projects
 * heading was static while the Skills and Experience headings faded in — that
 * difference is preserved.
 */
export default function SectionHeading({
  lead,
  emphasis,
  dark = false,
  animated = true,
}: {
  lead: string
  emphasis: string
  dark?: boolean
  animated?: boolean
}) {
  const className = `text-2xl lg:text-4xl text-center${dark ? ' text-white' : ''}`
  const content = (
    <>
      {lead} <span className="font-extrabold">{emphasis}</span>
    </>
  )

  if (!animated) {
    return <h2 className={className}>{content}</h2>
  }

  return (
    <motion.h2
      className={className}
      initial={{ opacity: 0, y: -30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {content}
    </motion.h2>
  )
}
