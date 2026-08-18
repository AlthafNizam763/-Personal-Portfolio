'use client'

import { useEffect, useState } from 'react'
import { TbDeviceFloppy, TbTrash, TbPlus, TbAlertTriangle, TbLock } from 'react-icons/tb'
import { api, ApiError } from '@/lib/api-client'
import ResourceForm from '../ResourceForm'
import { Field, Switch, TextInput } from '../FormFields'
import { useToast } from '../Toast'
import type { AdminField } from '../types'
import type { SectionKey, SiteSettingsDTO } from '@/lib/types'

const SEO_FIELDS: AdminField[] = [
  {
    name: 'siteTitle',
    label: 'Site title',
    type: 'text',
    required: true,
    help: 'Browser tab title and the default Open Graph title. The text before "|" is also used as the footer signature.',
  },
  {
    name: 'siteDescription',
    label: 'Meta description',
    type: 'textarea',
    rows: 3,
    help: 'Aim for 150–160 characters. Used for search results and link previews.',
  },
  {
    name: 'keywords',
    label: 'Keywords',
    type: 'tags',
    placeholder: 'Full Stack Developer, Laravel…',
  },
  {
    name: 'ogImage',
    label: 'Social share image',
    type: 'image',
    uploadFolder: 'seo',
    help: 'Shown when the site is shared. 1200×630 works best.',
  },
  {
    name: 'favicon',
    label: 'Favicon',
    type: 'image',
    uploadFolder: 'seo',
    aspect: 'aspect-square',
    help: 'A square PNG or SVG, at least 96×96.',
  },
  { name: 'twitterHandle', label: 'X / Twitter handle', type: 'text', placeholder: '@yourhandle' },
  {
    name: 'themeColor',
    label: 'Theme colour',
    type: 'text',
    placeholder: '#000000',
    help: 'Tints the browser UI on mobile. Hex format.',
  },
]

const SECTION_LABELS: { key: SectionKey; label: string; note?: string }[] = [
  { key: 'hero', label: 'Hero / Introduction' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'about', label: 'About Me' },
  { key: 'services', label: 'Services', note: 'New section — off by default' },
  { key: 'projects', label: 'Projects' },
  { key: 'education', label: 'Education', note: 'New section — off by default' },
  { key: 'certifications', label: 'Certifications', note: 'New section — off by default' },
  { key: 'achievements', label: 'Achievements', note: 'New section — off by default' },
  { key: 'contact', label: 'Contact' },
]

