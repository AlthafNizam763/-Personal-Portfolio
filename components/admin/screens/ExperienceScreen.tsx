'use client'

import ResourceManager from '../ResourceManager'
import { ThumbLabelCell, DateRangeCell, TagsCell, Badge } from '../cells'
import type { AdminResourceConfig } from '../types'
import type { ExperienceDTO } from '@/lib/types'

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Self-employed',
].map((value) => ({ label: value, value }))

const config: AdminResourceConfig<ExperienceDTO & { [key: string]: unknown }> = {
  resource: 'experience',
  title: 'Experience',
  singular: 'Role',
  description:
    'Your work history, rendered as the dark cards on the portfolio. Technologies appear as chips beneath the summary.',
  searchPlaceholder: 'Search by company, position or description…',
  orderable: true,
  defaults: {
    company: '',
    position: '',
    employmentType: 'Full-time',
    location: '',
    startDate: null,
    endDate: null,
    current: false,
    description: '',
    technologies: [],
    companyLogo: '',
    companyUrl: '',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'employmentType', label: 'Employment type', type: 'facet' },
    { key: 'current', label: 'Current role', type: 'boolean', trueLabel: 'Current', falseLabel: 'Past' },
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    { name: 'position', label: 'Position', type: 'text', required: true, placeholder: 'Software Engineer' },
    { name: 'company', label: 'Company', type: 'text', required: true, placeholder: 'DOCME Cloud Solutions' },
    { name: 'employmentType', label: 'Employment type', type: 'select', options: EMPLOYMENT_TYPES },
    { name: 'location', label: 'Location', type: 'text', placeholder: 'Kerala, India' },
    { name: 'startDate', label: 'Start date', type: 'date' },
    {
      name: 'endDate',
      label: 'End date',
      type: 'date',
      // Hidden once "I currently work here" is on — the UI shows "Present".
      hiddenWhen: (values) => Boolean(values.current),
    },
    {
      name: 'current',
      label: 'I currently work here',
      type: 'switch',
      help: 'Shows “Present” instead of an end date.',
    },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 6,
      placeholder: 'What you built, owned and improved in this role.',
    },
    {
      name: 'technologies',
      label: 'Technologies used',
      type: 'tags',
      placeholder: 'Laravel, React.js, MySQL…',
      help: 'Rendered as chips under the description. Leave empty to hide them.',
    },
    { name: 'companyLogo', label: 'Company logo', type: 'image', uploadFolder: 'experience', aspect: 'aspect-square' },
    { name: 'companyUrl', label: 'Company website', type: 'text', placeholder: 'https://example.com' },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'position',
      label: 'Role',
      render: (row) => (
        <ThumbLabelCell src={row.companyLogo} title={row.position} subtitle={row.company} />
      ),
    },
    {
      key: 'employmentType',
      label: 'Type',
      render: (row) => <Badge>{row.employmentType}</Badge>,
    },
    {
      key: 'startDate',
      label: 'Period',
      render: (row) => (
        <DateRangeCell start={row.startDate} end={row.endDate} current={row.current} />
      ),
    },
    {
      key: 'technologies',
      label: 'Tech',
      render: (row) => <TagsCell values={row.technologies} />,
    },
  ],
  labelOf: (row) => `${row.position} at ${row.company}`,
}

export default function ExperienceScreen() {
  return <ResourceManager config={config} />
}
