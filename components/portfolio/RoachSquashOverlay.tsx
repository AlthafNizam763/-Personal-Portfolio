'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * The little gag that plays after a contact message is accepted: a cartoon
 * cockroach scuttles up from the very bottom edge of the screen, a frying pan
 * swings in from above and flattens it, the screen takes a comedic knock, and
 * the overlay then hands off to the success popup.
 *
 * Everything is laid out in viewport units around one shared impact point, so
 * the gag lands in the same spot on a phone as it does on a desktop. The
 * overlay is decorative: `pointer-events-none` plus `aria-hidden`, so it never
 * blocks the page or reaches a screen reader (the form keeps its own live
 * region for that).
 */

/** Shared timeline, in seconds. Every keyframe below is derived from these. */
const T = {
  panIn: 0.8, // pan starts its swing
  panDuration: 1.15, // swing -> follow-through -> recoil -> exit
  impact: 1.2, // the hit
  reveal: 2.05, // success popup is requested
  end: 2.4, // overlay has faded out
}

/** Height of the hit, as a share of the viewport. Both actors aim at this. */
const IMPACT_TOP = '46vh'

/**
 * Actor sizes clamp so they stay visible (and in proportion) at any width.
 * The burst deliberately stays smaller than the pan, so the swing still reads
 * around the edges of it at the moment of impact.
 */
const ROACH_WIDTH = 'clamp(54px, 13vw, 90px)'
const PAN_WIDTH = 'clamp(200px, 52vw, 350px)'
const BURST_SIZE = 'clamp(150px, 40vw, 260px)'

/** 10-point comic starburst — generated so the spikes stay perfectly even. */
const STAR_POINTS = Array.from({ length: 20 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 20 - Math.PI / 2
  const radius = i % 2 === 0 ? 100 : 58
  const x = 100 + radius * Math.cos(angle)
  const y = 100 + radius * Math.sin(angle)
  return `${x.toFixed(1)},${y.toFixed(1)}`
}).join(' ')

/** Debris flung out of the impact, as px offsets from the hit. */
const SPARKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8
  const distance = 66 + (i % 3) * 26
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    size: i % 2 === 0 ? 9 : 6,
  }
})

/** The swing shares one set of keyframe timings across position and rotation. */
const SWING_TIMES = [0, 0.348, 0.435, 0.626, 1]
const SWING_EASE = ['easeIn', 'easeOut', 'easeOut', 'easeIn'] as const

