'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * The blend-mode cursor from the original src/utils/CursorAnimation.jsx.
 *
 * Two changes, both invisible on desktop:
 *  - It is skipped entirely on coarse-pointer (touch) devices. The original
 *    rendered a stuck quarter-circle in the top-left corner on phones because
 *    the cursor never received a mousemove event.
 *  - Text elements are observed through a single delegated listener rather
 *    than one pair of listeners per element, so content rendered after mount
 *    (any section revealed by an admin change) still grows the cursor.
 */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState(32)

  useEffect(() => {
    // Only devices with a real pointer get the custom cursor.
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return
    }
    setEnabled(true)

    const TEXT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'])

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      setSize(target && TEXT_TAGS.has(target.tagName) ? 80 : 32)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseover', handleOver, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseover', handleOver)
    }
  }, [])

  if (!enabled) return null

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 bg-white rounded-full pointer-events-none mix-blend-difference z-50"
      style={{ width: size, height: size }}
      animate={{ x: position.x - size / 2, y: position.y - size / 2 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    />
  )
}
