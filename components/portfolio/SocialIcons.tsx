'use client'

import { motion } from 'framer-motion'
import { getIcon } from '@/lib/icons'
import type { SocialLinkDTO } from '@/lib/types'

/**
 * The bordered social icon row that appears both under the hero copy and
 * inside the contact form. Extracted so the two can never drift — the original
 * duplicated this markup in Home.jsx and Contact.jsx.
 *
 * The two call sites used different gaps (`gap-x-5` in the hero,
 * `gap-x-2 lg:gap-x-5` in contact), so spacing is passed in rather than baked
 * in — that difference is preserved deliberately.
 */
export default function SocialIcons({
  links,
  className = 'gap-x-2 lg:gap-x-5',
}: {
  links: SocialLinkDTO[]
  className?: string
}) {
  if (links.length === 0) return null

  return (
    <div className={`flex items-center ${className}`}>
      {links.map((link) => {
        const Icon = getIcon(link.icon)
        const isExternal = /^https?:\/\//i.test(link.url)

        return (
          <motion.a
            key={link.id}
            href={link.url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            aria-label={link.label}
            title={link.label}
            className="bg-white p-2 lg:p-3 rounded border-2 border-black"
            whileHover={{ scale: 1.1, backgroundColor: '#000', color: '#fff' }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon className="w-4 h-4 lg:w-5 lg:h-5" aria-hidden="true" />
          </motion.a>
        )
      })}
    </div>
  )
}
