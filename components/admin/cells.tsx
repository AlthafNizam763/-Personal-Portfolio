'use client'

import { getIcon } from '@/lib/icons'
import { formatDateRange, formatMonthYear, truncate } from '@/lib/utils'

/**
 * Small presentational helpers used by the `columns` definitions of the admin
 * screens, so every table renders icons, badges and thumbnails identically.
 */

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'dark' | 'success' | 'warning'
}) {
  const tones = {
    neutral: 'bg-admin-bg text-admin-ink border-admin-border',
    dark: 'bg-black text-white border-black',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

/** Icon + primary label, with an optional muted second line. */
export function IconLabelCell({
  icon,
  title,
  subtitle,
}: {
  icon?: string
  title: string
  subtitle?: string
}) {
  const Icon = icon ? getIcon(icon) : null
  return (
    <div className="flex items-center gap-3 min-w-0">
      {Icon && (
        <span className="shrink-0 w-9 h-9 rounded-lg border border-admin-border bg-admin-bg flex items-center justify-center text-admin-ink">
          <Icon size={18} aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold text-admin-ink truncate">{title}</span>
        {subtitle && <span className="block text-xs text-admin-muted truncate">{subtitle}</span>}
      </span>
    </div>
  )
}

/** Thumbnail + primary label. Falls back to a monogram when no image is set. */
export function ThumbLabelCell({
  src,
  title,
  subtitle,
  rounded = 'rounded-lg',
}: {
  src?: string
  title: string
  subtitle?: string
  rounded?: string
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className={`shrink-0 w-11 h-11 ${rounded} border border-admin-border bg-admin-bg overflow-hidden flex items-center justify-center`}
      >
        {src ? (
          // Admin thumbnail; the source may be a remote Blob URL or an SVG.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-admin-muted">
            {title.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-admin-ink truncate">{title}</span>
        {subtitle && <span className="block text-xs text-admin-muted truncate">{subtitle}</span>}
      </span>
    </div>
  )
}

export function TextCell({ value, max = 70 }: { value?: string; max?: number }) {
  if (!value) return <span className="text-admin-muted">—</span>
  return (
    <span className="text-admin-muted block max-w-md" title={value}>
      {truncate(value, max)}
    </span>
  )
}

export function DateRangeCell({
  start,
  end,
  current,
}: {
  start: string | null
  end: string | null
  current?: boolean
}) {
  const range = formatDateRange(start, end, current)
  return range ? (
    <span className="whitespace-nowrap text-admin-muted">{range}</span>
  ) : (
    <span className="text-admin-muted">—</span>
  )
}

export function MonthCell({ value }: { value: string | null }) {
  const formatted = formatMonthYear(value)
  return formatted ? (
    <span className="whitespace-nowrap text-admin-muted">{formatted}</span>
  ) : (
    <span className="text-admin-muted">—</span>
  )
}

/** A percentage meter, used for skill level. */
export function LevelCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[7rem]">
      <span className="h-1.5 flex-1 rounded-full bg-admin-bg overflow-hidden">
        <span
          className="block h-full rounded-full bg-black"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </span>
      <span className="text-xs text-admin-muted tabular-nums w-9 text-right">{value}%</span>
    </div>
  )
}

export function LinkCell({ href, label }: { href?: string; label?: string }) {
  if (!href) return <span className="text-admin-muted">—</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-admin-ink underline underline-offset-2 hover:text-black truncate block max-w-[14rem]"
      title={href}
    >
      {label ?? href.replace(/^https?:\/\/(www\.)?/, '')}
    </a>
  )
}

export function TagsCell({ values }: { values: string[] }) {
  if (!values || values.length === 0) return <span className="text-admin-muted">—</span>
  const shown = values.slice(0, 3)
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((value) => (
        <Badge key={value}>{value}</Badge>
      ))}
      {values.length > shown.length && <Badge>+{values.length - shown.length}</Badge>}
    </div>
  )
}
