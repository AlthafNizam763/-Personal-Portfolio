'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * Migrated from src/utils/ErrorPopup.jsx, keeping the gif and the error sound.
 *
 * The original reloaded the page after 4 seconds. Now that the contact form
 * actually submits, a reload would throw away whatever the visitor typed, so
 * the popup is dismissible instead (click the backdrop, press Escape, or use
 * the close button).
 */
export default function ErrorPopup({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Autoplay is blocked until the user has interacted with the page; since
    // this only appears after a form submit, it normally succeeds.
    audioRef.current?.play().catch(() => {})
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-popup-title"
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center relative"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={audioRef} src="/assets/error.mp3" preload="auto" />

        {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF;
            the optimizer would strip the animation. */}
        <img src="/assets/error.gif" alt="" className="mx-auto mb-4" />

        <h2 id="error-popup-title" className="text-xl font-semibold mb-2">
          500 Internal Server Error
        </h2>
        <p className="text-sm text-gray-700">Your message could not be delivered.</p>
        <p className="text-xs text-gray-400 mt-1">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 bg-black text-white px-4 py-2 rounded text-sm font-medium"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
