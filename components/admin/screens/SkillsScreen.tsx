'use client'

import ResourceManager from '../ResourceManager'
import { IconLabelCell, Badge, LevelCell } from '../cells'
import type { AdminResourceConfig } from '../types'
import type { SkillDTO } from '@/lib/types'

const config: AdminResourceConfig<SkillDTO & { [key: string]: unknown }> = {
  resource: 'skills',
  title: 'Skills',
  singular: 'Skill',
  description:
    'Grouped into categories on the portfolio. Categories are free text — reuse an existing name to add to that group, or type a new one to start another.',
  searchPlaceholder: 'Search by skill or category…',
  orderable: true,
  defaults: {
    name: '',
    category: 'Languages',
    level: 80,
    icon: 'TbCode',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'category', label: 'Category', type: 'facet' },
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    { name: 'name', label: 'Skill name', type: 'text', required: true, placeholder: 'React.js' },
    {
      name: 'category',
      label: 'Category',
      type: 'text',
      required: true,
      placeholder: 'Frontend',
      help: 'Skills sharing a category are rendered together under one heading.',
    },
    {
      name: 'level',
      label: 'Proficiency',
      type: 'range',
      min: 0,
      max: 100,
      step: 5,
      help: 'Shown as a tooltip on the portfolio chip and as a meter here.',
    },
    {
      name: 'order',
      label: 'Display order',
      type: 'number',
      min: 0,
      help: 'Lower numbers appear first. Also controls which category comes first.',
    },
    { name: 'icon', label: 'Icon', type: 'icon' },
    {
      name: 'enabled',
      label: 'Visible on the portfolio',
      type: 'switch',
      help: 'Turn off to hide without deleting.',
    },
  ],
  columns: [
    {
      key: 'name',
      label: 'Skill',
      render: (row) => <IconLabelCell icon={row.icon} title={row.name} />,
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => <Badge>{row.category}</Badge>,
    },
    {
      key: 'level',
      label: 'Proficiency',
      render: (row) => <LevelCell value={row.level} />,
    },
  ],
  labelOf: (row) => row.name,
}

export default function SkillsScreen() {
  return <ResourceManager config={config} />
}
