import type { ProfileDTO, SiteSettingsDTO } from '@/lib/types'

/**
 * Migrated from src/components/Footer.jsx.
 *
 * A server component — the year is computed at render time on the server, so
 * there is no client/server mismatch around New Year and no JS shipped for it.
 */
export default function Footer({
  profile,
  settings,
}: {
  profile: ProfileDTO
  settings: SiteSettingsDTO
}) {
  const year = new Date().getFullYear()
  // The original footer's second line read "Xpalico" — the site title's first
  // word, which keeps working if the title is edited in the admin.
  const signature = settings.siteTitle.split('|')[0]?.trim() || profile.name

  return (
    <footer className="bg-black px-5 lg:px-28 py-3 lg:py-6 flex items-center justify-between mt-16">
      {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG logo,
          inverted with a CSS filter; nothing for the optimizer to do. */}
      <img
        className="invert h-5 lg:h-9"
        src={profile.logo || '/assets/logo.svg'}
        alt={profile.name ? `${profile.name} logo` : 'Logo'}
      />

      <div className="text-white lg:font-semibold lg:text-sm font-normal text-[10px] text-right lg:space-y-3">
        <p>© {year} Personal Portfolio. All rights reserved.</p>
        <p>{signature}</p>
      </div>
    </footer>
  )
}
