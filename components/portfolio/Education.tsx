'use client'

import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import MediaImage from './MediaImage'
import { formatDateRange } from '@/lib/utils'
import type { EducationDTO } from '@/lib/types'

/**
 * New section, styled to match the existing Experience cards — same border
 * radius, same date-range treatment on the right, same mono body copy — but on
 * the light background so the page keeps alternating light/dark.
 */
export default function Education({ education }: { education: EducationDTO[] }) {
  if (education.length === 0) return null

  return (
    <section className="px-5 lg:px-28 my-8 lg:my-16" id="education" aria-label="Education">
      <SectionHeading lead="My" emphasis="Education" />

      <div className="mt-7 lg:mt-16 space-y-6 lg:space-y-8">
        {education.map((item, index) => {
          const period = formatDateRange(item.startDate, item.endDate, item.current)

          return (
            <motion.article
              key={item.id}
              className="border-2 border-black rounded-md p-5 lg:p-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 12, delay: index * 0.12 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-between flex-col items-start lg:flex-row lg:items-center">
                <div className="flex items-center gap-5">
                  {item.image && (
                    <MediaImage
                      src={item.image}
                      alt={`${item.institution} logo`}
                      className="w-10 h-10 object-contain"
                      width={80}
                      height={80}
                      sizes="40px"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg lg:text-xl">{item.degree}</h3>
                    <p className="text-[#71717A] font-mono text-sm mt-1">
                      {item.institution}
                      {item.fieldOfStudy && ` — ${item.fieldOfStudy}`}
                    </p>
                  </div>
                </div>

                <div className="mt-4 lg:mt-0 lg:text-right">
                  {period && <span className="font-semibold text-sm lg:text-base">{period}</span>}
                  {item.grade && (
                    <p className="text-[#71717A] font-mono text-xs lg:text-sm mt-1">
                      Grade: {item.grade}
                    </p>
                  )}
                </div>
              </div>

              {item.description && (
                <p className="text-[#71717A] mt-5 text-sm/6 lg:text-base font-mono">
                  {item.description}
                </p>
              )}
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
