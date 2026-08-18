'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'
import {
  TbUpload,
  TbTrash,
  TbPhoto,
  TbX,
  TbPlus,
  TbSearch,
  TbFileText,
  TbGripVertical,
} from 'react-icons/tb'
import { ICON_GROUPS, ICON_REGISTRY, getIcon } from '@/lib/icons'
import { api } from '@/lib/api-client'
import { useToast } from './Toast'

/* -------------------------------------------------------------------------
 * Shared shell
 * ---------------------------------------------------------------------- */

const inputBase =
  'w-full rounded-lg border border-admin-border bg-white px-3.5 py-2.5 text-sm text-admin-ink placeholder:text-admin-muted/70 transition-shadow focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black disabled:bg-admin-bg disabled:text-admin-muted'

export function Field({
  label,
  htmlFor,
  help,
  error,
  required,
  children,
  className = '',
}: {
  label?: string
  htmlFor?: string
  help?: string
  error?: string[]
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-semibold text-admin-ink mb-1.5"
        >
          {label}
          {required && (
            <span className="text-red-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {help && !error?.length && <p className="text-xs text-admin-muted mt-1.5">{help}</p>}
      {error?.map((message) => (
        <p key={message} className="text-xs text-red-600 mt-1.5" role="alert">
          {message}
        </p>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Text-like inputs
 * ---------------------------------------------------------------------- */

export function TextInput({
  value,
  onChange,
  error,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  error?: string[]
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error?.length ? true : undefined}
      className={`${inputBase} ${error?.length ? 'border-red-500 focus:ring-red-100' : ''}`}
    />
  )
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  error,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  error?: string[]
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'rows'>) {
  return (
    <textarea
      {...rest}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error?.length ? true : undefined}
      className={`${inputBase} resize-y leading-6 ${
        error?.length ? 'border-red-500 focus:ring-red-100' : ''
      }`}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  error,
  ...rest
}: {
  value: number
  onChange: (value: number) => void
  error?: string[]
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      aria-invalid={error?.length ? true : undefined}
      className={`${inputBase} ${error?.length ? 'border-red-500' : ''}`}
    />
  )
}

/** Stores an ISO string but presents a native `YYYY-MM-DD` picker. */
export function DateInput({
  value,
  onChange,
  error,
  ...rest
}: {
  value: string | null
  onChange: (value: string | null) => void
  error?: string[]
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const asDateValue = value ? value.slice(0, 10) : ''

  return (
    <input
      {...rest}
      type="date"
      value={asDateValue}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
      aria-invalid={error?.length ? true : undefined}
      className={`${inputBase} ${error?.length ? 'border-red-500' : ''}`}
    />
  )
}

export function SelectInput({
  value,
  onChange,
  options,
  error,
  placeholder,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  error?: string[]
  placeholder?: string
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error?.length ? true : undefined}
      className={`${inputBase} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2371717A" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>')] bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${
        error?.length ? 'border-red-500' : ''
      }`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** Accessible on/off control used for `enabled`, `featured`, `current`, … */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'} select-none`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 mt-0.5 w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 ${
          checked ? 'bg-black' : 'bg-admin-border'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span>
        <span className="block text-sm font-semibold text-admin-ink">{label}</span>
        {description && <span className="block text-xs text-admin-muted mt-0.5">{description}</span>}
      </span>
    </label>
  )
}

/* -------------------------------------------------------------------------
 * Tag input (technologies, keywords, …)
 * ---------------------------------------------------------------------- */

export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  error,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  error?: string[]
}) {
  const [draft, setDraft] = useState('')

  const commit = useCallback(
    (raw: string) => {
      // Support pasting "React, Next.js, Node" in one go.
      const additions = raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => !value.includes(t))

      if (additions.length > 0) onChange([...value, ...additions])
      setDraft('')
    },
    [value, onChange]
  )

  return (
    <div
      className={`${inputBase} flex flex-wrap items-center gap-2 py-2 ${
        error?.length ? 'border-red-500' : ''
      }`}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-md bg-admin-bg border border-admin-border px-2 py-1 text-xs font-medium text-admin-ink"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-admin-muted hover:text-red-600 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <TbX size={13} />
          </button>
        </span>
      ))}

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit(draft)
          } else if (e.key === 'Backspace' && !draft && value.length > 0) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => draft && commit(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[8rem] bg-transparent text-sm outline-none placeholder:text-admin-muted/70"
      />
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Repeatable multi-line text (about paragraphs, typed phrases)
 * ---------------------------------------------------------------------- */

export function ParagraphList({
  value,
  onChange,
  placeholder,
  help,
  rows = 4,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  help?: string
  rows?: number
}) {
  const update = (index: number, text: string) => {
    const next = [...value]
    next[index] = text
    onChange(next)
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= value.length) return
    const next = [...value]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.map((paragraph, index) => (
        <div key={index} className="flex gap-2">
          <div className="flex flex-col items-center gap-1 pt-2 text-admin-muted">
            <TbGripVertical size={16} aria-hidden="true" />
            <span className="text-[10px] font-mono">{index + 1}</span>
          </div>

          <textarea
            value={paragraph}
            rows={rows}
            onChange={(e) => update(index, e.target.value)}
            placeholder={placeholder}
            className={`${inputBase} resize-y leading-6 flex-1`}
          />

          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="p-1.5 rounded border border-admin-border text-admin-muted hover:text-admin-ink disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={`Move paragraph ${index + 1} up`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === value.length - 1}
              className="p-1.5 rounded border border-admin-border text-admin-muted hover:text-admin-ink disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={`Move paragraph ${index + 1} down`}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="p-1.5 rounded border border-admin-border text-admin-muted hover:text-red-600 hover:border-red-300"
              aria-label={`Remove paragraph ${index + 1}`}
            >
              <TbTrash size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, ''])}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-ink hover:underline"
      >
        <TbPlus size={16} /> Add paragraph
      </button>

      {help && <p className="text-xs text-admin-muted">{help}</p>}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Icon picker
 * ---------------------------------------------------------------------- */

export function IconPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string>('all')
  const Selected = getIcon(value)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return Object.entries(ICON_REGISTRY).filter(([name, entry]) => {
      if (group !== 'all' && entry.group !== group) return false
      if (!q) return true
      return name.toLowerCase().includes(q) || entry.label.toLowerCase().includes(q)
    })
  }, [query, group])

  return (
    <div className="rounded-lg border border-admin-border overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-admin-border bg-admin-bg">
        <span className="shrink-0 w-11 h-11 rounded-lg bg-white border border-admin-border flex items-center justify-center text-admin-ink">
          <Selected size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-admin-ink truncate">
            {ICON_REGISTRY[value]?.label ?? 'Select an icon'}
          </p>
          <p className="text-xs text-admin-muted font-mono truncate">{value || '—'}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 p-3 border-b border-admin-border">
        <div className="relative flex-1">
          <TbSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons…"
            aria-label="Search icons"
            className={`${inputBase} pl-9 py-2`}
          />
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          aria-label="Filter icons by group"
          className={`${inputBase} py-2 sm:w-40`}
        >
          <option value="all">All groups</option>
          {ICON_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-56 overflow-y-auto admin-scroll p-3">
        {matches.length === 0 ? (
          <p className="text-sm text-admin-muted text-center py-6">
            No icons match “{query}”.
          </p>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {matches.map(([name, entry]) => {
              const Icon = entry.Icon
              const active = name === value
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange(name)}
                  title={`${entry.label} (${name})`}
                  aria-label={entry.label}
                  aria-pressed={active}
                  className={`aspect-square rounded-lg border flex items-center justify-center transition-colors ${
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-admin-border text-admin-ink hover:border-black hover:bg-admin-bg'
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------
 * File / image upload with live preview
 * ---------------------------------------------------------------------- */

export function ImageUploader({
  value,
  onChange,
  folder,
  kind = 'image',
  aspect = 'aspect-video',
  help,
  error,
}: {
  value: string
  onChange: (url: string) => void
  folder: string
  kind?: 'image' | 'document' | 'video'
  aspect?: string
  help?: string
  error?: string[]
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  /** Object URL shown instantly while the real upload is still in flight. */
  const [preview, setPreview] = useState<string | null>(null)
  const inputId = useId()

  const accept =
    kind === 'document'
      ? 'application/pdf'
      : kind === 'video'
        ? 'video/mp4,video/webm'
        : 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif'

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return

      const localUrl = URL.createObjectURL(file)
      setPreview(localUrl)
      setBusy(true)

      try {
        const result = await api.upload(file, { folder, kind })
        onChange(result.url)
        toast.success('File uploaded.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed.')
        setPreview(null)
      } finally {
        setBusy(false)
        URL.revokeObjectURL(localUrl)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [folder, kind, onChange, toast]
  )

  const shown = preview ?? value
  const isDoc = kind === 'document'
  const isVideo = kind === 'video'

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragging ? 'border-black bg-admin-bg' : 'border-admin-border'
        } ${error?.length ? 'border-red-400' : ''}`}
      >
        {shown ? (
          <div className="p-3">
            <div className={`relative ${isDoc ? '' : aspect} rounded-md overflow-hidden bg-admin-bg`}>
              {isDoc ? (
                <div className="flex items-center gap-3 p-4">
                  <TbFileText size={28} className="text-admin-muted shrink-0" aria-hidden="true" />
                  <a
                    href={shown}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-admin-ink font-medium truncate hover:underline"
                  >
                    {shown.split('/').pop()}
                  </a>
                </div>
              ) : isVideo ? (
                <video src={shown} className="w-full h-full object-cover" muted playsInline controls />
              ) : (
                // The preview may be a blob: URL, which next/image cannot process.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shown} alt="Preview" className="w-full h-full object-contain" />
              )}

              {busy && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-xs font-semibold text-admin-ink">Uploading…</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-3">
              <p className="text-xs text-admin-muted font-mono truncate flex-1" title={value}>
                {value || 'Pending…'}
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded border border-admin-border hover:bg-admin-bg disabled:opacity-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    onChange('')
                  }}
                  disabled={busy}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded border border-admin-border text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-full px-4 py-8 flex flex-col items-center gap-2 text-admin-muted hover:text-admin-ink transition-colors"
          >
            {busy ? (
              <span className="text-sm font-semibold">Uploading…</span>
            ) : (
              <>
                {kind === 'document' ? <TbUpload size={26} /> : <TbPhoto size={26} />}
                <span className="text-sm font-semibold">
                  Drop a file here or <span className="underline">browse</span>
                </span>
                <span className="text-xs">
                  {kind === 'document' ? 'PDF' : kind === 'video' ? 'MP4 or WebM' : 'PNG, JPG, WebP, GIF or SVG'} · max 8 MB
                </span>
              </>
            )}
          </button>
        )}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      {/* Escape hatch: paste a URL for media hosted elsewhere. */}
      <input
        value={value}
        onChange={(e) => {
          setPreview(null)
          onChange(e.target.value)
        }}
        placeholder="…or paste a URL / path such as /assets/logo.svg"
        aria-label="File URL"
        className={`${inputBase} mt-2 text-xs font-mono`}
      />

      {help && !error?.length && <p className="text-xs text-admin-muted mt-1.5">{help}</p>}
      {error?.map((message) => (
        <p key={message} className="text-xs text-red-600 mt-1.5" role="alert">
          {message}
        </p>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------
 * Gallery — multiple images for a single project
 * ---------------------------------------------------------------------- */

export function GalleryUploader({
  value,
  onChange,
  folder,
}: {
  value: { url: string; alt: string }[]
  onChange: (value: { url: string; alt: string }[]) => void
  folder: string
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)

    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => api.upload(file, { folder, kind: 'image' }))
      )
      onChange([...value, ...uploaded.map((u) => ({ url: u.url, alt: '' }))])
      toast.success(`${uploaded.length} image(s) added.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {value.map((image, index) => (
            <li
              key={`${image.url}-${index}`}
              className="rounded-lg border border-admin-border overflow-hidden"
            >
              <div className="aspect-video bg-admin-bg">
                {/* eslint-disable-next-line @next/next/no-img-element -- small
                    admin thumbnail, may be a remote Blob URL. */}
                <img src={image.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-2 space-y-2">
                <input
                  value={image.alt}
                  onChange={(e) => {
                    const next = [...value]
                    next[index] = { ...image, alt: e.target.value }
                    onChange(next)
                  }}
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${index + 1}`}
                  className="w-full text-xs rounded border border-admin-border px-2 py-1.5 focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="w-full text-xs font-semibold text-red-600 hover:bg-red-50 rounded py-1.5 transition-colors"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full rounded-lg border-2 border-dashed border-admin-border px-4 py-5 text-sm font-semibold text-admin-muted hover:text-admin-ink hover:border-black transition-colors disabled:opacity-50"
      >
        {busy ? 'Uploading…' : '+ Add gallery images'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  )
}
