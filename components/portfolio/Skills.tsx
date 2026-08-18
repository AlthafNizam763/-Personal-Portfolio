'use client'

import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'
import { getIcon } from '@/lib/icons'
import { groupSkillsByCategory } from '@/lib/utils'
import type { SkillDTO } from '@/lib/types'

/**
 * Migrated from the first half of src/components/Skills.jsx.
 *
 * Categories and their contents now come from the database; the grouping
 * helper preserves the original ordering so the rendered output is unchanged
 * for the seeded data.
 */
export default function Skills({ skills }: { skills: SkillDTO[] }) {
  const groups = groupSkillsByCategory(skills)
  if (groups.length === 0) return null

  return (
    <section className="mt-3 lg:mt-16" id="skills" aria-label="Skills">
      <div className="px-5 lg:px-28">
        <SectionHeading lead="My" emphasis="Skills" />

        <div className="mt-7 lg:mt-16 space-y-8 lg:space-y-10">
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: groupIndex * 0.05 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-4 lg:mb-6">
                <h3 className="text-lg lg:text-2xl font-extrabold whitespace-nowrap">
                  {group.category}
                </h3>
                <span className="h-[2px] w-full bg-black/10" />
              </div>

              <ul className="flex flex-wrap gap-3 lg:gap-4 list-none p-0 m-0">
                {group.skills.map((skill, index) => {
                  const Icon = getIcon(skill.icon)
                  return (
                    <motion.li
                      key={skill.id}
                      className="flex items-center gap-2 border-2 border-black rounded px-3 py-2 lg:px-4 lg:py-2.5 font-semibold text-sm lg:text-base hover:bg-black hover:text-white transition-all cursor-pointer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.04 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -3 }}
                      title={skill.level ? `${skill.name} — ${skill.level}%` : skill.name}
                    >
                      <Icon size={30} aria-hidden="true" />
                      <span>{skill.name}</span>
                    </motion.li>
                  )
                })}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
