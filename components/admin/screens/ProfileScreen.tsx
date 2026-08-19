'use client'

import { useEffect, useState } from 'react'
import { TbDeviceFloppy, TbAlertTriangle } from 'react-icons/tb'
import { api, ApiError } from '@/lib/api-client'
import ResourceForm from '../ResourceForm'
import { useToast } from '../Toast'
import type { AdminField } from '../types'
import type { ProfileDTO } from '@/lib/types'

/**
 * Single-record editor for the profile document. Grouped into cards so the
 * form stays readable, but every group reuses <ResourceForm> so field
 * rendering behaves exactly as it does in the CRUD modals.
 */

const IDENTITY_FIELDS: AdminField[] = [
  { name: 'name', label: 'Full name', type: 'text', required: true, placeholder: 'Althaf N' },
  {
    name: 'title',
    label: 'Profile title',
    type: 'text',
    placeholder: 'Full Stack Developer',
    help: 'Used for SEO and structured data.',
  },
  {
    name: 'headline',
    label: 'Hero headline',
    type: 'text',
    placeholder: 'Fullstack Developer',
    help: 'The large heading. The first word is solid black; the rest renders white with a black outline — exactly as in the original design.',
  },
  {
    name: 'typedPhrases',
    label: 'Typing animation phrases',
    type: 'tags',
    placeholder: 'I am Althaf N',
    help: 'Cycled by the animated greeting. Add several to rotate between them.',
  },
  {
    name: 'shortDescription',
    label: 'Short description',
    type: 'textarea',
    rows: 4,
    help: 'The paragraph under the hero headline.',
  },
  {
    name: 'availableForWork',
    label: 'Available for work',
    type: 'switch',
    help: 'Reserved for future use — it does not change the current layout.',
  },
]

const ABOUT_FIELDS: AdminField[] = [
  {
    name: 'aboutParagraphs',
    label: 'About Me paragraphs',
    type: 'paragraphs',
    rows: 5,
    placeholder: 'Write one paragraph…',
    help: 'Each paragraph becomes its own block. Wrap text in **double asterisks** to render it semi-bold, matching the original highlighted phrases.',
  },
]

const CONTACT_FIELDS: AdminField[] = [
  { name: 'email', label: 'Email', type: 'text', placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone', type: 'text', placeholder: '9633146330' },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    placeholder: 'Kerala, India',
    help: 'Not shown in the contact list (the original design had no location line) — it is published as SEO structured data.',
  },
]

const MEDIA_FIELDS: AdminField[] = [
  {
    name: 'logo',
    label: 'Logo',
    type: 'image',
    uploadFolder: 'profile',
    aspect: 'aspect-[3/1]',
    help: 'Shown in the navbar and, inverted, in the footer. SVG, PNG or GIF — the footer inverts it, so video is not accepted here.',
  },
  {
    name: 'heroImage',
    label: 'Hero illustration or video',
    type: 'media',
    uploadFolder: 'profile',
    help: 'The large graphic beside the hero text. A GIF or an MP4/WebM clip works here too — video plays muted and looped, with no controls.',
  },
  {
    name: 'aboutImage',
    label: 'About illustration or video',
    type: 'media',
    uploadFolder: 'profile',
    help: 'The graphic beside the About Me copy. Accepts a still image, a GIF or an MP4/WebM clip.',
  },
  {
    name: 'profileImage',
    label: 'Profile photo',
    type: 'image',
    uploadFolder: 'profile',
    aspect: 'aspect-square',
    help: 'Used for SEO structured data and social sharing.',
  },
  {
    name: 'resumeUrl',
    label: 'Resume (PDF)',
    type: 'document',
    uploadFolder: 'resume',
    help: 'Linked from the navbar button. Clear it to hide the button entirely.',
  },
  { name: 'resumeLabel', label: 'Resume button label', type: 'text', placeholder: 'Resume' },
]

const GROUPS: { title: string; description: string; fields: AdminField[] }[] = [
  {
    title: 'Identity & hero',
    description: 'The first thing visitors read at the top of the page.',
    fields: IDENTITY_FIELDS,
  },
  {
    title: 'About Me',
    description: 'The paragraphs beside the About illustration.',
    fields: ABOUT_FIELDS,
  },
  {
    title: 'Contact details',
    description: 'Shown in the contact section and used for structured data.',
    fields: CONTACT_FIELDS,
  },
  {
    title: 'Media & resume',
    description: 'Images and files used across the portfolio.',
    fields: MEDIA_FIELDS,
  },
]

export default function ProfileScreen() {
  const toast = useToast()

  const [values, setValues] = useState<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<ProfileDTO>('/api/admin/profile')
      .then(({ data }) => {
        if (!cancelled) setValues(data as unknown as Record<string, unknown>)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load profile.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Warn before losing unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const handleChange = (name: string, value: unknown) => {
    setValues((current) => (current ? { ...current, [name]: value } : current))
    setDirty(true)
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const handleSave = async () => {
    if (!values) return
    setSaving(true)
    setErrors({})

    const { id: _id, ...payload } = values as Record<string, unknown> & { id?: string }
    void _id

    try {
      const { data } = await api.put<ProfileDTO>('/api/admin/profile', payload)
      setValues(data as unknown as Record<string, unknown>)
      setDirty(false)
      toast.success('Profile saved — your portfolio is updated.')
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors)
        toast.error(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not save the profile.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
        <TbAlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-red-800">Could not load your profile</p>
          <p className="text-sm text-red-700 mt-1">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!values) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-white border border-admin-border animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void handleSave()
      }}
    >
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-ink">Profile</h1>
          <p className="text-sm text-admin-muted mt-1 max-w-2xl">
            Your name, hero copy, About Me text, contact details and the images used across the
            portfolio.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !dirty}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TbDeviceFloppy size={18} aria-hidden="true" />
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </header>

      <div className="space-y-5">
        {GROUPS.map((group) => (
          <section key={group.title} className="bg-white border border-admin-border rounded-xl">
            <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-ink">{group.title}</h2>
              <p className="text-xs text-admin-muted mt-0.5">{group.description}</p>
            </header>
            <div className="p-5 sm:p-6">
              <ResourceForm
                fields={group.fields}
                values={values}
                errors={errors}
                onChange={handleChange}
              />
            </div>
          </section>
        ))}
      </div>

      {/* Sticky save bar so the button is always reachable on long forms. */}
      {dirty && (
        <div className="sticky bottom-4 mt-5 flex justify-end">
          <div className="inline-flex items-center gap-3 rounded-xl border border-admin-border bg-white px-4 py-3 shadow-lg">
            <span className="text-sm text-admin-muted">You have unsaved changes</span>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
