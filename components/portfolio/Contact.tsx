'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { IoMdMail } from 'react-icons/io'
import { FaPhone } from 'react-icons/fa6'
import SocialIcons from './SocialIcons'
import ErrorPopup from './ErrorPopup'
import type { ProfileDTO, SocialLinkDTO } from '@/lib/types'

/**
 * Migrated from src/components/Contact.jsx.
 *
 * Layout, classes and animations are unchanged. The one behavioural change:
 * the original always faked a "500 Internal Server Error" popup and reloaded
 * the page. The form now posts to /api/contact and the submission appears in
 * Admin -> Messages. The error popup is kept for genuine server failures, but
 * it no longer reloads (that would discard whatever the visitor typed).
 */
type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function Contact({
  profile,
  socialLinks,
}: {
  profile: ProfileDTO
  socialLinks: SocialLinkDTO[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [showErrorPopup, setShowErrorPopup] = useState(false)

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
        setMessage("Thanks for reaching out — I'll get back to you soon.")
        form.reset()
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
                whileHover={{ scale: status === 'submitting' ? 1 : 1.05 }}
                type="submit"
                disabled={status === 'submitting'}
                className="bg-black justify-center w-fit lg:w-auto lg:flex-1 hover:shadow-lg text-white px-3 py-2 rounded flex items-center gap-x-3 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? 'Sending…' : 'Get In Touch'}
              </motion.button>

              <SocialIcons links={socialLinks} />
            </motion.div>

            {/* Live region so screen readers announce the result. */}
            <p
              role="status"
              aria-live="polite"
              className={`text-sm font-mono ${
                status === 'success' ? 'text-black' : 'text-red-600'
              } ${message ? '' : 'sr-only'}`}
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
    </motion.section>
  )
}
