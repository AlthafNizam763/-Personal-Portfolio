'use client'

import {
  DateInput,
  Field,
  GalleryUploader,
  IconPicker,
  ImageUploader,
  NumberInput,
  ParagraphList,
  SelectInput,
  Switch,
  TagInput,
  TextArea,
  TextInput,
} from './FormFields'
import type { AdminField } from './types'

/**
 * Renders a form from an `AdminField[]` description.
 *
 * Used by both <ResourceManager> (inside its modal) and the single-record
 * screens (Profile, Settings), so all admin forms share one implementation of
 * layout, labelling and server-side error display.
 */
export default function ResourceForm({
  fields,
  values,
  errors,
  onChange,
}: {
  fields: AdminField[]
  values: Record<string, unknown>
  errors: Record<string, string[]>
  onChange: (name: string, value: unknown) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
      {fields.map((field) => {
        if (field.hiddenWhen?.(values)) return null

        const error = errors[field.name]
        const fieldId = `field-${field.name}`
        const span = field.full || isWideByDefault(field.type) ? 'sm:col-span-2' : ''

        // Switches carry their own label, so they skip the <Field> wrapper.
        if (field.type === 'switch') {
          return (
            <div key={field.name} className={`${span} flex items-center`}>
              <Switch
                checked={Boolean(values[field.name])}
                onChange={(checked) => onChange(field.name, checked)}
                label={field.label}
                description={field.help}
              />
            </div>
          )
        }

        return (
          <Field
            key={field.name}
            label={field.label}
            htmlFor={fieldId}
            help={field.help}
            error={error}
            required={field.required}
            className={span}
          >
            {renderControl(field, fieldId, values, error, onChange)}
          </Field>
        )
      })}
    </div>
  )
}

/** Field types that always need the full row to be usable. */
function isWideByDefault(type: AdminField['type']): boolean {
  return (
    type === 'textarea' ||
    type === 'paragraphs' ||
    type === 'icon' ||
    type === 'gallery' ||
    type === 'tags'
  )
}

function renderControl(
  field: AdminField,
  fieldId: string,
  values: Record<string, unknown>,
  error: string[] | undefined,
  onChange: (name: string, value: unknown) => void
) {
  const value = values[field.name]

  switch (field.type) {
    case 'textarea':
      return (
        <TextArea
          id={fieldId}
          value={String(value ?? '')}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'number':
      return (
        <NumberInput
          id={fieldId}
          value={Number(value ?? 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'range': {
      const numeric = Number(value ?? 0)
      return (
        <div className="flex items-center gap-4">
          <input
            id={fieldId}
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 5}
            value={numeric}
            onChange={(e) => onChange(field.name, Number(e.target.value))}
            className="flex-1 accent-black"
          />
          <output className="w-12 text-right text-sm font-semibold text-admin-ink tabular-nums">
            {numeric}%
          </output>
        </div>
      )
    }

    case 'date':
      return (
        <DateInput
          id={fieldId}
          value={(value as string | null) ?? null}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'select':
      return (
        <SelectInput
          id={fieldId}
          value={String(value ?? '')}
          options={field.options ?? []}
          placeholder={field.placeholder}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'tags':
      return (
        <TagInput
          value={Array.isArray(value) ? (value as string[]) : []}
          placeholder={field.placeholder}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'paragraphs':
      return (
        <ParagraphList
          value={Array.isArray(value) ? (value as string[]) : []}
          placeholder={field.placeholder}
          rows={field.rows}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'icon':
      return (
        <IconPicker value={String(value ?? '')} onChange={(v) => onChange(field.name, v)} />
      )

    case 'image':
    case 'document':
    case 'video':
      return (
        <ImageUploader
          value={String(value ?? '')}
          folder={field.uploadFolder ?? 'misc'}
          kind={field.type === 'image' ? 'image' : field.type}
          aspect={field.aspect}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    case 'gallery':
      return (
        <GalleryUploader
          value={Array.isArray(value) ? (value as { url: string; alt: string }[]) : []}
          folder={field.uploadFolder ?? 'misc'}
          onChange={(v) => onChange(field.name, v)}
        />
      )

    default:
      return (
        <TextInput
          id={fieldId}
          value={String(value ?? '')}
          placeholder={field.placeholder}
          error={error}
          onChange={(v) => onChange(field.name, v)}
        />
      )
  }
}
