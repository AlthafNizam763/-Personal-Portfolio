import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import NotificationsScreen from '@/components/admin/screens/NotificationsScreen'

export const metadata: Metadata = { title: 'Notification Settings' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  // Everything the screen needs it loads client-side; this is the same
  // belt-and-braces session check every other panel page makes.
  if (!(await getSession())) redirect('/admin/login')

  return <NotificationsScreen />
}
