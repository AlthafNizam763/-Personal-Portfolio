'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * The little gag that plays after a contact message is accepted: a cartoon
 * cockroach scurries in from one of the bottom corners, crawls diagonally
 * across the screen towards the opposite side, and a red flyswatter drops in
 * and flattens it before the overlay hands off to the success popup.
 *
 * The entry corner is picked at random per run, so the gag does not always
 * play out the same way. Everything is laid out in viewport units around one
 * shared impact point, so the swat lands in the same place on a phone as it
 * does on a desktop. The overlay is decorative: `pointer-events-none` plus
 * `aria-hidden`, so it never blocks the page or reaches a screen reader (the
 * form keeps its own live region for that).
 */

/** Shared timeline, in seconds. Every keyframe below is derived from these. */
const T = {
  swatIn: 0.85, // flyswatter starts its swing
  impact: 1.2, // the hit
  reveal: 2.05, // success popup is requested
  end: 2.4, // overlay has faded out
}

/**
 * Geometry of the crawl, in viewport units. The roach starts just outside a
 * bottom corner and ends at the impact point over on the far side, so the
 * whole path is one long diagonal:
 *
 *   left  ->  starts at (-10vw, 118vh), swatted at (66vw, 40vh)
 *   right ->  starts at (110vw, 118vh), swatted at (34vw, 40vh)
 */
const IMPACT_Y = 40 // % of viewport height
const IMPACT_X_FAR = 66 // % of viewport width, on the side being crawled towards
const TRAVEL_X = 76 // vw covered by the crawl
const TRAVEL_Y = 78 // vh covered by the crawl

/**
 * Actor sizes clamp so they stay visible (and in proportion) at any width.
 * The `vh` term only bites on short landscape viewports, where sizing purely
 * off the width would fill the whole screen; portrait phones and desktops are
 * unaffected by it.
 */
const ROACH_WIDTH = 'clamp(52px, min(12vw, 15vh), 86px)'
const SWATTER_WIDTH = 'clamp(200px, min(52vw, 62vh), 360px)'
const BURST_SIZE = 'clamp(150px, min(40vw, 48vh), 260px)'
const SWAT_FONT_SIZE = 'clamp(18px, min(5.6vw, 6.7vh), 42px)'

/** A scurry is not a constant speed: dash, hesitate, dart, arrive. */
const CRAWL_TIMES = [0, 0.22, 0.42, 0.82, 1]
const CRAWL_PROGRESS = [0, 0.3, 0.46, 0.9, 1]
const CRAWL_EASE = ['easeOut', 'linear', 'easeIn', 'easeOut'] as const

/**
 * The swing: enter, connect, follow through, recoil, leave. Written as absolute
 * times and converted to framer's 0..1 `times`, so the contact keyframe cannot
 * drift away from `T.impact` — if it did, the burst would fire while the pad
 * was still visibly in the air.
 */
const SWING_AT = [T.swatIn, T.impact, T.impact + 0.1, T.impact + 0.32, T.impact + 0.8]
const SWAT_DURATION = SWING_AT[SWING_AT.length - 1] - SWING_AT[0]
const SWING_TIMES = SWING_AT.map((at) => (at - SWING_AT[0]) / SWAT_DURATION)
const SWING_EASE = ['easeIn', 'easeOut', 'easeOut', 'easeIn'] as const
const SWING_Y = ['-75vh', '3vh', '7vh', '-6vh', '-85vh']
const SWING_ROTATE = [-100, 5, 13, -18, -95]

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

/** Positions along the diagonal, counted back from the starting corner. */
const crawlKeyframes = (start: number, unit: 'vw' | 'vh') =>
  CRAWL_PROGRESS.map((progress) => `${(start * (1 - progress)).toFixed(1)}${unit}`)

/**
 * How far to lean the roach so it faces where it is going. The diagonal is
 * defined in viewport units, so its on-screen angle depends on the aspect
 * ratio: near-horizontal on a wide desktop, steep on a phone.
 */
