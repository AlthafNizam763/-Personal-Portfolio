'use client'

import ResourceManager from '../ResourceManager'
import { IconLabelCell, LinkCell, Badge } from '../cells'
import type { AdminResourceConfig } from '../types'
import type { SocialLinkDTO } from '@/lib/types'

/**
 * Suggested platforms with sensible icon defaults. `platform` is free text, so
 * anything not listed here still works — the list is a convenience, not a
 * constraint.
 */
const PLATFORMS = [
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'GitHub', value: 'github' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'X (Twitter)', value: 'x' },
  { label: 'Threads', value: 'threads' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'Dribbble', value: 'dribbble' },
  { label: 'Behance', value: 'behance' },
  { label: 'Medium', value: 'medium' },
  { label: 'Stack Overflow', value: 'stackoverflow' },
  { label: 'Email', value: 'email' },
  { label: 'Website', value: 'website' },
  { label: 'Other', value: 'other' },
]

const config: AdminResourceConfig<SocialLinkDTO & { [key: string]: unknown }> = {
  resource: 'social-links',
  title: 'Social Links',
  singular: 'Social link',
  description:
    'The bordered icon buttons under the hero text and next to the contact form. Both places share this list, so a change appears in both.',
  searchPlaceholder: 'Search by platform, label or URL…',
  orderable: true,
  defaults: {
    platform: 'linkedin',
    label: '',
    url: '',
    icon: 'IoLogoLinkedin',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'platform', label: 'Platform', type: 'facet' },
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    {
      name: 'platform',
      label: 'Platform',
      type: 'select',
      required: true,
      options: PLATFORMS,
      help: 'A machine key. Pick "Other" for anything not listed.',
    },
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      required: true,
      placeholder: 'LinkedIn',
      help: 'Used as the accessible name and tooltip for the icon button.',
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      required: true,
      placeholder: 'https://linkedin.com/in/your-handle',
      help: 'Also accepts mailto: and tel: links, e.g. mailto:you@example.com',
    },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    { name: 'icon', label: 'Icon', type: 'icon' },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'label',
      label: 'Link',
      render: (row) => <IconLabelCell icon={row.icon} title={row.label} />,
    },
    {
      key: 'platform',
      label: 'Platform',
      render: (row) => <Badge>{row.platform}</Badge>,
    },
    {
      key: 'url',
      label: 'URL',
      render: (row) => <LinkCell href={row.url} />,
    },
  ],
  labelOf: (row) => row.label || row.platform,
}

export default function SocialLinksScreen() {
  return <ResourceManager config={config} />
}
