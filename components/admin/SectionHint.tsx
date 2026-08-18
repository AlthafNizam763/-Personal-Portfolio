'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TbInfoCircle } from 'react-icons/tb'
import { api } from '@/lib/api-client'
import { useToast } from './Toast'
import type { SectionKey, SiteSettingsDTO } from '@/lib/types'

/**
 * Shown on the screens for sections that did not exist in the original React
 * portfolio (Services, Education, Certifications, Achievements).
 *
 * Those sections ship disabled so the migrated site looks unchanged on day
 * one; without this banner it would look like adding a record simply did
 * nothing. Offers a one-click enable.
 */
export default function SectionHint({
  section,
  label,
}: {
  section: SectionKey
  label: string
}) {
  const toast = useToast()
  const [settings, setSettings] = useState<SiteSettingsDTO | null>(null)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<SiteSettingsDTO>('/api/admin/settings')
      .then(({ data }) => {
        if (!cancelled) setSettings(data)
      })
      .catch(() => {
        /* Non-critical: the banner just stays hidden. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Nothing to warn about until we know the section is off.
  if (!settings || settings.sections[section]) return null

  const enable = async () => {
    setEnabling(true)
    try {
      const { data } = await api.put<SiteSettingsDTO>('/api/admin/settings', {
        ...settings,
        sections: { ...settings.sections, [section]: true },
      })
      setSettings(data)
      toast.success(`${label} section is now visible on your portfolio.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update settings.')
    } finally {
      setEnabling(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <TbInfoCircle size={20} className="shrink-0 text-amber-600" aria-hidden="true" />

      <p className="text-sm text-amber-900 flex-1">
        The <strong>{label}</strong> section is currently hidden on your portfolio, so anything you
        add here will not be visible yet.
      </p>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => void enable()}
          disabled={enabling}
          className="rounded-lg bg-black px-3.5 py-2 text-xs font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
        >
          {enabling ? 'Enabling…' : 'Enable section'}
        </button>
        <Link
          href="/admin/settings"
          className="text-xs font-semibold text-amber-900 underline underline-offset-2"
        >
          Settings
        </Link>
      </div>
    </div>
  )
}