function crawlTilt(toRight: boolean) {
  const width = typeof window === 'undefined' ? 1280 : window.innerWidth
  const height = typeof window === 'undefined' ? 800 : window.innerHeight
  const across = (TRAVEL_X / 100) * width
  const up = (TRAVEL_Y / 100) * height
  // 0deg is the roach's drawn orientation (head up).
  const degrees = (Math.atan2(across, up) * 180) / Math.PI
  const leaning = Math.min(72, Math.max(18, degrees))
  return toRight ? leaning : -leaning
}

export default function RoachSquashOverlay({ onReveal }: { onReveal: () => void }) {
  const [visible, setVisible] = useState(true)

  // Which bottom corner the roach comes from, decided once per run. Safe to
  // randomise in a lazy initialiser: the overlay is only ever mounted in
  // response to a client-side submit, so it never renders on the server.
  const [toRight] = useState(() => Math.random() < 0.5)
  const [tilt] = useState(() => crawlTilt(toRight))

  const impactX = toRight ? IMPACT_X_FAR : 100 - IMPACT_X_FAR
  const startX = toRight ? -TRAVEL_X : TRAVEL_X
  // The swatter comes down from whichever side the roach is heading for.
  const mirrored = !toRight
  const swing = mirrored ? SWING_ROTATE.map((r) => -r) : SWING_ROTATE

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

  const anchor = { left: `${impactX}%`, top: `${IMPACT_Y}%` }

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
            {/* Cockroach: bottom corner -> diagonally across -> squashed.  */}
            {/* ---------------------------------------------------------- */}
            <div className="absolute" style={anchor}>
              <motion.div
                initial={{ x: `${startX}vw`, y: `${TRAVEL_Y}vh` }}
                animate={{
                  x: crawlKeyframes(startX, 'vw'),
                  y: crawlKeyframes(TRAVEL_Y, 'vh'),
                }}
                transition={{
                  duration: T.impact,
                  times: CRAWL_TIMES,
                  ease: CRAWL_EASE,
                }}
              >
                {/* Plain wrapper: centres the roach on the impact point. */}
                <div className="-translate-x-1/2 -translate-y-1/2">
                  {/* Squash and vanish, the instant the swatter lands. Kept
                      outside the lean so it flattens downwards on screen. */}
                  <motion.div
                    // 88% is the underside of the roach's body (viewBox y 132
                    // of 150), not the empty floor of its box — so it flattens
                    // onto itself rather than onto thin air below.
                    style={{ width: ROACH_WIDTH, transformOrigin: '50% 88%' }}
                    initial={{ scaleX: 1, scaleY: 1, opacity: 1 }}
                    animate={{ scaleX: [1, 1.5, 1.7], scaleY: [1, 0.2, 0.12], opacity: [1, 1, 0] }}
                    transition={{ delay: T.impact, duration: 0.14, times: [0, 0.7, 1] }}
                  >
                    {/* Lean into the direction of travel, plus a scuttling
                        wobble — a roach never runs in a straight line. */}
                    <motion.div
                      initial={{ rotate: tilt }}
                      animate={{
                        x: [0, -8, 6, -5, 3, -1, 0],
                        y: [0, 4, -3, 3, -2, 1, 0],
                        rotate: [tilt, tilt - 6, tilt + 5, tilt - 4, tilt + 3, tilt - 1, tilt],
                      }}
                      transition={{ duration: T.impact, ease: 'easeInOut' }}
                    >
                      <Roach />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Flyswatter: drops in from above, connects, recoils, exits.  */}
            {/* ---------------------------------------------------------- */}
            <div className="absolute" style={anchor}>
              <motion.div
                initial={{ y: SWING_Y[0] }}
                animate={{ y: SWING_Y }}
                transition={{
                  delay: T.swatIn,
                  duration: SWAT_DURATION,
                  times: SWING_TIMES,
                  ease: SWING_EASE,
                }}
              >
                {/* Plain wrapper: centres the pad on the impact point and drops
                    its bottom edge onto it. */}
                <div className="-translate-x-1/2 -translate-y-full">
                  <motion.div
                    style={{
                      width: SWATTER_WIDTH,
                      // The pivot is the loop at the end of the handle:
                      // (280, 28) of the 300x200 viewBox, mirrored with it.
                      transformOrigin: mirrored ? '6.7% 14%' : '93.3% 14%',
                    }}
                    initial={{ rotate: swing[0] }}
                    animate={{ rotate: swing }}
                    transition={{
                      delay: T.swatIn,
                      duration: SWAT_DURATION,
                      times: SWING_TIMES,
                      ease: SWING_EASE,
                    }}
                  >
                    <div style={mirrored ? { transform: 'scaleX(-1)' } : undefined}>
                      <Flyswatter />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* Impact: starburst, shockwave, debris and a big SWAT!        */}
            {/* ---------------------------------------------------------- */}
            <div className="absolute" style={anchor}>
              <div className="-translate-x-1/2 -translate-y-1/2">
                <div className="relative" style={{ width: BURST_SIZE, height: BURST_SIZE }}>
                  {/* Shockwave.
                      Note: through a `delay`, framer-motion holds keyframes[0],
                      NOT `initial` (see MainThreadAnimation's delay phase). So
                      every delayed animation here has to open on its invisible
                      state — otherwise this ring would sit at 90% opacity on
                      the impact point for the whole crawl and give the gag
                      away. Hence the extra opacity-0 keyframe up front. */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-[3px] border-black"
                    initial={{ scale: 0.15, opacity: 0 }}
                    animate={{ scale: [0.15, 0.15, 1.35], opacity: [0, 0.9, 0] }}
                    transition={{
                      delay: T.impact,
                      duration: 0.5,
                      times: [0, 0.04, 1],
                      ease: 'easeOut',
                    }}
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

                  {/* SWAT! */}
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
                      style={{ fontSize: SWAT_FONT_SIZE, transform: 'rotate(-8deg)' }}
                    >
                      SWAT!
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
 * Cartoon cockroach, drawn head-up; the crawl leans it into whichever
 * direction it is travelling. Googly eyes keep it silly rather than
 * skin-crawling.
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

/** Mesh holes in the swatter pad, as subpaths so they punch straight through. */
const PAD_OUTLINE =
  'M98 86 H202 A20 20 0 0 1 222 106 V176 A20 20 0 0 1 202 196 H98 A20 20 0 0 1 78 176 V106 A20 20 0 0 1 98 86 Z'

const PAD_HOLES = [110, 134, 158, 182]
  .flatMap((cy) => [102, 126, 150, 174, 198].map((cx) => ({ cx, cy })))
  .map(({ cx, cy }) => `M${cx - 7} ${cy} a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z`)
  .join(' ')

/**
 * Red flyswatter, drawn so the pad sits centred on the bottom edge of the
 * viewBox and the handle runs up to the top-right corner — the loop at that
 * corner is the pivot the swing rotates around (see `transformOrigin` above).
 * Mirrored horizontally when the swat comes in from the left instead.
 */
function Flyswatter() {
  return (
    <svg viewBox="0 0 300 200" className="w-full h-auto" role="presentation">
      {/* Handle: black casing with a red core, and a hanging loop at the tip.
          The loop sits at (280, 28) with a 17-unit outer radius, so it stays
          inside the viewBox — push it further out and the SVG clips it flat. */}
      <path
        d="M206 96 Q256 74 280 38"
        fill="none"
        stroke="#171717"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d="M206 96 Q256 74 280 38"
        fill="none"
        stroke="#E23B34"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="280" cy="28" r="11" fill="none" stroke="#171717" strokeWidth="12" />
      <circle cx="280" cy="28" r="11" fill="none" stroke="#E23B34" strokeWidth="6" />

      {/* Pad: one compound path, so the mesh holes are genuinely see-through. */}
      <path
        d={`${PAD_OUTLINE} ${PAD_HOLES}`}
        fillRule="evenodd"
        fill="#E23B34"
        stroke="#171717"
        strokeWidth="3"
      />
      {/* Bold outer edge on top of the thin mesh outlines. */}
      <path d={PAD_OUTLINE} fill="none" stroke="#171717" strokeWidth="7" strokeLinejoin="round" />
      {/* Highlight down the left edge, clear of the mesh. */}
      <path
        d="M86 170 V116 Q86 98 104 94"
        fill="none"
        stroke="#FA8C86"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}
