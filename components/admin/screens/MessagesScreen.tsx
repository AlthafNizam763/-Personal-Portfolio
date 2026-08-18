'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  TbSearch,
  TbTrash,
  TbArchive,
  TbMailOpened,
  TbMail,
  TbChevronLeft,
  TbChevronRight,
  TbRefresh,
  TbExternalLink,
  TbWorld,
} from 'react-icons/tb'
import { api, buildQuery } from '@/lib/api-client'
import { formatDateTime, relativeTime, truncate } from '@/lib/utils'
import Modal from '../Modal'
import ConfirmDialog from '../ConfirmDialog'
import { useToast } from '../Toast'
import type { MessageDTO } from '@/lib/types'

type Tab = 'inbox' | 'unread' | 'archived'

export default function MessagesScreen() {
  const toast = useToast()

  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('inbox')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [selected, setSelected] = useState<MessageDTO | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MessageDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const requestId = useRef(0)

  const load = useCallback(async () => {
    const current = ++requestId.current
    setLoading(true)
    setError(null)

    try {
      // The three tabs are just different filters on the same endpoint.
      const filters =
        tab === 'unread'
          ? { read: 'false', archived: 'false' }
          : tab === 'archived'
            ? { archived: 'true' }
            : { archived: 'false' }

      const query = buildQuery({
        search: debouncedSearch,
        sort: 'createdAt',
        dir: 'desc',
        page,
        pageSize,
        ...filters,
      })

      const { data, meta } = await api.get<{ items: MessageDTO[] }>(
        `/api/admin/messages${query}`
      )

      if (current !== requestId.current) return
      setMessages(data.items)
      setTotal(meta?.total ?? data.items.length)
      setTotalPages(meta?.totalPages ?? 1)
    } catch (err) {
      if (current !== requestId.current) return
      setError(err instanceof Error ? err.message : 'Could not load messages.')
    } finally {
      if (current === requestId.current) setLoading(false)
    }
  }, [tab, debouncedSearch, page])

  useEffect(() => {
    void load()
  }, [load])

  const patch = async (message: MessageDTO, changes: Partial<MessageDTO>) => {
    setMessages((current) =>
      current.map((m) => (m.id === message.id ? { ...m, ...changes } : m))
    )
    try {
      await api.patch(`/api/admin/messages/${message.id}`, changes)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the message.')
      await load()
    }
  }

  const open = (message: MessageDTO) => {
    setSelected(message)
    // Opening a message marks it read, the way an email client would.
    if (!message.read) void patch(message, { read: true })
  }

  const toggleArchive = async (message: MessageDTO) => {
    const archived = !message.archived
    await patch(message, { archived })
    toast.success(archived ? 'Message archived.' : 'Message restored to inbox.')
    if (selected?.id === message.id) setSelected(null)
    await load()
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.del(`/api/admin/messages/${pendingDelete.id}`)
      toast.success('Message deleted.')
      setPendingDelete(null)
      setSelected(null)
      if (messages.length === 1 && page > 1) setPage((p) => p - 1)
      else await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete the message.')
    } finally {
      setDeleting(false)
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'inbox', label: 'Inbox' },
    { key: 'unread', label: 'Unread' },
    { key: 'archived', label: 'Archived' },
  ]

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-admin-ink">Contact Messages</h1>
        <p className="text-sm text-admin-muted mt-1 max-w-2xl">
          Submissions from the portfolio contact form. Opening a message marks it as read.
        </p>
      </header>

      {/* ---- toolbar ---- */}
      <div className="bg-white border border-admin-border rounded-xl p-3 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div
            className="inline-flex rounded-lg border border-admin-border p-0.5 bg-admin-bg self-start"
            role="tablist"
            aria-label="Message folders"
          >
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key)
                  setPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === key ? 'bg-white text-admin-ink shadow-sm' : 'text-admin-muted hover:text-admin-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <TbSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or message…"
              aria-label="Search messages"
              className="w-full rounded-lg border border-admin-border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
            />
          </div>

          <button
            type="button"
            onClick={() => void load()}
            aria-label="Refresh messages"
            className="rounded-lg border border-admin-border px-3 py-2.5 text-admin-muted hover:text-admin-ink hover:bg-admin-bg transition-colors self-start"
          >
            <TbRefresh size={18} />
          </button>
        </div>
      </div>

      {/* ---- list ---- */}
      <div className="bg-white border border-admin-border rounded-xl overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="p-4 space-y-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-admin-bg animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <TbMail size={32} className="mx-auto text-admin-muted mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-admin-ink">
              {debouncedSearch ? 'No matching messages' : `No ${tab === 'archived' ? 'archived ' : ''}messages`}
            </p>
            <p className="text-sm text-admin-muted mt-1">
              {debouncedSearch
                ? 'Try a different search.'
                : 'Messages sent through the contact form will appear here.'}
            </p>
          </div>
        ) : (
          <ul className={loading ? 'opacity-60 transition-opacity' : ''}>
            {messages.map((message) => (
              <li
                key={message.id}
                className="border-b border-admin-border last:border-0 hover:bg-admin-bg/60 transition-colors"
              >
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => open(message)}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <span
                      className={`mt-2 w-2 h-2 rounded-full shrink-0 ${
                        message.read ? 'bg-transparent' : 'bg-black'
                      }`}
                      aria-label={message.read ? 'Read' : 'Unread'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span
                          className={`text-sm text-admin-ink ${
                            message.read ? 'font-medium' : 'font-bold'
                          }`}
                        >
                          {message.name}
                        </span>
                        <span className="text-xs text-admin-muted truncate">{message.email}</span>
                      </span>
                      <span className="block text-sm text-admin-muted mt-0.5">
                        {truncate(message.message, 120)}
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-admin-muted whitespace-nowrap mr-1 hidden sm:block">
                      {relativeTime(message.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void patch(message, { read: !message.read })}
                      aria-label={message.read ? 'Mark as unread' : 'Mark as read'}
                      title={message.read ? 'Mark as unread' : 'Mark as read'}
                      className="p-2 rounded-lg text-admin-muted hover:text-admin-ink hover:bg-admin-bg transition-colors"
                    >
                      {message.read ? <TbMail size={16} /> : <TbMailOpened size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleArchive(message)}
                      aria-label={message.archived ? 'Restore to inbox' : 'Archive'}
                      title={message.archived ? 'Restore to inbox' : 'Archive'}
                      className="p-2 rounded-lg text-admin-muted hover:text-admin-ink hover:bg-admin-bg transition-colors"
                    >
                      <TbArchive size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(message)}
                      aria-label="Delete message"
                      title="Delete"
                      className="p-2 rounded-lg text-admin-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <TbTrash size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {messages.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-admin-border bg-admin-bg">
            <p className="text-xs text-admin-muted">
              Showing <strong>{(page - 1) * pageSize + 1}</strong>–
              <strong>{Math.min(page * pageSize, total)}</strong> of <strong>{total}</strong>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg border border-admin-border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-admin-bg"
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
                className="p-1.5 rounded-lg border border-admin-border bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-admin-bg"
              >
                <TbChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- detail ---- */}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected ? formatDateTime(selected.createdAt) : undefined}
        size="md"
        footer={
          selected && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => void toggleArchive(selected)}
                className="px-4 py-2.5 rounded-lg border border-admin-border bg-white text-sm font-semibold text-admin-ink hover:bg-admin-bg transition-colors"
              >
                {selected.archived ? 'Restore to inbox' : 'Archive'}
              </button>
              <a
                href={`mailto:${selected.email}?subject=${encodeURIComponent(
                  'Re: your message from my portfolio'
                )}`}
                className="px-5 py-2.5 rounded-lg bg-black text-sm font-semibold text-white hover:bg-admin-ink transition-colors inline-flex items-center justify-center gap-2"
              >
                Reply by email <TbExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-semibold text-admin-muted">Email</dt>
              <dd>
                <a
                  href={`mailto:${selected.email}`}
                  className="text-admin-ink underline underline-offset-2 break-all"
                >
                  {selected.email}
                </a>
              </dd>

              {selected.website && (
                <>
                  <dt className="font-semibold text-admin-muted">Website</dt>
                  <dd className="flex items-center gap-1.5 min-w-0">
                    <TbWorld size={14} className="text-admin-muted shrink-0" aria-hidden="true" />
                    <a
                      href={
                        /^https?:\/\//i.test(selected.website)
                          ? selected.website
                          : `https://${selected.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-admin-ink underline underline-offset-2 truncate"
                    >
                      {selected.website}
                    </a>
                  </dd>
                </>
              )}

              <dt className="font-semibold text-admin-muted">Received</dt>
              <dd className="text-admin-ink">{formatDateTime(selected.createdAt)} UTC</dd>
            </dl>

            <div className="rounded-lg border border-admin-border bg-admin-bg p-4">
              <p className="text-sm text-admin-ink leading-6 whitespace-pre-wrap break-words">
                {selected.message}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this message?"
        busy={deleting}
        message={
          <>
            The message from{' '}
            <strong className="font-semibold">{pendingDelete?.name}</strong> will be permanently
            removed. This cannot be undone.
          </>
        }
        confirmLabel="Delete message"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
