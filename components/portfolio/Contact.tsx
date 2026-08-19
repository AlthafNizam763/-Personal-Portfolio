'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { IoMdMail } from 'react-icons/io'
import { FaPhone } from 'react-icons/fa6'
import SocialIcons from './SocialIcons'
import ErrorPopup from './ErrorPopup'
import RoachSquashOverlay from './RoachSquashOverlay'
import SuccessPopup from './SuccessPopup'
import type { ProfileDTO, SocialLinkDTO } from '@/lib/types'

/**
 * Migrated from src/components/Contact.jsx.
 *
 * Layout, classes and animations are unchanged. The one behavioural change:
 * the original always faked a "500 Internal Server Error" popup and reloaded
 * the page. The form now posts to /api/contact and the submission appears in
 * Admin -> Messages. The error popup is kept for genuine server failures, but
 * it no longer reloads (that would discard whatever the visitor typed).
 *
 * A confirmed submission also plays a short cartoon interstitial
 * (RoachSquashOverlay) before SuccessPopup confirms the send. Both are
 * strictly downstream of a 2xx response — a failed or rejected submission
 * still just sets the inline message or the error popup, exactly as before.
 */
type Status = 'idle' | 'submitting' | 'success' | 'error'

const SUCCESS_MESSAGE = "Thanks for reaching out — I'll get back to you soon."

