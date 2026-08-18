'use client'

import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TbX } from 'react-icons/tb'

/**
 * Accessible dialog used for every create/edit form in the admin panel.
 * Locks background scroll, closes on Escape or backdrop click, restores focus
 * to whatever opened it, and keeps Tab inside the dialog while open.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the first meaningful control once the open animation starts.
    const focusTimer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button:not([data-modal-close])'
      )
      focusable?.focus()
    }, 50)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key !== 'Tab' || !panelRef.current) return

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)

      if (focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  const maxWidth = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={`relative w-full ${maxWidth} bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-admin-border flex flex-col max-h-[92vh] sm:max-h-[88vh]`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-start justify-between gap-4 px-5 sm:px-7 py-5 border-b border-admin-border">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-bold text-admin-ink truncate">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-sm text-admin-muted mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                data-modal-close
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 p-2 -m-2 rounded-lg text-admin-muted hover:text-admin-ink hover:bg-admin-bg transition-colors"
              >
                <TbX size={20} />
              </button>
            </header>

            <div className="overflow-y-auto admin-scroll px-5 sm:px-7 py-6 flex-1">{children}</div>

            {footer && (
              <footer className="px-5 sm:px-7 py-4 border-t border-admin-border bg-admin-bg rounded-b-none sm:rounded-b-xl">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
