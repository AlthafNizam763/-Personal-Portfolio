'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  TbPlus,
  TbSearch,
  TbEdit,
  TbTrash,
  TbArrowUp,
  TbArrowDown,
  TbRefresh,
  TbChevronLeft,
  TbChevronRight,
  TbFilter,
} from 'react-icons/tb'
import { api, ApiError, buildQuery } from '@/lib/api-client'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import ResourceForm from './ResourceForm'
import { useToast } from './Toast'
import { Switch } from './FormFields'
import type { AdminRecord, AdminResourceConfig } from './types'

/**
 * Generic CRUD screen: search, filter, sort, paginate, create, edit,
 * enable/disable, reorder and delete — driven entirely by an
 * `AdminResourceConfig`.
 */
export default function ResourceManager<T extends AdminRecord>({
  config,
}: {
  config: AdminResourceConfig<T>
}) {
  const toast = useToast()

  const [items, setItems] = useState<T[]>([])
  const [facets, setFacets] = useState<Record<string, string[]>>({})
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // --- query state ---
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sort, setSort] = useState(config.orderable ? 'order' : '')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showFilters, setShowFilters] = useState(false)

  // --- editor state ---
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)

  // --- delete state ---
  const [pendingDelete, setPendingDelete] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  // Guards against a slow earlier response overwriting a newer one.
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setLoadError(null)

    try {
      const query = buildQuery({
        search: debouncedSearch,
        sort: sort || undefined,
        dir,
        page,
        pageSize,
        ...filters,
      })

      const { data, meta } = await api.get<{ items: T[]; facets: Record<string, string[]> }>(
        `/api/admin/${config.resource}${query}`
      )

      if (currentRequest !== requestId.current) return

      setItems(data.items)
      setFacets(data.facets ?? {})
      setTotal(meta?.total ?? data.items.length)
      setTotalPages(meta?.totalPages ?? 1)
    } catch (err) {
      if (currentRequest !== requestId.current) return
      setLoadError(err instanceof Error ? err.message : 'Could not load records.')
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [config.resource, debouncedSearch, sort, dir, page, pageSize, filters])

  useEffect(() => {
    void load()
  }, [load])

  /* ---------------------------------------------------------------- editor */

  const openCreate = () => {
    setEditing(null)
    setValues({ ...config.defaults })
    setErrors({})
    setEditorOpen(true)
  }

  const openEdit = (row: T) => {
    setEditing(row)
    // Start from defaults so a field added to the schema after this record was
    // created still renders with a sane value instead of `undefined`.
    setValues({ ...config.defaults, ...row })
    setErrors({})
    setEditorOpen(true)
  }

  const handleFieldChange = (name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setErrors({})

    // `id` is a client-side concern; the server assigns and owns it.
    const { id: _id, ...payload } = values as Record<string, unknown> & { id?: string }
    void _id

    try {
      if (editing) {
        await api.patch(`/api/admin/${config.resource}/${editing.id}`, payload)
        toast.success(`${config.singular} updated.`)
      } else {
        await api.post(`/api/admin/${config.resource}`, payload)
        toast.success(`${config.singular} created.`)
      }

      setEditorOpen(false)
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors)
        toast.error(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Could not save.')
      }
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------------------------------------------- delete */

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)

    try {
      await api.del(`/api/admin/${config.resource}/${pendingDelete.id}`)
      toast.success(`${config.singular} deleted.`)
      setPendingDelete(null)

      // Step back a page if the last row on it was just removed.
      if (items.length === 1 && page > 1) setPage((p) => p - 1)
      else await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete.')
    } finally {
      setDeleting(false)
    }
  }

  /* ------------------------------------------------------- inline toggling */

  const toggleEnabled = async (row: T) => {
    const next = !row.enabled
    // Optimistic: flip immediately, roll back if the request fails.
    setItems((current) =>
      current.map((item) => (item.id === row.id ? { ...item, enabled: next } : item))
    )

    try {
      await api.patch(`/api/admin/${config.resource}/${row.id}`, { enabled: next })
      toast.success(next ? `${config.singular} enabled.` : `${config.singular} disabled.`)
    } catch (err) {
      setItems((current) =>
        current.map((item) => (item.id === row.id ? { ...item, enabled: !next } : item))
      )
      toast.error(err instanceof Error ? err.message : 'Could not update.')
    }
  }

  /* ------------------------------------------------------------- reordering */

  const canReorder = Boolean(config.orderable) && sort === 'order' && dir === 'asc' && !debouncedSearch

  const move = async (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return

    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved!)
    setItems(reordered)

    try {
      await api.post(`/api/admin/${config.resource}/reorder`, {
        ids: reordered.map((item) => item.id),
        offset: (page - 1) * pageSize,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reorder.')
      await load()
    }
  }

  /* ------------------------------------------------------------------ view */

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const sortOptions = useMemo(
    () =>
      config.sortOptions ??
      [
        ...(config.orderable
          ? [{ label: 'Display order', value: 'order', dir: 'asc' as const }]
          : []),
        { label: 'Newest first', value: 'createdAt', dir: 'desc' as const },
        { label: 'Oldest first', value: 'createdAt', dir: 'asc' as const },
      ],
    [config.sortOptions, config.orderable]
  )

  const columnCount = config.columns.length + (config.orderable ? 1 : 0) + 2

  return (
    <div>
      {/* ---- header ---- */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-ink">{config.title}</h1>
          <p className="text-sm text-admin-muted mt-1 max-w-2xl">{config.description}</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors"
        >
          <TbPlus size={18} aria-hidden="true" /> Add {config.singular.toLowerCase()}
        </button>
      </header>

      {config.note && <div className="mb-5">{config.note}</div>}

      {/* ---- toolbar ---- */}
      <div className="bg-white border border-admin-border rounded-xl p-3 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <TbSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={config.searchPlaceholder ?? `Search ${config.title.toLowerCase()}…`}
              aria-label={`Search ${config.title}`}
              className="w-full rounded-lg border border-admin-border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={`${sort}:${dir}`}
              onChange={(e) => {
                const [nextSort, nextDir] = e.target.value.split(':')
                setSort(nextSort ?? '')
                setDir((nextDir as 'asc' | 'desc') ?? 'asc')
                setPage(1)
              }}
              aria-label="Sort records"
              className="rounded-lg border border-admin-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-black"
            >
              {sortOptions.map((option) => (
                <option key={`${option.value}:${option.dir}`} value={`${option.value}:${option.dir}`}>
                  {option.label}
                </option>
              ))}
            </select>

            {config.filters && config.filters.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  activeFilterCount > 0
                    ? 'border-black bg-black text-white'
                    : 'border-admin-border text-admin-ink hover:bg-admin-bg'
                }`}
              >
                <TbFilter size={16} aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => void load()}
              aria-label="Refresh list"
              className="rounded-lg border border-admin-border px-3 py-2.5 text-admin-muted hover:text-admin-ink hover:bg-admin-bg transition-colors"
            >
              <TbRefresh size={18} />
            </button>
          </div>
        </div>

        {showFilters && config.filters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-admin-border">
            {config.filters.map((filter) => (
              <label key={filter.key} className="text-sm">
                <span className="block text-xs font-semibold text-admin-muted mb-1">
                  {filter.label}
                </span>
                <select
                  value={filters[filter.key] ?? ''}
                  onChange={(e) => {
                    setFilters((current) => ({ ...current, [filter.key]: e.target.value }))
                    setPage(1)
                  }}
                  className="rounded-lg border border-admin-border px-3 py-2 text-sm bg-white focus:outline-none focus:border-black min-w-[10rem]"
                >
                  <option value="">All</option>
                  {filter.type === 'boolean' ? (
                    <>
                      <option value="true">{filter.trueLabel ?? 'Yes'}</option>
                      <option value="false">{filter.falseLabel ?? 'No'}</option>
                    </>
                  ) : (
                    (facets[filter.key] ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  )}
                </select>
              </label>
            ))}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilters({})
                  setPage(1)
                }}
                className="self-end text-sm font-semibold text-admin-muted hover:text-admin-ink underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---- table ---- */}
      <div className="bg-white border border-admin-border rounded-xl overflow-hidden">
        {loadError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : loading && items.length === 0 ? (
          <TableSkeleton columns={columnCount} />
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-admin-ink">
              {debouncedSearch || activeFilterCount > 0
                ? 'No matching records'
                : `No ${config.title.toLowerCase()} yet`}
            </p>
            <p className="text-sm text-admin-muted mt-1">
              {debouncedSearch || activeFilterCount > 0
                ? 'Try a different search or clear the filters.'
                : `Add your first ${config.singular.toLowerCase()} to see it on the portfolio.`}
            </p>
            {!debouncedSearch && activeFilterCount === 0 && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-admin-ink transition-colors"
              >
                <TbPlus size={18} /> Add {config.singular.toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto admin-scroll">
            <table className="w-full text-sm min-w-[40rem]">
              <thead>
                <tr className="border-b border-admin-border bg-admin-bg text-left">
                  {config.orderable && (
                    <th scope="col" className="w-16 px-3 py-3 font-semibold text-admin-muted">
                      <span className="sr-only">Reorder</span>#
                    </th>
                  )}
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-4 py-3 font-semibold text-admin-muted ${column.className ?? ''}`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-semibold text-admin-muted w-28">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-admin-muted w-24 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className={loading ? 'opacity-60 transition-opacity' : ''}>
                {items.map((row, index) => (
                  <tr
                    key={row.id}
                    className="border-b border-admin-border last:border-0 hover:bg-admin-bg/60 transition-colors"
                  >
                    {config.orderable && (
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-1">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => void move(index, -1)}
                              disabled={!canReorder || index === 0}
                              title={
                                canReorder
                                  ? 'Move up'
                                  : 'Sort by display order (and clear search) to reorder'
                              }
                              aria-label="Move up"
                              className="text-admin-muted hover:text-admin-ink disabled:opacity-25 disabled:cursor-not-allowed"
                            >
                              <TbArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void move(index, 1)}
                              disabled={!canReorder || index === items.length - 1}
                              title={
                                canReorder
                                  ? 'Move down'
                                  : 'Sort by display order (and clear search) to reorder'
                              }
                              aria-label="Move down"
                              className="text-admin-muted hover:text-admin-ink disabled:opacity-25 disabled:cursor-not-allowed"
                            >
                              <TbArrowDown size={14} />
                            </button>
                          </div>
                          <span className="text-xs text-admin-muted tabular-nums">
                            {(page - 1) * pageSize + index + 1}
                          </span>
                        </div>
                      </td>
                    )}

                    {config.columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 align-middle text-admin-ink ${column.className ?? ''}`}
                      >
                        {column.render ? column.render(row) : String(row[column.key] ?? '—')}
                      </td>
                    ))}

                    <td className="px-4 py-3 align-middle">
                      {typeof row.enabled === 'boolean' ? (
                        <Switch
                          checked={row.enabled}
                          onChange={() => void toggleEnabled(row)}
                          label={row.enabled ? 'Visible' : 'Hidden'}
                        />
                      ) : (
                        <span className="text-admin-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          aria-label={`Edit ${config.labelOf(row)}`}
                          className="p-2 rounded-lg text-admin-muted hover:text-admin-ink hover:bg-admin-bg transition-colors"
                        >
                          <TbEdit size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row)}
                          aria-label={`Delete ${config.labelOf(row)}`}
                          className="p-2 rounded-lg text-admin-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TbTrash size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- pagination ---- */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-admin-border bg-admin-bg">
            <p className="text-xs text-admin-muted">
              Showing <strong>{(page - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong>
            </p>

            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                aria-label="Rows per page"
                className="rounded-lg border border-admin-border px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-black"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                  className="p-1.5 rounded-lg border border-admin-border bg-white text-admin-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-admin-bg"
                >
                  <TbChevronLeft size={16} />
                </button>
                <span className="text-xs text-admin-muted px-2 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="p-1.5 rounded-lg border border-admin-border bg-white text-admin-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-admin-bg"
                >
                  <TbChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- create / edit modal ---- */}
      <Modal
        open={editorOpen}
        onClose={() => !saving && setEditorOpen(false)}
        title={editing ? `Edit ${config.singular.toLowerCase()}` : `Add ${config.singular.toLowerCase()}`}
        description={
          editing
            ? 'Changes appear on the public portfolio as soon as you save.'
            : `This ${config.singular.toLowerCase()} appears on the portfolio once saved and enabled.`
        }
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg border border-admin-border bg-white text-sm font-semibold text-admin-ink hover:bg-admin-bg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-black text-sm font-semibold text-white hover:bg-admin-ink transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : `Create ${config.singular.toLowerCase()}`}
            </button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSave()
          }}
        >
          <ResourceForm
            fields={config.fields}
            values={values}
            errors={errors}
            onChange={handleFieldChange}
          />
          {/* Allows Enter-to-submit without rendering a second visible button. */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            Save
          </button>
        </form>
      </Modal>

      {/* ---- delete confirmation ---- */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete this ${config.singular.toLowerCase()}?`}
        busy={deleting}
        message={
          <>
            <strong className="font-semibold">
              {pendingDelete ? config.labelOf(pendingDelete) : ''}
            </strong>{' '}
            will be permanently removed from your portfolio, along with any images uploaded for it.
            This cannot be undone.
          </>
        }
        confirmLabel={`Delete ${config.singular.toLowerCase()}`}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading records">
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="flex gap-4">
          {Array.from({ length: columns }).map((_, col) => (
            <div
              key={col}
              className="h-9 flex-1 rounded-lg bg-admin-bg relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
