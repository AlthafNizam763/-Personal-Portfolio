'use client'

import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import MediaImage from './MediaImage'
import { getIcon } from '@/lib/icons'
import { formatMonthYear } from '@/lib/utils'
import type { AchievementDTO } from '@/lib/types'

/**
 * New section using the light-background card treatment (2px black border,
 * hover lift) established by the skills chips and services cards.
 */
export default function Achievements({ achievements }: { achievements: AchievementDTO[] }) {
  if (achievements.length === 0) return null

  return (
    <section className="px-5 lg:px-28 my-8 lg:my-16" id="achievements" aria-label="Achievements">
      <SectionHeading lead="My" emphasis="Achievements" />

      <div className="mt-7 lg:mt-16 grid gap-4 lg:gap-6 sm:grid-cols-2">
        {achievements.map((item, index) => {
          const Icon = getIcon(item.icon)
          return (
            <motion.article
              key={item.id}
              className="border-2 border-black rounded p-5 lg:p-6 flex gap-4"
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              {item.image ? (
                <MediaImage
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-14 object-cover rounded shrink-0"
                  width={112}
                  height={112}
                  sizes="56px"
                />
              ) : (
                <span className="shrink-0" aria-hidden="true">
                  <Icon size={34} />
                </span>
              )}

              <div>
                <h3 className="font-extrabold text-base lg:text-lg">{item.title}</h3>

                {(item.issuer || item.date) && (
                  <p className="text-[#71717A] font-mono text-xs lg:text-sm mt-1">
                    {item.issuer}
                    {item.issuer && item.date && ' · '}
                    {formatMonthYear(item.date)}
                  </p>
                )}

                {item.description && (
                  <p className="text-[#71717A] font-mono text-sm/6 mt-3">{item.description}</p>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
