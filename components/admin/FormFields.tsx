'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  TbUpload,
  TbTrash,
  TbPhoto,
  TbVideo,
  TbX,
  TbPlus,
  TbSearch,
  TbFileText,
  TbGripVertical,
  TbAlertTriangle,
} from 'react-icons/tb'
import { ICON_GROUPS, ICON_REGISTRY, getIcon } from '@/lib/icons'
import { api, uploadBackendInfo, type UploadBackendInfo } from '@/lib/api-client'
import {
  acceptFor,
  describeAccepted,
  formatBytes,
  isVideoType,
  isVideoUrl,
  labelForUrl,
  resolveFileType,
  validateUpload,
  type UploadKind,
} from '@/lib/upload-limits'
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
 * Media upload — images, GIFs, video and documents
 * ---------------------------------------------------------------------- */

/** What the browser knows about a file that is still uploading. */
interface PendingFile {
  name: string
  size: number
  /** Resolved type, so a mobile pick with an empty `File.type` still shows. */
  type: string
}

/**
 * Reports whether this deployment can store uploads at all.
 *
 * Asked once per screen (the answer is cached in the API client) so the
 * uploader can say "no Blob store is configured" before someone picks a 40 MB
 * video and waits for it to fail.
 */
function useUploadBackend(): UploadBackendInfo | null {
  const [info, setInfo] = useState<UploadBackendInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    uploadBackendInfo()
      .then((result) => {
        if (!cancelled) setInfo(result)
      })
      // A failed status check is not itself an upload failure — stay quiet and
      // let the upload report the real problem if there is one.
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return info
}

/** Thin bar under the preview; `null` percent means "started, size unknown". */
function ProgressBar({ percent }: { percent: number | null }) {
  return (
    <div
      className="h-1.5 rounded-full bg-admin-border overflow-hidden"
      role="progressbar"
      aria-label="Upload progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
    >
      <div
        className={`h-full bg-black transition-[width] duration-200 ${
          percent === null ? 'w-1/3 animate-pulse' : ''
        }`}
        style={percent === null ? undefined : { width: `${percent}%` }}
      />
    </div>
  )
}

/**
 * One media slot: pick a file, see it before saving, keep the stored URL.
 *
 * The upload happens as soon as a file is chosen, so the preview shown in the
 * form is the real stored asset by the time the record is saved — but nothing
 * is written to the record until the surrounding form is submitted, so
 * cancelling out of the form leaves the existing value alone.
 *
 * `kind` decides what the picker offers and how the preview renders:
 *   image    — PNG/JPG/WebP/GIF/SVG/AVIF
 *   video    — MP4/WebM
 *   media    — either, for slots that take an illustration *or* a clip
 *   document — PDF
 */
