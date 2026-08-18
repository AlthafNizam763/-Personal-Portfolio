import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { tryConnect } from '@/lib/db'
import { Message, User } from '@/models'
import AdminShell from '@/components/admin/AdminShell'
import { ToastProvider } from '@/components/admin/Toast'

/**
 * Shell for the authenticated part of the admin panel.
 *
 * `middleware.ts` already redirects unauthenticated visitors; this is a second,
 * independent check so the panel is never rendered without a valid session even
 * if the middleware matcher changes. It also re-validates `tokenVersion`, so a
 * session issued before the last password change is rejected here too.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  let name = session.name
  let email = session.email
  let unreadCount = 0

  if (await tryConnect()) {
    const [user, unread] = await Promise.all([
      User.findById(session.sub).lean(),
      Message.countDocuments({ read: false, archived: false }),
    ])

    if (!user || (user.tokenVersion ?? 0) !== session.tv) {
      redirect('/admin/login')
    }

    name = user.name ?? name
    email = user.email
    unreadCount = unread
  }

  return (
    <ToastProvider>
      <AdminShell user={{ name, email }} unreadCount={unreadCount}>
        {children}
      </AdminShell>
    </ToastProvider>
  )
}
