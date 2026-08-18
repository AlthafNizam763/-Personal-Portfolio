'use client'

import ResourceManager from '../ResourceManager'
import { ThumbLabelCell, Badge, LinkCell, TagsCell } from '../cells'
import type { AdminResourceConfig } from '../types'
import type { ProjectDTO } from '@/lib/types'

const config: AdminResourceConfig<ProjectDTO & { [key: string]: unknown }> = {
  resource: 'projects',
  title: 'Projects',
  singular: 'Project',
  description:
    'Rendered in the black Projects section, alternating left and right. The numbering (01, 02, …) follows the display order automatically.',
  searchPlaceholder: 'Search by title, description or category…',
  orderable: true,
  defaults: {
    title: '',
    slug: '',
    description: '',
    image: '',
    images: [],
    video: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    category: 'Web',
    featured: false,
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'category', label: 'Category', type: 'facet' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    { name: 'title', label: 'Project name', type: 'text', required: true, placeholder: 'Zenith Academy' },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      placeholder: 'zenith-academy',
      help: 'Leave blank to generate one from the title.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      rows: 5,
      placeholder: 'What the project does and what you contributed.',
    },
    {
      name: 'image',
      label: 'Main image',
      type: 'image',
      uploadFolder: 'projects',
      help: 'Shown on the card. Takes precedence over the video if both are set.',
    },
    {
      name: 'video',
      label: 'Video (optional)',
      type: 'video',
      uploadFolder: 'projects',
      help: 'Autoplays muted on the card when no main image is set. MP4 or WebM.',
    },
    {
      name: 'images',
      label: 'Additional images',
      type: 'gallery',
      uploadFolder: 'projects',
      help: 'Extra screenshots stored with the project for future use.',
    },
    { name: 'category', label: 'Category', type: 'text', placeholder: 'Web' },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    { name: 'liveUrl', label: 'Live URL', type: 'text', placeholder: 'https://example.com' },
    { name: 'githubUrl', label: 'GitHub URL', type: 'text', placeholder: 'https://github.com/user/repo' },
    {
      name: 'technologies',
      label: 'Technologies',
      type: 'tags',
      placeholder: 'Next.js, Tailwind, MongoDB…',
      help: 'Rendered as chips on the project card. Leave empty to hide them.',
    },
    { name: 'featured', label: 'Featured project', type: 'switch' },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'title',
      label: 'Project',
      render: (row) => (
        <ThumbLabelCell
          src={row.image || undefined}
          title={row.title}
          subtitle={row.slug}
          rounded="rounded-md"
        />
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge>{row.category}</Badge>
          {row.featured && <Badge tone="dark">Featured</Badge>}
        </div>
      ),
    },
    {
      key: 'technologies',
      label: 'Tech',
      render: (row) => <TagsCell values={row.technologies} />,
    },
    {
      key: 'liveUrl',
      label: 'Live',
      render: (row) => <LinkCell href={row.liveUrl || undefined} />,
    },
  ],
  labelOf: (row) => row.title,
}

export default function ProjectsScreen() {
  return <ResourceManager config={config} />
}