export function MediaUploader({
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
  kind?: UploadKind
  aspect?: string
  help?: string
  error?: string[]
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  /** Object URL shown instantly while the real upload is still in flight. */
  const objectUrlRef = useRef<string | null>(null)

  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingFile | null>(null)
  const [dragging, setDragging] = useState(false)

  const backend = useUploadBackend()
  const inputId = useId()
  const accept = acceptFor(kind)
  const blocked = backend !== null && !backend.ready

  /** Frees the previous object URL; keeping them alive leaks the whole file. */
  const releasePreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return

      // Same rules the endpoint applies, so an unusable file is reported
      // immediately instead of after a round trip.
      const invalid = validateUpload(file, kind)
      if (invalid) {
        toast.error(invalid.error)
        if (inputRef.current) inputRef.current.value = ''
        return
      }

      releasePreview()
      const localUrl = URL.createObjectURL(file)
      objectUrlRef.current = localUrl

      setPreview(localUrl)
      setPending({ name: file.name, size: file.size, type: resolveFileType(file) })
      setProgress(0)
      setBusy(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const result = await api.upload(file, {
          folder,
          kind,
          signal: controller.signal,
          onProgress: setProgress,
        })

        onChange(result.url)
        // The stored URL renders from `value` now; keeping the object URL would
        // leave the preview pointing at a blob that is revoked a line later.
        setPreview(null)
        setPending(null)
        releasePreview()
        toast.success('File uploaded.')
      } catch (err) {
        setPreview(null)
        setPending(null)
        releasePreview()

        if (err instanceof DOMException && err.name === 'AbortError') {
          toast.push('Upload cancelled.')
        } else {
          toast.error(err instanceof Error ? err.message : 'Upload failed.')
        }
      } finally {
        abortRef.current = null
        setBusy(false)
        setProgress(null)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [folder, kind, onChange, releasePreview, toast]
  )

  const shown = preview ?? value
  const isDoc = kind === 'document'
  // While a file is in flight its own type decides the preview; once stored,
  // the URL is all there is to go on.
  const showsVideo = !isDoc && (pending ? isVideoType(pending.type) : isVideoUrl(value))

  const openPicker = () => inputRef.current?.click()

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (blocked || busy) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (blocked || busy) return
          void handleFile(e.dataTransfer.files?.[0])
        }}
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragging ? 'border-black bg-admin-bg' : 'border-admin-border'
        } ${error?.length ? 'border-red-400' : ''}`}
      >
        {shown ? (
          <div className="p-3">
            <div
              className={`relative ${isDoc ? '' : aspect} rounded-md overflow-hidden bg-admin-bg`}
            >
              {isDoc ? (
                <div className="flex items-center gap-3 p-4">
                  <TbFileText size={28} className="text-admin-muted shrink-0" aria-hidden="true" />
                  <a
                    href={shown}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-admin-ink font-medium truncate hover:underline"
                  >
                    {pending?.name ?? shown.split('/').pop()}
                  </a>
                </div>
              ) : showsVideo ? (
                // Controls rather than autoplay: this is a review surface, and
                // muted + playsInline keep iOS from taking the video fullscreen
                // the moment it is tapped.
                <video
                  key={shown}
                  src={shown}
                  className="w-full h-full object-contain bg-black"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                // The preview may be a blob: URL, which next/image cannot
                // process, and an animated GIF must not be re-encoded.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shown} alt="Preview" className="w-full h-full object-contain" />
              )}

              {busy && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <span className="text-xs font-semibold text-admin-ink">
                    {progress === null ? 'Uploading…' : `Uploading… ${progress}%`}
                  </span>
                </div>
              )}
            </div>

            {busy && (
              <div className="mt-3">
                <ProgressBar percent={progress} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-admin-muted font-mono truncate" title={value}>
                  {pending ? pending.name : value || 'Pending…'}
                </p>
                <p className="text-[11px] text-admin-muted mt-0.5">
                  {pending
                    ? `${formatBytes(pending.size)} · ${pending.type}`
                    : labelForUrl(value)}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                {busy ? (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    className="text-xs font-semibold px-3 py-2 rounded border border-admin-border hover:bg-admin-bg"
                  >
                    Cancel
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={openPicker}
                      disabled={blocked}
                      className="text-xs font-semibold px-3 py-2 rounded border border-admin-border hover:bg-admin-bg disabled:opacity-50"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        releasePreview()
                        setPreview(null)
                        setPending(null)
                        onChange('')
                      }}
                      className="text-xs font-semibold px-3 py-2 rounded border border-admin-border text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={busy || blocked}
            className="w-full px-4 py-8 flex flex-col items-center gap-2 text-admin-muted hover:text-admin-ink transition-colors disabled:cursor-not-allowed"
          >
            {busy ? (
              <span className="text-sm font-semibold">Uploading…</span>
            ) : (
              <>
                {kind === 'document' ? (
                  <TbUpload size={26} aria-hidden="true" />
                ) : kind === 'video' ? (
                  <TbVideo size={26} aria-hidden="true" />
                ) : (
                  <TbPhoto size={26} aria-hidden="true" />
                )}
                <span className="text-sm font-semibold">
                  Drop a file here or <span className="underline">browse</span>
                </span>
                <span className="text-xs text-center px-2">{describeAccepted(kind)}</span>
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

      {blocked && backend?.reason && (
        <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <TbAlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{backend.reason}</span>
        </p>
      )}

      {/* Escape hatch: paste a URL for media hosted elsewhere. */}
      <input
        value={value}
        onChange={(e) => {
          releasePreview()
          setPreview(null)
          setPending(null)
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

/** Previous name for the same control, kept so older call sites keep working. */
export const ImageUploader = MediaUploader

/* -------------------------------------------------------------------------
 * Gallery — several assets for a single record
 * ---------------------------------------------------------------------- */

export function GalleryUploader({
  value,
  onChange,
  folder,
  kind = 'media',
}: {
  value: { url: string; alt: string }[]
  onChange: (value: { url: string; alt: string }[]) => void
  folder: string
  kind?: UploadKind
}) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    setDone(0)

    try {
      const picked = Array.from(files)

      // Settled rather than all: one rejected file must not discard the assets
      // that uploaded alongside it — those are already stored, and throwing
      // them away here would strand them as orphans.
      const results = await Promise.allSettled(
        picked.map(async (file) => {
          const invalid = validateUpload(file, kind)
          if (invalid) throw new Error(`${file.name}: ${invalid.error}`)
          const uploaded = await api.upload(file, { folder, kind })
          setDone((n) => n + 1)
          return uploaded
        })
      )

      const uploaded = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => ({ url: r.value.url, alt: '' }))

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded])
        toast.success(`${uploaded.length} file(s) added.`)
      }

      const failures = results.filter((r) => r.status === 'rejected')
      for (const failure of failures.slice(0, 3)) {
        const reason = (failure as PromiseRejectedResult).reason
        toast.error(reason instanceof Error ? reason.message : 'Upload failed.')
      }
      if (failures.length > 3) {
        toast.error(`${failures.length - 3} more file(s) failed to upload.`)
      }
    } finally {
      setBusy(false)
      setDone(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {value.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="rounded-lg border border-admin-border overflow-hidden"
            >
              <div className="aspect-video bg-admin-bg">
                {isVideoUrl(item.url) ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover bg-black"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element -- small
                     admin thumbnail, may be a remote Blob URL or a GIF. */
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-2 space-y-2">
                <input
                  value={item.alt}
                  onChange={(e) => {
                    const next = [...value]
                    next[index] = { ...item, alt: e.target.value }
                    onChange(next)
                  }}
                  placeholder="Alt text"
                  aria-label={`Alt text for item ${index + 1}`}
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
        {busy ? `Uploading… ${done} done` : '+ Add images or video'}
      </button>

      <p className="text-xs text-admin-muted mt-1.5">{describeAccepted(kind)}</p>

      <input
        ref={inputRef}
        type="file"
        accept={acceptFor(kind)}
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  )
}
