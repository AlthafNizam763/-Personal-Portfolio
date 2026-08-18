'use client'

import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import { getIcon } from '@/lib/icons'
import type { ServiceDTO } from '@/lib/types'

/**
 * New section — there was no Services block in the original React site, so it
 * is built from the same primitives the rest of the page uses: the shared
 * centred heading, `px-5 lg:px-28` gutters, 2px black card borders and the
 * hover-invert treatment lifted from the skills chips.
 *
 * Hidden until the admin adds a service and enables the section, so the
 * migrated site is unchanged on day one.
 */
export default function Services({ services }: { services: ServiceDTO[] }) {
  if (services.length === 0) return null

  return (
    <section className="px-5 lg:px-28 my-8 lg:my-16" id="services" aria-label="Services">
      <SectionHeading lead="My" emphasis="Services" />

      <div className="mt-7 lg:mt-16 grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => {
          const Icon = getIcon(service.icon)
          return (
            <motion.article
              key={service.id}
              className="border-2 border-black rounded p-5 lg:p-6 group hover:bg-black hover:text-white transition-all cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Icon size={34} aria-hidden="true" />
              <h3 className="font-extrabold text-lg lg:text-xl mt-4">{service.title}</h3>
              {service.description && (
                <p className="font-mono text-sm/6 mt-3 text-[#71717A] group-hover:text-[#D4D4D8] transition-colors">
                  {service.description}
                </p>
              )}
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