export default function SettingsScreen({
  account,
}: {
  account: { name: string; email: string }
}) {
  const toast = useToast()

  const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<SiteSettingsDTO>('/api/admin/settings')
      .then(({ data }) => {
        if (!cancelled) setSettings(data as unknown as Record<string, unknown>)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load settings.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const change = (name: string, value: unknown) => {
    setSettings((current) => (current ? { ...current, [name]: value } : current))
    setDirty(true)
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setErrors({})

    const { id: _id, ...payload } = settings as Record<string, unknown> & { id?: string }
    void _id

    try {
      const { data } = await api.put<SiteSettingsDTO>('/api/admin/settings', payload)
      setSettings(data as unknown as Record<string, unknown>)
      setDirty(false)
      toast.success('Settings saved.')
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors)
        toast.error(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not save settings.')
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
          <p className="text-sm font-semibold text-red-800">Could not load settings</p>
          <p className="text-sm text-red-700 mt-1">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-white border border-admin-border animate-pulse" />
        ))}
      </div>
    )
  }

  const sections = (settings.sections ?? {}) as Record<SectionKey, boolean>
  const navLinks = (settings.navLinks ?? []) as { label: string; href: string }[]

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-ink">Settings</h1>
          <p className="text-sm text-admin-muted mt-1 max-w-2xl">
            Search metadata, which sections appear, navigation links, and your admin account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !dirty}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TbDeviceFloppy size={18} aria-hidden="true" />
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </header>

      <div className="space-y-5">
        {/* ---- SEO ---- */}
        <section className="bg-white border border-admin-border rounded-xl">
          <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
            <h2 className="text-base font-bold text-admin-ink">SEO & sharing</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              Feeds the page metadata, Open Graph and Twitter card tags, and the sitemap.
            </p>
          </header>
          <div className="p-5 sm:p-6">
            <ResourceForm fields={SEO_FIELDS} values={settings} errors={errors} onChange={change} />
          </div>
        </section>

        {/* ---- section visibility ---- */}
        <section className="bg-white border border-admin-border rounded-xl">
          <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
            <h2 className="text-base font-bold text-admin-ink">Section visibility</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              Turn whole sections on or off. A section also stays hidden while it has no content,
              regardless of this switch.
            </p>
          </header>
          <div className="p-5 sm:p-6 grid gap-4 sm:grid-cols-2">
            {SECTION_LABELS.map(({ key, label, note }) => (
              <Switch
                key={key}
                checked={Boolean(sections[key])}
                onChange={(checked) => change('sections', { ...sections, [key]: checked })}
                label={label}
                description={note}
              />
            ))}
          </div>
        </section>

        {/* ---- navigation ---- */}
        <section className="bg-white border border-admin-border rounded-xl">
          <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
            <h2 className="text-base font-bold text-admin-ink">Navigation links</h2>
            <p className="text-xs text-admin-muted mt-0.5">
              The navbar menu. Each target is a section id on the page — one of{' '}
              <code className="font-mono">
                {SECTION_LABELS.map((s) => s.key).filter((k) => k !== 'hero').join(', ')}
              </code>
              , or <code className="font-mono">home</code>.
            </p>
          </header>
          <div className="p-5 sm:p-6">
            <div className="space-y-3">
              {navLinks.map((link, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <Field label={index === 0 ? 'Label' : undefined} className="flex-1">
                    <TextInput
                      value={link.label}
                      onChange={(value) => {
                        const next = [...navLinks]
                        next[index] = { ...link, label: value }
                        change('navLinks', next)
                      }}
                      placeholder="About"
                    />
                  </Field>
                  <Field label={index === 0 ? 'Section id' : undefined} className="flex-1">
                    <TextInput
                      value={link.href}
                      onChange={(value) => {
                        const next = [...navLinks]
                        next[index] = { ...link, href: value }
                        change('navLinks', next)
                      }}
                      placeholder="about"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => change('navLinks', navLinks.filter((_, i) => i !== index))}
                    aria-label={`Remove ${link.label || 'link'}`}
                    className="shrink-0 p-2.5 rounded-lg border border-admin-border text-admin-muted hover:text-red-600 hover:border-red-300 transition-colors sm:mb-0"
                  >
                    <TbTrash size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => change('navLinks', [...navLinks, { label: '', href: '' }])}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-admin-ink hover:underline"
            >
              <TbPlus size={16} /> Add navigation link
            </button>
          </div>
        </section>

        {/* ---- appearance ---- */}
        <section className="bg-white border border-admin-border rounded-xl">
          <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
            <h2 className="text-base font-bold text-admin-ink">Appearance</h2>
          </header>
          <div className="p-5 sm:p-6">
            <Switch
              checked={Boolean(settings.showCursorAnimation)}
              onChange={(checked) => change('showCursorAnimation', checked)}
              label="Custom cursor animation"
              description="The blend-mode circle that follows the pointer. Automatically disabled on touch devices."
            />
          </div>
        </section>

        <AccountSection account={account} />
        <PasswordSection />
      </div>

      {dirty && (
        <div className="sticky bottom-4 mt-5 flex justify-end">
          <div className="inline-flex items-center gap-3 rounded-xl border border-admin-border bg-white px-4 py-3 shadow-lg">
            <span className="text-sm text-admin-muted">You have unsaved changes</span>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ account */

function AccountSection({ account }: { account: { name: string; email: string } }) {
  const toast = useToast()
  const [name, setName] = useState(account.name)
  const [email, setEmail] = useState(account.email)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await api.patch('/api/auth/account', { name, email })
      toast.success('Account details updated.')
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      toast.error(err instanceof Error ? err.message : 'Could not update the account.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white border border-admin-border rounded-xl">
      <header className="px-5 sm:px-6 py-4 border-b border-admin-border">
        <h2 className="text-base font-bold text-admin-ink">Admin account</h2>
        <p className="text-xs text-admin-muted mt-0.5">
          The name shown in the sidebar and the email you sign in with.
        </p>
      </header>

      <form onSubmit={submit} className="p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" error={errors.name} required>
            <TextInput value={name} onChange={setName} error={errors.name} required />
          </Field>
          <Field label="Sign-in email" error={errors.email} required>
            <TextInput
              value={email}
              onChange={setEmail}
              error={errors.email}
              type="email"
              autoComplete="username"
              required
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update account'}
        </button>
      </form>
    </section>
  )
}

/* ----------------------------------------------------------------- password */

function PasswordSection() {
  const toast = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed. Other devices have been signed out.')
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors)
      toast.error(err instanceof Error ? err.message : 'Could not change the password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white border border-admin-border rounded-xl">
      <header className="px-5 sm:px-6 py-4 border-b border-admin-border flex items-center gap-2">
        <TbLock size={18} className="text-admin-muted" aria-hidden="true" />
        <div>
          <h2 className="text-base font-bold text-admin-ink">Change password</h2>
          <p className="text-xs text-admin-muted mt-0.5">
            At least 8 characters with an uppercase letter, a lowercase letter and a number.
            Changing it signs out every other device.
          </p>
        </div>
      </header>

      <form onSubmit={submit} className="p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Current password" error={errors.currentPassword} required>
            <TextInput
              value={currentPassword}
              onChange={setCurrentPassword}
              error={errors.currentPassword}
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Field label="New password" error={errors.newPassword} required>
            <TextInput
              value={newPassword}
              onChange={setNewPassword}
              error={errors.newPassword}
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
          <Field label="Confirm new password" error={errors.confirmPassword} required>
            <TextInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={errors.confirmPassword}
              type="password"
              autoComplete="new-password"
              required
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
        >
          {saving ? 'Updating…' : 'Change password'}
        </button>
      </form>
    </section>
  )
}