export default function Contact({
  profile,
  socialLinks,
}: {
  profile: ProfileDTO
  socialLinks: SocialLinkDTO[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const prefersReducedMotion = useReducedMotion()

  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  // Bumped on every accepted submission: it both starts the interstitial and
  // keys it, so a second message replays the gag from the top.
  const [squashRun, setSquashRun] = useState(0)
  const [playingSquash, setPlayingSquash] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  // The section fades itself in on scroll, and an ancestor's opacity would
  // drag a nested full-screen overlay down with it — so both overlays are
  // portalled to <body> instead.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // The pan has landed — hand off to the confirmation dialog.
  const revealSuccess = useCallback(() => {
    setPlayingSquash(false)
    setShowSuccessPopup(true)
  }, [])

  const celebrate = () => {
    if (prefersReducedMotion) {
      setShowSuccessPopup(true)
      return
    }
    setPlayingSquash(true)
    setSquashRun((run) => run + 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    setStatus('submitting')
    setMessage('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          website: String(data.get('website') ?? ''),
          message: String(data.get('message') ?? ''),
          company: String(data.get('company') ?? ''), // honeypot
        }),
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.ok) {
        setStatus('success')
        setMessage(SUCCESS_MESSAGE)
        form.reset()
        celebrate()
        return
      }

      if (res.status >= 500) {
        setStatus('error')
        setShowErrorPopup(true)
        return
      }

      setStatus('error')
      setMessage(json?.error ?? 'Please check the form and try again.')
    } catch {
      setStatus('error')
      setMessage('Network error — please check your connection and try again.')
    }
  }

  const inputClass =
    'border-2 px-5 py-3 border-black rounded placeholder:text-[#71717A] text-sm w-full'

  // Stays locked through the interstitial so the form cannot be fired twice
  // between the response landing and the confirmation appearing.
  const busy = status === 'submitting' || playingSquash

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="lg:my-16 lg:px-28 my-8 px-5"
      id="contact"
      aria-label="Contact"
    >
      <motion.h2
        initial={{ y: -50, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl lg:text-4xl text-center"
      >
        Contact <span className="font-extrabold">Me</span>
      </motion.h2>

      <div className="flex justify-between items-center mt-8 lg:mt-16 flex-col lg:flex-row">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:w-[40%]"
        >
          <form className="w-full space-y-3 lg:space-y-5" onSubmit={handleSubmit} noValidate={false}>
            <input
              className={inputClass}
              type="text"
              name="name"
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="name"
              required
            />
            <input
              className={inputClass}
              type="email"
              name="email"
              placeholder="Email"
              aria-label="Your email address"
              autoComplete="email"
              required
            />
            <input
              className={inputClass}
              type="text"
              name="website"
              placeholder="Your website (If exists)"
              aria-label="Your website"
              autoComplete="url"
            />
            <textarea
              className="resize-none border-2 px-5 py-3 h-32 border-black placeholder:text-[#71717A]  rounded text-sm w-full"
              name="message"
              placeholder="How can I help?*"
              aria-label="Your message"
              required
            />

            {/* Honeypot: hidden from humans, irresistible to naive bots. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="flex justify-between gap-3 lg:gap-5 flex-col lg:flex-row"
            >
              <motion.button
                whileHover={{ scale: busy ? 1 : 1.05 }}
                type="submit"
                disabled={busy}
                className="bg-black justify-center w-fit lg:w-auto lg:flex-1 hover:shadow-lg text-white px-3 py-2 rounded flex items-center gap-x-3 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? 'Sending…' : 'Get In Touch'}
              </motion.button>

              <SocialIcons links={socialLinks} />
            </motion.div>

            {/* Live region so screen readers announce the result. Errors stay
                inline exactly as before; the success wording is announced but
                left invisible, since SuccessPopup now carries it visually. */}
            <p
              role="status"
              aria-live="polite"
              className={`text-sm font-mono ${
                status === 'success' ? 'text-black' : 'text-red-600'
              } ${message && status !== 'success' ? '' : 'sr-only'}`}
            >
              {message}
            </p>
          </form>
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:w-1/2"
        >
          <div className="font-extrabold text-2xl lg:text-5xl mt-5 lg:mt-0 space-y-1 lg:space-y-3">
            <p>
              Let&apos;s <span className="text-white text-stroke-black">talk</span> for
            </p>
            <p>Something special</p>
          </div>

          <p className="text-[#71717A] text-sm/6 lg:text-base mt-3 lg:mt-6 font-mono">
            I seek to push the limits of creativity to create high-engaging, user-friendly, and
            memorable interactive experiences.
          </p>

          <div className="font-semibold text-sm lg:text-xl flex flex-col mt-6 gap-2 lg:gap-4">
            {profile.email && (
              <motion.a
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 group"
                href={`mailto:${profile.email}`}
              >
                <span className="border-2 transition-all border-transparent group-hover:border-black rounded-full p-1">
                  <IoMdMail className="w-4 h-4 lg:w-5 lg:h-5" aria-hidden="true" />
                </span>
                {profile.email}
              </motion.a>
            )}

            {profile.phone && (
              <motion.a
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 group"
                href={`tel:${profile.phone.replace(/\s+/g, '')}`}
              >
                <span className="border-2 transition-all border-transparent group-hover:border-black rounded-full p-[5px]">
                  <FaPhone className="w-3 h-3 lg:w-4 lg:h-4" aria-hidden="true" />
                </span>
                {profile.phone}
              </motion.a>
            )}
            {/*
              `profile.location` is intentionally not rendered here: the
              original contact block listed only email and phone. The value is
              still used — it feeds the JSON-LD structured data in app/page.tsx.
            */}
          </div>
        </motion.div>
      </div>

      {showErrorPopup && (
        <ErrorPopup
          message="I apologize, but there seems to be an issue."
          onClose={() => setShowErrorPopup(false)}
        />
      )}

      {mounted &&
        createPortal(
          <>
            {/* Cockroach vs. flyswatter. Keyed by `squashRun` so it replays
                cleanly on a second submission (and re-rolls which corner the
                roach comes from); it hides itself once it has faded out. */}
            {squashRun > 0 && <RoachSquashOverlay key={squashRun} onReveal={revealSuccess} />}

            <AnimatePresence>
              {showSuccessPopup && (
                <SuccessPopup
                  message={SUCCESS_MESSAGE}
                  onClose={() => setShowSuccessPopup(false)}
                />
              )}
            </AnimatePresence>
          </>,
          document.body
        )}
    </motion.section>
  )
}