export default function RoachSquashOverlay({ onReveal }: { onReveal: () => void }) {
  const [visible, setVisible] = useState(true)

  // Held in a ref so a fresh inline callback from the parent cannot restart
  // the timeline half way through.
  const revealRef = useRef(onReveal)
  useEffect(() => {
    revealRef.current = onReveal
  })

  useEffect(() => {
    const reveal = window.setTimeout(() => revealRef.current(), T.reveal * 1000)
    const end = window.setTimeout(() => setVisible(false), T.end * 1000)
    return () => {
      window.clearTimeout(reveal)
      window.clearTimeout(end)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="roach-squash"
          className="fixed inset-0 z-[60] overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          aria-hidden="true"
        >
          {/* Soft stage light so the black-outlined cartoon reads over the page. */}
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />

          {/* Impact flash. */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.75, 0] }}
            transition={{ delay: T.impact, duration: 0.26, ease: 'easeOut' }}
          />

          {/* Everything inside takes the knock together, which reads as a screen
              shake without disturbing the real page layout underneath. */}
          <motion.div
            className="absolute inset-0"
            animate={{
              x: [0, -12, 10, -7, 4, -2, 0],
              y: [0, 7, -6, 4, -2, 1, 0],
              rotate: [0, -1.1, 0.9, -0.5, 0.2, 0],
            }}
            transition={{ delay: T.impact, duration: 0.45, ease: 'easeOut' }}
          >
            {/* ---------------------------------------------------------- */}
            {/* Cockroach: bottom edge -> impact point, then squashed flat. */}
            {/* ---------------------------------------------------------- */}
            <div className="absolute inset-x-0 flex justify-center" style={{ top: IMPACT_TOP }}>
              <motion.div
                initial={{ y: '62vh' }}
                animate={{ y: ['62vh', '42vh', '34vh', '6vh', '0vh'] }}
                transition={{
                  duration: T.impact,
                  times: [0, 0.22, 0.42, 0.82, 1],
                  ease: ['easeOut', 'linear', 'easeIn', 'easeOut'],
                }}
              >
                {/* Scuttling sway — a roach never runs in a straight line. */}
                <motion.div
                  animate={{ x: [0, -10, 8, -7, 5, -2, 0], rotate: [0, -6, 5, -4, 3, -1, 0] }}
                  transition={{ duration: T.impact, ease: 'easeInOut' }}
                >
                  {/* Squash and vanish, the instant the pan lands. */}
                  <motion.div
                    style={{ width: ROACH_WIDTH, transformOrigin: '50% 100%' }}
                    initial={{ scaleX: 1, scaleY: 1, opacity: 1 }}
                    animate={{ scaleX: [1, 1.5, 1.7], scaleY: [1, 0.2, 0.12], opacity: [1, 1, 0] }}
                    transition={{ delay: T.impact, duration: 0.14, times: [0, 0.7, 1] }}
                  >
                    <Roach />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Frying pan: swings in from above, connects, recoils, exits. */}
            {/* ---------------------------------------------------------- */}
            <div className="absolute inset-x-0 flex justify-center" style={{ top: IMPACT_TOP }}>
              <motion.div
                initial={{ y: '-75vh' }}
                animate={{ y: ['-75vh', '2vh', '6vh', '-6vh', '-85vh'] }}
                transition={{
                  delay: T.panIn,
                  duration: T.panDuration,
                  times: SWING_TIMES,
                  ease: SWING_EASE,
                }}
              >
                {/* Plain wrapper: drops the pan's bottom edge onto the impact line. */}
                <div className="-translate-y-full">
                  <motion.div
                    style={{ width: PAN_WIDTH, transformOrigin: '96% 24%' }}
                    initial={{ rotate: -105 }}
                    animate={{ rotate: [-105, 4, 12, -16, -95] }}
                    transition={{
                      delay: T.panIn,
                      duration: T.panDuration,
                      times: SWING_TIMES,
                      ease: SWING_EASE,
                    }}
                  >
                    <Pan />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Impact: starburst, shockwave, debris and a big WHACK!       */}
            {/* ---------------------------------------------------------- */}
            <div className="absolute inset-x-0 flex justify-center" style={{ top: IMPACT_TOP }}>
              <div className="-translate-y-1/2">
                <div className="relative" style={{ width: BURST_SIZE, height: BURST_SIZE }}>
                  {/* Shockwave. */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-[3px] border-black"
                    initial={{ scale: 0.15, opacity: 0 }}
                    animate={{ scale: [0.15, 1.35], opacity: [0.9, 0] }}
                    transition={{ delay: T.impact, duration: 0.5, ease: 'easeOut' }}
                  />

                  {/* Comic starburst. */}
                  <motion.svg
                    viewBox="0 0 200 200"
                    className="absolute inset-0 h-full w-full"
                    initial={{ scale: 0, opacity: 0, rotate: -12 }}
                    animate={{ scale: [0, 1.12, 0.98, 1], opacity: [0, 1, 1, 0], rotate: -12 }}
                    transition={{
                      delay: T.impact,
                      duration: 0.72,
                      times: [0, 0.22, 0.34, 1],
                      ease: 'easeOut',
                    }}
                  >
                    <polygon
                      points={STAR_POINTS}
                      fill="#FFD84D"
                      stroke="#111111"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                  </motion.svg>

                  {/* WHACK! */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.25, 1, 1.05], opacity: [0, 1, 1, 0] }}
                    transition={{
                      delay: T.impact + 0.03,
                      duration: 0.7,
                      times: [0, 0.2, 0.35, 1],
                      ease: 'easeOut',
                    }}
                  >
                    <span
                      className="font-extrabold text-black select-none"
                      style={{ fontSize: 'clamp(18px, 5.2vw, 38px)', transform: 'rotate(-8deg)' }}
                    >
                      WHACK!
                    </span>
                  </motion.div>

                  {/* Debris. */}
                  {SPARKS.map((spark, i) => (
                    <motion.span
                      key={i}
                      className="absolute left-1/2 top-1/2 rounded-full bg-black"
                      style={{
                        width: spark.size,
                        height: spark.size,
                        marginLeft: -spark.size / 2,
                        marginTop: -spark.size / 2,
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: [0, spark.x],
                        y: [0, spark.y],
                        scale: [0, 1, 0.2],
                        opacity: [0, 1, 0],
                      }}
                      transition={{ delay: T.impact, duration: 0.55, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Cartoon cockroach, head up so it reads as crawling towards the top of the
 * screen. Googly eyes keep it silly rather than skin-crawling.
 */
function Roach() {
  const legStyle = {
    fill: 'none',
    stroke: '#2A1A10',
    strokeWidth: 7,
    strokeLinecap: 'round',
  } as const

  return (
    <svg viewBox="0 0 120 150" className="w-full h-auto" role="presentation">
      {/* Antennae — a touch slower than the legs so the two never sync up. */}
      <motion.g
        {...legStyle}
        strokeWidth={5}
        style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M52 32 Q34 14 24 4" />
        <path d="M68 32 Q86 14 96 4" />
      </motion.g>

      {/* Left legs. */}
      <motion.g
        {...legStyle}
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
        animate={{ rotate: [0, -9, 0, 9, 0] }}
        transition={{ duration: 0.36, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M46 54 L28 44 L12 30" />
        <path d="M44 74 L22 74 L6 64" />
        <path d="M46 94 L24 102 L12 122" />
      </motion.g>

      {/* Right legs, half a beat behind, for an alternating gait. */}
      <motion.g
        {...legStyle}
        style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
        animate={{ rotate: [0, 9, 0, -9, 0] }}
        transition={{ duration: 0.36, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M74 54 L92 44 L108 30" />
        <path d="M76 74 L98 74 L114 64" />
        <path d="M74 94 L96 102 L108 122" />
      </motion.g>

      {/* Abdomen and wings. */}
      <ellipse cx="60" cy="92" rx="27" ry="38" fill="#7A4A24" stroke="#2A1A10" strokeWidth="5" />
      <path d="M60 60 L60 126" stroke="#2A1A10" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M44 66 Q36 90 42 112"
        fill="none"
        stroke="#A9702F"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Pronotum — the shield just behind the head. */}
      <ellipse cx="60" cy="52" rx="23" ry="16" fill="#8E5628" stroke="#2A1A10" strokeWidth="5" />

      {/* Head. */}
      <ellipse cx="60" cy="34" rx="14" ry="12" fill="#7A4A24" stroke="#2A1A10" strokeWidth="5" />
      <circle cx="54" cy="32" r="4.6" fill="#FFFFFF" stroke="#2A1A10" strokeWidth="2" />
      <circle cx="66" cy="32" r="4.6" fill="#FFFFFF" stroke="#2A1A10" strokeWidth="2" />
      <circle cx="54.8" cy="31.2" r="2.2" fill="#141414" />
      <circle cx="66.8" cy="31.2" r="2.2" fill="#141414" />
    </svg>
  )
}

/**
 * Frying pan, drawn so the bowl sits centred on the bottom edge of the viewBox
 * and the handle runs up to the top-right corner — that corner is the pivot
 * the swing rotates around (see `transformOrigin` above).
 */
function Pan() {
  return (
    <svg viewBox="0 0 300 180" className="w-full h-auto" role="presentation">
      {/* Handle. */}
      <path
        d="M238 98 L286 46"
        stroke="#171717"
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M238 98 L286 46"
        stroke="#4A3524"
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M250 86 L272 62"
        stroke="#6B5238"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bowl. */}
      <path
        d="M50 100 C50 100 58 176 148 176 C238 176 246 100 246 100 Z"
        fill="#33333A"
        stroke="#111111"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M74 128 C86 158 118 166 138 166"
        fill="none"
        stroke="#5C5C68"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Rim, seen at a slight angle. */}
      <ellipse cx="148" cy="100" rx="98" ry="21" fill="#1A1A1E" stroke="#111111" strokeWidth="7" />
      <path
        d="M72 94 C86 84 116 80 140 81"
        fill="none"
        stroke="#8A8A96"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}
