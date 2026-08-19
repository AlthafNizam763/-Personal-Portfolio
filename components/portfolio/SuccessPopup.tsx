'use client'

import { useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * Confirmation dialog shown once a contact message has actually been stored —
 * it is the visual counterpart to the form's live region, and the payoff at
 * the end of RoachSquashOverlay.
 *
 * Mirrors the behaviour of the admin panel's Modal (Escape, backdrop click,
 * scroll lock, focus restore) but keeps the portfolio's own black-outline
 * styling rather than the admin design tokens.
 */
export default function SuccessPopup({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Wait for the entrance animation to start before stealing focus, so the
    // dialog does not jump into view mid-transform.
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key !== 'Tab' || !panelRef.current) return

      // Only one control in here, but keep Tab inside the dialog anyway.
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus?.()
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center px-5 bg-black/45 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-black bg-white px-6 pb-6 pt-8 text-center shadow-[0_24px_70px_-20px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 28, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft sheen along the top edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/[0.06] to-transparent"
        />

        {/* Check mark: a ring settles in, then the tick draws itself. */}
        <div className="relative mx-auto mb-5 h-16 w-16">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-black"
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: [0.7, 1.55], opacity: [0.5, 0] }}
            transition={{ delay: 0.18, duration: 0.7, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 420, damping: 18 }}
          >
            <svg viewBox="0 0 32 32" className="h-8 w-8" role="presentation">
              <motion.path
                d="M8 16.5 L14 22.5 L24 10.5"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.26, duration: 0.35, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        </div>

        <motion.h2
          id={titleId}
          className="text-2xl font-extrabold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.32, ease: 'easeOut' }}
        >
          Message sent!
        </motion.h2>

        <motion.p
          id={descriptionId}
          className="mt-2 font-mono text-sm/6 text-[#71717A]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33, duration: 0.32, ease: 'easeOut' }}
        >
          {message}
        </motion.p>

        <motion.button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded bg-black px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.32, ease: 'easeOut' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Done
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
