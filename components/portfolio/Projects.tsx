'use client'

import { motion } from 'framer-motion'
import { TbExternalLink } from 'react-icons/tb'
import { FaGithub } from 'react-icons/fa'
import SectionHeading from './SectionHeading'
import Media from './Media'
import { padIndex } from '@/lib/utils'
import type { ProjectDTO } from '@/lib/types'

/**
 * Migrated from src/components/Projects.jsx.
 *
 * Alternating left/right layout, the zero-padded index and the video-or-image
 * media slot all behave as before. The index is derived from the render
 * position rather than a stored id, so reordering in the admin renumbers the
 * list correctly.
 */
export default function Projects({ projects }: { projects: ProjectDTO[] }) {
  if (projects.length === 0) return null

  return (
    <section
      className="bg-black px-5 lg:px-28 py-8 my-8 lg:py-16 lg:my-16"
      id="projects"
      aria-label="Projects"
    >
      <SectionHeading lead="My" emphasis="Projects" dark animated={false} />

      <div className="lg:mt-16 mt-8 lg:space-y-16 space-y-8 lg:pb-6 pb-3">
        {projects.map((project, index) => (
          <motion.article
            key={project.id}
            className={`flex justify-between items-center flex-col ${
              index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
            }`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 10, delay: index * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="lg:w-[500px] w-full rounded-2xl overflow-hidden shadow-lg">
              {/* Image takes precedence over video, matching the original. The
                  main slot accepts a GIF or a clip too, so <Media> picks the
                  element from the stored URL — the precedence itself is
                  unchanged. */}
              {project.image ? (
                <Media
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                  width={1000}
                  height={640}
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              ) : project.video ? (
                <Media
                  src={project.video}
                  alt={`${project.title} demo`}
                  className="w-full h-full object-cover"
                  width={1000}
                  height={640}
                  sizes="(max-width: 1024px) 100vw, 500px"
                  controls
                />
              ) : null}
            </div>

            <div className="lg:w-1/2 lg:space-y-6 space-y-4">
              <p className="font-extrabold text-white mt-5 lg:mt-0 text-3xl lg:text-5xl">
                {padIndex(index + 1)}
              </p>
              <h3 className="font-bold text-white text-xl lg:text-3xl">{project.title}</h3>

              {project.description && (
                <p className="font-mono text-sm/6 lg:text-base text-[#71717A]">
                  {project.description}
                </p>
              )}

              {project.technologies.length > 0 && (
                <ul className="flex flex-wrap gap-2 list-none p-0">
                  {project.technologies.map((tech) => (
                    <li
                      key={tech}
                      className="text-[#D4D4D8] border border-[#3F3F46] rounded px-2 py-1 text-xs lg:text-sm font-mono"
                    >
                      {tech}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-x-6 flex-wrap">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    className="text-white mt-3 inline-flex items-center gap-1 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <TbExternalLink size={23} aria-hidden="true" />
                    View Project
                    <span className="sr-only"> — {project.title}</span>
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    className="text-white mt-3 inline-flex items-center gap-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaGithub size={20} aria-hidden="true" />
                    Source
                    <span className="sr-only"> code for {project.title}</span>
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
