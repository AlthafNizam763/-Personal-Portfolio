'use client'

import ResourceManager from '../ResourceManager'
import { IconLabelCell, TextCell } from '../cells'
import SectionHint from '../SectionHint'
import type { AdminResourceConfig } from '../types'
import type { ServiceDTO } from '@/lib/types'

const config: AdminResourceConfig<ServiceDTO & { [key: string]: unknown }> = {
  resource: 'services',
  title: 'Services',
  singular: 'Service',
  description:
    'What you offer, rendered as a responsive grid of bordered cards between the About and Projects sections.',
  searchPlaceholder: 'Search by title or description…',
  orderable: true,
  note: <SectionHint section="services" label="Services" />,
  defaults: {
    title: '',
    description: '',
    icon: 'TbCode',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    {
      name: 'title',
      label: 'Service title',
      type: 'text',
      required: true,
      placeholder: 'Full Stack Web Development',
    },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 4,
      placeholder: 'A sentence or two on what this service covers.',
    },
    { name: 'icon', label: 'Icon', type: 'icon' },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'title',
      label: 'Service',
      render: (row) => <IconLabelCell icon={row.icon} title={row.title} />,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <TextCell value={row.description} max={90} />,
    },
  ],
  labelOf: (row) => row.title,
}

export default function ServicesScreen() {
  return <ResourceManager config={config} />
}
