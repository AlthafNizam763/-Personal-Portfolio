'use client'

import { motion } from 'framer-motion'
import { TbExternalLink } from 'react-icons/tb'
import SectionHeading from './SectionHeading'
import MediaImage from './MediaImage'
import { formatMonthYear } from '@/lib/utils'
import type { CertificationDTO } from '@/lib/types'

/**
 * New section on the dark background, reusing the Projects section's
 * `bg-black … py-8 my-8 lg:py-16 lg:my-16` shell and the muted #71717A /
 * #D4D4D8 text pairing used throughout the dark blocks.
 */
export default function Certifications({
  certifications,
}: {
  certifications: CertificationDTO[]
}) {
  if (certifications.length === 0) return null

  return (
    <section
      className="bg-black px-5 lg:px-28 py-8 my-8 lg:py-16 lg:my-16"
      id="certifications"
      aria-label="Certifications"
    >
      <SectionHeading lead="My" emphasis="Certifications" dark />

      <div className="mt-8 lg:mt-16 grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {certifications.map((cert, index) => (
          <motion.article
            key={cert.id}
            className="border border-[#D4D4D8] rounded-md p-5 hover:bg-[#27272A] transition-all flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
            viewport={{ once: true }}
          >
            {cert.image && (
              <div className="rounded overflow-hidden mb-4">
                <MediaImage
                  src={cert.image}
                  alt={`${cert.name} certificate`}
                  className="w-full h-40 object-cover"
                  width={600}
                  height={400}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            )}

            <h3 className="font-semibold text-white text-base lg:text-lg">{cert.name}</h3>
            <p className="text-[#D4D4D8] font-mono text-sm mt-2">{cert.organization}</p>

            {cert.issueDate && (
              <p className="text-[#71717A] font-mono text-xs mt-2">
                Issued {formatMonthYear(cert.issueDate)}
                {cert.expiryDate && ` · Expires ${formatMonthYear(cert.expiryDate)}`}
              </p>
            )}

            {cert.credentialId && (
              <p className="text-[#71717A] font-mono text-xs mt-1 break-all">
                ID: {cert.credentialId}
              </p>
            )}

            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white mt-4 inline-flex items-center gap-1 hover:underline text-sm"
              >
                <TbExternalLink size={18} aria-hidden="true" />
                Show credential
                <span className="sr-only"> for {cert.name}</span>
              </a>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  )
}
