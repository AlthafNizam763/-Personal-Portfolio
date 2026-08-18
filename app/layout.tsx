import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'
import { getPortfolioData } from '@/lib/data'
import { getSiteUrl } from '@/lib/site'

/**
 * Replaces the Google Fonts @import that used to live in src/index.css.
 * next/font self-hosts the file, removes the render-blocking request and
 * exposes the family to Tailwind via the `--font-sora` CSS variable.
 */
const sora = Sora({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sora',
})

export async function generateMetadata(): Promise<Metadata> {
  const { settings, profile } = await getPortfolioData()
  const siteUrl = getSiteUrl()

  const title = settings.siteTitle || `${profile.name} | ${profile.title}`
  const description = settings.siteDescription || profile.shortDescription

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${profile.name || 'Portfolio'}`,
    },
    description,
    keywords: settings.keywords,
    authors: profile.name ? [{ name: profile.name, url: siteUrl }] : undefined,
    creator: profile.name || undefined,
    applicationName: title,
    alternates: { canonical: '/' },
    icons: {
      icon: settings.favicon || '/assets/xpalico.png',
      apple: settings.favicon || '/assets/xpalico.png',
    },
    openGraph: {
      type: 'website',
      url: siteUrl,
      siteName: title,
      title,
      description,
      images: settings.ogImage
        ? [{ url: settings.ogImage, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: settings.twitterHandle || undefined,
      images: settings.ogImage ? [settings.ogImage] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const { settings } = await getPortfolioData()
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: settings.themeColor || '#000000',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable}>
      <body>{children}</body>
    </html>
  )
}
