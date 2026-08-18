import Link from 'next/link'
import type { Metadata } from 'next'
import {
  TbFolders,
  TbCode,
  TbBriefcase,
  TbCertificate,
  TbMail,
  TbCircleCheck,
  TbSchool,
  TbTrophy,
  TbTools,
  TbLink,
  TbAlertTriangle,
  TbArrowRight,
} from 'react-icons/tb'
import type { IconType } from 'react-icons'
import { getDashboardStats } from '@/lib/stats'
import { relativeTime, truncate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards: {
    label: string
    value: number
    hint: string
    href: string
    Icon: IconType
    accent?: boolean
  }[] = [
    {
      label: 'Total Projects',
      value: stats.projects.total,
      hint: `${stats.projects.published} published · ${stats.projects.featured} featured`,
      href: '/admin/projects',
      Icon: TbFolders,
    },
    {
      label: 'Total Skills',
      value: stats.skills.total,
      hint: `${stats.skills.published} visible on the site`,
      href: '/admin/skills',
      Icon: TbCode,
    },
    {
      label: 'Total Experience',
      value: stats.experience.total,
      hint:
        stats.experience.years > 0
          ? `${stats.experience.years}+ years in the industry`
          : 'Roles on your timeline',
      href: '/admin/experience',
      Icon: TbBriefcase,
    },
    {
      label: 'Certifications',
      value: stats.certifications.total,
      hint: `${stats.certifications.published} visible on the site`,
      href: '/admin/certifications',
      Icon: TbCertificate,
    },
    {
      label: 'Contact Messages',
      value: stats.messages.total,
      hint:
        stats.messages.unread > 0
          ? `${stats.messages.unread} unread`
          : 'All caught up',
      href: '/admin/messages',
      Icon: TbMail,
      accent: stats.messages.unread > 0,
    },
    {
      label: 'Published Items',
      value: stats.totalPublished,
      hint: 'Live across all sections',
      href: '/admin/settings',
      Icon: TbCircleCheck,
    },
  ]

  const secondary: { label: string; value: number; href: string; Icon: IconType }[] = [
    { label: 'Education', value: stats.education.total, href: '/admin/education', Icon: TbSchool },
    {
      label: 'Achievements',
      value: stats.achievements.total,
      href: '/admin/achievements',
      Icon: TbTrophy,
    },
    { label: 'Services', value: stats.services.total, href: '/admin/services', Icon: TbTools },
    {
      label: 'Social Links',
      value: stats.socialLinks.total,
      href: '/admin/social-links',
      Icon: TbLink,
    },
  ]

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-admin-ink">Dashboard</h1>
        <p className="text-sm text-admin-muted mt-1">
          An overview of everything currently powering your portfolio.
        </p>
      </header>

      {!stats.available && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 mb-6"
        >
          <TbAlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Database unreachable</p>
            <p className="mt-0.5">
              Check <code className="font-mono text-xs">MONGODB_URI</code> in your environment. The
              public portfolio is still serving its built-in fallback content.
            </p>
          </div>
        </div>
      )}

      {/* ---- primary summary cards ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, hint, href, Icon, accent }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
              accent ? 'border-black bg-black text-white' : 'border-admin-border bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  accent ? 'bg-white/15 text-white' : 'bg-admin-bg text-admin-ink'
                }`}
              >
                <Icon size={20} aria-hidden="true" />
              </span>
              <TbArrowRight
                size={18}
                aria-hidden="true"
                className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                  accent ? 'text-white' : 'text-admin-muted'
                }`}
              />
            </div>

            <p className={`text-3xl font-extrabold mt-4 tabular-nums ${accent ? '' : 'text-admin-ink'}`}>
              {value}
            </p>
            <p className={`text-sm font-semibold mt-1 ${accent ? 'text-white' : 'text-admin-ink'}`}>
              {label}
            </p>
            <p className={`text-xs mt-1 ${accent ? 'text-white/70' : 'text-admin-muted'}`}>{hint}</p>
          </Link>
        ))}
      </div>

      {/* ---- secondary counts ---- */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mt-4">
        {secondary.map(({ label, value, href, Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-admin-border bg-white px-4 py-3.5 hover:shadow-sm hover:border-admin-muted/40 transition-all"
          >
            <span className="w-9 h-9 rounded-lg bg-admin-bg text-admin-ink flex items-center justify-center shrink-0">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold text-admin-ink tabular-nums leading-tight">
                {value}
              </span>
              <span className="block text-xs text-admin-muted truncate">{label}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* ---- recent messages ---- */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-admin-ink">Recent messages</h2>
          <Link
            href="/admin/messages"
            className="text-sm font-semibold text-admin-ink hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="rounded-xl border border-admin-border bg-white overflow-hidden">
          {stats.recentMessages.length === 0 ? (
            <p className="p-8 text-center text-sm text-admin-muted">
              No messages yet. Submissions from the portfolio contact form land here.
            </p>
          ) : (
            <ul>
              {stats.recentMessages.map((message) => (
                <li
                  key={message.id}
                  className="border-b border-admin-border last:border-0 hover:bg-admin-bg/60 transition-colors"
                >
                  <Link href="/admin/messages" className="flex items-start gap-3 px-4 py-3.5">
                    {!message.read && (
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full bg-black shrink-0"
                        aria-label="Unread"
                      />
                    )}
                    <span className={`min-w-0 flex-1 ${message.read ? 'pl-5' : ''}`}>
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold text-admin-ink">{message.name}</span>
                        <span className="text-xs text-admin-muted truncate">{message.email}</span>
                      </span>
                      <span className="block text-sm text-admin-muted mt-0.5">
                        {truncate(message.message, 110)}
                      </span>
                    </span>
                    <span className="text-xs text-admin-muted whitespace-nowrap shrink-0">
                      {relativeTime(message.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
