'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TbDownload } from 'react-icons/tb'
import { HiOutlineMenu, HiX } from 'react-icons/hi'
import type { ProfileDTO, SiteSettingsDTO } from '@/lib/types'

/**
 * Migrated from src/components/Navbar.jsx with the same behaviour:
 * shadow appears once scrolled, the bar hides while scrolling down and
 * reappears on scroll up, and section links scroll with a 110px offset.
 *
 * Links and the resume file now come from the database instead of being
 * hardcoded.
 */
export default function Navbar({
  profile,
  settings,
}: {
  profile: ProfileDTO
  settings: SiteSettingsDTO
}) {
  const [hasShadow, setHasShadow] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showNavbar, setShowNavbar] = useState(true)

  // Held in a ref so the scroll listener is attached once instead of being
  // torn down and re-added on every scroll event (the original re-subscribed
  // through a `lastScrollY` dependency).
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setHasShadow(currentScrollY > 0)
      setShowNavbar(!(currentScrollY > lastScrollY.current && currentScrollY > 80))
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent the page behind the full-screen mobile menu from scrolling.
  useEffect(() => {
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const scrollToSection = useCallback((id: string) => {
    const section = document.getElementById(id)
    if (section) {
      window.scrollTo({ top: section.offsetTop - 110, behavior: 'smooth' })
    }
    setIsOpen(false)
  }, [])

  const navLinks = settings.navLinks

  const resumeButton = (labelClass: string) => (
    <>
      <span className="absolute inset-0 w-full h-full transition duration-200 ease-out transform translate-x-1 translate-y-1 bg-black group-hover:-translate-x-0 group-hover:-translate-y-0" />
      <span className="absolute inset-0 w-full h-full bg-white border-2 border-black group-hover:bg-black" />
      <span className={labelClass}>
        {profile.resumeLabel || 'Resume'} <TbDownload size={16} aria-hidden="true" />
      </span>
    </>
  )

  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: showNavbar ? 0 : -100, opacity: showNavbar ? 1 : 0.95 }}
      transition={{ duration: 0.4 }}
      className={`fixed lg:px-28 px-5 top-0 left-0 w-full z-50 bg-white p-5 transition-shadow duration-300 ${
        hasShadow ? 'shadow-md' : 'shadow-none'
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* The logo is a small inline SVG, so it stays a plain <img>:
            next/image would add a request without optimising anything. */}
        <motion.img
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scrollToSection('home')}
          className="h-9 cursor-pointer"
          src={profile.logo || '/assets/logo.svg'}
          alt={profile.name ? `${profile.name} logo` : 'Logo'}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              scrollToSection('home')
            }
          }}
        />

        <ul className="hidden lg:flex items-center gap-x-7 font-semibold">
          {navLinks.map((link) => (
            <motion.li key={link.href} className="group" whileHover={{ scale: 1.1 }}>
              <button type="button" onClick={() => scrollToSection(link.href)}>
                {link.label}
              </button>
              <motion.span
                className="w-0 transition-all duration-300 group-hover:w-full h-[2px] bg-black flex"
                layout
              />
            </motion.li>
          ))}
        </ul>

        {profile.resumeUrl ? (
          <motion.a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden relative lg:inline-block px-4 py-2 font-medium group"
          >
            {resumeButton(
              'relative text-black group-hover:text-white flex items-center gap-x-3'
            )}
          </motion.a>
        ) : (
          // Keeps the flex layout balanced when no resume is configured.
          <span className="hidden lg:block" aria-hidden="true" />
        )}

        <motion.button
          type="button"
          className="lg:hidden text-2xl"
          onClick={() => setIsOpen((v) => !v)}
          whileHover={{ scale: 1.2 }}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          {isOpen ? <HiX /> : <HiOutlineMenu />}
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-0 right-0 h-full w-full bg-white shadow"
          >
            <button
              type="button"
              className="absolute top-5 right-5 text-2xl"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <HiX />
            </button>
            <ul className="flex flex-col items-start ml-16 mt-28 h-full gap-y-6 font-semibold">
              {navLinks.map((link) => (
                <motion.li key={link.href} className="border-b" whileHover={{ scale: 1.1 }}>
                  <button type="button" onClick={() => scrollToSection(link.href)}>
                    {link.label}
                  </button>
                </motion.li>
              ))}
              {profile.resumeUrl && (
                <li>
                  <motion.a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-block px-4 py-2 font-semibold group"
                    whileHover={{ scale: 1.1 }}
                  >
                    {resumeButton(
                      'relative text-black group-hover:text-white flex items-center gap-x-3'
                    )}
                  </motion.a>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
