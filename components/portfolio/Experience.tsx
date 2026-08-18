'use client'

import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import MediaImage from './MediaImage'
import { formatDateRange } from '@/lib/utils'
import type { ExperienceDTO } from '@/lib/types'

/**
 * Migrated from the black "My Experience" block at the bottom of
 * src/components/Skills.jsx, extracted into its own section so it can be
 * toggled and reordered independently. The wrapper keeps the original
 * `my-8 py-8 lg:my-16 lg:py-16` spacing, so the page renders unchanged.
 *
 * The date range is now derived from real start/end dates rather than a
 * hardcoded string.
 */
export default function Experience({ experiences }: { experiences: ExperienceDTO[] }) {
  if (experiences.length === 0) return null

  return (
    <section
      className="bg-black w-full my-8 py-8 lg:my-16 lg:py-16"
      id="experience"
      aria-label="Work experience"
    >
      <SectionHeading lead="My" emphasis="Experience" dark />

      <div className="px-5 lg:px-28 my-8 lg:mt-16 space-y-10">
        {experiences.map((exp, index) => {
          const period = formatDateRange(exp.startDate, exp.endDate, exp.current)

          return (
            <motion.article
              key={exp.id}
              className="bg-black p-5 border border-[#D4D4D8] rounded-md hover:bg-[#27272A] transition-all cursor-pointer"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 10, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-between flex-col items-start lg:flex-row lg:items-center">
                <div className="flex items-center gap-5">
                  {exp.companyLogo && (
                    <MediaImage
                      src={exp.companyLogo}
                      alt={`${exp.company} logo`}
                      className="w-7"
                      width={56}
                      height={56}
                      sizes="28px"
                    />
                  )}
                  <h3 className="font-semibold text-white text-lg lg:text-xl">
                    {exp.position} at {exp.company}
                  </h3>
                </div>
                {period && (
                  <span className="text-[#D4D4D8] font-semibold text-sm mt-4 lg:mt-0 lg:text-base">
                    {period}
                  </span>
                )}
              </div>

              {exp.description && (
                <p className="text-[#D4D4D8] mt-6 text-sm/6 lg:text-base font-mono">
                  {exp.description}
                </p>
              )}

              {exp.technologies.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-5 list-none p-0">
                  {exp.technologies.map((tech) => (
                    <li
                      key={tech}
                      className="text-[#D4D4D8] border border-[#3F3F46] rounded px-2 py-1 text-xs lg:text-sm font-mono"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              )}
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
