import type { Metadata } from 'next'

/**
 * Applies to every /admin route, including the login page.
 *
 * `robots: noindex` overrides the site-wide indexable default from the root
 * layout, which together with the Disallow rule in app/robots.ts keeps the
 * admin panel out of search results.
 */
export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · Portfolio Admin',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
