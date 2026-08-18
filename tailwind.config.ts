import type { Config } from 'tailwindcss'

/**
 * Kept intentionally close to the original Vite/Tailwind 3.4 config so the
 * migrated portfolio renders identically. The only additions are the admin
 * panel design tokens (prefixed `admin-`) and a handful of keyframes used by
 * the admin UI — none of them touch the public portfolio's styling.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // `var(--font-sora)` is provided by next/font in app/layout.tsx.
        // The literal 'Sora' fallback keeps rendering correct if the
        // optimized font fails to load.
        sora: ['var(--font-sora)', 'Sora', 'sans-serif'],
      },
      colors: {
        admin: {
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          border: '#E4E4E7',
          muted: '#71717A',
          ink: '#18181B',
          accent: '#000000',
        },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}

export default config
