'use client'

import ResourceManager from '../ResourceManager'
import { ThumbLabelCell, MonthCell, LinkCell, TextCell } from '../cells'
import SectionHint from '../SectionHint'
import type { AdminResourceConfig } from '../types'
import type { CertificationDTO } from '@/lib/types'

const config: AdminResourceConfig<CertificationDTO & { [key: string]: unknown }> = {
  resource: 'certifications',
  title: 'Certifications',
  singular: 'Certification',
  description:
    'Credentials you have earned, shown as cards in the dark Certifications section with a link to verify each one.',
  searchPlaceholder: 'Search by name, organization or credential ID…',
  orderable: true,
  note: <SectionHint section="certifications" label="Certifications" />,
  defaults: {
    name: '',
    organization: '',
    issueDate: null,
    expiryDate: null,
    credentialId: '',
    credentialUrl: '',
    image: '',
    enabled: true,
    order: 0,
  },
  filters: [
    { key: 'organization', label: 'Organization', type: 'facet' },
    { key: 'enabled', label: 'Visibility', type: 'boolean', trueLabel: 'Visible', falseLabel: 'Hidden' },
  ],
  fields: [
    {
      name: 'name',
      label: 'Certification name',
      type: 'text',
      required: true,
      placeholder: 'AWS Certified Developer',
    },
    {
      name: 'organization',
      label: 'Issuing organization',
      type: 'text',
      required: true,
      placeholder: 'Amazon Web Services',
    },
    { name: 'issueDate', label: 'Issue date', type: 'date' },
    {
      name: 'expiryDate',
      label: 'Expiry date',
      type: 'date',
      help: 'Leave empty if the credential does not expire.',
    },
    { name: 'credentialId', label: 'Credential ID', type: 'text', placeholder: 'ABC-123-XYZ' },
    {
      name: 'credentialUrl',
      label: 'Credential URL',
      type: 'text',
      placeholder: 'https://verify.example.com/abc123',
    },
    { name: 'order', label: 'Display order', type: 'number', min: 0 },
    { name: 'image', label: 'Certificate image', type: 'image', uploadFolder: 'certifications' },
    { name: 'enabled', label: 'Visible on the portfolio', type: 'switch' },
  ],
  columns: [
    {
      key: 'name',
      label: 'Certification',
      render: (row) => (
        <ThumbLabelCell
          src={row.image || undefined}
          title={row.name}
          subtitle={row.organization}
          rounded="rounded-md"
        />
      ),
    },
    { key: 'issueDate', label: 'Issued', render: (row) => <MonthCell value={row.issueDate} /> },
    {
      key: 'credentialId',
      label: 'Credential ID',
      render: (row) => <TextCell value={row.credentialId} max={24} />,
    },
    {
      key: 'credentialUrl',
      label: 'Verify',
      render: (row) => <LinkCell href={row.credentialUrl || undefined} label="Open" />,
    },
  ],
  labelOf: (row) => row.name,
}

export default function CertificationsScreen() {
  return <ResourceManager config={config} />
}
