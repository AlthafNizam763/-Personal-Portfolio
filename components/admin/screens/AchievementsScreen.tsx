'use client'

import ResourceManager from '../ResourceManager'
import { IconLabelCell, MonthCell, TextCell } from '../cells'
import SectionHint from '../SectionHint'
import type { AdminResourceConfig } from '../types'
import type { AchievementDTO } from '@/lib/types'

const config: AdminResourceConfig<AchievementDTO & { [key: string]: unknown }> = {
  resource: 'achievements',
  title: 'Achievements',
  singular: 'Achievement',
  description:
    'Awards, recognitions and milestones. Each card uses the image if you upload one, otherwise the icon you pick.',
  searchPlaceholder: 'Search by title, issuer or description…',
  orderable: true,
  note: <SectionHint section="achievements" label="Achievements" />,
  defaults: {
    title: '',
    description: '',
    date: null,
    issuer: '',
    icon: 'TbTrophy',
    image: '',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      placeholder: 'Employee of the Year',
    },
    { name: 'issuer', label: 'Issued by', type: 'text', placeholder: 'DOCME Cloud Solutions' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
    {
      name: 'icon',
      label: 'Icon',
      type: 'icon',
      help: 'Used when no image is uploaded.',
    },
    {
      name: 'image',
      label: 'Image (optional)',
      type: 'image',
      uploadFolder: 'achievements',
      aspect: 'aspect-square',
      help: 'Replaces the icon on the card when present.',
    },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'title',
      label: 'Achievement',
      render: (row) => (
        <IconLabelCell icon={row.icon} title={row.title} subtitle={row.issuer || undefined} />
      ),
    },
    { key: 'date', label: 'Date', render: (row) => <MonthCell value={row.date} /> },
    {
      key: 'description',
      label: 'Description',
      render: (row) => <TextCell value={row.description} />,
    },
  ],
  labelOf: (row) => row.title,
}

export default function AchievementsScreen() {
  return <ResourceManager config={config} />
}
