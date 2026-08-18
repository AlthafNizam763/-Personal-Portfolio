'use client'

import { useState } from 'react'
import { TbAlertTriangle } from 'react-icons/tb'
import Modal from './Modal'

/**
 * Confirmation step shown before any destructive action.
 *
 * `requireTypedConfirmation` adds a "type the name to confirm" gate, used for
 * bulk deletes where a mis-click is expensive.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  requireTypedConfirmation,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /** When set, the confirm button unlocks only once this exact text is typed. */
  requireTypedConfirmation?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const [typed, setTyped] = useState('')

  const locked = Boolean(requireTypedConfirmation) && typed !== requireTypedConfirmation

  const handleCancel = () => {
    setTyped('')
    onCancel()
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="px-4 py-2.5 rounded-lg border border-admin-border bg-white text-sm font-semibold text-admin-ink hover:bg-admin-bg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || locked}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-admin-ink'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex gap-4">
        {destructive && (
          <span className="shrink-0 w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <TbAlertTriangle size={20} aria-hidden="true" />
          </span>
        )}
        <div className="text-sm text-admin-ink leading-6">
          {message}

          {requireTypedConfirmation && (
            <label className="block mt-4">
              <span className="text-xs font-semibold text-admin-muted">
                Type <span className="font-mono text-admin-ink">{requireTypedConfirmation}</span> to
                confirm
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-admin-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                autoComplete="off"
              />
            </label>
          )}
        </div>
      </div>
    </Modal>
  )
}
