'use client'

import ResourceManager from '../ResourceManager'
import { ThumbLabelCell, DateRangeCell, TextCell } from '../cells'
import SectionHint from '../SectionHint'
import type { AdminResourceConfig } from '../types'
import type { EducationDTO } from '@/lib/types'

const config: AdminResourceConfig<EducationDTO & { [key: string]: unknown }> = {
  resource: 'education',
  title: 'Education',
  singular: 'Education entry',
  description: 'Degrees, courses and training, shown as bordered cards on the portfolio.',
  searchPlaceholder: 'Search by institution, degree or field…',
  orderable: true,
  note: <SectionHint section="education" label="Education" />,
  defaults: {
    institution: '',
    degree: '',
    fieldOfStudy: '',
    grade: '',
    startDate: null,
    endDate: null,
    current: false,
    description: '',
    image: '',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'current', label: 'Ongoing', type: 'boolean', trueLabel: 'Ongoing', falseLabel: 'Completed' },
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    {
      name: 'degree',
      label: 'Degree / course',
      type: 'text',
      required: true,
      placeholder: 'B.Tech Computer Science',
    },
    {
      name: 'institution',
      label: 'Institution',
      type: 'text',
      required: true,
      placeholder: 'University name',
    },
    { name: 'fieldOfStudy', label: 'Field of study', type: 'text', placeholder: 'Computer Science' },
    { name: 'grade', label: 'Grade / CGPA', type: 'text', placeholder: '8.4 CGPA' },
    { name: 'startDate', label: 'Start date', type: 'date' },
    {
      name: 'endDate',
      label: 'End date',
      type: 'date',
      hiddenWhen: (values) => Boolean(values.current),
    },
    { name: 'current', label: 'Currently studying here', type: 'switch' },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
    {
      name: 'image',
      label: 'Certificate or logo',
      type: 'image',
      uploadFolder: 'education',
      aspect: 'aspect-square',
    },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'degree',
      label: 'Qualification',
      render: (row) => (
        <ThumbLabelCell src={row.image || undefined} title={row.degree} subtitle={row.institution} />
      ),
    },
    {
      key: 'startDate',
      label: 'Period',
      render: (row) => (
        <DateRangeCell start={row.startDate} end={row.endDate} current={row.current} />
      ),
    },
    {
      key: 'fieldOfStudy',
      label: 'Field',
      render: (row) => <TextCell value={row.fieldOfStudy} max={40} />,
    },
  ],
  labelOf: (row) => `${row.degree} — ${row.institution}`,
}

export default function EducationScreen() {
  return <ResourceManager config={config} />
}
