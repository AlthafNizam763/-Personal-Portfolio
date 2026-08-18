'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  TbLayoutDashboard,
  TbUser,
  TbCode,
  TbBriefcase,
  TbFolders,
  TbSchool,
  TbCertificate,
  TbTrophy,
  TbTools,
  TbLink,
  TbMail,
  TbSettings,
  TbLogout,
  TbMenu2,
  TbExternalLink,
} from 'react-icons/tb'
import type { IconType } from 'react-icons'
import { api } from '@/lib/api-client'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'

interface NavItem {
  href: string
  label: string
  Icon: IconType
}

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', Icon: TbLayoutDashboard }],
  },
  {
    heading: 'Content',
    items: [
      { href: '/admin/profile', label: 'Profile', Icon: TbUser },
      { href: '/admin/skills', label: 'Skills', Icon: TbCode },
      { href: '/admin/experience', label: 'Experience', Icon: TbBriefcase },
      { href: '/admin/projects', label: 'Projects', Icon: TbFolders },
      { href: '/admin/education', label: 'Education', Icon: TbSchool },
      { href: '/admin/certifications', label: 'Certifications', Icon: TbCertificate },
      { href: '/admin/achievements', label: 'Achievements', Icon: TbTrophy },
      { href: '/admin/services', label: 'Services', Icon: TbTools },
      { href: '/admin/social-links', label: 'Social Links', Icon: TbLink },
    ],
  },
  {
    heading: 'Inbox & setup',
    items: [
      { href: '/admin/messages', label: 'Messages', Icon: TbMail },
      { href: '/admin/settings', label: 'Settings', Icon: TbSettings },
    ],
  },
]

export default function AdminShell({
  user,
  unreadCount,
  children,
}: {
  user: { name: string; email: string }
  unreadCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToast()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Close the drawer whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [mobileOpen])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await api.post('/api/auth/logout', {})
      router.replace('/admin/login')
      router.refresh()
    } catch {
      toast.error('Could not sign out. Please try again.')
      setSigningOut(false)
    }
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const initials =
    user.name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A'

  const sidebar = (
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 py-5 border-b border-admin-border">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-extrabold text-sm">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-admin-ink truncate">Portfolio Admin</span>
            <span className="block text-xs text-admin-muted truncate">{user.email}</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto admin-scroll px-3 py-4" aria-label="Admin sections">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="mb-5 last:mb-0">
            <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-admin-muted/70">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-black text-white'
                          : 'text-admin-ink hover:bg-admin-bg'
                      }`}
                    >
                      <Icon size={18} aria-hidden="true" className="shrink-0" />
                      <span className="flex-1 truncate">{label}</span>
                      {href === '/admin/messages' && unreadCount > 0 && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                            active ? 'bg-white text-black' : 'bg-black text-white'
                          }`}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-admin-border p-3 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-admin-ink hover:bg-admin-bg transition-colors"
        >
          <TbExternalLink size={18} aria-hidden="true" />
          View portfolio
        </a>
        <button
          type="button"
          onClick={() => setConfirmSignOut(true)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-admin-ink hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <TbLogout size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="font-sora min-h-screen bg-admin-bg text-admin-ink">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-admin-border z-30">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              aria-label="Admin navigation"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between gap-3 bg-white border-b border-admin-border px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="p-2 -m-2 text-admin-ink"
          >
            <TbMenu2 size={22} />
          </button>
          <span className="font-bold text-sm">Portfolio Admin</span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View portfolio"
            className="p-2 -m-2 text-admin-muted"
          >
            <TbExternalLink size={20} />
          </a>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">{children}</main>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        destructive={false}
        confirmLabel="Sign out"
        busy={signingOut}
        message="You will need to sign in again to manage your portfolio."
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}
