import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsScreen from '@/components/admin/screens/SettingsScreen'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function Page() {
  // The account card needs the signed-in user's current name and email as its
  // initial values; everything else the screen loads client-side.
  const session = await getSession()
  if (!session) redirect('/admin/login')

  return <SettingsScreen account={{ name: session.name, email: session.email }} />
}
