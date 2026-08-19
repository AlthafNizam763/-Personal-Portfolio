import type { ReactNode } from 'react'

/**
 * Declarative description of an admin screen.
 *
 * Every management page (skills, projects, certifications, …) is expressed as
 * one of these objects and rendered by <ResourceManager>. That keeps the list,
 * toolbar, form, validation wiring, pagination and delete confirmation in a
 * single implementation rather than repeated nine times.
 */

export type AdminFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'range'
  | 'date'
  | 'switch'
  | 'select'
  | 'tags'
  | 'icon'
  | 'image'
  | 'document'
  | 'video'
  | 'media'
  | 'paragraphs'
  | 'gallery'

export interface AdminField {
  name: string
  label: string
  type: AdminFieldType
  placeholder?: string
  help?: string
  required?: boolean
  options?: { label: string; value: string }[]
  /** Render across both columns of the form grid. */
  full?: boolean
  /** Upload destination folder, for the file-ish field types. */
  uploadFolder?: string
  /** For `gallery`: what the picker accepts. Defaults to images and video. */
  uploadKind?: 'image' | 'video' | 'media'
  /** Tailwind aspect class for image previews. */
  aspect?: string
  rows?: number
  min?: number
  max?: number
  step?: number
  /** Hide conditionally, e.g. "End date" once "Currently working here" is on. */
  hiddenWhen?: (values: Record<string, unknown>) => boolean
}

export interface AdminColumn<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  /** Applied to both the header cell and the body cells. */
  className?: string
  /** Field name to sort by; omit to make the column non-sortable. */
  sortKey?: string
}

export interface AdminFilter {
  key: string
  label: string
  /** `boolean` renders Yes/No/All; `facet` pulls its options from the API. */
  type: 'boolean' | 'facet'
  trueLabel?: string
  falseLabel?: string
}

export interface AdminResourceConfig<T> {
  /** API slug — must match a key in lib/resources.ts. */
  resource: string
  title: string
  description: string
  /** Used in buttons and confirmation copy, e.g. "Add skill". */
  singular: string
  icon?: ReactNode
  fields: AdminField[]
  columns: AdminColumn<T>[]
  /** Blank record used when opening the "create" form. */
  defaults: Record<string, unknown>
  /** Enables the up/down reorder controls and the order column. */
  orderable?: boolean
  searchPlaceholder?: string
  filters?: AdminFilter[]
  sortOptions?: { label: string; value: string; dir: 'asc' | 'desc' }[]
  /** Human label for a row, used in the delete confirmation. */
  labelOf: (row: T) => string
  /** Optional extra note rendered above the table. */
  note?: ReactNode
}

/** Every record the admin lists has at least these. */
export interface AdminRecord {
  id: string
  enabled?: boolean
  order?: number
  [key: string]: unknown
}
